import { BigNumberish, BigNumber } from '@ethersproject/bignumber'
import { getAddress } from '@ethersproject/address'
import { Wallet } from '@ethersproject/wallet'
import { splitSignature } from '@ethersproject/bytes'

import {
  Variant,
  variantDefinitions,
  VariantRequiredData,
  PermitCalldata,
  PermitData,
} from './variants'

interface PermitDataParsed {
  chainId: number
  tokenAddress: string
  spender: string
  value: BigNumber
  deadline: BigNumber
}

export function parsePermitData(permitData: PermitData): PermitDataParsed {
  return {
    chainId: permitData.chainId,
    tokenAddress: getAddress(permitData.tokenAddress),
    spender: getAddress(permitData.spender),
    value: BigNumber.from(permitData.value),
    deadline: BigNumber.from(permitData.deadline),
  }
}

export async function getPermitCalldataByVariant(
  variant: Variant,
  variantRequiredData: VariantRequiredData[Variant],
  permitData: PermitDataParsed,
  wallet: Wallet,
  getNonce: (fragment: string, inputs: [string]) => Promise<BigNumberish>
): Promise<PermitCalldata> {
  const variantDefinition = variantDefinitions[variant]

  switch (variant) {
    case Variant.Zero:
      const nonce = await getNonce(variantDefinition.nonceFragment, [
        wallet.address,
      ])

      const { v, r, s } = splitSignature(
        await wallet._signTypedData(
          {
            ...variantRequiredData,
            chainId: permitData.chainId,
            verifyingContract: permitData.tokenAddress,
          },
          {
            [variantDefinition.name]: variantDefinition.struct,
          },
          {
            owner: wallet.address,
            spender: permitData.spender,
            value: permitData.value,
            nonce,
            deadline: permitData.deadline,
          }
        )
      )
      return {
        fragment: variantDefinition.permitFragment,
        inputs: [
          wallet.address,
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
  wallet: Wallet,
  getNonce: (fragment: string, inputs: [string]) => Promise<BigNumberish>
): Promise<PermitCalldata> {
  const permitDataParsed = parsePermitData(permitData)

  // try to fetch contract data from known list
  return import(`./contracts/${permitDataParsed.tokenAddress}.json`).then(
    (knownContract: KnownContract) => {
      if (!knownContract.chainIds.includes(permitDataParsed.chainId))
        throw Error('Unsupported chainId.')

      return getPermitCalldataByVariant(
        knownContract.variant,
        knownContract.variantRequiredData,
        permitDataParsed,
        wallet,
        getNonce
      )
    }
  )
}
