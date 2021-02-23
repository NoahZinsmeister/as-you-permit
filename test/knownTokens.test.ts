// public imports
import {
  getPermitCalldataOfKnownToken,
  getPermitCalldataBySimulation,
  getPermitCalldataByProvider,
} from '../src'

// private imports for testing
import {
  getKnownTokens,
  NUMBER_OF_KNOWN_TOKENS,
  PROVIDERS,
  SPENDER,
  WALLET,
} from '.'

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T

describe('known tokens', () => {
  let knownTokens: Awaited<ReturnType<typeof getKnownTokens>>

  beforeAll(async () => {
    knownTokens = await getKnownTokens()
  })

  // hack so that we can loop through the awaited array
  new Array(NUMBER_OF_KNOWN_TOKENS)
    .fill(0)
    .map((_, i) => i)
    .forEach(i => {
      describe(`token ${i}`, () => {
        it('includes mainnet', () => {
          const { knownToken } = knownTokens[i]
          expect(knownToken.chainIds.includes(1)).toBe(true)
        })

        it('getPermitCalldataOfKnownToken does not fail for any chainId', () => {
          const { knownToken, tokenAddress } = knownTokens[i]

          // loop over all chainIds
          return Promise.all(
            knownToken.chainIds.map(async chainId => {
              const permitCalldata = await getPermitCalldataOfKnownToken(
                {
                  chainId,
                  tokenAddress: tokenAddress,
                  spender: SPENDER,
                },
                WALLET,
                () => Promise.resolve(0)
              )

              expect(permitCalldata).toBeTruthy()
            })
          )
        })

        it('getPermitCalldataBySimulation matches known implementation', () => {
          const { tokenAddress, bytecode } = knownTokens[i]

          // loop over all bytecode chainIds
          return Promise.all(
            Object.keys(bytecode).map(async chainId => {
              const permitData = {
                chainId: Number(chainId),
                tokenAddress: tokenAddress,
                spender: SPENDER,
              }

              const known = await getPermitCalldataOfKnownToken(
                permitData,
                WALLET,
                () => Promise.resolve(0)
              )
              const simulation = await getPermitCalldataBySimulation(
                bytecode[Number(chainId)],
                permitData,
                WALLET,
                () => Promise.resolve(0)
              )

              expect(known).toEqual(simulation)
            })
          )
        })

        it('getPermitCalldataByProvider matches known implementation', async () => {
          // we only test against mainnet at the moment
          const provider = PROVIDERS[1]
          const { tokenAddress } = knownTokens[i]

          const permitData = {
            tokenAddress: tokenAddress,
            spender: SPENDER,
          }

          const known = await getPermitCalldataOfKnownToken(
            permitData,
            WALLET,
            () => Promise.resolve(0)
          )
          const byProvider = await getPermitCalldataByProvider(
            provider,
            permitData,
            WALLET
          )

          expect(known).toEqual(byProvider)
        })
      })
    })
})
