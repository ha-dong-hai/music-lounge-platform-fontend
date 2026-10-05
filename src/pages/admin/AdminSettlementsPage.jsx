// src/pages/admin/AdminSettlementsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Đây là tiền của phòng trà đang bị hệ thống GIỮ LẠI vì nghi buổi diễn không chạy đủ như đã hứa
//   với người mua vé. Admin phải trả lời đúng một câu: buổi diễn có thật sự diễn ra đủ không.
// - Backend trả kèm ĐÚNG bằng chứng đã khiến khoản tiền bị giữ (giờ dự kiến, giờ thật, tỉ lệ,
//   ngưỡng đang áp) để Admin không phải tự đi tra rồi tính lại một con số có thể lệch. Vì vậy màn
//   này hiển thị nguyên các con số đó, KHÔNG tự tính lại tỉ lệ ở FE.
// - verdict='NeverStarted': buổi diễn đã đóng mà chưa từng được đánh dấu bắt đầu — nhiều khả năng
//   không diễn ra, và khi đó người mua vé cần được hoàn tiền.
//   verdict='Measured': có diễn nhưng ngắn hơn dự kiến, so ratio với threshold.
// - Quyết định ở đây KHÔNG tự tạo hoàn tiền cho người mua — hoàn tiền là luồng riêng ở trang
//   "Yêu cầu hoàn tiền". hasPendingRefund cảnh báo khoản này còn yêu cầu hoàn tiền chưa xử lý.
//
// LÀM LẠI 01/10/2026 (đối chiếu ReviewSettlementCommandHandler):
// - "Giữ lại" = Status Cancelled VĨNH VIỄN — phòng trà không bao giờ được trả đợt này, và lý do được GỬI NGUYÊN VĂN cho
//   chủ phòng trà. Bản cũ không hỏi lại và không nói hai điều đó → nay qua HopXacNhan, nói rõ.
// - "Nhả tiền" bị backend chặn khi còn yêu cầu hoàn tiền chờ (hasPendingRefund) → nút không hiện, thay bằng lời dẫn sang
//   trang hoàn tiền. Chốt "chưa có tài khoản nhận tiền" không có trong DTO → để backend báo, in nguyên văn.
// - releaseType in thô ("Partial70", "Final30", "Full") → đổi sang chữ; tỉ lệ đợt là cấu hình nên không in số 70/30.
// - Lý do là ô có nhãn thật; lỗi thiếu lý do in dưới ô thay vì toast.
// PHÂN TRANG (01/10/2026): dùng hooks/useDanhSachMayChu + components/bang/PhanTrang như mọi danh sách khác — bản cũ tự
// giữ {page,totalPages} với hai nút trước/sau, trang không lên URL (tải lại về trang 1) và không có dòng "Hiện x–y".
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getSettlementsPendingReview, reviewSettlement } from '../../services/moneyServices'
import HopXacNhan from '../../components/shared/HopXacNhan'
import NhanTrangThai from '../../components/shared/NhanTrangThai'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import { ngayDayDu, gioTrongNgay } from '../../utils/ngayVietNam'

const tien = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`
const moc = (v) => (v ? `${gioTrongNgay(v)} ${ngayDayDu(v)}` : '—')
const phanTram = (r) => `${(Number(r) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}%`
// SettlementReleaseType: Partial70 (đợt đầu), Final30 (đợt cuối), Full (một đợt — đơn F&B). Tỉ lệ đợt đọc từ cấu hình
// nên không in con số 70/30 ở đây.
const DOT = { Partial70: 'Đợt chi trả đầu', Final30: 'Đợt chi trả cuối', Full: 'Chi trả một lần (đơn món)' }
const PHAN_XET = { NeverStarted: ['xau', 'Chưa từng bắt đầu'], Measured: ['cho', 'Diễn ngắn hơn dự kiến'], Unknown: ['tat', 'Chưa đủ dữ liệu'] }

const AdminSettlementsPage = () => {
  const ds = useDanhSachMayChu({ khoa: ['admin-quyet-toan'], goi: getSettlementsPendingReview })
  const items = ds.items
  const isLoading = ds.dangTai
  const loiTai = Boolean(ds.loi)
  const [busyId, setBusyId] = useState(null)
  const [notes, setNotes] = useState({})
  const [loiLyDo, setLoiLyDo] = useState({})
  const [hoi, setHoi] = useState(null) // { s, decision }

  const moHoi = (s, decision) => {
    if (!(notes[s.settlementId] || '').trim()) {
      setLoiLyDo((l) => ({ ...l, [s.settlementId]: 'Ghi lý do trước khi quyết định.' }))
      document.getElementById(`ly-do-${s.settlementId}`)?.focus()
      return
    }
    setHoi({ s, decision })
  }

  const xuLy = async () => {
    const { s, decision } = hoi
    setBusyId(s.settlementId)
    try {
      await reviewSettlement(s.settlementId, { decision, note: notes[s.settlementId].trim() })
      toast.success(decision === 'Release' ? 'Đã nhả tiền cho phòng trà.' : 'Đã giữ lại khoản này.')
      setHoi(null)
      await ds.taiLai()
    } catch (err) {
      setHoi(null)
      toast.error(err.response?.data?.message || 'Xử lý thất bại.', { duration: 10000 })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="text-4xl text-ink">Quyết toán</h1>
      <p className="mt-2 max-w-[70ch] text-ink-soft">
        Tiền của phòng trà đang bị giữ vì nghi buổi diễn không chạy đủ như đã hứa với người mua vé. Quyết định ở đây không tự
        hoàn tiền cho người mua — việc đó đi qua trang Yêu cầu hoàn tiền.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-48 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải danh sách quyết toán" />
        ) : loiTai ? (
          <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
            <p>Danh sách quyết toán chưa tải được.</p>
            <button type="button" onClick={() => ds.taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
          </div>
        ) : items.length === 0 ? (
          <p className="border-2 border-ink p-6">Không có khoản quyết toán nào đang bị giữ.</p>
        ) : (
          <ol className="border-y-2 border-ink divide-y divide-line">
            {items.map((s) => {
              const dangXuLy = busyId === s.settlementId
              const [sacThai, nhanPX] = PHAN_XET[s.verdict] ?? ['trung', s.verdict]
              return (
                <li key={s.settlementId} className="py-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-2xl">{tien(s.netAmount)}</p>
                      <span className="text-sm text-ink-soft">phòng trà nhận · gộp <span className="font-mono">{tien(s.grossAmount)}</span></span>
                      <NhanTrangThai sacThai={sacThai}>{nhanPX}</NhanTrangThai>
                      {s.hasPendingRefund && <NhanTrangThai sacThai="cho">Còn yêu cầu hoàn tiền chờ xử lý</NhanTrangThai>}
                    </div>
                    <p className="mt-2 font-display text-2xl leading-tight break-words">{s.showName || '(buổi diễn không còn tồn tại)'}</p>
                    <p className="text-sm text-ink-mute">
                      {DOT[s.releaseType] ?? s.releaseType} · lên lịch <span className="font-mono">{moc(s.scheduledAt)}</span>
                    </p>

                    {/* Bằng chứng do backend trả — không tự tính lại ở FE */}
                    <table className="mt-3 w-full max-w-xl text-sm">
                      <caption className="sr-only">Bằng chứng thời lượng buổi diễn</caption>
                      <thead><tr className="text-left text-ink-mute"><th scope="col" className="font-normal py-1"></th><th scope="col" className="font-normal py-1">Bắt đầu</th><th scope="col" className="font-normal py-1">Kết thúc</th></tr></thead>
                      <tbody className="font-mono">
                        <tr className="border-t border-line"><th scope="row" className="font-sans font-normal text-left py-1.5 pr-4 text-ink-mute">Dự kiến</th><td>{moc(s.scheduledStart)}</td><td>{moc(s.scheduledEnd)}</td></tr>
                        <tr className="border-t border-line"><th scope="row" className="font-sans font-normal text-left py-1.5 pr-4 text-ink-mute">Thực tế</th><td>{moc(s.actualStart)}</td><td>{moc(s.actualEnd)}</td></tr>
                      </tbody>
                    </table>
                    <p className="mt-2 text-sm">
                      Tỉ lệ đạt <span className="font-mono font-semibold">{s.ratio != null ? phanTram(s.ratio) : '—'}</span>
                      <span className="text-ink-mute"> · ngưỡng yêu cầu </span><span className="font-mono">{phanTram(s.threshold)}</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`ly-do-${s.settlementId}`} className="block text-sm font-semibold">Lý do quyết định <span className="text-danger" aria-hidden="true">*</span><span className="sr-only"> (bắt buộc)</span></label>
                      <p id={`ly-do-goi-y-${s.settlementId}`} className="text-xs text-ink-soft">Gửi nguyên văn cho chủ phòng trà.</p>
                      <input id={`ly-do-${s.settlementId}`} value={notes[s.settlementId] || ''} maxLength={500}
                        onChange={(e) => { setNotes((p) => ({ ...p, [s.settlementId]: e.target.value })); setLoiLyDo((l) => ({ ...l, [s.settlementId]: undefined })) }}
                        aria-invalid={loiLyDo[s.settlementId] ? 'true' : undefined}
                        aria-describedby={`ly-do-goi-y-${s.settlementId}${loiLyDo[s.settlementId] ? ` ly-do-loi-${s.settlementId}` : ''}`}
                        className={`mt-1 w-full min-h-[44px] px-3 bg-card border-2 text-ink focus:outline-none focus:ring-2 focus:ring-ink ${loiLyDo[s.settlementId] ? 'border-danger' : 'border-ink'}`} />
                      {loiLyDo[s.settlementId] && <p id={`ly-do-loi-${s.settlementId}`} className="mt-1 text-sm font-semibold text-danger">{loiLyDo[s.settlementId]}</p>}
                    </div>
                    {s.hasPendingRefund && (
                      <p className="text-sm border-l-4 border-warning pl-3">
                        Chưa nhả tiền được: <Link to="/admin/refunds" className="underline underline-offset-4 font-semibold">xử lý yêu cầu hoàn tiền</Link> trước, nếu không phòng trà nhận đủ tiền cho phần sắp phải trả lại khách.
                      </p>
                    )}
                    <div className="flex gap-2">
                      {!s.hasPendingRefund && (
                        <button type="button" onClick={() => moHoi(s, 'Release')} disabled={dangXuLy}
                          className="flex-1 min-h-[44px] px-3 bg-ink text-lamp font-semibold hover:bg-board disabled:opacity-60">Nhả tiền</button>
                      )}
                      <button type="button" onClick={() => moHoi(s, 'Withhold')} disabled={dangXuLy}
                        className="flex-1 min-h-[44px] px-3 border-2 border-danger text-danger font-semibold hover:bg-danger hover:text-lamp disabled:opacity-60">Giữ lại</button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {!isLoading && !loiTai && <PhanTrang ds={ds} tenDonVi="khoản" className="mt-4" />}

      <HopXacNhan mo={!!hoi} dangXuLy={busyId != null} nhanGiu="Không, quay lại" nguyHiem={hoi?.decision === 'Withhold'}
        tieuDe={!hoi ? '' : hoi.decision === 'Withhold' ? `Giữ lại ${tien(hoi.s.netAmount)}?` : `Nhả ${tien(hoi.s.netAmount)} cho phòng trà?`}
        nhanXacNhan={hoi?.decision === 'Withhold' ? 'Giữ lại vĩnh viễn' : 'Nhả tiền'}
        onDong={() => setHoi(null)} onXacNhan={xuLy}>
        {hoi && (hoi.decision === 'Withhold' ? (
          <p>Phòng trà sẽ <strong className="text-danger">không bao giờ</strong> được trả đợt này, và nhận thông báo kèm lý do của bạn. Việc hoàn tiền cho người mua vé không tự xảy ra — xử lý ở trang Yêu cầu hoàn tiền. Không hoàn tác được.</p>
        ) : (
          <p>Hệ thống ghi bút toán chi trả và báo cho phòng trà. Chỉ nhả khi bạn đã chắc buổi diễn diễn ra đủ. Không hoàn tác được.</p>
        ))}
      </HopXacNhan>
    </div>
  )
}

export default AdminSettlementsPage
