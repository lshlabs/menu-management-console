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
import type { Store } from "@/lib/types"

interface StoreManagerProps {
  stores: Store[]
  selectedStore: Store | null
  onSelectStore: (store: Store) => void
  onCreateStore: (data: Omit<Store, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onUpdateStore: (
    id: string,
    data: Partial<Omit<Store, "id" | "createdAt" | "updatedAt">>
  ) => Promise<void>
  onDeleteStore: (id: string) => Promise<void>
  isLoading: boolean
}

export function StoreManager({
  stores,
  selectedStore,
  onSelectStore,
  onCreateStore,
  onUpdateStore,
  onDeleteStore,
  isLoading,
}: StoreManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    isActive: true,
  })

  const resetForm = () => {
    setFormData({ name: "", address: "", isActive: true })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) return
    await onCreateStore(formData)
    resetForm()
  }

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return
    await onUpdateStore(editingId, formData)
    resetForm()
  }

  const startEdit = (store: Store) => {
    setEditingId(store.id)
    setFormData({
      name: store.name,
      address: store.address,
      isActive: store.isActive,
    })
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({ name: "", address: "", isActive: true })
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            매장 목록
            {stores.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {stores.length}
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
              <Label htmlFor="store-name">매장명</Label>
              <Input
                id="store-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="매장 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">주소</Label>
              <Input
                id="store-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="매장 주소를 입력하세요"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="store-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="store-active">운영중</Label>
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

        <ScrollArea className="max-h-[280px]">
          <div className="space-y-2 pr-4">
            {stores.length === 0 && !isCreating && (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 매장이 없습니다. 새 매장을 생성하세요.
              </p>
            )}
            {stores.map((store) => (
              <div
                key={store.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStore?.id === store.id
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectStore(store)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{store.name}</span>
                      <Badge
                        variant={store.isActive ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {store.isActive ? "운영중" : "휴업"}
                      </Badge>
                    </div>
                    {store.address && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {store.address}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(store)
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
                        onDeleteStore(store.id)
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
