import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import { KnownToken } from '../src/variants'
import { wallet, providers } from '../src'

import bytecode from './bytecode.json'

dotenv.config()

export const SPENDER = '0x00C0FfeEc0FFEec0ffEeC0fFEEc0FfEeC0ffEE00'
export const WALLET = wallet.Wallet.createRandom()

if (
  typeof process.env.URL_MAINNET !== 'string' ||
  process.env.URL_MAINNET.length === 0
)
  throw Error('Please provide a valid URL_MAINNET')

export const PROVIDERS: { [chainId: number]: providers.Provider } = {
  1: new providers.JsonRpcProvider(process.env.URL_MAINNET),
}

export async function getKnownTokens(): Promise<
  {
    knownToken: KnownToken
    tokenAddress: string
    bytecode: { [chainId: number]: string }
  }[]
> {
  const filenames: string[] = await fs.promises.readdir(
    path.join(__dirname, '..', 'src', 'tokens')
  )

  const knownTokens = await Promise.all(
    filenames.map(
      (filename): Promise<KnownToken> =>
        import(path.join(__dirname, '..', 'src', 'tokens', filename))
    )
  )

  const tokenAddresses = filenames.map(filename => filename.split('.')[0])

  const bytecodes = tokenAddresses.map(tokenAddress => {
    const optionalBytecode:
      | {
          chainId: number
          bytecode: string
        }
      | undefined = (bytecode as any)[tokenAddress]
    if (optionalBytecode === undefined) return {}
    // each token only supports a single chainId per bytecode at the moment
    return { [optionalBytecode.chainId]: optionalBytecode.bytecode }
  })

  return knownTokens.map((knownToken, i) => ({
    knownToken,
    tokenAddress: tokenAddresses[i],
    bytecode: bytecodes[i],
  }))
}

export const NUMBER_OF_KNOWN_TOKENS = fs.readdirSync(
  path.join(__dirname, '..', 'src', 'tokens')
).length
