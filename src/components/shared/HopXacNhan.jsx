// src/components/shared/HopXacNhan.jsx
//
// HỘP XÁC NHẬN cho thao tác KHÓ HOÀN TÁC hoặc ĐỤNG TỚI TIỀN (huỷ vé, hoàn tiền, xoá…).
//
// VÌ SAO CÓ: WCAG 2.2 SC 3.3.4 (mức AA) — thao tác tài chính hoặc xoá dữ liệu phải hoàn tác được, kiểm lại được, hoặc
// được xác nhận. Trang chi tiết vé cũ huỷ vé ngay ở lần bấm đầu tiên.
//
// CÁCH DÙNG ĐÚNG (NN/g, "Confirmation Dialogs"): chỉ dùng cho hậu quả thật sự nghiêm trọng — hỏi xác nhận mọi thứ thì
// người dùng bấm "Có" theo quán tính. Nút mang TÊN HÀNH ĐỘNG ("Huỷ vé này"), không phải "Có / Không" hay "OK".
//
// - <dialog>.showModal() của trình duyệt: giữ focus bên trong, Esc đóng, trả focus về nút đã mở, nền phía sau trơ.
// - Focus ban đầu đặt ở lựa chọn ÍT PHÁ HUỶ NHẤT (WAI-ARIA APG, mẫu dialog) — Enter theo quán tính không gây hại.
// - Đang xử lý thì cả hai nút khoá và Esc bị chặn: không gửi hai lần, không đóng giữa chừng.
import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

const HopXacNhan = ({ mo, tieuDe, children, nhanXacNhan, nhanGiu = 'Không, quay lại', dangXuLy = false, nguyHiem = true, onDong, onXacNhan }) => {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (mo && !el.open) el.showModal()
    if (!mo && el.open) el.close()
  }, [mo])

  return (
    <dialog
      ref={ref}
      aria-labelledby="hop-xac-nhan-td"
      onCancel={(e) => { e.preventDefault(); if (!dangXuLy) onDong?.() }}
      onClose={() => { if (mo && !dangXuLy) onDong?.() }}
      className="bg-card text-ink border-2 border-ink shadow-lift w-[calc(100vw-2rem)] max-w-md p-6 sm:p-8 m-auto backdrop:bg-board/80"
    >
      <h2 id="hop-xac-nhan-td" className="text-3xl">{tieuDe}</h2>
      <div className="mt-3 text-ink-soft leading-relaxed">{children}</div>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button type="button" autoFocus onClick={onDong} disabled={dangXuLy}
          className="min-h-[48px] px-5 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-60">
          {nhanGiu}
        </button>
        <button type="button" onClick={onXacNhan} disabled={dangXuLy}
          className={`inline-flex items-center justify-center gap-2 min-h-[48px] px-5 font-semibold text-lamp transition-colors disabled:opacity-60 ${nguyHiem ? 'bg-danger hover:bg-ink' : 'bg-ink hover:bg-board'}`}>
          {dangXuLy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {nhanXacNhan}
        </button>
      </div>
    </dialog>
  )
}

export default HopXacNhan
