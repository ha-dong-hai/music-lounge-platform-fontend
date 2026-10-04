// src/pages/owner/OwnerFnbOrdersPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Màn của NHÂN VIÊN phục vụ/bếp. Đổi trạng thái đơn và thu tiền đều là RequireVenueOperator, nên
//   nhân viên dùng được — đặt ngoài nhóm route chỉ dành cho chủ.
// - `status` và `isPaid` là HAI CHUYỆN KHÁC NHAU (MLACP-349). Đơn trả trước qua VNPay vẫn nằm ở
//   Pending/Preparing cho tới khi phục vụ xong, nên KHÔNG được suy ra "đã trả tiền" từ status, và
//   ngược lại. Màn này hiện hai thứ đó tách biệt.
// - `onlinePaymentLiveUntil`: khách đang giữ một liên kết VNPay còn trả được tới thời điểm đó. Trong
//   lúc đó backend TỪ CHỐI thu tiền mặt và từ chối huỷ đơn — nếu không nói lý do thì nhân viên sẽ
//   tưởng hệ thống hỏng. Hai nút liên quan bị khoá kèm giải thích cho tới khi hết hạn.
// - Luồng trạng thái: Pending → Preparing → Served → Paid (backend chỉ cho đi tuần tự, không lùi),
//   Cancelled là huỷ đơn. Bước Served → Paid là ĐÓNG ĐƠN: chưa trả thì backend ghi nhận luôn khoản
//   tiền mặt (UpdateFnbOrderStatusCommandHandler tạo Payment Cash); đã trả online thì chỉ đóng đơn.
// - LỖI ĐÃ SỬA (đo 30/09): nút "Thu tiền" trước đây gọi POST /fnb-orders/{id}/pay — endpoint đó là
//   KHÁCH tự khởi tạo thanh toán VNPay cho đơn của chính mình, nhân viên gọi luôn nhận 403. Và bảng
//   bước kế thiếu Served → Paid, trong khi nút thu tiền ẩn khi đơn đã trả online — nên đơn trả trước
//   nằm ở "Đã phục vụ" mãi, không đóng được.
// - DANH SÁCH (01/10/2026): bản cũ lấy 100 đơn rồi lọc "Đang xử lý" trên trình duyệt — quá 100 đơn là đơn cũ biến mất
//   mà không báo. Nay dùng hooks/useDanhSachMayChu (TanStack Query + nuqs): mỗi tab là MỘT trạng thái lọc phía máy chủ
//   (backend GET /fnb-orders chỉ nhận một `status` — GetFnbOrdersQueryHandler.cs:39-53, nên không gộp được 3 trạng thái),
//   phân trang thật, tab + trang nằm trên URL, tự tải lại mỗi 30 giây để bếp thấy đơn mới.
//   GIỚI HẠN: backend trả MỚI NHẤT TRƯỚC; bếp cần cũ trước nên trang được sắp lại cũ-trước — chỉ đúng trong một trang.
//   Tab "Chờ làm" mặc định 50 đơn/trang nên hiếm khi vượt; vượt thì đơn cũ nhất nằm ở trang cuối. Đường nâng cấp: backend
//   thêm `sort=oldest` cho endpoint này.
import { useState, useEffect, useCallback } from 'react'
import { parseAsStringLiteral } from 'nuqs'
import { Loader2, RefreshCw, UtensilsCrossed, Banknote, CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getLounges, getLoungeDetail } from '../../services/loungeServices'
import { useAuthStore } from '../../store/useAuthStore'
import { getLoungeFnbOrders, updateFnbOrderStatus } from '../../services/fnbServices'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import NutXacNhan from '../../components/shared/NutXacNhan'
import NhomTab from '../../components/bang/NhomTab'
import { maNgan } from '../../utils/format'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const STATUS_VIEW = {
  Pending: { label: 'Chờ làm', cls: 'bg-warning/10 text-warning border-warning/30' },
  Preparing: { label: 'Đang làm', cls: 'bg-ink/10 text-ink border-ink/30' },
  Served: { label: 'Đã phục vụ', cls: 'bg-success/10 text-success border-success/30' },
  Paid: { label: 'Đã thanh toán', cls: 'bg-line-strong/10 text-ink-soft border-line-strong/30' },
  Cancelled: { label: 'Đã huỷ', cls: 'bg-danger/10 text-danger border-danger/30' },
}

// Bước tiếp theo hợp lệ của bếp. Không có đường lùi — backend cũng không cho.
const BUOC_TIEP = { Pending: 'Preparing', Preparing: 'Served', Served: 'Paid' }
const nhanBuocTiep = (buoc, daTra) =>
  buoc === 'Paid' ? (daTra ? 'Đóng đơn' : 'Thu tiền mặt và đóng đơn')
    : buoc === 'Served' ? 'Đã phục vụ xong' : 'Bắt đầu làm'
const TEN_PHUONG_THUC = { Cash: 'Tiền mặt', Gateway: 'Online (VNPay)' }

// Mỗi tab = một trạng thái lọc phía máy chủ. 'TatCa' không gửi `status`.
const TAB = [
  { key: 'Pending', label: 'Chờ làm' },
  { key: 'Preparing', label: 'Đang làm' },
  { key: 'Served', label: 'Đã phục vụ' },
  { key: 'Paid', label: 'Đã thanh toán' },
  { key: 'Cancelled', label: 'Đã huỷ' },
  { key: 'TatCa', label: 'Tất cả' },
]
const BO_LOC = { tab: parseAsStringLiteral(TAB.map((t) => t.key)).withDefault('Pending') }
// Hàng chờ của bếp đọc cũ-trước; lịch sử (đã thanh toán, đã huỷ, tất cả) đọc mới-trước như backend trả.
const BEP = ['Pending', 'Preparing', 'Served']

const OwnerFnbOrdersPage = () => {
  const [lounge, setLounge] = useState(null)
  const [daTaiPhongTra, setDaTaiPhongTra] = useState(false)
  const [busyId, setBusyId] = useState(null)

  // Nhân viên KHÔNG sở hữu phòng trà nào, nên GET /lounges?mine=true trả rỗng và màn này từng báo
  // "Chưa có phòng trà nào để nhận đơn" với chính người đứng bếp (đo 30/09). Phòng trà nhân viên vận
  // hành nằm trong phiên đăng nhập (AuthResultDto.loungeId) — dùng nó; chủ phòng trà vẫn đi đường mine.
  const loungeIdPhien = useAuthStore((st) => st.user?.loungeId)
  const loadLounge = useCallback(async () => {
    try {
      if (loungeIdPhien) {
        const res = await getLoungeDetail(loungeIdPhien)
        if (res.success) setLounge(res.data ?? null)
        return
      }
      const res = await getLounges({ mine: true })
      if (res.success) {
        const items = Array.isArray(res.data) ? res.data : res.data?.items
        setLounge(items?.[0] ?? null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được thông tin phòng trà.')
    } finally {
      setDaTaiPhongTra(true)
    }
  }, [loungeIdPhien])

  const ds = useDanhSachMayChu({
    khoa: ['don-mon', lounge?.id],
    goi: ({ tab, ...p }) => getLoungeFnbOrders(lounge.id, { ...p, status: tab === 'TatCa' ? undefined : tab }),
    boLoc: BO_LOC,
    coMacDinh: 50,
    batDau: Boolean(lounge),
    lamMoiMoi: 30_000,
  })
  const tab = ds.boLoc.tab
  const hienThi = BEP.includes(tab) ? [...ds.items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) /* MLACP-516: id GUID không trừ được — đơn cũ lên trước theo giờ đặt */ : ds.items

  useEffect(() => { const chay = async () => { await loadLounge() }; chay() }, [loadLounge])

  const doiTrangThai = async (order, status) => {
    setBusyId(order.id)
    try {
      await updateFnbOrderStatus(order.id, status)
      toast.success(`Đã chuyển đơn #${maNgan(order.id)} sang “${TAB.find((t) => t.key === status)?.label ?? status}”.`)
      await ds.taiLai()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không cập nhật được đơn.')
    } finally {
      setBusyId(null)
    }
  }

  if (!daTaiPhongTra || (lounge && ds.dangTai)) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
  }

  if (!lounge) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl text-ink mb-1">Đơn gọi món</h1>
        <div className="mt-4 bg-card border border-line p-6">
          <p className="text-sm text-ink-soft">Chưa có phòng trà nào để nhận đơn.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl text-ink mb-1">Đơn gọi món</h1>
          <p className="text-ink-soft text-sm">Đơn khách đặt tại bàn. Trạng thái bếp và việc thu tiền là hai việc tách nhau.</p>
        </div>
        <button type="button" onClick={() => ds.taiLai()} disabled={ds.dangTaiLai}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink text-sm font-semibold hover:bg-ink hover:text-lamp disabled:opacity-50">
          <RefreshCw size={15} className={ds.dangTaiLai ? 'animate-spin' : ''} aria-hidden="true" /> Tải lại
        </button>
      </div>

      <NhomTab nhan="Lọc đơn theo trạng thái" dangChon={tab} cacTab={TAB.map((t) => ({ khoa: t.key, nhan: t.label }))}
        onChon={(k) => ds.datBoLoc({ tab: k })} />

      {/* MLACP-604: danh sách rỗng thì chỉ khung bên dưới báo (có tên mục đang lọc) — trước đây dòng phân trang cũng in
          "Không có đơn nào" ngay phía trên, hai câu cùng một ý. */}
      {(ds.tong > 0 || ds.dangTai) && <PhanTrang ds={ds} tenDonVi="đơn" idDanhSach="ds-don-mon" />}

      {ds.loi ? (
        <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
          <p>Danh sách đơn chưa tải được.</p>
          <button type="button" onClick={() => ds.taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
        </div>
      ) : hienThi.length === 0 ? (
        <div className="bg-card border border-line p-10 text-center">
          <UtensilsCrossed size={28} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">Không có đơn nào ở mục “{TAB.find((t) => t.key === tab)?.label}”.</p>
        </div>
      ) : (
        <div id="ds-don-mon" tabIndex={-1} className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 focus:outline-none ${ds.laDuLieuCu ? 'opacity-60' : ''}`}>
          {hienThi.map((o) => {
            const tt = STATUS_VIEW[o.status] ?? { label: o.status, cls: 'bg-line-strong/10 text-ink-soft border-line-strong/30' }
            const buocTiep = BUOC_TIEP[o.status]
            // Liên kết VNPay còn sống: backend chặn thu tiền mặt và chặn huỷ cho tới lúc đó.
            const conLinkOnline = o.onlinePaymentLiveUntil && dayjs(o.onlinePaymentLiveUntil).isAfter(dayjs())
            const dangBan = busyId === o.id

            return (
              <div key={o.id} className="bg-card border border-line p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-ink font-bold">#{maNgan(o.id)}</p>
                    <p className="text-xs text-ink-mute mt-0.5">
                      {o.tableNote ? `Bàn: ${o.tableNote}` : 'Không ghi bàn'} · {dayjs(o.createdAt).format('HH:mm DD/MM')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${tt.cls}`}>
                    {tt.label}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 flex-1">
                  {o.items.map((it) => (
                    <li key={it.id} className={`flex justify-between text-sm gap-3 ${it.cancelled ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-ink-soft min-w-0">
                        <span className="text-ink-mute tabular-nums">{it.quantity}×</span> {it.menuItemName}
                        {it.note && <span className="block text-xs text-ink-mute">{it.note}</span>}
                      </span>
                      <span className="text-ink-soft tabular-nums flex-shrink-0">{fmtMoney(it.unitPrice * it.quantity)}</span>
                    </li>
                  ))}
                </ul>

                {o.note && <p className="mt-2 text-xs text-ink-mute italic">Ghi chú: {o.note}</p>}

                <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                  <span className="text-sm text-ink-soft">Tổng</span>
                  <span className="text-ink font-bold tabular-nums">{fmtMoney(o.totalAmount)}</span>
                </div>

                {/* Trả tiền hay chưa là thông tin RIÊNG, không suy ra từ trạng thái bếp */}
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {o.isPaid ? (
                    <span className="inline-flex items-center gap-1.5 text-success"><CheckCircle2 size={13} /> Khách đã trả tiền</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-warning"><Clock size={13} /> Chưa thu tiền</span>
                  )}
                  <span className="text-ink-mute">·</span>
                  <span className="text-ink-mute">{TEN_PHUONG_THUC[o.paymentMethod] ?? o.paymentMethod}</span>
                </div>

                {conLinkOnline && (
                  <p className="mt-2 text-xs text-ink/90 flex items-start gap-1.5 leading-relaxed">
                    <CreditCard size={13} className="mt-px flex-shrink-0" />
                    Khách đang giữ liên kết thanh toán online (còn hạn tới {dayjs(o.onlinePaymentLiveUntil).format('HH:mm')}).
                    Trong lúc này hệ thống không cho thu tiền mặt và không cho huỷ đơn.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {buocTiep && (() => {
                    // Thu tiền mặt bị backend chặn khi khách còn liên kết VNPay sống; đã trả online thì đóng đơn được.
                    const khoaThuTien = buocTiep === 'Paid' && !o.isPaid && conLinkOnline
                    return (
                      <button onClick={() => doiTrangThai(o, buocTiep)} disabled={dangBan || khoaThuTien}
                        title={khoaThuTien ? 'Khách đang có liên kết thanh toán online còn hạn' : undefined} aria-label={khoaThuTien ? 'Khách đang có liên kết thanh toán online còn hạn' : undefined}
                        className="flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed justify-center min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
                        {dangBan ? <Loader2 size={13} className="animate-spin" />
                          : buocTiep === 'Paid' ? <Banknote size={13} /> : <UtensilsCrossed size={13} />}
                        {nhanBuocTiep(buocTiep, o.isPaid)}
                      </button>
                    )
                  })()}
                  {o.status !== 'Cancelled' && o.status !== 'Paid' && (
                    // Huỷ là trạng thái cuối (không lùi được); đơn đã trả online thì backend tạo yêu cầu hoàn 100%
                    // (UpdateFnbOrderStatusCommandHandler, MLACP-351) — hỏi lại và nói đúng hậu quả.
                    <NutXacNhan onXacNhan={() => doiTrangThai(o, 'Cancelled')} disabled={dangBan || conLinkOnline}
                      tieuDe={`Huỷ đơn #${maNgan(o.id)}?`} nhanXacNhan="Huỷ đơn" nhanGiu="Không, giữ đơn"
                      noiDung={o.isPaid
                        ? 'Khách đã trả tiền online cho đơn này: hệ thống tạo yêu cầu hoàn 100% và báo cho khách. Không hoàn tác được.'
                        : 'Đơn chuyển sang Đã huỷ và khách được báo. Không hoàn tác được.'}
                      title={conLinkOnline ? 'Không huỷ được khi khách còn liên kết thanh toán online' : undefined}
                      aria-label={conLinkOnline ? 'Không huỷ được khi khách còn liên kết thanh toán online' : `Huỷ đơn #${maNgan(o.id)}`}
                      className="flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink/40 text-ink-soft text-sm font-semibold hover:border-danger hover:text-danger disabled:opacity-40 disabled:cursor-not-allowed">
                      <XCircle size={14} aria-hidden="true" /> Huỷ đơn
                    </NutXacNhan>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {ds.soTrang > 1 && <PhanTrang ds={ds} tenDonVi="đơn" idDanhSach="ds-don-mon" />}
    </div>
  )
}

export default OwnerFnbOrdersPage
