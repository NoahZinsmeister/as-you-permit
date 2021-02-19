import { BigNumberish, BigNumber } from '@ethersproject/bignumber'
import { getAddress } from '@ethersproject/address'
import { Wallet } from '@ethersproject/wallet'
import { splitSignature } from '@ethersproject/bytes'

import {
  Variant,
  variantDefinitions,
  VariantRequiredData,
  PermitCalldata,
} from './variants'

export interface PermitData {
  chainId?: number
  tokenAddress: string
  owner: string
  spender: string
  value: BigNumberish
  nonce: BigNumberish
  deadline: BigNumberish
}

export interface PermitDataParsed {
  chainId: number
  tokenAddress: string
  owner: string
  spender: string
  value: BigNumber
  nonce: BigNumber
  deadline: BigNumber
}

export function parsePermitData(permitData: PermitData): PermitDataParsed {
  return {
    chainId: permitData.chainId ?? 1,
    tokenAddress: getAddress(permitData.tokenAddress),
    owner: getAddress(permitData.owner),
    spender: getAddress(permitData.spender),
    value: BigNumber.from(permitData.value),
    nonce: BigNumber.from(permitData.nonce),
    deadline: BigNumber.from(permitData.deadline),
  }
}

export async function getPermitCalldataByVariant(
  variant: Variant,
  variantRequiredData: VariantRequiredData[Variant],
  permitData: PermitDataParsed,
  wallet: Wallet
): Promise<PermitCalldata> {
  const variantDefinition = variantDefinitions[variant]

  switch (variant) {
    case Variant.Zero:
      const { v, r, s } = splitSignature(
        await wallet._signTypedData(
          {
            name: variantRequiredData.name,
            chainId: permitData.chainId,
            verifyingContract: permitData.tokenAddress,
          },
          {
            [variantDefinition.name]: variantDefinition.struct,
          },
          {
            owner: permitData.owner,
            spender: permitData.spender,
            value: permitData.value,
            nonce: permitData.nonce,
            deadline: permitData.deadline,
          }
        )
      )
      return {
        fragment: variantDefinition.fragment,
        inputs: [
          permitData.owner,
          permitData.spender,
          permitData.value,
          permitData.deadline,
          v,
          r,
          s,
        ],
      }
    default:
      throw Error('Unrecognized variant.')
  }
}

export interface KnownContract {
  chainIds: number[]
  variant: Variant
  variantRequiredData: VariantRequiredData[Variant]
}

export async function getPermitCalldata(
  permitData: PermitData,
  wallet: Wallet
): Promise<PermitCalldata> {
  const permitDataParsed = parsePermitData(permitData)

  // ensure owner is the wallet address
  if (wallet.address !== permitDataParsed.owner)
    throw Error('Wallet address is not owner.')

  // try to fetch contract data from known list
  return import(`./contracts/${permitDataParsed.tokenAddress}.json`).then(
    (knownContract: KnownContract) => {
      if (!knownContract.chainIds.includes(permitDataParsed.chainId))
        throw Error('Unsupported chainId.')

      return getPermitCalldataByVariant(
        knownContract.variant,
        knownContract.variantRequiredData,
        permitDataParsed,
        wallet
      )
    }
  )
}
