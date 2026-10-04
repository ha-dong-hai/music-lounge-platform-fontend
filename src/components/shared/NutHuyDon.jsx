// src/components/shared/NutHuyDon.jsx
//
// NÚT HUỶ ĐƠN GỌI MÓN CÓ LÝ DO (MLACP-631, 04/10/2026). Phần mềm F&B thực tế (KiotViet, CUKCUK) bắt chọn hoặc nhập lý
// do khi huỷ món đã báo bếp/bar, để chủ quán xem lại vì sao đơn bị huỷ và ai huỷ. Backend nay từ chối lệnh huỷ không có
// lý do (400).
//
// - Bốn lý do hay gặp ở quầy bar phòng trà bấm một chạm điền sẵn; vẫn gõ tự do được. Danh sách này chỉ là gợi ý ở giao
//   diện — lý do lưu ở máy chủ là chuỗi chữ, không phải mã.
// - Hộp xác nhận dùng HopXacNhan (WCAG 2.2 SC 3.3.4); nút "Huỷ đơn" khoá khi chưa có lý do.
import { useState } from 'react'
import HopXacNhan from './HopXacNhan'

const GOI_Y = ['Khách đổi ý', 'Hết món', 'Gọi nhầm món', 'Khách bỏ về']

const NutHuyDon = ({ onHuy, tieuDe, noiDung, children, ...nut }) => {
  const [mo, setMo] = useState(false)
  const [lyDo, setLyDo] = useState('')
  const dong = () => { setMo(false); setLyDo('') }
  const coLyDo = lyDo.trim().length > 0
  return (
    <>
      <button type="button" {...nut} onClick={() => setMo(true)}>{children}</button>
      <HopXacNhan mo={mo} tieuDe={tieuDe} nhanXacNhan="Huỷ đơn" nhanGiu="Không, giữ đơn"
        onDong={dong}
        onXacNhan={() => { if (!coLyDo) return; const r = lyDo.trim(); dong(); onHuy?.(r) }}>
        {typeof noiDung === 'string' ? <p>{noiDung}</p> : noiDung}
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-ink">Lý do huỷ</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOI_Y.map((g) => (
              <button key={g} type="button" aria-pressed={lyDo === g} onClick={() => setLyDo(g)}
                className={`min-h-[44px] px-3 border-2 text-sm font-semibold ${lyDo === g ? 'border-ink bg-ink text-lamp' : 'border-ink/40 text-ink hover:border-ink'}`}>
                {g}
              </button>
            ))}
          </div>
          <label htmlFor="ly-do-huy" className="block mt-3 text-sm font-semibold text-ink">Hoặc ghi lý do khác</label>
          <input id="ly-do-huy" value={lyDo} maxLength={500} onChange={(e) => setLyDo(e.target.value)} autoComplete="off"
            className="mt-1 w-full min-h-[44px] px-3 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink" />
          {!coLyDo && <p className="mt-1.5 text-sm text-ink-mute">Chọn hoặc ghi lý do để huỷ.</p>}
        </fieldset>
      </HopXacNhan>
    </>
  )
}

export default NutHuyDon
