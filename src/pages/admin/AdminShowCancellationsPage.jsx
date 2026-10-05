// src/pages/admin/AdminShowCancellationsPage.jsx
//
// MLACP-676 — XÉT LÝ DO HUỶ BUỔI. Chủ phòng trà huỷ buổi hòa nhạc đã mở bán phải nêu lý do; buổi diễn bị huỷ và khán giả
// được hoàn NGAY (chủ dự án chốt 06/10/2026: Admin "từ chối huỷ" không ép được phòng trà biểu diễn). Ở đây Admin chỉ quyết
// phòng trà có bị phạt hay không: Miễn phạt, hoặc Phạt (mặc định cảnh cáo; tạm khoá/khoá khi tái phạm nặng).
// Quyết định có hiệu lực ngay, không hoàn tác — phạt rồi thì phòng trà vẫn có đường khiếu nại án phạt.
import { useState } from 'react'
import { parseAsStringLiteral } from 'nuqs'
import { Loader2, CalendarX2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getShowCancellationReviews, decideShowCancellationReview } from '../../services/showServices'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import NhomTab from '../../components/bang/NhomTab'
import HopThoai, { TieuDeHop } from '../../components/shared/HopThoai'
import { ngayDayDu, gioTrongNgay } from '../../utils/ngayVietNam'

const TRANG_THAI = ['Pending', 'Excused', 'Penalized']
const BO_LOC = { trangThai: parseAsStringLiteral(TRANG_THAI).withDefault('Pending') }
const NHAN = { Pending: 'Chờ xét', Excused: 'Đã miễn phạt', Penalized: 'Đã phạt' }
const MUC_PHAT = [['Warning', 'Cảnh cáo'], ['Suspension', 'Tạm khoá'], ['Ban', 'Khoá vĩnh viễn']]
const tien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const luc = (t) => `${gioTrongNgay(t)} ${ngayDayDu(t)}`

const AdminShowCancellationsPage = () => {
  const ds = useDanhSachMayChu({
    khoa: ['admin-xet-huy-buoi'],
    goi: ({ trangThai, ...q }) => getShowCancellationReviews({ ...q, status: trangThai }),
    boLoc: BO_LOC,
  })
  const trangThai = ds.boLoc.trangThai
  const [chon, setChon] = useState(null) // { item, quyetDinh: 'Excuse' | 'Penalize' }
  const [ghiChu, setGhiChu] = useState('')
  const [mucPhat, setMucPhat] = useState('Warning')
  const [soNgay, setSoNgay] = useState(7)
  const [dangGui, setDangGui] = useState(false)

  const mo = (item, quyetDinh) => { setChon({ item, quyetDinh }); setGhiChu(''); setMucPhat('Warning'); setSoNgay(7) }

  const gui = async (e) => {
    e.preventDefault()
    if (!ghiChu.trim()) { toast.error('Hãy ghi lý do của quyết định — chủ phòng trà sẽ đọc câu này.'); return }
    setDangGui(true)
    try {
      await decideShowCancellationReview(chon.item.id, {
        decision: chon.quyetDinh, note: ghiChu.trim(),
        penaltyType: chon.quyetDinh === 'Penalize' ? mucPhat : null,
        suspensionDays: chon.quyetDinh === 'Penalize' && mucPhat === 'Suspension' ? Number(soNgay) : null,
      })
      toast.success(chon.quyetDinh === 'Excuse' ? 'Đã miễn phạt.' : 'Đã ra án phạt.')
      setChon(null)
      await ds.taiLai()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được quyết định.', { duration: 6000 })
    } finally {
      setDangGui(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarX2 size={28} className="text-ink" />
          <div>
            <h1 className="text-4xl text-ink">Lý do huỷ buổi</h1>
            <p className="text-ink-soft text-sm leading-relaxed max-w-2xl">
              Phòng trà huỷ buổi đã mở bán. Khán giả đã được hoàn tiền; ở đây chỉ quyết miễn phạt hay phạt phòng trà.
            </p>
          </div>
        </div>
        <button onClick={() => ds.taiLai()} disabled={ds.dangTai}
          className="flex items-center gap-2 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
          <RefreshCw size={16} className={ds.dangTai ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <NhomTab nhan="Lọc theo trạng thái" dangChon={trangThai} onChon={(k) => ds.datBoLoc({ trangThai: k === 'Pending' ? null : k })}
        cacTab={TRANG_THAI.map((k) => ({ khoa: k, nhan: NHAN[k], dem: k === trangThai && ds.tong > 0 ? ds.tong : undefined }))} />

      {ds.dangTai ? (
        <div className="py-20 flex justify-center"><Loader2 size={30} className="animate-spin text-ink" /></div>
      ) : ds.loi ? (
        <div role="alert" className="bg-card border border-line p-6 flex flex-wrap items-center gap-4">
          <p className="text-sm">Chưa tải được danh sách.</p>
          <button type="button" onClick={() => ds.taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
        </div>
      ) : ds.items.length === 0 ? (
        <div className="bg-card border border-line p-12 text-center text-sm text-ink-mute">
          {trangThai === 'Pending' ? 'Không có lý do huỷ nào đang chờ xét.' : 'Chưa có mục nào.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {ds.items.map((r) => (
            <li key={r.id} className="bg-card border border-line p-5 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-sans font-bold text-lg text-ink">{r.showName} <span className="font-normal text-ink-soft">· {r.loungeName}</span></h2>
                <span className="text-sm text-ink-mute">Huỷ lúc {luc(r.createdAt)}{r.status === 'Pending' && ` · hạn xét ${luc(r.slaDeadline)}`}</span>
              </div>
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
                <dt className="text-ink-mute">Giờ diễn đã định</dt><dd>{luc(r.showStart)}</dd>
                <dt className="text-ink-mute">Loại lý do</dt><dd className="font-semibold">{r.reasonLabel}</dd>
                <dt className="text-ink-mute">Mô tả của phòng trà</dt><dd className="whitespace-pre-line break-words">{r.detail}</dd>
                <dt className="text-ink-mute">Ảnh hưởng khán giả</dt><dd>{r.ticketsRefunded} vé đã bán · hoàn {tien(r.amountRefunded)}</dd>
                <dt className="text-ink-mute">Lần huỷ trước đó</dt>
                <dd className={r.earlierCancellations > 0 ? 'font-semibold text-danger' : ''}>
                  {r.earlierCancellations > 0 ? `${r.earlierCancellations} lần` : 'Chưa từng'}
                </dd>
                {r.evidenceUrl && (<>
                  <dt className="text-ink-mute">Bằng chứng</dt>
                  <dd><a href={r.evidenceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Mở ảnh bằng chứng</a></dd>
                </>)}
                {r.status !== 'Pending' && (<>
                  <dt className="text-ink-mute">Kết quả</dt>
                  <dd>{NHAN[r.status]}{r.decisionNote && ` — ${r.decisionNote}`}</dd>
                </>)}
              </dl>
              {r.status === 'Pending' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => mo(r, 'Excuse')}
                    className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Miễn phạt</button>
                  <button type="button" onClick={() => mo(r, 'Penalize')}
                    className="min-h-[44px] px-4 bg-danger text-lamp font-semibold hover:bg-ink">Phạt phòng trà</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!ds.dangTai && !ds.loi && <PhanTrang ds={ds} tenDonVi="mục" />}

      {chon && (
        <HopThoai onDong={() => !dangGui && setChon(null)} className="max-w-md">
          <form onSubmit={gui} className="p-6 space-y-4">
            <TieuDeHop><h2 className="text-3xl text-ink">{chon.quyetDinh === 'Excuse' ? 'Miễn phạt?' : 'Phạt phòng trà?'}</h2></TieuDeHop>
            <p className="text-sm text-ink-soft">{chon.item.showName} · {chon.item.loungeName}</p>
            {chon.quyetDinh === 'Penalize' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="block text-sm font-semibold mb-1">Mức phạt</span>
                  <select value={mucPhat} onChange={(e) => setMucPhat(e.target.value)} className="w-full min-h-[44px] px-3 border-2 border-ink bg-card">
                    {MUC_PHAT.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                  </select>
                </label>
                {mucPhat === 'Suspension' && (
                  <label className="block">
                    <span className="block text-sm font-semibold mb-1">Số ngày tạm khoá</span>
                    <input type="number" min={1} max={365} value={soNgay} onChange={(e) => setSoNgay(e.target.value)}
                      className="w-full min-h-[44px] px-3 border-2 border-ink bg-card" />
                  </label>
                )}
              </div>
            )}
            <label className="block">
              <span className="block text-sm font-semibold mb-1">Lý do quyết định * <span className="font-normal text-ink-mute">(chủ phòng trà sẽ đọc)</span></span>
              <textarea rows={3} maxLength={1000} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
                className="w-full px-3 py-2 border-2 border-ink bg-card" />
            </label>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={() => setChon(null)} disabled={dangGui}
                className="min-h-[44px] px-5 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp disabled:opacity-60">Quay lại</button>
              <button type="submit" disabled={dangGui}
                className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-5 font-semibold text-lamp disabled:opacity-60 ${chon.quyetDinh === 'Excuse' ? 'bg-ink hover:bg-board' : 'bg-danger hover:bg-ink'}`}>
                {dangGui && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {chon.quyetDinh === 'Excuse' ? 'Miễn phạt' : 'Ra án phạt'}
              </button>
            </div>
          </form>
        </HopThoai>
      )}
    </div>
  )
}

export default AdminShowCancellationsPage
