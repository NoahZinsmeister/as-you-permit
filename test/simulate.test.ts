import path from 'path'
import { Wallet } from '@ethersproject/wallet'

import contracts from './contracts.json'

// public imports
import { getPermitCalldataBySimulation } from '../src'

// private imports for testing
import { read } from '../src/simulate'
import { KnownContract } from '../src/permit'
import { Variant } from '../src/variants'

const WALLET = Wallet.createRandom()
const SPENDER = '0x00C0FfeEc0FFEec0ffEeC0fFEEc0FfEeC0ffEE00'

describe('simulate', () => {
  // for all contracts
  Object.keys(contracts).forEach(tokenAddress => {
    describe(tokenAddress, () => {
      const implementation: {
        chainId: number
        bytecode: string
      } = (contracts as any)[tokenAddress]
      let knownContract: KnownContract

      beforeAll(async () => {
        knownContract = await import(
          path.join(__dirname, '..', 'src', 'contracts', `${tokenAddress}.json`)
        ).catch()
      })

      it('if contract is known, ensure the required data matches', async () => {
        if (knownContract) {
          switch (knownContract.variant) {
            case Variant.Zero:
              const name = await read({
                fragment: 'function name() pure returns (string)',
                bytecode: implementation.bytecode,
              })
              expect(name).toBe(knownContract.variantRequiredData.name)
          }
        }
      })

      it('getPermitCalldataBySimulation', async () => {
        const permitCalldata = await getPermitCalldataBySimulation(
          implementation.bytecode,
          {
            chainId: implementation.chainId,
            tokenAddress,
            spender: SPENDER,
            value:
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            deadline:
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          },
          WALLET,
          () => Promise.resolve(0)
        )
        expect(permitCalldata).toBeTruthy()
      })
    })
  })
})
