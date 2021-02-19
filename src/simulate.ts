import Common from '@ethereumjs/common'
import VM from '@ethereumjs/vm'
import { Address } from 'ethereumjs-util'
import { Wallet } from '@ethersproject/wallet'
import {
  defaultAbiCoder,
  Fragment,
  FunctionFragment,
  Interface,
} from '@ethersproject/abi'

function getVM(chainId: number) {
  return new VM({ common: new Common({ chain: chainId }) })
}

export const WALLET = new Wallet(
  '0x00c0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffee00'
)

export const SPENDER = '0x00C0FfeEc0FFEec0ffEeC0fFEEc0FfEeC0ffEE00'

export async function read({
  fragment,
  bytecode,
  chainId,
}: {
  fragment: string
  bytecode: string
  chainId: number
}) {
  const functionFragment = FunctionFragment.from(Fragment.fromString(fragment))
  const contractInterface = new Interface([functionFragment])

  const sigHash = contractInterface.getSighash(functionFragment.name)

  const result = await getVM(chainId).runCall({
    caller: Address.zero(),
    to: Address.zero(),
    code: Buffer.from(bytecode, 'hex'),
    data: Buffer.from(`${sigHash.slice(2)}`, 'hex'),
  })

  if (result.execResult.exceptionError) {
    throw result.execResult.exceptionError
  }

  return defaultAbiCoder.decode(
    functionFragment.outputs!,
    result.execResult.returnValue
  )[0]
}

export async function simulateWrite({
  fragment,
  bytecode,
  address,
  inputs,
  chainId,
}: {
  fragment: string
  bytecode: string
  address: string
  inputs: any[]
  chainId: number
}) {
  const functionFragment = FunctionFragment.from(Fragment.fromString(fragment))
  const contractInterface = new Interface([functionFragment])

  const sigHash = contractInterface.getSighash(functionFragment.name)
  const inputsEncoded = defaultAbiCoder.encode(functionFragment.inputs, inputs)

  const result = await getVM(chainId).runCall({
    caller: Address.zero(),
    to: Address.fromString(address),
    code: Buffer.from(bytecode, 'hex'),
    data: Buffer.from(`${sigHash.slice(2)}${inputsEncoded.slice(2)}`, 'hex'),
  })

  if (result.execResult.exceptionError) {
    throw result.execResult.exceptionError
  }
}
