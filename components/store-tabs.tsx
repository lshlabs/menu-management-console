"use client"

import { useState } from "react"
import { Plus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Store } from "@/lib/types"

interface StoreTabsProps {
  stores: Store[]
  selectedStore: Store | null
  onSelectStore: (store: Store) => void
  onCreateStore: (data: Omit<Store, "id" | "createdAt" | "updatedAt">) => Promise<void>
  isLoading: boolean
}

export function StoreTabs({
  stores,
  selectedStore,
  onSelectStore,
  onCreateStore,
  isLoading,
}: StoreTabsProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState(true)

  const resetForm = () => {
    setName("")
    setIsActive(true)
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    await onCreateStore({ name: name.trim(), address: "", isActive })
    resetForm()
    setCreateOpen(false)
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <div className="flex items-center gap-1.5">
        {stores.length === 0 && (
          <span className="px-2 text-sm text-muted-foreground">
            등록된 매장이 없습니다. 새 매장을 추가하세요.
          </span>
        )}
        {stores.map((store) => {
          const active = selectedStore?.id === store.id
          return (
            <button
              key={store.id}
              type="button"
              onClick={() => onSelectStore(store)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  store.isActive
                    ? active
                      ? "bg-primary-foreground"
                      : "bg-primary"
                    : "bg-muted-foreground/40"
                }`}
                aria-hidden="true"
              />
              {store.name}
            </button>
          )
        })}
      </div>

      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8 shrink-0"
        onClick={() => setCreateOpen(true)}
        disabled={isLoading}
        aria-label="새 매장 추가"
        title="새 매장 추가"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>새 매장 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-store-name">매장명</Label>
              <Input
                id="new-store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="매장 이름을 입력하세요"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void handleCreate()
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="new-store-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="new-store-active">운영중</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              <X className="mr-1 h-4 w-4" />
              취소
            </Button>
            <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
              <Check className="mr-1 h-4 w-4" />
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
