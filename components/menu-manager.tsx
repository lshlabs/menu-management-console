"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
    await onCreateMenu({ ...formData, storeId })
    resetForm()
  }

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return
    await onUpdateMenu(editingId, formData)
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

  const getTypeBadgeVariant = (type: MenuType) => {
    switch (type) {
      case "MAIN":
        return "default"
      case "SET":
        return "secondary"
      case "SIDE":
        return "outline"
      case "DRINK":
        return "outline"
    }
  }

  const getTypeLabel = (type: MenuType) => {
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

  if (!storeId) {
    return (
      <Card className="flex h-full items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">
          매장을 선택하면 메뉴가 표시됩니다
        </p>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col">
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
              <Label htmlFor="menu-type">메뉴 유형</Label>
              <Select
                value={formData.type}
                onValueChange={(value: MenuType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="menu-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MENU_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getTypeLabel(type)} ({type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {COMMON_ALLERGENS.filter(a => !formData.allergens.includes(a)).map((allergen) => (
                  <Badge
                    key={allergen}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => toggleAllergen(allergen)}
                  >
                    {allergen}
                  </Badge>
                ))}
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

        <ScrollArea className="max-h-[350px]">
          <div className="space-y-2 pr-4">
            {menus.length === 0 && !isCreating && (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 메뉴가 없습니다. 새 메뉴를 생성하세요.
              </p>
            )}
            {menus.map((menu) => (
              <div
                key={menu.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedMenu?.id === menu.id
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectMenu(menu)}
              >
                <div className="flex items-start justify-between gap-2">
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
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(menu)
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
                        onDeleteMenu(menu.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
