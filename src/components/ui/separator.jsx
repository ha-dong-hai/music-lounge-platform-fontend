// Nguồn: https://ui.shadcn.com/docs/components/separator (shadcn/ui, kiểu new-york, giấy phép MIT)
// Ngày lấy: 05/10/2026
// Đã sửa: sinh bằng `npx shadcn@latest add` ở chế độ JavaScript (components.json tsx:false); đổi chỗ nhập `cn` về "@/lib/utils" (công cụ ghi nhầm thành gói "cn"). Màu lấy qua src/styles/shadcn.css, không sửa lớp.
import * as React from "react"
import { cn } from "@/lib/utils"
import { Separator as SeparatorPrimitive } from "radix-ui"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
