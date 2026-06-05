import type {
  Store,
  Menu,
  OptionGroup,
  Option,
  CatalogData,
} from "./types"

// In-memory data store
let stores: Store[] = []
let menus: Menu[] = []
let optionGroups: OptionGroup[] = []
let options: Option[] = []

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const timestamp = () => new Date().toISOString()

// Simulate API delay
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Store API
export async function apiGetStores(): Promise<Store[]> {
  await delay()
  return [...stores]
}

export async function apiCreateStore(
  data: Omit<Store, "id" | "createdAt" | "updatedAt">
): Promise<Store> {
  await delay()
  const store: Store = {
    ...data,
    id: generateId(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  }
  stores.push(store)
  return store
}

export async function apiUpdateStore(
  id: string,
  data: Partial<Omit<Store, "id" | "createdAt" | "updatedAt">>
): Promise<Store> {
  await delay()
  const index = stores.findIndex((s) => s.id === id)
  if (index === -1) throw new Error("Store not found")
  stores[index] = { ...stores[index], ...data, updatedAt: timestamp() }
  return stores[index]
}

export async function apiDeleteStore(id: string): Promise<void> {
  await delay()
  const index = stores.findIndex((s) => s.id === id)
  if (index === -1) throw new Error("Store not found")
  // Delete related data
  const menuIds = menus.filter((m) => m.storeId === id).map((m) => m.id)
  const optionGroupIds = optionGroups
    .filter((og) => menuIds.includes(og.menuId))
    .map((og) => og.id)
  options = options.filter((o) => !optionGroupIds.includes(o.optionGroupId))
  optionGroups = optionGroups.filter((og) => !menuIds.includes(og.menuId))
  menus = menus.filter((m) => m.storeId !== id)
  stores.splice(index, 1)
}

// Menu API
export async function apiGetMenus(storeId: string): Promise<Menu[]> {
  await delay()
  return menus.filter((m) => m.storeId === storeId)
}

export async function apiCreateMenu(
  data: Omit<Menu, "id" | "createdAt" | "updatedAt">
): Promise<Menu> {
  await delay()
  const menu: Menu = {
    ...data,
    id: generateId(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  }
  menus.push(menu)
  return menu
}

export async function apiUpdateMenu(
  id: string,
  data: Partial<Omit<Menu, "id" | "createdAt" | "updatedAt">>
): Promise<Menu> {
  await delay()
  const index = menus.findIndex((m) => m.id === id)
  if (index === -1) throw new Error("Menu not found")
  menus[index] = { ...menus[index], ...data, updatedAt: timestamp() }
  return menus[index]
}

export async function apiDeleteMenu(id: string): Promise<void> {
  await delay()
  const index = menus.findIndex((m) => m.id === id)
  if (index === -1) throw new Error("Menu not found")
  // Delete related data
  const optionGroupIds = optionGroups
    .filter((og) => og.menuId === id)
    .map((og) => og.id)
  options = options.filter((o) => !optionGroupIds.includes(o.optionGroupId))
  optionGroups = optionGroups.filter((og) => og.menuId !== id)
  menus.splice(index, 1)
}

// OptionGroup API
export async function apiGetOptionGroups(menuId: string): Promise<OptionGroup[]> {
  await delay()
  return optionGroups
    .filter((og) => og.menuId === menuId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function apiCreateOptionGroup(
  data: Omit<OptionGroup, "id" | "createdAt" | "updatedAt">
): Promise<OptionGroup> {
  await delay()
  const optionGroup: OptionGroup = {
    ...data,
    id: generateId(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  }
  optionGroups.push(optionGroup)
  return optionGroup
}

export async function apiUpdateOptionGroup(
  id: string,
  data: Partial<Omit<OptionGroup, "id" | "createdAt" | "updatedAt">>
): Promise<OptionGroup> {
  await delay()
  const index = optionGroups.findIndex((og) => og.id === id)
  if (index === -1) throw new Error("OptionGroup not found")
  optionGroups[index] = { ...optionGroups[index], ...data, updatedAt: timestamp() }
  return optionGroups[index]
}

export async function apiDeleteOptionGroup(id: string): Promise<void> {
  await delay()
  const index = optionGroups.findIndex((og) => og.id === id)
  if (index === -1) throw new Error("OptionGroup not found")
  options = options.filter((o) => o.optionGroupId !== id)
  optionGroups.splice(index, 1)
}

// Option API
export async function apiGetOptions(optionGroupId: string): Promise<Option[]> {
  await delay()
  return options
    .filter((o) => o.optionGroupId === optionGroupId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function apiCreateOption(
  data: Omit<Option, "id" | "createdAt" | "updatedAt">
): Promise<Option> {
  await delay()
  const option: Option = {
    ...data,
    id: generateId(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  }
  options.push(option)
  return option
}

export async function apiUpdateOption(
  id: string,
  data: Partial<Omit<Option, "id" | "createdAt" | "updatedAt">>
): Promise<Option> {
  await delay()
  const index = options.findIndex((o) => o.id === id)
  if (index === -1) throw new Error("Option not found")
  options[index] = { ...options[index], ...data, updatedAt: timestamp() }
  return options[index]
}

export async function apiDeleteOption(id: string): Promise<void> {
  await delay()
  const index = options.findIndex((o) => o.id === id)
  if (index === -1) throw new Error("Option not found")
  options.splice(index, 1)
}

// Duplication API
export async function apiDuplicateOptionGroup(
  optionGroupId: string,
  targetMenuId: string
): Promise<{ optionGroup: OptionGroup; options: Option[] }> {
  await delay()
  const sourceGroup = optionGroups.find((og) => og.id === optionGroupId)
  if (!sourceGroup) throw new Error("OptionGroup not found")

  const newGroup: OptionGroup = {
    ...sourceGroup,
    id: generateId(),
    menuId: targetMenuId,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  }
  optionGroups.push(newGroup)

  const sourceOptions = options.filter((o) => o.optionGroupId === optionGroupId)
  const newOptions: Option[] = sourceOptions.map((o) => ({
    ...o,
    id: generateId(),
    optionGroupId: newGroup.id,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  }))
  options.push(...newOptions)

  return { optionGroup: newGroup, options: newOptions }
}

export async function apiDuplicateAllOptionGroups(
  sourceMenuId: string,
  targetMenuId: string
): Promise<{ optionGroups: OptionGroup[]; options: Option[] }> {
  await delay()
  const sourceGroups = optionGroups.filter((og) => og.menuId === sourceMenuId)
  const newGroups: OptionGroup[] = []
  const newOptions: Option[] = []

  for (const group of sourceGroups) {
    const newGroup: OptionGroup = {
      ...group,
      id: generateId(),
      menuId: targetMenuId,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    }
    newGroups.push(newGroup)
    optionGroups.push(newGroup)

    const groupOptions = options.filter((o) => o.optionGroupId === group.id)
    for (const opt of groupOptions) {
      const newOpt: Option = {
        ...opt,
        id: generateId(),
        optionGroupId: newGroup.id,
        createdAt: timestamp(),
        updatedAt: timestamp(),
      }
      newOptions.push(newOpt)
      options.push(newOpt)
    }
  }

  return { optionGroups: newGroups, options: newOptions }
}

// Export/Import API
export async function apiExportCatalog(): Promise<CatalogData> {
  await delay()
  return {
    stores: [...stores],
    menus: [...menus],
    optionGroups: [...optionGroups],
    options: [...options],
  }
}

export async function apiImportCatalog(
  data: CatalogData,
  mode: "merge" | "replace"
): Promise<{ imported: number; errors: string[] }> {
  await delay()
  const errors: string[] = []
  let imported = 0

  // Validate data structure
  if (!data.stores || !Array.isArray(data.stores)) {
    errors.push("Invalid stores data")
  }
  if (!data.menus || !Array.isArray(data.menus)) {
    errors.push("Invalid menus data")
  }
  if (!data.optionGroups || !Array.isArray(data.optionGroups)) {
    errors.push("Invalid optionGroups data")
  }
  if (!data.options || !Array.isArray(data.options)) {
    errors.push("Invalid options data")
  }

  if (errors.length > 0) {
    return { imported: 0, errors }
  }

  if (mode === "replace") {
    stores = []
    menus = []
    optionGroups = []
    options = []
  }

  // Import stores
  for (const store of data.stores) {
    if (!store.id || !store.name) {
      errors.push(`Invalid store: ${JSON.stringify(store).slice(0, 100)}`)
      continue
    }
    if (mode === "merge" && stores.find((s) => s.id === store.id)) {
      continue // Skip duplicates in merge mode
    }
    stores.push({ ...store, updatedAt: timestamp() })
    imported++
  }

  // Import menus
  for (const menu of data.menus) {
    if (!menu.id || !menu.name || !menu.storeId) {
      errors.push(`Invalid menu: ${JSON.stringify(menu).slice(0, 100)}`)
      continue
    }
    if (mode === "merge" && menus.find((m) => m.id === menu.id)) {
      continue
    }
    menus.push({ ...menu, updatedAt: timestamp() })
    imported++
  }

  // Import optionGroups
  for (const og of data.optionGroups) {
    if (!og.id || !og.name || !og.menuId) {
      errors.push(`Invalid optionGroup: ${JSON.stringify(og).slice(0, 100)}`)
      continue
    }
    if (mode === "merge" && optionGroups.find((g) => g.id === og.id)) {
      continue
    }
    optionGroups.push({ ...og, updatedAt: timestamp() })
    imported++
  }

  // Import options
  for (const opt of data.options) {
    if (!opt.id || !opt.name || !opt.optionGroupId) {
      errors.push(`Invalid option: ${JSON.stringify(opt).slice(0, 100)}`)
      continue
    }
    if (mode === "merge" && options.find((o) => o.id === opt.id)) {
      continue
    }
    options.push({ ...opt, updatedAt: timestamp() })
    imported++
  }

  return { imported, errors }
}

// Get linkable menus (SIDE and DRINK only)
export async function apiGetLinkableMenus(storeId: string): Promise<Menu[]> {
  await delay(100)
  return menus.filter(
    (m) => m.storeId === storeId && (m.type === "SIDE" || m.type === "DRINK")
  )
}

// Get target menus for duplication (MAIN and SET only)
export async function apiGetTargetMenus(
  storeId: string,
  excludeMenuId?: string
): Promise<Menu[]> {
  await delay(100)
  return menus.filter(
    (m) =>
      m.storeId === storeId &&
      (m.type === "MAIN" || m.type === "SET") &&
      m.id !== excludeMenuId
  )
}
