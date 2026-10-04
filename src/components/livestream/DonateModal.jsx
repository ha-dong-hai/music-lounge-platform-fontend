// src/components/livestream/DonateModal.jsx
//
// HỘP ỦNG HỘ NGHỆ SĨ trong buổi phát trực tuyến. Bấm gửi → tạo khoản ủng hộ → chuyển sang VNPay để trả tiền.
//
// LÀM LẠI 01/10/2026 — chữ nói sai về tiền:
// - Bản cũ bắn "Ủng hộ thành công!" NGAY khi bấm, trong khi lúc đó người xem mới sắp được chuyển sang VNPay (chưa trả
//   đồng nào), và kể cả khi tạo khoản thất bại (trang cha nuốt lỗi, không ném lại). Nay: nút ghi rõ "Tiếp tục thanh toán
//   qua VNPay"; lỗi máy chủ in ngay trong hộp (vd. vượt trần DonationMaxAmount do backend kiểm).
// - Chỉ liệt kê nghệ sĩ CÓ nhận ủng hộ (`acceptsDonation`) và có `performanceId` — chọn người không nhận thì backend từ chối.
// - Lời nhắn LUÔN công khai (trang cha gửi isMessagePublic = true) → nói rõ; bản cũ ghi "Dùng cho sổ cái" (sai).
// - Số tiền là đồng chẵn (CreateDonationCommandValidator: MustBeWholeDong): ô tự nhập chỉ nhận chữ số.
// - <dialog> của trình duyệt (giữ focus, Esc đóng); chọn nghệ sĩ và mức tiền là nhóm radio.
// Mức tối thiểu 1.000 đ là quy ước sẵn có của giao diện (backend nhận từ 1 đ); trần do backend kiểm và báo lỗi.
import { useState, useRef, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { anhChuCai } from '../../utils/anhChuCai'
import { ChiaTienUngHo } from '../shared/DieuKhoanTien'

const MUC_SAN = [20000, 50000, 100000, 200000, 500000, 1000000]
const TOI_THIEU = 1000
const DAI_NHAN = 500
const tien = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`

const DonateModal = ({ performers, onClose, onSendDonation }) => {
  const ref = useRef(null)
  const nhanDuoc = (performers ?? []).filter((p) => p.acceptsDonation && p.performanceId)
  const [ngheSi, setNgheSi] = useState(nhanDuoc.length === 1 ? nhanDuoc[0].id : null)
  const [muc, setMuc] = useState(50000)
  const [tuNhap, setTuNhap] = useState('')
  const [nhan, setNhan] = useState('')
  const [loi, setLoi] = useState({})
  const [dangGui, setDangGui] = useState(false)

  useEffect(() => { ref.current?.showModal() }, [])

  // Lỗi máy chủ nằm cuối hộp, dễ bị thanh nút dính ở đáy che: cuộn tới và đưa focus vào nó.
  const refLoi = useRef(null)
  useEffect(() => { if (loi.chung) refLoi.current?.focus() }, [loi.chung])

  const soTien = tuNhap ? Number(tuNhap) : muc

  const gui = async (e) => {
    e.preventDefault()
    const thieu = {}
    if (!ngheSi) thieu.ngheSi = 'Chọn nghệ sĩ bạn muốn ủng hộ.'
    if (!soTien || soTien < TOI_THIEU) thieu.soTien = `Số tiền tối thiểu là ${tien(TOI_THIEU)}.`
    setLoi(thieu)
    if (Object.keys(thieu).length) return
    setDangGui(true)
    try {
      // Thành công thì trang cha chuyển hẳn sang VNPay — hộp này không cần tự đóng.
      await onSendDonation(ngheSi, soTien, nhan.trim())
    } catch (err) {
      setLoi({ chung: err.message || 'Chưa tạo được khoản ủng hộ. Hãy thử lại.' })
      setDangGui(false)
    }
  }

  return (
    <dialog ref={ref} aria-labelledby="ung-ho-td" onClose={onClose}
      onCancel={(e) => { if (dangGui) e.preventDefault() }}
      className="bg-card text-ink border-2 border-ink shadow-lift w-[calc(100vw-2rem)] max-w-md max-h-[90vh] p-0 m-auto backdrop:bg-board/80">
      <form onSubmit={gui} noValidate>
        <div className="sticky top-0 z-10 bg-card flex items-center justify-between gap-4 px-5 py-3 border-b-2 border-ink">
          <h2 id="ung-ho-td" className="text-3xl">Ủng hộ nghệ sĩ</h2>
          <button type="button" autoFocus onClick={() => ref.current?.close()} disabled={dangGui} aria-label="Đóng hộp ủng hộ"
            className="inline-flex items-center justify-center w-11 h-11 border-2 border-ink hover:bg-ink hover:text-lamp disabled:opacity-60">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {nhanDuoc.length === 0 ? (
          <p className="p-5">Buổi diễn này chưa có nghệ sĩ nào nhận tiền ủng hộ.</p>
        ) : (
          <div className="p-5 space-y-6">
            <fieldset aria-describedby={loi.ngheSi ? 'loi-nghe-si' : undefined}>
              <legend className="font-semibold">Nghệ sĩ</legend>
              {loi.ngheSi && <p id="loi-nghe-si" className="mt-1 text-sm font-semibold text-danger">{loi.ngheSi}</p>}
              <div className="mt-2 space-y-2">
                {nhanDuoc.map((p) => (
                  <label key={p.id} className={`flex items-center gap-3 min-h-[52px] px-3 border-2 cursor-pointer ${ngheSi === p.id ? 'border-ink bg-sunken' : 'border-ink/30 hover:border-ink'}`}>
                    <input type="radio" name="nghe-si" checked={ngheSi === p.id} onChange={() => { setNgheSi(p.id); setLoi((l) => ({ ...l, ngheSi: undefined })) }} className="w-5 h-5 accent-ink" />
                    <img src={p.avatarUrl || anhChuCai(p.name)} alt="" width="32" height="32" className="w-8 h-8 object-cover" />
                    <span className="font-semibold">{p.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset aria-describedby={loi.soTien ? 'loi-so-tien' : undefined}>
              <legend className="font-semibold">Số tiền</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {MUC_SAN.map((v) => {
                  const chon = !tuNhap && muc === v
                  return (
                    <label key={v} className={`flex items-center justify-center min-h-[48px] border-2 cursor-pointer font-mono text-sm ${chon ? 'border-ink bg-ink text-lamp' : 'border-ink/30 hover:border-ink'}`}>
                      <input type="radio" name="muc-tien" className="sr-only" checked={chon} onChange={() => { setMuc(v); setTuNhap(''); setLoi((l) => ({ ...l, soTien: undefined })) }} />
                      {v.toLocaleString('vi-VN')}
                    </label>
                  )
                })}
              </div>
              <label htmlFor="so-tien-khac" className="block mt-3 text-sm font-semibold">Hoặc nhập số khác (đồng)</label>
              <input id="so-tien-khac" inputMode="numeric" autoComplete="off" value={tuNhap ? Number(tuNhap).toLocaleString('vi-VN') : ''}
                onChange={(e) => { setTuNhap(e.target.value.replace(/\D/g, '').slice(0, 10)); setLoi((l) => ({ ...l, soTien: undefined })) }}
                aria-invalid={loi.soTien ? 'true' : undefined}
                className={`mt-1 w-full min-h-[48px] px-3 bg-card border-2 font-mono focus:outline-none focus:ring-2 focus:ring-ink ${loi.soTien ? 'border-danger' : 'border-ink'}`} />
              {loi.soTien && <p id="loi-so-tien" className="mt-1.5 text-sm font-semibold text-danger">{loi.soTien}</p>}
            </fieldset>

            <div>
              <label htmlFor="loi-nhan" className="block font-semibold">Lời nhắn <span className="font-normal text-ink-mute">(không bắt buộc)</span></label>
              <p id="loi-nhan-goi-y" className="text-sm text-ink-soft">Lời nhắn hiện công khai trong buổi phát và trên sao kê của nghệ sĩ.</p>
              <textarea id="loi-nhan" aria-describedby="loi-nhan-goi-y loi-nhan-dem" rows={2} maxLength={DAI_NHAN} value={nhan} onChange={(e) => setNhan(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-card border-2 border-ink focus:outline-none focus:ring-2 focus:ring-ink resize-none" />
              <p id="loi-nhan-dem" className="text-right text-xs font-mono text-ink-mute">{nhan.length}/{DAI_NHAN}</p>
            </div>

            {/* MLACP-626: trước khi trả tiền, người ủng hộ phải thấy nghệ sĩ nhận bao nhiêu và rằng tiền không hoàn lại. */}
            <ChiaTienUngHo soTien={soTien} />

            {loi.chung && <p ref={refLoi} tabIndex={-1} role="alert" className="scroll-mb-24 border-2 border-danger p-3 font-semibold text-danger">{loi.chung}</p>}
          </div>
        )}

        {nhanDuoc.length > 0 && (
          <div className="sticky bottom-0 bg-card px-5 py-4 border-t-2 border-ink">
            <button type="submit" disabled={dangGui}
              className="w-full min-h-[48px] bg-ink text-lamp font-semibold inline-flex items-center justify-center gap-2 hover:bg-board disabled:opacity-60">
              {dangGui && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              Thanh toán <span className="font-mono whitespace-nowrap">{tien(soTien)}</span> qua VNPay
            </button>
          </div>
        )}
      </form>
    </dialog>
  )
}

export default DonateModal
