import { BigNumberish } from '@ethersproject/bignumber'
import { Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'

import {
  PermitData,
  PermitCalldata,
  Variant,
  variantDefinitions,
  nonceFragment,
} from './variants'
import { parsePermitData, getPermitCalldataByVariant } from './permit'

const WALLET = Wallet.createRandom()

// note that the chainId of the `provider` must match that specified in `permitData`
export async function getPermitCalldataByProvider(
  provider: Provider,
  permitData: PermitData,
  wallet: Wallet,
  getNonce?: (fragment: string, inputs: [string]) => Promise<BigNumberish>
): Promise<PermitCalldata> {
  const permitDataParsed = parsePermitData(permitData)
  const contract = new Contract(
    permitDataParsed.tokenAddress,
    [
      nonceFragment,
      'function name() pure returns (string)',
      variantDefinitions[Variant.Canonical].fragment,
    ],
    provider
  )

  // kick off nonce call right away
  const nonce = contract.nonces(WALLET.address).catch(() => {
    throw Error('Unable to fetch nonce.')
  })

  // try Variant.Canonical
  const name = await contract.name().catch(() => null)

  if (name !== null) {
    // iterate over possible versions (somewhat janky, don't see a nice way around it though)
    const versions = [null, '1', '2']
    const version: (null | string) | undefined = await Promise.any(
      versions.map(version =>
        getPermitCalldataByVariant(
          Variant.Canonical,
          { name, ...(version ? { version } : {}) },
          {
            chainId: permitDataParsed.chainId,
            tokenAddress: permitDataParsed.tokenAddress,
            spender: permitDataParsed.spender,
            value: permitDataParsed.value,
            deadline: permitDataParsed.deadline,
          },
          WALLET,
          () => nonce
        ).then(callData =>
          contract.callStatic.permit(...callData.inputs).then(() => version)
        )
      )
    ).catch(() => undefined)

    // version is only undefined if none of our tries worked
    if (version !== undefined) {
      return getPermitCalldataByVariant(
        Variant.Canonical,
        { name, ...(version ? { version } : {}) },
        permitDataParsed,
        wallet,
        getNonce || (() => contract.nonces(wallet.address))
      )
    }
  }

  throw Error('Unable to identify variant.')
}
