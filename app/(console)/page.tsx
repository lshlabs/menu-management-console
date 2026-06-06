"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { MenuManager } from "@/components/menu-manager"
import { OptionGroupManager } from "@/components/option-group-manager"
import { OptionManager } from "@/components/option-manager"
import { MenuDetail } from "@/components/menu-detail"
import { JsonImportExport } from "@/components/json-import-export"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Store as StoreIcon, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
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

  // New store dialog state
  const [storeDialogOpen, setStoreDialogOpen] = useState(false)
  const [newStoreForm, setNewStoreForm] = useState({
    name: "",
    isActive: true,
  })

  // Delete store confirmation dialog state
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

  // New store dialog handlers
  const openStoreDialog = () => {
    setNewStoreForm({ name: "", isActive: true })
    setStoreDialogOpen(true)
  }

  const submitNewStore = async () => {
    if (!newStoreForm.name.trim()) return
    await handleCreateStore({ ...newStoreForm, address: "" })
    setStoreDialogOpen(false)
  }

  const confirmDeleteStore = async () => {
    if (!selectedStore) return
    await handleDeleteStore(selectedStore.id)
    setDeleteStoreOpen(false)
  }

  // Miller column depth: which level is the user currently focused on?
  // 0 = menus, 1 = option groups, 2 = options
  const activeColumn = selectedOptionGroup ? 2 : selectedMenu ? 1 : 0

  // Dynamic flex sizing for Miller columns. Completed (left) columns shrink,
  // the active column expands. Detail panel always shown as the last column.
  const colClass = (index: number) => {
    const isActive = index === activeColumn
    const isCompleted = index < activeColumn
    return cn(
      "min-w-0 shrink-0 transition-[flex-grow,flex-basis,width] duration-300 ease-in-out",
      isActive
        ? "lg:flex-[2.2] lg:basis-0"
        : isCompleted
          ? "lg:flex-[0.8] lg:basis-0"
          : "lg:flex-1 lg:basis-0"
    )
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
                disabled={!selectedStore}
                onClick={() => setDeleteStoreOpen(true)}
                title={
                  selectedStore
                    ? "선택한 매장 삭제"
                    : "매장을 선택하면 삭제할 수 있습니다"
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                매장 삭제
              </Button>
              <JsonImportExport
                onExport={handleExport}
                onImport={handleImport}
                isLoading={isLoading}
                compact
              />
            </div>
          </div>

          {/* Store tabs */}
          <div
            role="tablist"
            aria-label="매장 목록"
            className="flex items-center gap-1 overflow-x-auto pb-1"
          >
            {stores.map((store) => {
              const isSelected = selectedStore?.id === store.id
              return (
                <button
                  key={store.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedStore(store)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 font-semibold text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <StoreIcon className="h-3.5 w-3.5" />
                  {store.name}
                </button>
              )
            })}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={openStoreDialog}
              title="새 매장 추가"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">새 매장 추가</span>
            </Button>
          </div>
        </div>
      </header>

      {/* New store dialog */}
      <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 매장 추가</DialogTitle>
            <DialogDescription>새로운 매장 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-store-name">매장명</Label>
              <Input
                id="new-store-name"
                value={newStoreForm.name}
                onChange={(e) =>
                  setNewStoreForm({ ...newStoreForm, name: e.target.value })
                }
                placeholder="매장 이름을 입력하세요"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    submitNewStore()
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="new-store-active"
                checked={newStoreForm.isActive}
                onCheckedChange={(checked) =>
                  setNewStoreForm({ ...newStoreForm, isActive: checked })
                }
              />
              <Label htmlFor="new-store-active">운영중</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStoreDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={submitNewStore}
              disabled={isLoading || !newStoreForm.name.trim()}
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete store confirmation dialog */}
      <Dialog open={deleteStoreOpen} onOpenChange={setDeleteStoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>매장 삭제</DialogTitle>
            <DialogDescription>
              {selectedStore
                ? `"${selectedStore.name}" 매장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
                : "삭제할 매장을 선택하세요."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteStoreOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStore}
              disabled={isLoading || !selectedStore}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Miller columns: 메뉴 → 옵션 그룹 → 옵션 → 상세 */}
      <div className="flex-1 overflow-x-auto px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className={colClass(0)}>
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
          <div className={colClass(1)}>
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
          </div>
          <div className={colClass(2)}>
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
          <div className={cn("min-w-0 shrink-0 lg:basis-0 transition-[flex-grow] duration-300 ease-in-out", activeColumn >= 1 ? "lg:flex-[1.6]" : "lg:flex-1")}>
            <MenuDetail
              menu={selectedMenu}
              optionGroups={optionGroups}
              options={options}
              linkableMenus={linkableMenus}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
