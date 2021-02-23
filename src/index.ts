import * as providers from '@ethersproject/providers'
import * as wallet from '@ethersproject/wallet'

export { PermitData, VariantCalldata, PermitCalldata } from './variants'
export { getPermitCalldataOfKnownToken } from './permit'
export { getPermitCalldataBySimulation } from './withBytecode'
export { getPermitCalldataByProvider } from './withProvider'

// exported for compatibility if consumer does not want their own versions of these dependencies
export { providers, wallet }
