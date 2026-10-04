// Nguồn: https://ui.shadcn.com/docs/components/sidebar (shadcn/ui, kiểu new-york, giấy phép MIT)
// Ngày lấy: 05/10/2026
// Đã sửa: sinh bằng `npx shadcn@latest add` ở chế độ JavaScript (components.json tsx:false); đổi chỗ nhập `cn` về "@/lib/utils" (công cụ ghi nhầm thành gói "cn"). Màu lấy qua src/styles/shadcn.css, không sửa lớp.
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
