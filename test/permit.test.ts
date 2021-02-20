import path from 'path'
import fs from 'fs'

import contracts from './contracts.json'

// public imports
import { getPermitCalldata, getPermitCalldataBySimulation } from '../src'

// private imports for testing
import { KnownContract } from '../src/permit'
import { WALLET } from '../src/simulate'

const SPENDER = '0x00C0FfeEc0FFEec0ffEeC0fFEEc0FfEeC0ffEE00'

// these contracts must be tested manually
const KNOWN_CONTRACTS_WITH_EXEMPTIONS = [
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC, upgradable
]

describe('permit', () => {
  const knownContractFilenames: string[] = fs.readdirSync(
    path.join(__dirname, '..', 'src', 'contracts')
  )

  // for all known contracts
  knownContractFilenames.forEach(knownContractFilename => {
    describe(knownContractFilename, () => {
      const tokenAddress = knownContractFilename.split('.')[0]
      let knownContract: KnownContract
      const implementation: {
        chainId: number
        bytecode: string
      } = (contracts as any)[tokenAddress]

      beforeAll(async () => {
        knownContract = await import(
          path.join(__dirname, '..', 'src', 'contracts', knownContractFilename)
        )
      })

      it('ensure that each known contract also has a valid implemention, unless exempt', () => {
        if (!KNOWN_CONTRACTS_WITH_EXEMPTIONS.includes(tokenAddress)) {
          expect(implementation).toBeTruthy()
          expect(knownContract.chainIds.includes(implementation.chainId)).toBe(
            true
          )
        }
      })

      it('getPermitCalldata', () => {
        // this is janky, but can't figure out how to loop over result of async dynamic import
        return Promise.all(
          // for all chainIds
          knownContract.chainIds.map(async chainId => {
            // ensure that we can generate permit calldata without simulation
            const permitCalldata = await getPermitCalldata(
              {
                chainId,
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
        )
      })

      it('ensure calldata from known data matches simulation results', async () => {
        if (!KNOWN_CONTRACTS_WITH_EXEMPTIONS.includes(tokenAddress)) {
          const permitData = {
            chainId: implementation.chainId,
            tokenAddress,
            spender: SPENDER,
            value:
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            deadline:
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          }

          const permitCalldata = await getPermitCalldata(
            permitData,
            WALLET,
            () => Promise.resolve(0)
          )
          const permitCalldataBySimulation = await getPermitCalldataBySimulation(
            implementation.bytecode,
            permitData,
            WALLET,
            () => Promise.resolve(0)
          )
          expect(permitCalldata).toEqual(permitCalldataBySimulation)
        }
      })
    })
  })
})
