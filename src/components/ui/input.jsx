// Nguồn: https://ui.shadcn.com/docs/components/input (shadcn/ui, kiểu new-york, giấy phép MIT)
// Ngày lấy: 05/10/2026
// Đã sửa: sinh bằng `npx shadcn@latest add` ở chế độ JavaScript (components.json tsx:false); đổi chỗ nhập `cn` về "@/lib/utils" (công cụ ghi nhầm thành gói "cn"); nhận `aria-label` tường minh và báo lỗi khi phát triển nếu ô không có tên (xem dưới). Màu lấy qua src/styles/shadcn.css, không sửa lớp.
//
// TÊN CỦA Ô: đây là lớp vỏ chung nên tên do nơi dùng truyền vào (aria-label, aria-labelledby, hoặc id nối với <label htmlFor>).
// Cổng scripts/kiem-o-nhap-khong-ten.mjs đọc tĩnh thẻ <input> và không thấy được tên truyền qua {...props}; thay vì cho thư
// mục này ra ngoài cổng (rồi ô không tên sẽ lọt), lớp vỏ tự kiểm lúc chạy: thiếu cả ba thì in lỗi ở môi trường phát triển.
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  "aria-label": nhan,
  ...props
}) {
  if (import.meta.env.DEV && !nhan && !props["aria-labelledby"] && !props.id) {
    console.error("Input (components/ui/input): ô nhập không có tên — truyền aria-label, aria-labelledby, hoặc id nối với <label htmlFor>.")
  }
  return (
    <input
      type={type}
      aria-label={nhan}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
