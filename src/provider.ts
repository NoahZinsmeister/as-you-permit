import { BigNumberish } from '@ethersproject/bignumber'
import { Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'

import {
  PermitData,
  PermitCalldata,
  Variant,
  variantDefinitions,
} from './variants'
import { parsePermitData, getPermitCalldataByVariant } from './permit'

const WALLET = Wallet.createRandom()

export async function getPermitCalldataByProvider(
  provider: Provider,
  permitData: PermitData,
  wallet: Wallet,
  getNonce?: (fragment: string, inputs: [string]) => Promise<BigNumberish>
): Promise<PermitCalldata> {
  const permitDataParsed = parsePermitData(permitData)
  if (permitDataParsed.chainId !== 1) throw Error('Invalid chainId.')

  const contract = new Contract(
    permitDataParsed.tokenAddress,
    [
      'function name() pure returns (string)',
      variantDefinitions[Variant.Zero].nonceFragment,
      variantDefinitions[Variant.Zero].permitFragment,
    ],
    provider
  )

  // try Variant.Zero
  const nonce = contract.nonces(WALLET.address).catch(() => null)
  const name = await contract.name().catch(() => null)

  if (name !== null) {
    // TODO iterate over versions in a nicer way here
    const versions = [null, '2']
    const callDatas = await Promise.all(
      versions.map(version =>
        getPermitCalldataByVariant(
          Variant.Zero,
          { name, ...(version ? { version } : {}) },
          {
            chainId: permitDataParsed.chainId,
            tokenAddress: permitDataParsed.tokenAddress,
            spender: permitDataParsed.spender,
            value: permitDataParsed.value,
            deadline: permitDataParsed.deadline,
          },
          WALLET,
          (_, __) => nonce
        ).catch(() => null)
      )
    )

    if (callDatas.some(callData => callData !== null)) {
      const successes = await Promise.all(
        callDatas.map(callData => {
          if (callData === null) return false
          return contract.callStatic
            .permit(...callData.inputs)
            .then(() => true)
            .catch(() => false)
        })
      )

      if (successes.some(success => success)) {
        const index = successes.findIndex(success => success)
        const version = versions[index]
        return getPermitCalldataByVariant(
          Variant.Zero,
          { name, ...(version ? { version } : {}) },
          permitDataParsed,
          wallet,
          getNonce || ((_, __) => contract.nonces(wallet.address))
        )
      }
    }
  }

  throw Error('Unable to identify variant.')
}
