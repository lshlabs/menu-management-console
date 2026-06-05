"use client"

import { useState, useEffect, useCallback } from "react"
import { Toaster, toast } from "sonner"
import { StoreManager } from "@/components/store-manager"
import { MenuManager } from "@/components/menu-manager"
import { OptionGroupManager } from "@/components/option-group-manager"
import { OptionManager } from "@/components/option-manager"
import { MenuDetail } from "@/components/menu-detail"
import { JsonImportExport } from "@/components/json-import-export"
import { Badge } from "@/components/ui/badge"
import type { Store, Menu, OptionGroup, Option, CatalogData } from "@/lib/types"
import {
  apiGetStores,
  apiCreateStore,
  apiUpdateStore,
  apiDeleteStore,
  apiGetMenus,
  apiCreateMenu,
  apiUpdateMenu,
  apiDeleteMenu,
  apiGetOptionGroups,
  apiCreateOptionGroup,
  apiUpdateOptionGroup,
  apiDeleteOptionGroup,
  apiGetOptions,
  apiCreateOption,
  apiUpdateOption,
  apiDeleteOption,
  apiDuplicateOptionGroup,
  apiDuplicateAllOptionGroups,
  apiExportCatalog,
  apiImportCatalog,
  apiGetLinkableMenus,
  apiGetTargetMenus,
} from "@/lib/mock-api"

export default function MenuManagementPage() {
  // Data state
  const [stores, setStores] = useState<Store[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [options, setOptions] = useState<Map<string, Option[]>>(new Map())
  const [linkableMenus, setLinkableMenus] = useState<Menu[]>([])
  const [targetMenus, setTargetMenus] = useState<Menu[]>([])

  // Selection state
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [selectedOptionGroup, setSelectedOptionGroup] = useState<OptionGroup | null>(
    null
  )

  // Loading state
  const [isLoading, setIsLoading] = useState(false)

  // Load stores on mount
  useEffect(() => {
    loadStores()
  }, [])

  // Load menus when store changes
  useEffect(() => {
    if (selectedStore) {
      loadMenus(selectedStore.id)
    } else {
      setMenus([])
      setSelectedMenu(null)
    }
  }, [selectedStore])

  // Load option groups and linkable menus when menu changes
  useEffect(() => {
    if (selectedMenu) {
      loadOptionGroups(selectedMenu.id)
      loadLinkableMenus(selectedMenu.storeId)
      loadTargetMenus(selectedMenu.storeId, selectedMenu.id)
    } else {
      setOptionGroups([])
      setSelectedOptionGroup(null)
      setLinkableMenus([])
      setTargetMenus([])
    }
  }, [selectedMenu])

  // Load options when option group changes
  useEffect(() => {
    if (selectedOptionGroup) {
      loadOptions(selectedOptionGroup.id)
    }
  }, [selectedOptionGroup])

  // Load options for all option groups (for detail view)
  const loadAllOptions = useCallback(async (groups: OptionGroup[]) => {
    const optionsMap = new Map<string, Option[]>()
    for (const group of groups) {
      try {
        const groupOptions = await apiGetOptions(group.id)
        optionsMap.set(group.id, groupOptions)
      } catch (error) {
        console.error(`Failed to load options for group ${group.id}:`, error)
      }
    }
    setOptions(optionsMap)
  }, [])

  useEffect(() => {
    if (optionGroups.length > 0) {
      loadAllOptions(optionGroups)
    } else {
      setOptions(new Map())
    }
  }, [optionGroups, loadAllOptions])

  // API calls
  const loadStores = async () => {
    try {
      const data = await apiGetStores()
      setStores(data)
    } catch (error) {
      toast.error("매장 목록을 불러오는데 실패했습니다")
      console.error(error)
    }
  }

  const loadMenus = async (storeId: string) => {
    try {
      const data = await apiGetMenus(storeId)
      setMenus(data)
      setSelectedMenu(null)
      setOptionGroups([])
      setSelectedOptionGroup(null)
    } catch (error) {
      toast.error("메뉴 목록을 불러오는데 실패했습니다")
      console.error(error)
    }
  }

  const loadOptionGroups = async (menuId: string) => {
    try {
      const data = await apiGetOptionGroups(menuId)
      setOptionGroups(data)
      setSelectedOptionGroup(null)
    } catch (error) {
      toast.error("옵션 그룹을 불러오는데 실패했습니다")
      console.error(error)
    }
  }

  const loadOptions = async (optionGroupId: string) => {
    try {
      const data = await apiGetOptions(optionGroupId)
      setOptions((prev) => new Map(prev).set(optionGroupId, data))
    } catch (error) {
      toast.error("옵션을 불러오는데 실패했습니다")
      console.error(error)
    }
  }

  const loadLinkableMenus = async (storeId: string) => {
    try {
      const data = await apiGetLinkableMenus(storeId)
      setLinkableMenus(data)
    } catch (error) {
      console.error(error)
    }
  }

  const loadTargetMenus = async (storeId: string, excludeMenuId: string) => {
    try {
      const data = await apiGetTargetMenus(storeId, excludeMenuId)
      setTargetMenus(data)
    } catch (error) {
      console.error(error)
    }
  }

  // Store handlers
  const handleCreateStore = async (
    data: Omit<Store, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsLoading(true)
    try {
      const store = await apiCreateStore(data)
      setStores((prev) => [...prev, store])
      toast.success(`"${store.name}" 매장이 생성되었습니다`)
    } catch (error) {
      toast.error("매장 생성에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStore = async (
    id: string,
    data: Partial<Omit<Store, "id" | "createdAt" | "updatedAt">>
  ) => {
    setIsLoading(true)
    try {
      const store = await apiUpdateStore(id, data)
      setStores((prev) => prev.map((s) => (s.id === id ? store : s)))
      if (selectedStore?.id === id) {
        setSelectedStore(store)
      }
      toast.success(`"${store.name}" 매장이 수정되었습니다`)
    } catch (error) {
      toast.error("매장 수정에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStore = async (id: string) => {
    setIsLoading(true)
    try {
      await apiDeleteStore(id)
      setStores((prev) => prev.filter((s) => s.id !== id))
      if (selectedStore?.id === id) {
        setSelectedStore(null)
        setMenus([])
        setSelectedMenu(null)
        setOptionGroups([])
        setSelectedOptionGroup(null)
      }
      toast.success("매장이 삭제되었습니다")
    } catch (error) {
      toast.error("매장 삭제에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Menu handlers
  const handleCreateMenu = async (
    data: Omit<Menu, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsLoading(true)
    try {
      const menu = await apiCreateMenu(data)
      setMenus((prev) => [...prev, menu])
      toast.success(`"${menu.name}" 메뉴가 생성되었습니다`)
    } catch (error) {
      toast.error("메뉴 생성에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMenu = async (
    id: string,
    data: Partial<Omit<Menu, "id" | "createdAt" | "updatedAt">>
  ) => {
    setIsLoading(true)
    try {
      const menu = await apiUpdateMenu(id, data)
      setMenus((prev) => prev.map((m) => (m.id === id ? menu : m)))
      if (selectedMenu?.id === id) {
        setSelectedMenu(menu)
      }
      toast.success(`"${menu.name}" 메뉴가 수정되었습니다`)
    } catch (error) {
      toast.error("메뉴 수정에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMenu = async (id: string) => {
    setIsLoading(true)
    try {
      await apiDeleteMenu(id)
      setMenus((prev) => prev.filter((m) => m.id !== id))
      if (selectedMenu?.id === id) {
        setSelectedMenu(null)
        setOptionGroups([])
        setSelectedOptionGroup(null)
      }
      toast.success("메뉴가 삭제되었습니다")
    } catch (error) {
      toast.error("메뉴 삭제에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // OptionGroup handlers
  const handleCreateOptionGroup = async (
    data: Omit<OptionGroup, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsLoading(true)
    try {
      const og = await apiCreateOptionGroup(data)
      setOptionGroups((prev) => [...prev, og].sort((a, b) => a.sortOrder - b.sortOrder))
      toast.success(`"${og.name}" 옵션 그룹이 생성되었습니다`)
    } catch (error) {
      toast.error("옵션 그룹 생성에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateOptionGroup = async (
    id: string,
    data: Partial<Omit<OptionGroup, "id" | "createdAt" | "updatedAt">>
  ) => {
    setIsLoading(true)
    try {
      const og = await apiUpdateOptionGroup(id, data)
      setOptionGroups((prev) =>
        prev.map((g) => (g.id === id ? og : g)).sort((a, b) => a.sortOrder - b.sortOrder)
      )
      if (selectedOptionGroup?.id === id) {
        setSelectedOptionGroup(og)
      }
      // Only show toast if not a sortOrder-only update (drag reorder)
      if (Object.keys(data).length > 1 || !('sortOrder' in data)) {
        toast.success(`"${og.name}" 옵션 그룹이 수정되었습니다`)
      }
    } catch (error) {
      toast.error("옵션 그룹 수정에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reorder option groups (immediate state update for real-time reflection)
  const handleReorderOptionGroups = (reorderedGroups: OptionGroup[]) => {
    setOptionGroups(reorderedGroups)
  }

  const handleDeleteOptionGroup = async (id: string) => {
    setIsLoading(true)
    try {
      await apiDeleteOptionGroup(id)
      setOptionGroups((prev) => prev.filter((g) => g.id !== id))
      if (selectedOptionGroup?.id === id) {
        setSelectedOptionGroup(null)
      }
      setOptions((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
      toast.success("옵션 그룹이 삭제되었습니다")
    } catch (error) {
      toast.error("옵션 그룹 삭제에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicateOptionGroup = async (
    optionGroupId: string,
    targetMenuId: string
  ) => {
    setIsLoading(true)
    try {
      await apiDuplicateOptionGroup(optionGroupId, targetMenuId)
      toast.success("옵션 그룹이 복사되었습니다")
    } catch (error) {
      toast.error("옵션 그룹 복사에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicateAllOptionGroups = async (
    sourceMenuId: string,
    targetMenuId: string
  ) => {
    setIsLoading(true)
    try {
      await apiDuplicateAllOptionGroups(sourceMenuId, targetMenuId)
      toast.success("모든 옵션 그룹이 복사되었습니다")
    } catch (error) {
      toast.error("옵션 그룹 복사에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Option handlers
  const handleCreateOption = async (
    data: Omit<Option, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsLoading(true)
    try {
      const opt = await apiCreateOption(data)
      setOptions((prev) => {
        const next = new Map(prev)
        const existing = next.get(opt.optionGroupId) || []
        next.set(
          opt.optionGroupId,
          [...existing, opt].sort((a, b) => a.sortOrder - b.sortOrder)
        )
        return next
      })
      toast.success(`"${opt.name}" 옵션이 생성되었습니다`)
    } catch (error) {
      toast.error("옵션 생성에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateOption = async (
    id: string,
    data: Partial<Omit<Option, "id" | "createdAt" | "updatedAt">>
  ) => {
    setIsLoading(true)
    try {
      const opt = await apiUpdateOption(id, data)
      setOptions((prev) => {
        const next = new Map(prev)
        const existing = next.get(opt.optionGroupId) || []
        next.set(
          opt.optionGroupId,
          existing
            .map((o) => (o.id === id ? opt : o))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        )
        return next
      })
      // Only show toast if not a sortOrder-only update (drag reorder)
      if (Object.keys(data).length > 1 || !('sortOrder' in data)) {
        toast.success(`"${opt.name}" 옵션이 수정되었습니다`)
      }
    } catch (error) {
      toast.error("옵션 수정에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reorder options (immediate state update for real-time reflection)
  const handleReorderOptions = (reorderedOptions: Option[]) => {
    if (!selectedOptionGroup) return
    setOptions((prev) => {
      const next = new Map(prev)
      next.set(selectedOptionGroup.id, reorderedOptions)
      return next
    })
  }

  const handleDeleteOption = async (id: string) => {
    setIsLoading(true)
    try {
      await apiDeleteOption(id)
      setOptions((prev) => {
        const next = new Map(prev)
        for (const [groupId, groupOptions] of next) {
          next.set(
            groupId,
            groupOptions.filter((o) => o.id !== id)
          )
        }
        return next
      })
      toast.success("옵션이 삭제되었습니다")
    } catch (error) {
      toast.error("옵션 삭제에 실패했습니다")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Import/Export handlers
  const handleExport = async (): Promise<CatalogData> => {
    return apiExportCatalog()
  }

  const handleImport = async (
    data: CatalogData,
    mode: "merge" | "replace"
  ): Promise<{ imported: number; errors: string[] }> => {
    setIsLoading(true)
    try {
      const result = await apiImportCatalog(data, mode)
      // Refresh all data after import
      await loadStores()
      setSelectedStore(null)
      setMenus([])
      setSelectedMenu(null)
      setOptionGroups([])
      setSelectedOptionGroup(null)
      toast.success(`${result.imported}개 항목을 가져왔습니다`)
      return result
    } catch (error) {
      toast.error("가져오기에 실패했습니다")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">배달 API 관리 콘솔</h1>
              <p className="text-sm text-muted-foreground">
                메뉴 / 옵션 관리
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedStore && (
                <Badge variant="outline" className="text-xs">
                  매장: {selectedStore.name}
                </Badge>
              )}
              {selectedMenu && (
                <Badge variant="outline" className="text-xs">
                  메뉴: {selectedMenu.name}
                </Badge>
              )}
              {selectedOptionGroup && (
                <Badge variant="outline" className="text-xs">
                  그룹: {selectedOptionGroup.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Store & Menu lists */}
          <div className="lg:col-span-3 space-y-6">
            <StoreManager
              stores={stores}
              selectedStore={selectedStore}
              onSelectStore={setSelectedStore}
              onCreateStore={handleCreateStore}
              onUpdateStore={handleUpdateStore}
              onDeleteStore={handleDeleteStore}
              isLoading={isLoading}
            />
            <MenuManager
              menus={menus}
              selectedMenu={selectedMenu}
              storeId={selectedStore?.id || null}
              onSelectMenu={setSelectedMenu}
              onCreateMenu={handleCreateMenu}
              onUpdateMenu={handleUpdateMenu}
              onDeleteMenu={handleDeleteMenu}
              isLoading={isLoading}
            />
          </div>

          {/* Center column - Option Groups & Options */}
          <div className="lg:col-span-5 space-y-6">
            <OptionGroupManager
              optionGroups={optionGroups}
              selectedOptionGroup={selectedOptionGroup}
              selectedMenu={selectedMenu}
              targetMenus={targetMenus}
              onSelectOptionGroup={setSelectedOptionGroup}
              onCreateOptionGroup={handleCreateOptionGroup}
              onUpdateOptionGroup={handleUpdateOptionGroup}
              onDeleteOptionGroup={handleDeleteOptionGroup}
              onDuplicateOptionGroup={handleDuplicateOptionGroup}
              onDuplicateAllOptionGroups={handleDuplicateAllOptionGroups}
              onReorderOptionGroups={handleReorderOptionGroups}
              isLoading={isLoading}
            />
            <OptionManager
              options={
                selectedOptionGroup
                  ? options.get(selectedOptionGroup.id) || []
                  : []
              }
              selectedOptionGroup={selectedOptionGroup}
              linkableMenus={linkableMenus}
              onCreateOption={handleCreateOption}
              onUpdateOption={handleUpdateOption}
              onDeleteOption={handleDeleteOption}
              onReorderOptions={handleReorderOptions}
              isLoading={isLoading}
            />
          </div>

          {/* Right column - Menu Detail & Import/Export */}
          <div className="lg:col-span-4 space-y-6">
            <MenuDetail
              menu={selectedMenu}
              optionGroups={optionGroups}
              options={options}
              linkableMenus={linkableMenus}
            />
            <JsonImportExport
              onExport={handleExport}
              onImport={handleImport}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
