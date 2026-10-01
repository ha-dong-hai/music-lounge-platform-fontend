// src/components/shared/HopThoai.jsx
//
// KHUNG HỘP THOẠI DÙNG CHUNG (01/10/2026) — thay ~30 lớp phủ tự dựng (`fixed inset-0` + nền mờ + khung) ở màn vận hành.
// Rà soát 01/10 thấy 30/32 lớp phủ không khai báo là hộp thoại: trình đọc màn hình không biết đang ở trong hộp, phím Tab
// thoát ra trang phía sau, Esc không đóng, tiêu điểm không trả về nút đã mở.
//
// Dựng trên @radix-ui/react-dialog 1.1.23 (kb/TOOLS.md, mục "Hộp thoại"): role=dialog + aria-modal, aria-labelledby,
// giữ tiêu điểm, Esc đóng, trả tiêu điểm, khoá cuộn nền. KHÔNG dùng <dialog>.showModal() như HopXacNhan vì top layer che
// toast — các hộp này báo lỗi nhập bằng toast lúc hộp còn mở. Toaster (z 9999) nằm trên lớp phủ này (z 100).
//
// Cách dùng (trang mẹ gắn khi mở, gỡ khi đóng — giữ đúng cách các hộp cũ đang làm):
//   <HopThoai onDong={dong} className="w-full max-w-md …khung…">
//     <div className="…đầu hộp…"><TieuDeHop><h2>Thêm nhân viên</h2></TieuDeHop><button onClick={dong} aria-label="Đóng">…</button></div>
//     …nội dung…
//   </HopThoai>
// - TieuDeHop bọc ĐÚNG tiêu đề đang hiển thị (Dialog.Title asChild) — hộp được đặt tên theo chữ người dùng thấy.
// - dongKhiBamNgoai={false} cho hộp có form dài: bấm nhầm ra ngoài không làm mất dữ liệu đang nhập.
// - chanDong: đang gửi thì Esc / bấm ngoài không đóng (tránh đóng giữa chừng một thao tác tiền).
import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

export const TieuDeHop = ({ children }) => <Dialog.Title asChild>{children}</Dialog.Title>

// Màu nền / màu viền mặc định chỉ thêm khi hộp không tự đặt (vd. hộp duyệt nền tối, hộp kiểm duyệt viền vàng) —
// hai lớp cùng loại thì Tailwind không bảo đảm lớp nào thắng.
const macDinh = (lop) => [
  /(^|\s)bg-/.test(lop) ? '' : 'bg-card',
  /(^|\s)border-(ink|line|warning|danger|success|lamp)/.test(lop) ? 'border-2' : 'border-2 border-ink',
].join(' ')

// TRẢ TIÊU ĐIỂM về nút đã mở hộp (WAI-ARIA APG, mẫu dialog). Trang mẹ GỠ hộp ngay khi đóng ({mo && <Hop/>}) nên Radix không
// kịp tự trả — đo 01/10/2026: sau Esc tiêu điểm rơi về <body>, người dùng bàn phím mất chỗ đang đứng. Nhớ phần tử đang có
// tiêu điểm lúc hộp gắn vào, trả lại khi hộp bị gỡ (nếu phần tử đó còn trên trang).
const useTraTieuDiem = () => {
  useEffect(() => {
    const truoc = document.activeElement
    return () => {
      requestAnimationFrame(() => {
        // StrictMode (dev) gỡ-rồi-gắn-lại effect một lần lúc mở: khi đó hộp VẪN đang mở và tiêu điểm đã ở trong hộp —
        // không được kéo tiêu điểm ra ngoài (đo 01/10: Tab đầu tiên thoát ra trang sau). Chỉ trả khi không còn hộp nào mở.
        if (document.activeElement?.closest('[role="dialog"]')) return
        if (truoc?.isConnected && typeof truoc.focus === 'function') truoc.focus()
      })
    }
  }, [])
}

const HopThoai = ({ onDong, className = '', dongKhiBamNgoai = true, chanDong = false, children }) => {
  useTraTieuDiem()
  return (
  <Dialog.Root open onOpenChange={(mo) => { if (!mo && !chanDong) onDong?.() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[100] bg-board/80" />
      <Dialog.Content
        aria-describedby={undefined}
        onPointerDownOutside={(e) => { if (!dongKhiBamNgoai || chanDong) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (chanDong) e.preventDefault() }}
        className={`fixed left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto text-ink shadow-lift focus:outline-none ${macDinh(className)} ${className}`}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
  )
}

export default HopThoai
