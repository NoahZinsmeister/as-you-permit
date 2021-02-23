import hre from 'hardhat'
import { Web3Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'

import exemptions from './exemptions.json'

// public imports
import { getPermitCalldataByProvider } from '../src'

const provider = new Web3Provider(hre.network.provider as any)

const WALLET = Wallet.createRandom()
const SPENDER = '0x00C0FfeEc0FFEec0ffEeC0fFEEc0FfEeC0ffEE00'

describe('provider', () => {
  for (const tokenAddress of exemptions) {
    describe(tokenAddress, () => {
      it('getPermitCalldataByProvider', async () => {
        const permitCalldata = await getPermitCalldataByProvider(
          provider,
          {
            chainId: 1,
            tokenAddress,
            spender: SPENDER,
            value:
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            deadline:
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          },
          WALLET
        )
        expect(permitCalldata).toBeTruthy()
      }, 30000)
    })
  }
})
