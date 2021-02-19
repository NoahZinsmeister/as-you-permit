import { WALLET, SPENDER, read, simulateWrite } from '../src/simulate'
import { Variant } from '../src/variants'

import { getPermitSignatureByVariantViaWallet } from '../src'

import { contracts } from './contracts'

describe('simulate', () => {
  describe('UNI', () => {
    const address = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

    it('name', async () => {
      const name = await read({
        fragment: 'function name() pure returns (string)',
        bytecode: contracts[address],
        chainId: 1,
      })
      expect(name).toBe('Uniswap')
    })

    it('permit', async () => {
      const { v, r, s } = await getPermitSignatureByVariantViaWallet(
        Variant.Zero,
        { name: 'Uniswap' },
        {
          chainId: 1,
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

      await simulateWrite({
        fragment:
          'function permit(address owner, address spender, uint rawAmount, uint deadline, uint8 v, bytes32 r, bytes32 s)',
        bytecode: contracts[address],
        address,
        inputs: [
          WALLET.address,
          SPENDER,
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          v,
          r,
          s,
        ],
        chainId: 1,
      })
    })
  })
})
