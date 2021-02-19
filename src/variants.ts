import { BigNumber, BigNumberish } from '@ethersproject/bignumber'

export enum Variant {
  Zero, // UNI
}

interface VariantDefinition {
  name: string
  struct: { name: string; type: string }[]
  nonceFragment: string
  permitFragment: string
}

export const variantDefinitions: Record<Variant, VariantDefinition> = {
  [Variant.Zero]: {
    name: 'Permit',
    struct: [
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'value',
        type: 'uint256',
      },
      {
        name: 'nonce',
        type: 'uint256',
      },
      {
        name: 'deadline',
        type: 'uint256',
      },
    ],
    nonceFragment:
      'function nonces(address owner) view returns (uint256 nonce)',
    permitFragment:
      'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  },
}

export interface VariantRequiredData {
  [Variant.Zero]: {
    name: string
  }
}

export interface PermitData {
  chainId: number
  tokenAddress: string
  spender: string
  value: BigNumberish
  deadline: BigNumberish
}

export interface VariantCalldata {
  [Variant.Zero]: [
    string, // owner
    string, // spender
    BigNumber, // value
    BigNumber, // deadline
    number, // v
    string, // r
    string // s
  ]
}

export interface PermitCalldata {
  fragment: string
  inputs: VariantCalldata[Variant]
}
