// src/components/livestream/ReportModal.jsx
//
// HỘP BÁO CÁO NỘI DUNG của buổi phát. Backend chỉ nhận ba loại đối tượng (Show / Livestream / Rating) — KHÔNG báo cáo được
// từng tin nhắn — nên trang cha quy về cả buổi phát và ghép "<lý do>: <mô tả>" vào một trường `reason` (tối đa 500 ký tự,
// SubmitContentReportCommandValidator).
//
// LÀM LẠI 01/10/2026: gửi NHÃN TIẾNG VIỆT của lý do (bản cũ gửi mã "Spam", "Harassment"… nên quản trị viên đọc thấy chữ
// tiếng Anh); nhóm radio thật thay cho nút giả radio; "Description" / "Minimum of 10 characters" → tiếng Việt; ô mô tả
// giới hạn theo phần còn lại của 500 ký tự; lỗi in trong hộp; <dialog> của trình duyệt. Mức tối thiểu 10 ký tự là quy ước
// của giao diện (backend chỉ cần không rỗng).
import { useState, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const LY_DO = ['Tin nhắn rác hoặc quảng cáo', 'Quấy rối, công kích cá nhân', 'Ngôn từ không phù hợp', 'Lừa đảo', 'Lý do khác']
const TOI_DA = 500
const TOI_THIEU = 10

const ReportModal = ({ onClose, onSubmit }) => {
  const ref = useRef(null)
  const [lyDo, setLyDo] = useState(null)
  const [moTa, setMoTa] = useState('')
  const [loi, setLoi] = useState({})
  const [dangGui, setDangGui] = useState(false)

  useEffect(() => { ref.current?.showModal() }, [])

  const toiDaMoTa = TOI_DA - (lyDo?.length ?? 0) - 2

  const gui = async (e) => {
    e.preventDefault()
    const thieu = {}
    if (!lyDo) thieu.lyDo = 'Chọn một lý do.'
    if (moTa.trim().length < TOI_THIEU) thieu.moTa = `Mô tả cần ít nhất ${TOI_THIEU} ký tự để quản trị viên xử lý được.`
    setLoi(thieu)
    if (Object.keys(thieu).length) return
    setDangGui(true)
    try {
      await onSubmit(lyDo, moTa.trim().slice(0, toiDaMoTa))
      toast.success('Đã gửi báo cáo. Quản trị viên sẽ xem xét.')
      ref.current?.close()
    } catch (err) {
      // 409 = chính người này đã báo cáo buổi này và báo cáo cũ còn chờ xử lý — backend trả câu tiếng Việt.
      setLoi({ chung: err.response?.data?.message || err.message || 'Chưa gửi được báo cáo. Hãy thử lại.' })
      setDangGui(false)
    }
  }

  return (
    <dialog ref={ref} aria-labelledby="bao-cao-td" onClose={onClose}
      onCancel={(e) => { if (dangGui) e.preventDefault() }}
      className="bg-card text-ink border-2 border-ink shadow-lift w-[calc(100vw-2rem)] max-w-md max-h-[90vh] p-0 m-auto backdrop:bg-board/80">
      <form onSubmit={gui} noValidate>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b-2 border-ink">
          <div>
            <h2 id="bao-cao-td" className="text-3xl">Báo cáo buổi phát</h2>
            <p className="text-sm text-ink-soft">Báo cáo được gửi cho quản trị viên, không hiện với người khác.</p>
          </div>
          <button type="button" autoFocus onClick={() => ref.current?.close()} disabled={dangGui} aria-label="Đóng hộp báo cáo"
            className="inline-flex items-center justify-center w-11 h-11 border-2 border-ink hover:bg-ink hover:text-lamp flex-shrink-0 disabled:opacity-60">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <fieldset aria-describedby={loi.lyDo ? 'loi-ly-do' : undefined}>
            <legend className="font-semibold">Lý do <span className="text-danger" aria-hidden="true">*</span><span className="sr-only"> (bắt buộc)</span></legend>
            {loi.lyDo && <p id="loi-ly-do" className="mt-1 text-sm font-semibold text-danger">{loi.lyDo}</p>}
            <div className="mt-2 space-y-1">
              {LY_DO.map((l) => (
                <label key={l} className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                  <input type="radio" name="ly-do" checked={lyDo === l} onChange={() => { setLyDo(l); setLoi((x) => ({ ...x, lyDo: undefined })) }} className="w-5 h-5 accent-ink" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="mo-ta-bao-cao" className="block font-semibold">Mô tả <span className="text-danger" aria-hidden="true">*</span><span className="sr-only"> (bắt buộc)</span></label>
            <p id="mo-ta-goi-y" className="text-sm text-ink-soft">Điều gì đã xảy ra, vào khoảng lúc nào trong buổi phát. Ít nhất {TOI_THIEU} ký tự.</p>
            <textarea id="mo-ta-bao-cao" rows={4} maxLength={toiDaMoTa} value={moTa} disabled={dangGui}
              onChange={(e) => { setMoTa(e.target.value); setLoi((x) => ({ ...x, moTa: undefined })) }}
              aria-invalid={loi.moTa ? 'true' : undefined} aria-describedby={`mo-ta-goi-y mo-ta-dem${loi.moTa ? ' loi-mo-ta' : ''}`}
              className={`mt-1 w-full px-3 py-2 bg-card border-2 focus:outline-none focus:ring-2 focus:ring-ink resize-none ${loi.moTa ? 'border-danger' : 'border-ink'}`} />
            <p id="mo-ta-dem" className="text-right text-xs font-mono text-ink-mute">{moTa.length}/{toiDaMoTa}</p>
            {loi.moTa && <p id="loi-mo-ta" className="text-sm font-semibold text-danger">{loi.moTa}</p>}
          </div>

          {loi.chung && <p role="alert" className="border-2 border-danger p-3 font-semibold text-danger">{loi.chung}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 px-5 py-4 border-t-2 border-ink">
          <button type="button" onClick={() => ref.current?.close()} disabled={dangGui}
            className="flex-1 min-h-[48px] border-2 border-ink font-semibold hover:bg-ink hover:text-lamp disabled:opacity-60">Không gửi</button>
          <button type="submit" disabled={dangGui}
            className="flex-1 min-h-[48px] bg-danger text-lamp font-semibold inline-flex items-center justify-center gap-2 hover:bg-ink disabled:opacity-60">
            {dangGui && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Gửi báo cáo
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default ReportModal
