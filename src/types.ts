import { Variant } from './variants'

export interface VariantData {
  [Variant.Zero]: {
    name: string
  }
}

export interface ContractData {
  chainIds: number[]
  variant: Variant
  variantData: VariantData[Variant.Zero]
}
