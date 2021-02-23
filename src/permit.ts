import { BigNumberish, BigNumber } from '@ethersproject/bignumber'
import { getAddress } from '@ethersproject/address'
import { Wallet } from '@ethersproject/wallet'
import { splitSignature } from '@ethersproject/bytes'

import {
  Variant,
  variantDefinitions,
  VariantData,
  PermitCalldata,
  PermitData,
  KnownToken,
  nonceFragment,
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
  variantData: VariantData[Variant],
  permitData: PermitDataParsed,
  wallet: Wallet,
  getNonce: (fragment: string, inputs: [string]) => Promise<BigNumberish>
): Promise<PermitCalldata> {
  const nonce = await getNonce(nonceFragment, [wallet.address])

  const variantDefinition = variantDefinitions[variant]

  switch (variant) {
    case Variant.Canonical:
      const { v, r, s } = splitSignature(
        await wallet._signTypedData(
          {
            ...variantData,
            chainId: permitData.chainId,
            verifyingContract: permitData.tokenAddress,
          },
          {
            [variantDefinition.structName]: variantDefinition.struct,
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
        fragment: variantDefinition.fragment,
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

export async function getPermitCalldataOfKnownToken(
  permitData: PermitData,
  wallet: Wallet,
  getNonce: (fragment: string, inputs: [string]) => Promise<BigNumberish>
): Promise<PermitCalldata> {
  const permitDataParsed = parsePermitData(permitData)

  // try to fetch known token data
  return import(`./tokens/${permitDataParsed.tokenAddress}.json`).then(
    (knownToken: KnownToken) => {
      if (!knownToken.chainIds.includes(permitDataParsed.chainId))
        throw Error('Unsupported chainId.')

      return getPermitCalldataByVariant(
        knownToken.variant,
        knownToken.data,
        permitDataParsed,
        wallet,
        getNonce
      )
    }
  )
}
