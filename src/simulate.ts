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

import { PermitData, PermitCalldata, Variant } from './variants'
import { parsePermitData, getPermitCalldataByVariant } from './permit'

function getVM(chainId: number) {
  return new VM({ common: new Common({ chain: chainId }) })
}

const WALLET = Wallet.createRandom()

// only supports functions with a single output
export async function read({
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
    to: Address.zero(),
    code: Buffer.from(bytecode, 'hex'),
    data: Buffer.from(`${sigHash.slice(2)}${inputsEncoded.slice(2)}`, 'hex'),
    static: true,
  })

  if (result.execResult.exceptionError) {
    throw result.execResult.exceptionError
  }

  return defaultAbiCoder.decode(
    functionFragment.outputs!,
    result.execResult.returnValue
  )[0]
}

// returns a bool for whether the write would be successful
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
}): Promise<boolean> {
  const functionFragment = FunctionFragment.from(Fragment.fromString(fragment))
  const contractInterface = new Interface([functionFragment])

  const sigHash = contractInterface.getSighash(functionFragment.name)
  const inputsEncoded = defaultAbiCoder.encode(functionFragment.inputs, inputs)

  const result = await getVM(chainId).runCall({
    caller: Address.zero(),
    to: Address.fromString(to),
    code: Buffer.from(bytecode, 'hex'),
    data: Buffer.from(`${sigHash.slice(2)}${inputsEncoded.slice(2)}`, 'hex'),
  })

  if (result.execResult.exceptionError) {
    throw result.execResult.exceptionError
  }

  return true
}

export async function getPermitCalldataBySimulation(
  bytecode: string,
  permitData: PermitData,
  wallet: Wallet,
  getNonce: (fragment: string, inputs: [string]) => Promise<BigNumberish>
): Promise<PermitCalldata> {
  const permitDataParsed = parsePermitData(permitData)

  // try Variant.Zero
  const name = await read({
    fragment: 'function name() pure returns (string)',
    bytecode,
  }).catch(() => null)

  if (name !== null) {
    const callData = await getPermitCalldataByVariant(
      Variant.Zero,
      { name },
      {
        chainId: permitDataParsed.chainId,
        tokenAddress: permitDataParsed.tokenAddress,
        spender: permitDataParsed.spender,
        value: permitDataParsed.value,
        deadline: permitDataParsed.deadline,
      },
      WALLET,
      (fragment, inputs) =>
        read({
          fragment,
          inputs,
          bytecode,
        })
    ).catch(() => null)

    if (callData !== null) {
      const success = await write({
        fragment: callData.fragment,
        bytecode,
        inputs: callData.inputs,
        chainId: permitDataParsed.chainId,
        to: permitDataParsed.tokenAddress,
      }).catch(() => false)

      if (success) {
        return getPermitCalldataByVariant(
          Variant.Zero,
          { name },
          permitDataParsed,
          wallet,
          getNonce
        )
      }
    }
  }

  throw Error('Unable to identify variant.')
}
