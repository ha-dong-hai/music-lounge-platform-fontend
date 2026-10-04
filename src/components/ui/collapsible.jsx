// Nguồn: https://ui.shadcn.com/docs/components/collapsible (shadcn/ui, kiểu new-york, giấy phép MIT)
// Ngày lấy: 05/10/2026
// Đã sửa: sinh bằng `npx shadcn@latest add` ở chế độ JavaScript (components.json tsx:false); đổi chỗ nhập `cn` về "@/lib/utils" (công cụ ghi nhầm thành gói "cn"). Màu lấy qua src/styles/shadcn.css, không sửa lớp.
"use client"

import { Collapsible as CollapsiblePrimitive } from "radix-ui"

function Collapsible({
  ...props
}) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
