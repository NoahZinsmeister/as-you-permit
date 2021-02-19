import path from 'path'

import { contracts } from './contracts'

// public imports
import { getPermitCalldataBySimulation } from '../src'

// private imports for testing
import { read, WALLET } from '../src/simulate'
import { KnownContract } from '../src/permit'
import { Variant } from '../src/variants'

const SPENDER = '0x00C0FfeEc0FFEec0ffEeC0fFEEc0FfEeC0ffEE00'

describe('simulate', () => {
  // for all contracts
  Object.keys(contracts).forEach(tokenAddress => {
    describe(tokenAddress, () => {
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
                bytecode: contracts[tokenAddress].bytecode,
              })
              expect(name).toBe(knownContract.variantRequiredData.name)
          }
        }
      })

      it('getPermitCalldataBySimulation', async () => {
        const permitCalldata = await getPermitCalldataBySimulation(
          contracts[tokenAddress].bytecode,
          {
            chainId: contracts[tokenAddress].chainId,
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
