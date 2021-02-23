import { BigNumber, BigNumberish } from '@ethersproject/bignumber'

// constant across variants
export const nonceFragment =
  'function nonces(address owner) view returns (uint256 nonce)'

export enum Variant {
  Canonical, // EIP-2612
}

interface VariantDefinition {
  structName: string
  struct: { name: string; type: string }[]
  fragment: string
}

export const variantDefinitions: Record<Variant, VariantDefinition> = {
  [Variant.Canonical]: {
    structName: 'Permit',
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
    fragment:
      'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  },
}

export interface VariantData {
  [Variant.Canonical]: {
    name: string
    version?: string
  }
}

export interface KnownToken {
  chainIds: number[]
  variant: Variant
  data: VariantData[Variant]
}

export interface PermitData {
  chainId: number
  tokenAddress: string
  spender: string
  value: BigNumberish
  deadline: BigNumberish
}

export interface VariantCalldata {
  [Variant.Canonical]: [
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
