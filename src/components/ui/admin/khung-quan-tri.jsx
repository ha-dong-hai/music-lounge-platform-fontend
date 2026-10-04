// Nguồn: https://github.com/satnaing/shadcn-admin/tree/e16c87f/src/components/layout (authenticated-layout.tsx, app-sidebar.tsx, nav-group.tsx, nav-user.tsx, app-title.tsx, header.tsx, main.tsx — giấy phép MIT, © 2024 Sat Naing)
// Ngày lấy: 05/10/2026
// Đã sửa: TSX → JSX; @tanstack/react-router → react-router-dom; bỏ LayoutProvider, SearchProvider, TeamSwitcher, ThemeSwitch, ConfigDrawer (dự án không có các tính năng đó); menu, số việc chờ và người dùng nhận qua props thay cho sidebar-data.ts; bỏ nhánh menu gập nhiều cấp (menu quản trị phẳng); huy hiệu số việc dùng SidebarMenuBadge, quá hạn thì đỏ; đăng xuất gọi thẳng (không hộp xác nhận, như khung cũ); chữ tiếng Việt; gom bảy tệp gốc vào một tệp.
//
// KHUNG TRANG QUẢN TRỊ (05/10/2026). Chủ dự án: "cả bố cục design cũng nên tham khảo từ các repo template đã được thiết kế
// của React 19, Tailwind 4, Vite… tuyệt đối đừng tự code". Vì sao chọn mẫu này và nó giải chỗ vướng nào của người dùng:
// reports/Trang quản trị - người dùng cần gì, vướng ở đâu, lấy bố cục từ mẫu nào.md (repo backend) — thanh bên THU GỌN về
// dải biểu tượng (bảng nhiều cột có thêm ~200px), số việc chờ nằm ngay trên mục, điện thoại thành ngăn kéo.
//
// Cấu trúc giữ nguyên mẫu: SidebarProvider › Sidebar(collapsible="icon") + SidebarInset › Header + Main.
import { Link, NavLink, Outlet, matchPath, useLocation } from 'react-router-dom'
import { AlertTriangle, ChevronsUpDown, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import VungTiengViet from '@/i18n/VungTiengViet'
import { useChuDeVanHanh } from '@/hooks/useChuDeVanHanh'

// Mục đang mở: khớp dài nhất thắng (/admin/shows/12 thuộc "Buổi diễn") — cùng luật với khung cũ (PortalShell).
const mucDangMo = (nhom, pathname) => nhom.flatMap((n) => n.muc)
  .filter((m) => matchPath({ path: m.to, end: Boolean(m.end) }, pathname))
  .sort((a, b) => b.to.length - a.to.length)[0]

// app-title.tsx: tên sản phẩm + tên khu. Thu gọn thì chỉ còn ô chữ cái.
const TieuDeKhu = ({ tenKhu }) => {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link to="/admin" onClick={() => setOpenMobile(false)} aria-label={`MusicLounge, ${tenKhu}`}>
            <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">ML</span>
            <span className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-bold">MusicLounge</span>
              <span className="truncate text-xs">{tenKhu}</span>
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// nav-group.tsx › SidebarMenuLink. `dem` = { count, overdueCount } của hàng đợi việc (MLACP-618).
const NhomMenu = ({ ten, muc, dangMo }) => {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{ten}</SidebarGroupLabel>
      <SidebarMenu>
        {muc.map(({ to, end, nhan, icon: Icon, dem }) => {
          const soViec = dem?.count ?? 0
          const quaHan = dem?.overdueCount ?? 0
          return (
            <SidebarMenuItem key={to}>
              <SidebarMenuButton asChild isActive={dangMo?.to === to} tooltip={soViec > 0 ? `${nhan} — ${soViec} việc chờ` : nhan}>
                <NavLink to={to} end={end} onClick={() => setOpenMobile(false)}>
                  {Icon && <Icon />}
                  <span>{nhan}</span>
                </NavLink>
              </SidebarMenuButton>
              {soViec > 0 && (
                <SidebarMenuBadge className={cn('rounded-full px-1.5 font-bold', quaHan > 0 ? 'bg-destructive text-white peer-data-[active=true]/menu-button:text-white' : 'bg-sidebar-accent')}>
                  {quaHan > 0 && <AlertTriangle className="mr-0.5 size-3" aria-hidden="true" />}
                  <span aria-hidden="true">{soViec > 99 ? '99+' : soViec}</span>
                  <span className="sr-only">{quaHan > 0 ? `${soViec} việc đang chờ, ${quaHan} quá hạn` : `${soViec} việc đang chờ`}</span>
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const chuCaiDau = (ten) => (ten || '?').trim().split(/\s+/).slice(-2).map((t) => t[0]).join('').toUpperCase()

// nav-user.tsx: người đang đăng nhập + lối ra + đăng xuất.
const NguoiDung = ({ nguoiDung, loiRa, onDangXuat }) => {
  const { isMobile, setOpenMobile } = useSidebar()
  const the = (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        {nguoiDung.anh && <AvatarImage src={nguoiDung.anh} alt="" />}
        <AvatarFallback className="rounded-lg">{chuCaiDau(nguoiDung.ten)}</AvatarFallback>
      </Avatar>
      <span className="grid flex-1 text-start text-sm leading-tight">
        <span className="truncate font-semibold">{nguoiDung.ten}</span>
        {nguoiDung.email && <span className="truncate text-xs">{nguoiDung.email}</span>}
      </span>
    </>
  )
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" aria-label={`Tài khoản ${nguoiDung.ten}`}>
              {the}
              <ChevronsUpDown className="ms-auto size-4" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">{the}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {loiRa.map(({ to, nhan, icon: Icon }) => (
                <DropdownMenuItem key={to} asChild>
                  <Link to={to} onClick={() => setOpenMobile(false)}>{Icon && <Icon />}{nhan}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDangXuat}><LogOut />Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const KhungQuanTri = ({ tenKhu, nhom = [], loiRa = [], nguoiDung, onDangXuat, phaiDauTrang }) => {
  const { pathname } = useLocation()
  // Gắn kiểu màu lên <html>: ngăn kéo điện thoại và menu thả của Radix vẽ qua cổng dưới <body>, nằm ngoài khung này.
  const chuDe = useChuDeVanHanh({ ganLenGoc: true })
  const dangMo = mucDangMo(nhom, pathname)

  return (
    <VungTiengViet>
      <div className="khung-van-hanh" data-mau={chuDe}>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarHeader><TieuDeKhu tenKhu={tenKhu} /></SidebarHeader>
            <SidebarContent>
              {nhom.map((n) => <NhomMenu key={n.ten} ten={n.ten} muc={n.muc} dangMo={dangMo} />)}
            </SidebarContent>
            <SidebarFooter><NguoiDung nguoiDung={nguoiDung} loiRa={loiRa} onDangXuat={onDangXuat} /></SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="@container/content min-w-0">
            {/* header.tsx: nút thu gọn thanh bên + vạch ngăn + vị trí hiện tại; dính đầu trang khi cuộn. */}
            <header className="sticky top-0 z-40 h-16 border-b border-border bg-background">
              <div className="relative flex h-full items-center gap-3 p-4 sm:gap-4">
                <SidebarTrigger variant="outline" className="max-md:scale-125" aria-label="Thu gọn hoặc mở thanh bên" />
                <Separator orientation="vertical" className="h-6" />
                <p className="min-w-0 truncate text-sm text-muted-foreground">
                  {tenKhu}{dangMo && <> / <span className="font-semibold text-foreground">{dangMo.nhan}</span></>}
                </p>
                {phaiDauTrang && <div className="ms-auto flex flex-shrink-0 items-center gap-3">{phaiDauTrang}</div>}
              </div>
            </header>

            {/* main.tsx: lề 16/24px, nội dung tối đa 7xl căn giữa theo bề rộng VÙNG NỘI DUNG (container query), không theo
                cửa sổ — thanh bên mở hay thu gọn thì vẫn đúng. `man-van-hanh`: cỡ chữ tối thiểu 14px (index.css). */}
            <main className="man-van-hanh px-4 py-6 @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </VungTiengViet>
  )
}

export default KhungQuanTri
