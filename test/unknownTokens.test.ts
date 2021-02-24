// public imports
import {
  getPermitCalldataBySimulation,
  getPermitCalldataByProvider,
} from '../src'

// private imports for testing
import { PROVIDERS, SPENDER, WALLET } from '.'

describe('with provider', () => {
  const provider = PROVIDERS[1]
  const tokenAddress = '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11' // UNI-V2 ETH/DAI

  describe(tokenAddress, () => {
    // TODO figure out the bug causing this test to fail
    it.skip('getPermitCalldataBySimulation', async () => {
      const bytecode = await provider.getCode(tokenAddress)
      const calldata = await getPermitCalldataBySimulation(
        bytecode.slice(2),
        {
          tokenAddress,
          spender: SPENDER,
        },
        WALLET,
        () => Promise.resolve(0)
      )

      expect(calldata).toBeTruthy()
    })

    it('getPermitCalldataByProvider', async () => {
      const calldata = await getPermitCalldataByProvider(
        provider,
        {
          tokenAddress,
          spender: SPENDER,
        },
        WALLET
      )

      expect(calldata).toBeTruthy()
    })
  })
})
