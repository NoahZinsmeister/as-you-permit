import Common from '@ethereumjs/common'
import VM from '@ethereumjs/vm'
import { BigNumber } from '@ethersproject/bignumber'
import { Address } from 'ethereumjs-util'
import { Wallet } from '@ethersproject/wallet'
import {
  defaultAbiCoder,
  Fragment,
  FunctionFragment,
  Interface,
} from '@ethersproject/abi'

import { PermitCalldata, Variant } from './variants'
import {
  PermitData,
  parsePermitData,
  getPermitCalldataByVariant,
} from './permit'

function getVM(chainId: number) {
  return new VM({ common: new Common({ chain: chainId }) })
}

export const WALLET = new Wallet(
  '0x00c0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffee00'
)

// only supports functions without inputs and with a single output
export async function read({
  fragment,
  bytecode,
}: {
  fragment: string
  bytecode: string
}): Promise<any> {
  const functionFragment = FunctionFragment.from(Fragment.fromString(fragment))
  const contractInterface = new Interface([functionFragment])

  const sigHash = contractInterface.getSighash(functionFragment.name)

  const result = await getVM(1).runCall({
    caller: Address.zero(),
    to: Address.zero(),
    code: Buffer.from(bytecode, 'hex'),
    data: Buffer.from(`${sigHash.slice(2)}`, 'hex'),
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

// returns a bool for whether the write was successful
async function write({
  fragment,
  bytecode,
  to,
  inputs,
  chainId,
}: {
  fragment: string
  bytecode: string
  to: string
  inputs: any[]
  chainId: number
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
  wallet: Wallet
): Promise<PermitCalldata> {
  const permitDataParsed = parsePermitData(permitData)

  // ensure owner is the wallet address
  if (wallet.address !== permitDataParsed.owner)
    throw Error('Wallet address is not owner.')

  // try Variant.Zero
  const name = await read({
    fragment: 'function name() pure returns (string)',
    bytecode,
  }).catch(() => null)

  if (name) {
    // simulate
    const callData = await getPermitCalldataByVariant(
      Variant.Zero,
      { name },
      {
        chainId: permitDataParsed.chainId,
        tokenAddress: permitDataParsed.tokenAddress,
        owner: WALLET.address,
        spender: permitDataParsed.spender,
        value: permitDataParsed.value,
        nonce: BigNumber.from(0),
        deadline: permitDataParsed.deadline,
      },
      WALLET
    ).catch(() => null)

    if (callData) {
      const success = await write({
        fragment: callData.fragment,
        bytecode,
        to: permitDataParsed.tokenAddress,
        inputs: callData.inputs,
        chainId: permitDataParsed.chainId,
      }).catch(() => false)

      if (success) {
        return getPermitCalldataByVariant(
          Variant.Zero,
          { name },
          permitDataParsed,
          wallet
        )
      }
    }
  }

  throw Error('Unable to identify variant.')
}
