// Nguồn: https://ui.shadcn.com/docs/components/skeleton (shadcn/ui, kiểu new-york, giấy phép MIT)
// Ngày lấy: 05/10/2026
// Đã sửa: sinh bằng `npx shadcn@latest add` ở chế độ JavaScript (components.json tsx:false); đổi chỗ nhập `cn` về "@/lib/utils" (công cụ ghi nhầm thành gói "cn"). Màu lấy qua src/styles/shadcn.css, không sửa lớp.
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  )
}

export { Skeleton }
