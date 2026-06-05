export type MenuType = "MAIN" | "SET" | "SIDE" | "DRINK"
export type SelectionType = "RADIO" | "CHECKBOX"
export type OptionEffect = "NONE" | "ADD" | "EXCLUDE" | "REPLACE" | "NOTE"

export interface Store {
  id: string
  name: string
  address: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Menu {
  id: string
  storeId: string
  name: string
  type: MenuType
  basePrice: number
  allergens: string[]
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface OptionGroup {
  id: string
  menuId: string
  name: string
  selectionType: SelectionType
  isRequired: boolean
  minSelect: number
  maxSelect: number
  sortOrder: number
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface Option {
  id: string
  optionGroupId: string
  name: string
  effect: OptionEffect
  additionalPrice: number
  linkedMenuId: string | null
  isDefaultSelected: boolean
  sortOrder: number
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface CatalogData {
  stores: Store[]
  menus: Menu[]
  optionGroups: OptionGroup[]
  options: Option[]
}
