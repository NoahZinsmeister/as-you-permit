import path from 'path'
import fs from 'fs'

import { getPermitSignatureViaWallet } from '../src'

import { ContractData } from '../src/types'
import { SPENDER, WALLET } from '../src/simulate'

describe('getPermitSignatureViaWallet', () => {
  const filenames: string[] = fs.readdirSync(
    path.join(__dirname, '..', 'src', 'contracts')
  )

  // for all files
  filenames.forEach(async filename => {
    describe(filename, () => {
      const address = filename.split('.')[0]
      let data: ContractData

      beforeAll(async () => {
        data = await import(
          path.join(__dirname, '..', 'src', 'contracts', filename)
        )
      })

      it('getPermitSignatureViaWallet', async () => {
        await Promise.all(
          data.chainIds.map(async chainId => {
            const { v, r, s } = await getPermitSignatureViaWallet(
              {
                chainId,
                tokenAddress: address,
                owner: WALLET.address,
                spender: SPENDER,
                value:
                  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                nonce: 0,
                deadline:
                  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
              },
              WALLET
            )

            expect(v).toBeTruthy // eslint-disable-line @typescript-eslint/no-unused-expressions
            expect(r).toBeTruthy // eslint-disable-line @typescript-eslint/no-unused-expressions
            expect(s).toBeTruthy // eslint-disable-line @typescript-eslint/no-unused-expressions
          })
        )
      })
    })
  })
})
