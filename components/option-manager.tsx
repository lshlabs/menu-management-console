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
import { Plus, Edit2, Trash2, Check, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Option, OptionGroup, Menu, OptionEffect } from "@/lib/types"

const OPTION_EFFECTS: OptionEffect[] = ["NONE", "ADD", "EXCLUDE", "REPLACE", "NOTE"]

interface SortableOptionItemProps {
  option: Option
  linkableMenus: Menu[]
  onEdit: () => void
  onDelete: () => void
  getEffectLabel: (effect: OptionEffect) => string
  getEffectBadgeVariant: (effect: OptionEffect) => "default" | "destructive" | "secondary" | "outline"
}

function SortableOptionItem({
  option,
  linkableMenus,
  onEdit,
  onDelete,
  getEffectLabel,
  getEffectBadgeVariant,
}: SortableOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{option.name}</span>
            <Badge
              variant={getEffectBadgeVariant(option.effect)}
              className="shrink-0"
            >
              {getEffectLabel(option.effect)}
            </Badge>
            {option.isDefaultSelected && (
              <Badge variant="secondary" className="shrink-0">
                기본
              </Badge>
            )}
            {!option.isAvailable && (
              <Badge variant="secondary" className="shrink-0">
                비활성
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {option.additionalPrice !== 0 && (
              <span>
                {option.additionalPrice > 0 ? "+" : ""}
                {option.additionalPrice.toLocaleString()}원
              </span>
            )}
            {option.linkedMenuId && (
              <span className="ml-2">
                연결:{" "}
                {linkableMenus.find((m) => m.id === option.linkedMenuId)?.name ||
                  "알 수 없음"}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onEdit}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface OptionManagerProps {
  options: Option[]
  selectedOptionGroup: OptionGroup | null
  linkableMenus: Menu[]
  onCreateOption: (data: Omit<Option, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onUpdateOption: (
    id: string,
    data: Partial<Omit<Option, "id" | "createdAt" | "updatedAt">>
  ) => Promise<void>
  onDeleteOption: (id: string) => Promise<void>
  onReorderOptions?: (reorderedOptions: Option[]) => void
  isLoading: boolean
}

export function OptionManager({
  options,
  selectedOptionGroup,
  linkableMenus,
  onCreateOption,
  onUpdateOption,
  onDeleteOption,
  onReorderOptions,
  isLoading,
}: OptionManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    effect: OptionEffect
    additionalPrice: number
    linkedMenuId: string | null
    isDefaultSelected: boolean
    isAvailable: boolean
  }>({
    name: "",
    effect: "NONE",
    additionalPrice: 0,
    linkedMenuId: null,
    isDefaultSelected: false,
    isAvailable: true,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const resetForm = () => {
    setFormData({
      name: "",
      effect: "NONE",
      additionalPrice: 0,
      linkedMenuId: null,
      isDefaultSelected: false,
      isAvailable: true,
    })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!formData.name.trim() || !selectedOptionGroup) return
    await onCreateOption({
      ...formData,
      optionGroupId: selectedOptionGroup.id,
      sortOrder: options.length,
    })
    resetForm()
  }

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return
    const currentOption = options.find(o => o.id === editingId)
    await onUpdateOption(editingId, {
      ...formData,
      sortOrder: currentOption?.sortOrder ?? 0,
    })
    resetForm()
  }

  const startEdit = (option: Option) => {
    setEditingId(option.id)
    setFormData({
      name: option.name,
      effect: option.effect,
      additionalPrice: option.additionalPrice,
      linkedMenuId: option.linkedMenuId,
      isDefaultSelected: option.isDefaultSelected,
      isAvailable: option.isAvailable,
    })
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      name: "",
      effect: "NONE",
      additionalPrice: 0,
      linkedMenuId: null,
      isDefaultSelected: false,
      isAvailable: true,
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = options.findIndex((o) => o.id === active.id)
    const newIndex = options.findIndex((o) => o.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Recompute sortOrder for every option based on its new position
    const reordered = arrayMove(options, oldIndex, newIndex).map(
      (option, index) => ({ ...option, sortOrder: index })
    )

    // Optimistic UI update so the new order reflects immediately
    onReorderOptions?.(reordered)

    // Persist every option whose position actually changed. We compare each
    // option against its OWN previous sortOrder (matched by id) so the new
    // order survives navigation, re-renders, and import/export.
    const changed = reordered.filter((option) => {
      const original = options.find((o) => o.id === option.id)
      return !original || original.sortOrder !== option.sortOrder
    })

    await Promise.all(
      changed.map((option) =>
        onUpdateOption(option.id, { sortOrder: option.sortOrder })
      )
    )
  }

  const getEffectLabel = (effect: OptionEffect) => {
    switch (effect) {
      case "NONE":
        return "없음"
      case "ADD":
        return "추가"
      case "EXCLUDE":
        return "제외"
      case "REPLACE":
        return "교체"
      case "NOTE":
        return "메모"
    }
  }

  const getEffectBadgeVariant = (effect: OptionEffect): "default" | "destructive" | "secondary" | "outline" => {
    switch (effect) {
      case "ADD":
        return "default"
      case "EXCLUDE":
        return "destructive"
      case "REPLACE":
        return "secondary"
      case "NOTE":
        return "outline"
      default:
        return "outline"
    }
  }

  if (!selectedOptionGroup) {
    return (
      <Card className="flex h-full items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">
          옵션 그룹을 선택하면 옵션이 표시됩니다
        </p>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            옵션 목록
            {options.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {options.length}
              </span>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={startCreate} disabled={isLoading}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          그룹: {selectedOptionGroup.name}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {(isCreating || editingId) && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="opt-name">옵션명</Label>
              <Input
                id="opt-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 라지, 치즈 추가"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opt-effect">효과</Label>
              <Select
                value={formData.effect}
                onValueChange={(value: OptionEffect) =>
                  setFormData({ ...formData, effect: value })
                }
              >
                <SelectTrigger id="opt-effect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTION_EFFECTS.map((effect) => (
                    <SelectItem key={effect} value={effect}>
                      {getEffectLabel(effect)} ({effect})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opt-price">추가 가격 (원)</Label>
              <Input
                id="opt-price"
                type="number"
                step="100"
                value={formData.additionalPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opt-linked">연결 메뉴 (사이드/음료)</Label>
              <Select
                value={formData.linkedMenuId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    linkedMenuId: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger id="opt-linked">
                  <SelectValue placeholder="연결 메뉴 없음" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">연결 메뉴 없음</SelectItem>
                  {linkableMenus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name} ({menu.type === "SIDE" ? "사이드" : "음료"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="opt-default"
                  checked={formData.isDefaultSelected}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDefaultSelected: checked })
                  }
                />
                <Label htmlFor="opt-default">기본 선택</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="opt-available"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isAvailable: checked })
                  }
                />
                <Label htmlFor="opt-available">사용 가능</Label>
              </div>
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

        <div className="space-y-2">
          {options.length === 0 && !isCreating && (
            <p className="text-sm text-muted-foreground text-center py-4">
              옵션이 없습니다. 새 옵션을 생성하세요.
            </p>
          )}
          {options.length > 1 && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <GripVertical className="h-3 w-3" />
              드래그하여 순서를 변경할 수 있습니다 (자동 저장)
            </p>
          )}
          {options.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={options.map((o) => o.id)}
                strategy={verticalListSortingStrategy}
              >
                {options.map((option) => (
                  <SortableOptionItem
                    key={option.id}
                    option={option}
                    linkableMenus={linkableMenus}
                    onEdit={() => startEdit(option)}
                    onDelete={() => onDeleteOption(option.id)}
                    getEffectLabel={getEffectLabel}
                    getEffectBadgeVariant={getEffectBadgeVariant}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
