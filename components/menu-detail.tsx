"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Menu, OptionGroup, Option } from "@/lib/types"

interface MenuDetailProps {
  menu: Menu | null
  optionGroups: OptionGroup[]
  options: Map<string, Option[]>
  linkableMenus: Menu[]
}

export function MenuDetail({
  menu,
  optionGroups,
  options,
  linkableMenus,
}: MenuDetailProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MAIN":
        return "메인"
      case "SET":
        return "세트"
      case "SIDE":
        return "사이드"
      case "DRINK":
        return "음료"
      default:
        return type
    }
  }

  if (!menu) {
    return (
      <Card className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">
          메뉴를 선택하면 상세 정보가 표시됩니다
        </p>
      </Card>
    )
  }

  const canHaveOptions = menu.type === "MAIN" || menu.type === "SET"

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">메뉴 상세</CardTitle>
          <Badge variant={menu.isAvailable ? "default" : "secondary"}>
            {menu.isAvailable ? "판매중" : "품절"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">메뉴명</p>
            <p className="font-medium">{menu.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="font-mono text-xs truncate">{menu.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">유형</p>
              <Badge variant="outline">{getTypeLabel(menu.type)}</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">기본가격</p>
            <p className="font-medium">{menu.basePrice.toLocaleString()}원</p>
          </div>
          {menu.allergens.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">알레르기 정보</p>
              <div className="flex flex-wrap gap-1">
                {menu.allergens.map((allergen) => (
                  <Badge key={allergen} variant="secondary" className="text-xs">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {!canHaveOptions ? (
          <div className="text-center py-4">
            <Badge variant="secondary">{getTypeLabel(menu.type)}</Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {getTypeLabel(menu.type)} 메뉴는 옵션 그룹을 가질 수 없습니다.
            </p>
          </div>
        ) : optionGroups.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              설정된 옵션 그룹이 없습니다.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 pr-4">
              <p className="text-sm font-medium">
                옵션 그룹 ({optionGroups.length}개)
              </p>
              {optionGroups.map((group) => {
                const groupOptions = options.get(group.id) || []
                return (
                  <div key={group.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{group.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {group.selectionType === "RADIO" ? "단일" : "다중"}
                        </Badge>
                        {group.isRequired && (
                          <Badge className="text-xs">필수</Badge>
                        )}
                      </div>
                      {!group.isAvailable && (
                        <Badge variant="secondary" className="text-xs">
                          비활성
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      선택: {group.minSelect}~{group.maxSelect}개
                    </p>
                    {groupOptions.length > 0 && (
                      <div className="pl-3 border-l-2 border-muted space-y-1 mt-2">
                        {groupOptions.map((opt) => (
                          <div
                            key={opt.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span>{opt.name}</span>
                              {opt.isDefaultSelected && (
                                <Badge variant="secondary" className="text-xs">
                                  기본
                                </Badge>
                              )}
                              {opt.linkedMenuId && (
                                <span className="text-xs text-muted-foreground">
                                  →{" "}
                                  {linkableMenus.find((m) => m.id === opt.linkedMenuId)
                                    ?.name || "?"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {opt.additionalPrice !== 0 && (
                                <span className="text-xs">
                                  {opt.additionalPrice > 0 ? "+" : ""}
                                  {opt.additionalPrice.toLocaleString()}원
                                </span>
                              )}
                              {!opt.isAvailable && (
                                <Badge variant="secondary" className="text-xs">
                                  N/A
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
