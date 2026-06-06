"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, Edit2, Trash2, Check, X, Copy, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Menu, MenuType } from "@/lib/types"

const MENU_TYPES: MenuType[] = ["MAIN", "SET", "SIDE", "DRINK"]
const COMMON_ALLERGENS = [
  "우유",
  "계란",
  "땅콩",
  "견과류",
  "밀",
  "대두",
  "생선",
  "갑각류",
  "참깨",
  "아황산류",
  "복숭아",
  "토마토",
]

function getTypeBadgeVariant(type: MenuType) {
  switch (type) {
    case "MAIN":
      return "default" as const
    case "SET":
      return "secondary" as const
    case "SIDE":
      return "outline" as const
    case "DRINK":
      return "outline" as const
  }
}

function getTypeLabel(type: MenuType) {
  switch (type) {
    case "MAIN":
      return "메인"
    case "SET":
      return "세트"
    case "SIDE":
      return "사이드"
    case "DRINK":
      return "음료"
  }
}

interface SortableMenuItemProps {
  menu: Menu
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  disabled: boolean
}

function SortableMenuItem({
  menu,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  disabled,
}: SortableMenuItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: menu.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected ? "border-primary bg-primary/10" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
          aria-label="드래그하여 순서 변경"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{menu.name}</span>
            <Badge variant={getTypeBadgeVariant(menu.type)} className="shrink-0">
              {getTypeLabel(menu.type)}
            </Badge>
            {!menu.isAvailable && (
              <Badge variant="secondary" className="shrink-0">
                품절
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {menu.basePrice.toLocaleString()}원
            {menu.allergens.length > 0 && (
              <span className="ml-2 text-xs">
                알레르기: {menu.allergens.join(", ")}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            title="메뉴 복제"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface MenuManagerProps {
  menus: Menu[]
  selectedMenu: Menu | null
  storeId: string | null
  onSelectMenu: (menu: Menu) => void
  onCreateMenu: (data: Omit<Menu, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onUpdateMenu: (
    id: string,
    data: Partial<Omit<Menu, "id" | "createdAt" | "updatedAt">>
  ) => Promise<void>
  onDeleteMenu: (id: string) => Promise<void>
  onDuplicateMenu: (id: string) => Promise<void>
  onReorderMenus?: (reorderedMenus: Menu[]) => void
  isLoading: boolean
}

export function MenuManager({
  menus,
  selectedMenu,
  storeId,
  onSelectMenu,
  onCreateMenu,
  onUpdateMenu,
  onDeleteMenu,
  onDuplicateMenu,
  onReorderMenus,
  isLoading,
}: MenuManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [customAllergen, setCustomAllergen] = useState("")
  const [formData, setFormData] = useState<{
    name: string
    type: MenuType
    basePrice: number
    allergens: string[]
    isAvailable: boolean
  }>({
    name: "",
    type: "MAIN",
    basePrice: 0,
    allergens: [],
    isAvailable: true,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const resetForm = () => {
    setFormData({
      name: "",
      type: "MAIN",
      basePrice: 0,
      allergens: [],
      isAvailable: true,
    })
    setCustomAllergen("")
    setIsCreating(false)
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!formData.name.trim() || !storeId) return
    await onCreateMenu({ ...formData, storeId, sortOrder: menus.length })
    resetForm()
  }

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return
    const current = menus.find((m) => m.id === editingId)
    await onUpdateMenu(editingId, {
      ...formData,
      sortOrder: current?.sortOrder ?? 0,
    })
    resetForm()
  }

  const startEdit = (menu: Menu) => {
    setEditingId(menu.id)
    setFormData({
      name: menu.name,
      type: menu.type,
      basePrice: menu.basePrice,
      allergens: menu.allergens,
      isAvailable: menu.isAvailable,
    })
    setCustomAllergen("")
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      name: "",
      type: "MAIN",
      basePrice: 0,
      allergens: [],
      isAvailable: true,
    })
    setCustomAllergen("")
  }

  const toggleAllergen = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }))
  }

  const addCustomAllergen = () => {
    const trimmed = customAllergen.trim()
    if (trimmed && !formData.allergens.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        allergens: [...prev.allergens, trimmed],
      }))
      setCustomAllergen("")
    }
  }

  const removeAllergen = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.filter((a) => a !== allergen),
    }))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = menus.findIndex((m) => m.id === active.id)
    const newIndex = menus.findIndex((m) => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(menus, oldIndex, newIndex).map((menu, index) => ({
      ...menu,
      sortOrder: index,
    }))

    onReorderMenus?.(reordered)

    const changed = reordered.filter((menu) => {
      const original = menus.find((m) => m.id === menu.id)
      return !original || original.sortOrder !== menu.sortOrder
    })

    await Promise.all(
      changed.map((menu) => onUpdateMenu(menu.id, { sortOrder: menu.sortOrder }))
    )
  }

  if (!storeId) {
    return (
      <Card className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">
          매장을 선택하면 메뉴가 표시됩니다
        </p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            메뉴 목록
            {menus.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {menus.length}
              </span>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={startCreate} disabled={isLoading}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {(isCreating || editingId) && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="menu-name">메뉴명</Label>
              <Input
                id="menu-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="메뉴 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>메뉴 유형</Label>
              <div className="flex flex-wrap gap-2">
                {MENU_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={formData.type === type ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, type })}
                  >
                    {getTypeLabel(type)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-price">기본가격 (원)</Label>
              <Input
                id="menu-price"
                type="number"
                min="0"
                step="100"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })
                }
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-2">
              <Label>알레르기 정보</Label>
              {/* Selected allergens */}
              {formData.allergens.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.allergens.map((allergen) => (
                    <Badge
                      key={allergen}
                      variant="default"
                      className="cursor-pointer pr-1"
                      onClick={() => removeAllergen(allergen)}
                    >
                      {allergen}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              {/* Common allergens */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ALLERGENS.filter((a) => !formData.allergens.includes(a)).map(
                  (allergen) => (
                    <Badge
                      key={allergen}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => toggleAllergen(allergen)}
                    >
                      {allergen}
                    </Badge>
                  )
                )}
              </div>
              {/* Custom allergen input */}
              <div className="flex gap-2 mt-2">
                <Input
                  value={customAllergen}
                  onChange={(e) => setCustomAllergen(e.target.value)}
                  placeholder="직접 입력"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomAllergen()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addCustomAllergen}
                  disabled={!customAllergen.trim()}
                >
                  추가
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="menu-available"
                checked={formData.isAvailable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isAvailable: checked })
                }
              />
              <Label htmlFor="menu-available">판매중</Label>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={isLoading || !formData.name.trim()}
              >
                <Check className="h-4 w-4 mr-1" />
                {editingId ? "저장" : "생성"}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" />
                취소
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[480px]">
          <div className="space-y-2 pr-4">
            {menus.length === 0 && !isCreating && (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 메뉴가 없습니다. 새 메뉴를 생성하세요.
              </p>
            )}
            {menus.length > 1 && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <GripVertical className="h-3 w-3" />
                드래그하여 순서를 변경할 수 있습니다 (자동 저장)
              </p>
            )}
            {menus.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={menus.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {menus.map((menu) => (
                    <SortableMenuItem
                      key={menu.id}
                      menu={menu}
                      isSelected={selectedMenu?.id === menu.id}
                      onSelect={() => onSelectMenu(menu)}
                      onEdit={() => startEdit(menu)}
                      onDelete={() => onDeleteMenu(menu.id)}
                      onDuplicate={() => onDuplicateMenu(menu.id)}
                      disabled={isLoading}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
