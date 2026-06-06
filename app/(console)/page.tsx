"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { StoreTabs } from "@/components/store-tabs"
import { MenuManager } from "@/components/menu-manager"
import { OptionGroupManager } from "@/components/option-group-manager"
import { OptionManager } from "@/components/option-manager"
import { MenuDetail } from "@/components/menu-detail"
import { JsonImportExport } from "@/components/json-import-export"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronRight, Trash2, Store as StoreIcon, Home } from "lucide-react"
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
  apiDuplicateMenu,
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

  // Delete store confirmation state
  const [deleteStoreOpen, setDeleteStoreOpen] = useState(false)

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

  // Breadcrumb navigation: clicking a level clears deeper selections
  const goToRoot = () => {
    setSelectedStore(null)
  }
  const goToStore = () => {
    setSelectedMenu(null)
    setSelectedOptionGroup(null)
  }
  const goToMenu = () => {
    setSelectedOptionGroup(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky toolbar */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col gap-3 px-4 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                메뉴 관리
              </h1>
              <p className="text-sm text-muted-foreground">
                매장에서 메뉴, 옵션 그룹, 옵션까지 단계별로 관리하세요
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedMenu}
                onClick={() => setPreviewOpen(true)}
                title={
                  selectedMenu
                    ? "선택한 메뉴 미리보기"
                    : "메뉴를 선택하면 미리보기를 볼 수 있습니다"
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                미리보기
              </Button>
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>메뉴 미리보기</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-y-auto">
                    <MenuDetail
                      menu={selectedMenu}
                      optionGroups={optionGroups}
                      options={options}
                      linkableMenus={linkableMenus}
                    />
                  </div>
                </DialogContent>
              </Dialog>
              <JsonImportExport
                onExport={handleExport}
                onImport={handleImport}
                isLoading={isLoading}
                compact
              />
            </div>
          </div>

          {/* Breadcrumb / drill-down path */}
          <nav
            aria-label="탐색 경로"
            className="flex flex-wrap items-center gap-1 text-sm"
          >
            <button
              type="button"
              onClick={goToRoot}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
              전체 매장
            </button>
            {selectedStore && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={goToStore}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted ${
                    !selectedMenu
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <StoreIcon className="h-3.5 w-3.5" />
                  {selectedStore.name}
                </button>
              </>
            )}
            {selectedMenu && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={goToMenu}
                  className={`rounded-md px-2 py-1 transition-colors hover:bg-muted ${
                    !selectedOptionGroup
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {selectedMenu.name}
                </button>
              </>
            )}
            {selectedOptionGroup && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="rounded-md px-2 py-1 font-semibold text-foreground">
                  {selectedOptionGroup.name}
                </span>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Drill-down columns: 매장 → 메뉴 → 옵션 그룹 → 옵션 */}
      <div className="flex-1 px-4 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
      </div>
    </div>
  )
}
