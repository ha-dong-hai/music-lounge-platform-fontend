// src/pages/owner/OwnerDonationsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — ĐÂY LÀ TIỀN CỦA NGHỆ SĨ, KHÔNG PHẢI DOANH THU CỦA PHÒNG TRÀ:
// - Tiền donate đi qua ba chặng: khán giả trả cho nền tảng → nền tảng chuyển cho phòng trà →
//   phòng trà chuyển tiếp cho nghệ sĩ. Chủ phòng trà phải xác nhận HAI lần, mỗi chặng một lần:
//     Chặng 1 "Đã nhận tiền"   → POST /donations/{id}/acknowledge
//     Chặng 2 "Đã trả nghệ sĩ" → POST /donations/{id}/confirm-paid (kèm mã giao dịch + chứng từ)
// - `payoutDueAt` là HẠN phải chuyển tiếp cho nghệ sĩ. Quá hạn là căn cứ để nghệ sĩ khiếu nại và để
//   hệ thống cảnh cáo phòng trà — nên màn này tô đỏ khi sắp/đã quá hạn thay vì để nó lẫn vào danh sách.
// - `autoConfirmDeadline` là hạn mà hệ thống TỰ XÁC NHẬN thay chủ nếu chủ không bấm. Phải hiện, vì
//   chủ dễ tưởng "không bấm thì không có gì xảy ra" — trong khi tự xác nhận sẽ khởi động luôn đồng
//   hồ hạn chuyển tiếp cho nghệ sĩ. Khác hẳn `payoutDueAt` (hạn chuyển tiền cho nghệ sĩ).
// - `payoutReceivedAt` = null nghĩa là NỀN TẢNG CHƯA chuyển tiền về cho phòng trà. Đừng bắt chủ
//   "đã trả nghệ sĩ" khi họ còn chưa nhận được tiền.
// - KHÔNG có luồng hoàn tiền cho donate đã xác nhận — đừng thêm nút hoàn tiền ở đây.
// - `amountToPayPerformer` là số phải trả nghệ sĩ, KHÁC `gross` (khán giả trả) và `net` (sau phí).
//   Ba con số này không được gộp.
// - TAB "LỊCH SỬ" DÙNG ENDPOINT KHÁC và trả về HÌNH DẠNG KHÁC: /donations/owner-history trả một
//   BẢN TỔNG HỢP (OwnerDonationHistorySummaryDto) có các con số đếm + `items` phân trang bên trong,
//   không phải mảng trần như hai tab kia. Đừng dùng chung chỗ đọc dữ liệu.
// - GỠ LỜI NHẮN chỉ ẩn lời nhắn khỏi livestream; KHÔNG hoàn tiền, và lời nhắn gốc vẫn được lưu để
//   đối chiếu. Người đang xem nhận sự kiện SignalR DonationMessageHidden.
import { useState } from 'react'
import { parseAsStringLiteral } from 'nuqs'
import { Loader2, HeartHandshake, CheckCircle2, Clock, AlertTriangle, X, Send, RefreshCw, EyeOff, History } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getDonationsPendingAck, getDonationsAwaitingPayout, getOwnerDonationHistory,
  acknowledgeDonation, confirmDonationPaid, hideDonationMessage,
} from '../../services/donationServices'
import { uploadImage } from '../../services/userServices'
import NutXacNhan from '../../components/shared/NutXacNhan'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import NhomTab from '../../components/bang/NhomTab'
import HopThoai, { TieuDeHop } from '../../components/shared/HopThoai'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const inputCls = 'mt-1 w-full min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2'

const TABS = [
  { key: 'ack', label: 'Chờ tôi xác nhận đã nhận tiền' },
  { key: 'payout', label: 'Chờ tôi chuyển cho nghệ sĩ' },
  { key: 'history', label: 'Lịch sử' },
]
// Tab nằm trên URL (?tab=payout) để Quay lại và chép link trả đúng chỗ — hằng ở ngoài component để nuqs không
// nhận một đối tượng mới mỗi lần vẽ.
const BO_LOC = { tab: parseAsStringLiteral(TABS.map((t) => t.key)).withDefault('ack') }

// PHÂN TRANG (01/10/2026): bản cũ xin cố định pageSize 50 và không có nút trang tiếp — khoản thứ 51 trở đi của cả ba
// tab không bao giờ hiện, trong khi đây là tiền chủ phòng trà PHẢI xác nhận/chuyển trước hạn. Nay dùng
// hooks/useDanhSachMayChu. Tab Lịch sử trả bản tổng hợp có `items` phân trang LỒNG bên trong (xem ghi chú đầu tệp):
// bóc lớp ngoài ra để hook đọc được trang, và giữ các con số đếm ở `tongHop`.
const goiDanhSach = async ({ tab, ...q }) => {
  if (tab === 'history') {
    const res = await getOwnerDonationHistory(q)
    if (!res?.success) return res
    const { items: trangLong, ...tongHop } = res.data ?? {}
    return { success: true, data: { ...(trangLong ?? { items: [], totalCount: 0 }), tongHop } }
  }
  return tab === 'ack' ? getDonationsPendingAck(q) : getDonationsAwaitingPayout(q)
}

// Trạng thái chuyển tiếp trong lịch sử — chuỗi của backend, chỉ ánh xạ giá trị đã biết.
const TRANG_THAI_CHUYEN = {
  Paid: { chu: 'Đã chuyển nghệ sĩ', mau: 'text-success bg-success/10' },
  Pending: { chu: 'Chưa chuyển', mau: 'text-warning bg-warning/10' },
  Overdue: { chu: 'Quá hạn', mau: 'text-danger bg-danger/10' },
}

const ConfirmPaidModal = ({ donation, onClose, onSaved }) => {
  const [paymentRef, setPaymentRef] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const taiChungTu = async (file) => {
    if (!file) return
    setIsUploading(true)
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      setEvidenceUrl(up.data?.url ?? up.data)
      toast.success('Đã tải chứng từ lên.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được chứng từ.')
    } finally {
      setIsUploading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!paymentRef.trim()) { toast.error('Cần nhập mã giao dịch chuyển khoản.'); return }
    setIsBusy(true)
    try {
      await confirmDonationPaid(donation.id, {
        paymentRef: paymentRef.trim(),
        paymentEvidenceUrl: evidenceUrl || null,
      })
      toast.success('Đã ghi nhận việc chuyển tiền cho nghệ sĩ.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không ghi nhận được.')
    } finally { setIsBusy(false) }
  }

  return (
    <HopThoai onDong={onClose} className="max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <TieuDeHop><h2 className="text-3xl text-ink">Xác nhận đã trả nghệ sĩ</h2></TieuDeHop>
          <button onClick={onClose} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft" aria-label="Đóng"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-sunken/70 border border-line p-4">
            <p className="text-sm text-ink font-medium">{donation.performerName}</p>
            <p className="text-xs text-ink-mute mt-0.5">{donation.showName}</p>
            <p className="text-lg text-ink font-bold mt-2 tabular-nums">{fmtMoney(donation.amountToPayPerformer)}</p>
            <p className="text-xs text-ink-mute">Số phải chuyển cho nghệ sĩ</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-ink">Mã giao dịch chuyển khoản <span className="text-danger">*</span></label>
            <input aria-label="Mã giao dịch chuyển khoản" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className={inputCls}
              placeholder="Mã do ngân hàng của bạn cấp" />
            <p className="text-xs text-ink-mute mt-1">
              Đây là bằng chứng để đối chiếu nếu nghệ sĩ nói chưa nhận được tiền.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-ink">Ảnh chứng từ</label>
            <div className="mt-1 flex items-center gap-2">
              <label className="inline-flex items-center justify-center gap-2 cursor-pointer min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
                {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {evidenceUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                <input type="file" accept="image/*" className="hidden" disabled={isUploading}
                  onChange={(e) => taiChungTu(e.target.files?.[0])} />
              </label>
              {evidenceUrl && <CheckCircle2 size={16} className="text-success" />}
            </div>
          </div>

          <button type="submit" disabled={isBusy || isUploading}
            className="w-full flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
            {isBusy && <Loader2 size={16} className="animate-spin" />} Xác nhận đã chuyển
          </button>
        </form>
      </HopThoai>
  )
}

const OwnerDonationsPage = () => {
  const [busyId, setBusyId] = useState(null)
  const [traNgheSi, setTraNgheSi] = useState(null)
  const ds = useDanhSachMayChu({ khoa: ['ung-ho'], goi: goiDanhSach, boLoc: BO_LOC })
  const { tab } = ds.boLoc
  const items = ds.items
  const isLoading = ds.dangTai
  // Chỉ có ở tab Lịch sử: các con số đếm nằm NGOÀI mảng items của bản tổng hợp.
  const tongHop = tab === 'history' ? ds.duLieu?.tongHop ?? null : null
  const load = () => ds.taiLai()


  const xacNhanNhan = async (d) => {
    setBusyId(d.id)
    try {
      await acknowledgeDonation(d.id)
      toast.success('Đã xác nhận nhận được tiền.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xác nhận được.')
    } finally { setBusyId(null) }
  }

  // Gỡ lời nhắn khỏi livestream. Không hỏi lại bằng modal riêng vì việc này KHÔNG động tới tiền và
  // lời nhắn gốc vẫn được lưu — nhưng vẫn phải xác nhận một lần, vì người đang xem thấy thay đổi ngay.
  const goLoiNhan = async (d) => {
    if (!window.confirm(`Gỡ lời nhắn của khoản donate này khỏi livestream?

Không hoàn tiền, và lời nhắn gốc vẫn được lưu để đối chiếu.`)) return
    setBusyId(d.id)
    try {
      await hideDonationMessage(d.id)
      toast.success('Đã gỡ lời nhắn khỏi buổi phát trực tuyến.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gỡ được lời nhắn.')
    } finally { setBusyId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl text-ink mb-1">Tiền ủng hộ nghệ sĩ</h1>
          <p className="text-ink-soft text-sm leading-relaxed">
            Đây là tiền khán giả tặng NGHỆ SĨ, phòng trà chỉ giữ hộ và chuyển tiếp — không phải doanh thu của bạn.
          </p>
        </div>
        <button type="button" onClick={load} disabled={ds.dangTaiLai}
          className="flex items-center gap-1.5 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
          <RefreshCw size={14} className={ds.dangTaiLai ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <NhomTab nhan="Lọc tiền ủng hộ" dangChon={tab} cacTab={TABS.map((t) => ({ khoa: t.key, nhan: t.label }))}
        onChon={(k) => ds.datBoLoc({ tab: k })} />

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
      ) : ds.loi ? (
        <div role="alert" className="bg-card border border-line p-6 flex flex-wrap items-center gap-4">
          <p className="text-sm">Chưa tải được danh sách tiền ủng hộ.</p>
          <button type="button" onClick={load} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line p-10 text-center">
          <HeartHandshake size={28} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">
            {tab === 'ack' ? 'Không có khoản ủng hộ nào đang chờ bạn xác nhận.'
              : tab === 'payout' ? 'Không có khoản ủng hộ nào đang chờ chuyển cho nghệ sĩ.'
              : 'Chưa có khoản ủng hộ nào trong kỳ này.'}
          </p>
        </div>
      ) : tab === 'history' ? (
        <>
          {/* CÁC CON SỐ ĐẾM nằm ngoài mảng items — đây là bản tổng hợp, không phải mảng trần */}
          {tongHop && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-card border border-line p-4">
                <p className="text-xs text-ink-mute">Tổng khán giả tặng</p>
                <p className="text-lg font-bold text-ink mt-1 tabular-nums">{fmtMoney(tongHop.totalGross)}</p>
                <p className="text-xs text-ink-mute mt-1">{tongHop.totalCount} khoản</p>
              </div>
              <div className="bg-card border border-line p-4">
                <p className="text-xs text-ink-mute">Đã chuyển nghệ sĩ</p>
                <p className="text-lg font-bold text-ink mt-1 tabular-nums">{tongHop.paidCount}</p>
              </div>
              <div className="bg-card border border-line p-4">
                <p className="text-xs text-ink-mute">Còn trong hạn</p>
                <p className="text-lg font-bold text-ink mt-1 tabular-nums">{tongHop.withinHoldCount}</p>
              </div>
              <div className={`bg-card border p-4 ${tongHop.overdueCount > 0 ? 'border-danger/40' : 'border-line'}`}>
                <p className="text-xs text-ink-mute">Quá hạn</p>
                <p className={`text-lg font-bold mt-1 tabular-nums ${tongHop.overdueCount > 0 ? 'text-danger' : 'text-ink'}`}>
                  {tongHop.overdueCount}
                </p>
              </div>
            </div>
          )}

          {tongHop && (
            <p className="text-xs text-ink-mute flex items-center gap-1.5">
              <History size={12} />
              Kỳ {dayjs(tongHop.periodFrom).format('DD/MM/YYYY')} – {dayjs(tongHop.periodTo).format('DD/MM/YYYY')}
            </p>
          )}

          <PhanTrang ds={ds} tenDonVi="khoản" idDanhSach="ds-ung-ho" />
          <ul id="ds-ung-ho" tabIndex={-1} className={`space-y-2 focus:outline-none ${ds.laDuLieuCu ? 'opacity-60' : ''}`}>
            {items.map((d) => {
              const tt = TRANG_THAI_CHUYEN[d.payoutStatus]
              return (
                <li key={d.id} className="bg-card border border-line p-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-ink text-sm font-semibold">{d.performerName}</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${tt?.mau ?? 'text-ink-soft bg-line-strong/10'}`}>
                        {tt?.chu ?? d.payoutStatus}
                      </span>
                    </div>
                    <p className="text-xs text-ink-mute mt-0.5">{d.showName}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
                      <span>Tạo {dayjs(d.createdAt).format('DD/MM/YYYY')}</span>
                      {d.paymentConfirmedAt && <span>Thanh toán {dayjs(d.paymentConfirmedAt).format('DD/MM/YYYY')}</span>}
                      {d.payoutDueAt && <span>Hạn chuyển {dayjs(d.payoutDueAt).format('DD/MM/YYYY')}</span>}
                      {d.ownerPaidAt && <span>Bạn đã chuyển {dayjs(d.ownerPaidAt).format('DD/MM/YYYY')}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-ink tabular-nums">{fmtMoney(d.gross)}</p>
                    <p className="text-xs text-ink-mute">khán giả trả</p>
                    <p className="text-xs text-ink-mute mt-1 tabular-nums">sau phí {fmtMoney(d.net)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <PhanTrang ds={ds} tenDonVi="khoản" idDanhSach="ds-ung-ho" />
        </>
      ) : (
        <>
        <PhanTrang ds={ds} tenDonVi="khoản" idDanhSach="ds-ung-ho" />
        <ul id="ds-ung-ho" tabIndex={-1} className={`space-y-3 focus:outline-none ${ds.laDuLieuCu ? 'opacity-60' : ''}`}>
          {items.map((d) => {
            const quaHan = d.payoutDueAt && dayjs(d.payoutDueAt).isBefore(dayjs())
            const sapHan = !quaHan && d.payoutDueAt && dayjs(d.payoutDueAt).diff(dayjs(), 'hour') < 24
            const chuaNhanTien = !d.payoutReceivedAt
            const dangBan = busyId === d.id

            return (
              <li key={d.id} className={`bg-card border p-5 ${quaHan ? 'border-danger/40' : 'border-line'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-ink font-bold">{d.performerName}</span>
                      {d.isAnonymous
                        ? <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs">Khán giả ẩn danh</span>
                        : d.displayName && <span className="text-xs text-ink-mute">từ {d.displayName}</span>}
                    </div>
                    <p className="text-xs text-ink-mute mt-0.5">{d.showName}</p>
                    {d.message && <p className="text-sm text-ink-soft mt-2 italic">“{d.message}”</p>}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-ink tabular-nums">{fmtMoney(d.amountToPayPerformer)}</p>
                    <p className="text-xs text-ink-mute">phải trả nghệ sĩ</p>
                    <p className="text-xs text-ink-mute mt-1 tabular-nums">
                      Khán giả trả {fmtMoney(d.gross)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                  {d.payoutReceivedAt ? (
                    <span className="text-success inline-flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Nền tảng đã chuyển tiền cho bạn {dayjs(d.payoutReceivedAt).format('DD/MM/YYYY')}
                    </span>
                  ) : (
                    <span className="text-ink-mute inline-flex items-center gap-1.5">
                      <Clock size={13} /> Nền tảng chưa chuyển tiền về cho bạn
                    </span>
                  )}

                  {/* Hạn TỰ XÁC NHẬN — chỉ có ý nghĩa ở tab đang chờ chủ xác nhận. Không hiện thì
                      chủ tưởng không bấm là không có gì xảy ra. */}
                  {tab === 'ack' && d.autoConfirmDeadline && (
                    <span className={`inline-flex items-center gap-1.5 ${
                      dayjs(d.autoConfirmDeadline).diff(dayjs(), 'hour') < 24 ? 'text-warning' : 'text-ink-mute'
                    }`}>
                      <Clock size={13} />
                      Không bấm thì hệ thống tự xác nhận lúc {dayjs(d.autoConfirmDeadline).format('HH:mm DD/MM/YYYY')}
                    </span>
                  )}

                  {d.payoutDueAt && (
                    <span className={`inline-flex items-center gap-1.5 ${quaHan ? 'text-danger' : sapHan ? 'text-warning' : 'text-ink-mute'}`}>
                      {(quaHan || sapHan) && <AlertTriangle size={13} />}
                      {quaHan ? 'Đã quá hạn chuyển cho nghệ sĩ ' : 'Hạn chuyển cho nghệ sĩ '}
                      {dayjs(d.payoutDueAt).format('HH:mm DD/MM/YYYY')}
                    </span>
                  )}
                </div>

                {quaHan && (
                  <p className="mt-2 text-xs text-danger/90 leading-relaxed">
                    Quá hạn này là căn cứ để nghệ sĩ khiếu nại và để hệ thống cảnh cáo phòng trà. Hãy chuyển tiền và xác nhận sớm.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Gỡ lời nhắn: chỉ hiện khi khoản này CÓ lời nhắn — nút không làm gì thì không bày ra */}
                  {d.message && (
                    <button onClick={() => goLoiNhan(d)} disabled={dangBan}
                      className="flex items-center gap-2 disabled:opacity-50 order-last justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp"
                      title="Ẩn lời nhắn khỏi buổi phát trực tuyến; không hoàn tiền" aria-label="Ẩn lời nhắn khỏi buổi phát trực tuyến; không hoàn tiền">
                      <EyeOff size={15} /> Gỡ lời nhắn
                    </button>
                  )}
                  {tab === 'ack' ? (
                    // 01/10/2026: ghi một dòng KHÔNG sửa được vào nhật ký bằng chứng (AcknowledgeDonationCommandHandler,
                    // VenueAcknowledged) — hỏi lại một lần, và nói điều người bấm đang cam kết.
                    <NutXacNhan onXacNhan={() => xacNhanNhan(d)} disabled={dangBan} nguyHiem={false}
                      tieuDe="Xác nhận đã nhận tiền?" nhanXacNhan="Tôi đã nhận được tiền" nhanGiu="Chưa, để kiểm tra lại"
                      noiDung="Chỉ bấm khi tiền đã về tài khoản ngân hàng của phòng trà. Lời xác nhận được ghi vào nhật ký bằng chứng công khai của khoản ủng hộ và không sửa được."
                      className="flex items-center gap-2 px-4 min-h-[44px] bg-ink text-lamp text-sm font-bold hover:bg-board disabled:opacity-50">
                      {dangBan ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      Tôi đã nhận được tiền
                    </NutXacNhan>
                  ) : (
                    <button onClick={() => setTraNgheSi(d)} disabled={dangBan || chuaNhanTien}
                      title={chuaNhanTien ? 'Nền tảng chưa chuyển tiền về cho bạn' : undefined} aria-label={chuaNhanTien ? 'Nền tảng chưa chuyển tiền về cho bạn' : undefined}
                      className="flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed justify-center min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
                      <Send size={15} /> Xác nhận đã trả nghệ sĩ
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <PhanTrang ds={ds} tenDonVi="khoản" idDanhSach="ds-ung-ho" />
        </>
      )}

      {traNgheSi && (
        <ConfirmPaidModal donation={traNgheSi} onClose={() => setTraNgheSi(null)} onSaved={load} />
      )}
    </div>
  )
}

export default OwnerDonationsPage
