import { BigNumberish } from '@ethersproject/bignumber'
import { Wallet } from '@ethersproject/wallet'
import { getAddress } from '@ethersproject/address'
import { splitSignature } from '@ethersproject/bytes'

import { VariantData, ContractData } from './types'
import { Variant, definitions } from './variants'

export interface PermitData {
  chainId?: number
  tokenAddress: string
  owner: string
  spender: string
  value: BigNumberish
  nonce: BigNumberish
  deadline: BigNumberish
}

export async function getPermitSignatureByVariantViaWallet(
  variant: Variant,
  variantData: VariantData[Variant.Zero],
  permitData: PermitData,
  wallet: Wallet
) {
  const definition = definitions[variant]

  switch (variant) {
    case Variant.Zero:
      return splitSignature(
        await wallet._signTypedData(
          {
            name: variantData.name,
            chainId: permitData.chainId ?? 1,
            verifyingContract: permitData.tokenAddress,
          },
          {
            [definition.name]: definition.struct,
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
    default:
      throw Error('Unrecognized variant.')
  }
}

export async function getPermitSignatureViaWallet(
  permitData: PermitData,
  wallet: Wallet
) {
  // normalize addresses
  permitData.tokenAddress = getAddress(permitData.tokenAddress)
  permitData.owner = getAddress(permitData.owner)
  permitData.spender = getAddress(permitData.spender)

  // ensure owner is the wallet address
  if (permitData.owner !== wallet.address)
    throw Error('Wallet address does not match owner.')

  // try to fetch contract data from known list
  return import(`./contracts/${permitData.tokenAddress}.json`)
    .then((contractData: ContractData) => {
      if (!contractData.chainIds.includes(permitData.chainId ?? 1))
        throw Error('Unsupported chainId.')

      return getPermitSignatureByVariantViaWallet(
        contractData.variant,
        contractData.variantData,
        permitData,
        wallet
      )
    })
    .catch(() => {
      throw Error('Not implemented.')
    })
}
