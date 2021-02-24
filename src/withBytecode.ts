import Common from '@ethereumjs/common'
import VM from '@ethereumjs/vm'
import { BigNumberish } from '@ethersproject/bignumber'
import { Address } from 'ethereumjs-util'
import { Wallet } from '@ethersproject/wallet'
import {
  defaultAbiCoder,
  Fragment,
  FunctionFragment,
  Interface,
} from '@ethersproject/abi'

import { PermitData, PermitCalldata, Variant, nonceFragment } from './variants'
import { parsePermitData, getPermitCalldataByVariant } from './permit'

const VMs: { [chainId: number]: VM } = {}

function getVM(chainId: number) {
  const existingVM = VMs[chainId]
  if (existingVM !== undefined) return existingVM
  VMs[chainId] = new VM({ common: new Common({ chain: chainId }) })
  return VMs[chainId]
}

const WALLET = Wallet.createRandom()

// only supports functions with a single output
async function read({
  fragment,
  bytecode,
  inputs,
}: {
  fragment: string
  bytecode: string
  inputs?: any[]
}): Promise<any> {
  const functionFragment = FunctionFragment.from(Fragment.fromString(fragment))
  const contractInterface = new Interface([functionFragment])

  const sigHash = contractInterface.getSighash(functionFragment.name)
  const inputsEncoded = defaultAbiCoder.encode(
    functionFragment.inputs,
    inputs ?? []
  )

  const result = await getVM(1).runCall({
    caller: Address.zero(),
    code: Buffer.from(bytecode, 'hex'),
    data: Buffer.from(`${sigHash.slice(2)}${inputsEncoded.slice(2)}`, 'hex'),
    static: true,
    to: Address.zero(),
  })

  if (result.execResult.exceptionError) {
    throw result.execResult.exceptionError
  }

  return defaultAbiCoder.decode(
    functionFragment.outputs!,
    result.execResult.returnValue
  )[0]
}

// throws if the write would fail
async function write({
  fragment,
  bytecode,
  inputs,
  chainId,
  to,
}: {
  fragment: string
  bytecode: string
  inputs: any[]
  chainId: number
  to: string
}): Promise<void> {
  const functionFragment = FunctionFragment.from(Fragment.fromString(fragment))
  const contractInterface = new Interface([functionFragment])

  const sigHash = contractInterface.getSighash(functionFragment.name)
  const inputsEncoded = defaultAbiCoder.encode(functionFragment.inputs, inputs)

  const result = await getVM(chainId).runCall({
    caller: Address.zero(),
    code: Buffer.from(bytecode, 'hex'),
    data: Buffer.from(`${sigHash.slice(2)}${inputsEncoded.slice(2)}`, 'hex'),
    to: Address.fromString(to),
  })

  if (result.execResult.exceptionError) {
    throw result.execResult.exceptionError
  }
}

export async function getPermitCalldataBySimulation(
  bytecode: string,
  permitData: PermitData,
  wallet: Wallet,
  getNonce: (fragment: string, inputs: [string]) => Promise<BigNumberish>
): Promise<PermitCalldata> {
  // kick off nonce call right away
  const nonce = read({
    fragment: nonceFragment,
    bytecode,
    inputs: [WALLET.address],
  }).catch(() => {
    throw Error('Unable to fetch nonce.')
  })

  const permitDataParsed = parsePermitData(permitData)

  // try Variant.Canonical
  const name = await read({
    fragment: 'function name() pure returns (string)',
    bytecode,
  }).catch(() => null)

  if (name !== null) {
    // iterate over possible versions (somewhat janky, don't see a nice way around it though)
    const versions = [null, '1', '2']
    const version: (null | string) | undefined = await Promise.any(
      versions.map(version =>
        getPermitCalldataByVariant(
          Variant.Canonical,
          { name, ...(version ? { version } : {}) },
          {
            chainId: permitDataParsed.chainId,
            tokenAddress: permitDataParsed.tokenAddress,
            spender: permitDataParsed.spender,
            value: permitDataParsed.value,
            deadline: permitDataParsed.deadline,
          },
          WALLET,
          () => nonce
        ).then(callData =>
          write({
            fragment: callData.fragment,
            bytecode,
            inputs: callData.inputs,
            chainId: permitDataParsed.chainId,
            to: permitDataParsed.tokenAddress,
          }).then(() => version)
        )
      )
    ).catch(() => undefined)

    // version is only undefined if none of our tries worked
    if (version !== undefined) {
      return getPermitCalldataByVariant(
        Variant.Canonical,
        { name, ...(version ? { version } : {}) },
        permitDataParsed,
        wallet,
        getNonce
      )
    }
  }

  throw Error('Unable to identify variant.')
}
