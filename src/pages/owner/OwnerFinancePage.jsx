// src/pages/owner/OwnerFinancePage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Hai endpoint, hai câu hỏi khác nhau, ĐỪNG GỘP:
//     GET /me/earnings      — "tôi được nhận bao nhiêu" (tổng hợp theo quyết toán)
//     GET /me/transactions  — "từng đồng đi qua là gì" (sổ cái hợp nhất: vé, donate, quyết toán)
// - Tiền trong `transactions` KHÔNG phải tiền vào ví: nó là các bút toán từ cùng một nguồn sổ cái.
//   Cộng cột `amount` của mọi loại lại để ra "doanh thu" là SAI — vé bán được và quyết toán đã nhận
//   là hai mặt của cùng một dòng tiền, cộng vào là đếm hai lần.
// - `type` nhận đúng ba giá trị khi lọc: payment | donation | settlement (chữ thường, theo backend).
// - Donate trong danh sách này là tiền THU HỘ nghệ sĩ, phòng trà phải chuyển tiếp — không phải
//   doanh thu của phòng trà. Màn Donate mới là nơi xử lý việc chuyển tiếp đó.
// - `pendingSettlement` là tiền đã chốt nhưng CHƯA chuyển: nằm ở trạng thái Scheduled hoặc
//   PendingReview. Không hiện nó chung một ô với tiền đã nhận.
import { parseAsString, parseAsStringLiteral } from 'nuqs'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Loader2, Wallet, Landmark, Clock, CheckCircle2, ArrowRightLeft, Ticket, Heart, Info,
} from 'lucide-react'
import dayjs from 'dayjs'
import { getMyEarnings, getMyTransactions } from '../../services/userServices'
import NhomTab from '../../components/bang/NhomTab'
import KhungTai from '../../components/bang/KhungTai'
import PhanTrang from '../../components/bang/PhanTrang'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import { useDemTab } from '../../hooks/useDemTab'
import { loiKhoangNgay } from '../../utils/boLocBuoiDien'
import OChiSo from '../../components/bang/OChiSo'
import ChonKy from '../../components/bang/ChonKy'
import NhanTrangThai from '../../components/shared/NhanTrangThai'
import { PhiThueLichChi } from '../../components/shared/DieuKhoanTien'
import HangUyTin from '../../components/owner/HangUyTin'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Nhãn loại giao dịch. Giá trị gửi lên API là chữ thường; giá trị backend TRẢ VỀ trong trường
// `type` có thể khác hoa/thường, nên so sánh luôn hạ về chữ thường.
const LOAI = [
  { value: '', label: 'Tất cả' },
  { value: 'payment', label: 'Tiền vé', icon: Ticket },
  { value: 'donation', label: 'Tiền ủng hộ (thu hộ)', icon: Heart },
  { value: 'settlement', label: 'Quyết toán', icon: Landmark },
]

const nhanLoai = (type) => LOAI.find((l) => l.value && l.value === String(type || '').toLowerCase())?.label ?? 'Giao dịch'

const iconTheoLoai = (type) => {
  const t = String(type || '').toLowerCase()
  if (t.includes('payment') || t.includes('ticket')) return Ticket
  if (t.includes('donation')) return Heart
  if (t.includes('settlement')) return Landmark
  return ArrowRightLeft
}

// MLACP-619: nhãn trạng thái vẽ bằng components/shared/NhanTrangThai — sắc thái gán theo NGHĨA (xem định nghĩa ở đó).
// "Đã lên lịch" chờ THỜI GIAN chứ không chờ ai làm gì → 'trung' (đồng hồ). "Chờ xét" chờ Admin → 'cho'.
// "Đã huỷ" = đợt bị huỷ vì đã hoàn tiền cho khách, không cần làm gì → 'tat'.
const TRANG_THAI_QUYET_TOAN = {
  Released: { chu: 'Đã chuyển', sacThai: 'tot' },
  Scheduled: { chu: 'Đã lên lịch', sacThai: 'trung', icon: Clock },
  PendingReview: { chu: 'Chờ xét', sacThai: 'cho' },
  Cancelled: { chu: 'Đã huỷ', sacThai: 'tat' },
}

// DANH SÁCH GIAO DỊCH (01/10/2026): chuyển sang hooks/useDanhSachMayChu — loại, từ ngày, đến ngày và trang nằm trên URL
// (?loai=…&tu=…&den=…&trang=…), đổi lọc về trang 1, PhanTrang thay hai nút Trước/Sau. Lỗi tải danh sách nay báo "chưa tải
// được" — bản cũ vẽ "Không có giao dịch nào khớp bộ lọc" (nói sai khi mất mạng). Tổng quan tải riêng (useQuery), lỗi thì
// báo kèm Thử lại; danh sách vẫn dùng được và ngược lại.
const BO_LOC = {
  loai: parseAsStringLiteral(LOAI.map((l) => l.value).filter(Boolean)),
  tu: parseAsString.withDefault(''),
  den: parseAsString.withDefault(''),
}
// Ô ngày trả về "YYYY-MM-DD"; backend nhận DateTimeOffset nên gửi nguyên chuỗi là đủ.
// "Từ" sau "Đến" (gõ tay hoặc sửa địa chỉ) thì KHÔNG gửi khoảng ngày — gửi đi là nhận về danh sách rỗng trông như "không có
// giao dịch"; giao diện báo lỗi ngay dưới hai ô (rà soát 03/10: bản trước im lặng).
const goiGiaoDich = ({ loai, tu, den, ...q }) => {
  const sai = Boolean(loiKhoangNgay({ tu, den }))
  return getMyTransactions({ ...q, type: loai || undefined, from: (!sai && tu) || undefined, to: (!sai && den) || undefined })
}

const OwnerFinancePage = () => {
  const tongQuan = useQuery({
    queryKey: ['thu-nhap-cua-toi'],
    queryFn: async () => { const r = await getMyEarnings(); if (!r?.success) throw new Error('earnings'); return r.data },
  })
  const earnings = tongQuan.data ?? null
  const ds = useDanhSachMayChu({ khoa: ['giao-dich-cua-toi'], goi: goiGiaoDich, boLoc: BO_LOC })
  const { loai, tu: tuNgay, den: denNgay } = ds.boLoc
  const rows = ds.items
  // MLACP-685: số trên từng loại khoản — CÙNG khoảng ngày đang lọc (đổi ngày thì số đổi theo, khoá truy vấn mang ngày).
  const dem = useDemTab(`giao-dich-${tuNgay}-${denNgay}`, Object.fromEntries(LOAI.map((l) =>
    [l.value, () => goiGiaoDich({ loai: l.value, tu: tuNgay, den: denNgay, page: 1, pageSize: 1 })])))
  const coLoc = Boolean(loai || tuNgay || denNgay)
  const loiNgay = loiKhoangNgay({ tu: tuNgay, den: denNgay })

  if (tongQuan.isPending && ds.dangTai) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-ink mb-1">Tiền và quyết toán</h1>
        <p className="text-ink-soft text-sm leading-relaxed">
          Tổng quan tiền bạn được nhận, và lịch sử từng giao dịch đã đi qua phòng trà.
        </p>
      </div>

      {/* TỔNG QUAN */}
      {earnings ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <OChiSo nhan="Tổng đã ghi nhận" so={fmtTien(earnings.totalEarned)} icon={Wallet} />
          <OChiSo nhan="Đã chuyển cho bạn" so={fmtTien(earnings.completedSettlement)} icon={CheckCircle2} />
          <OChiSo nhan="Chờ chuyển" so={fmtTien(earnings.pendingSettlement)} icon={Clock}
            phu={`${earnings.pendingSettlementCount} đợt đã chốt nhưng chưa tới ngày chuyển.`} />
        </div>
      ) : tongQuan.isPending ? (
        <div className="h-28 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải tổng quan tiền" />
      ) : (
        <KhungTai loi tenVung="phần tổng quan (danh sách giao dịch bên dưới vẫn đúng)" taiLai={tongQuan.refetch} />
      )}

      {/* MLACP-671: hạng uy tín — quyết định phần tiền vé chuyển trước ở đợt 1. */}
      {earnings && <HangUyTin standings={earnings.standings} loungeNames={earnings.loungeNames} />}

      {/* MLACP-626: luật chia tiền và lịch chi, bằng số đang áp dụng — trước đây trang chỉ hiện kết quả, không nói luật. */}
      <PhiThueLichChi />

      {/* QUYẾT TOÁN GẦN ĐÂY */}
      {(earnings?.recentSettlements?.length ?? 0) > 0 && (
        <div className="bg-card border border-line p-6">
          <h2 className="font-sans font-bold text-base text-ink flex items-center gap-2">
            <Landmark size={16} /> Các đợt quyết toán gần đây
          </h2>
          <p className="text-xs text-ink-mute mt-0.5 mb-4 leading-relaxed">
            Đây là 10 đợt gần nhất. Muốn xem đầy đủ thì lọc &quot;Quyết toán&quot; ở danh sách bên dưới.
          </p>
          <div className="space-y-2">
            {earnings.recentSettlements.map((s) => {
              // MLACP-662: còn yêu cầu hoàn tiền chờ xử lý thì job giải ngân GIỮ khoản này — không ghi "Đã lên lịch / dự kiến chuyển".
              const tt = s.heldForRefund ? { chu: 'Đang giữ — chờ xử lý hoàn tiền', sacThai: 'cho' } : TRANG_THAI_QUYET_TOAN[s.status]
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 bg-sunken border border-line px-4 py-3">
                  {/* MLACP-658: `title` nói khoản này là tiền gì (vé buổi nào, đợt nào, mấy vé / ủng hộ nghệ sĩ nào). Bản cũ chỉ
                      có số tiền và ngày — chủ phòng trà không biết khoản nào của buổi nào. Backend cũ chưa có thì bỏ trống dòng. */}
                  <div className="min-w-0">
                    {s.title && <p className="text-sm text-ink">{s.title}</p>}
                    <p className="text-sm text-ink tabular-nums font-semibold mt-0.5">{fmtTien(s.amount)}</p>
                    <p className="text-xs text-ink-mute mt-0.5">
                      {s.heldForRefund
                        ? 'Khách đang được hoàn tiền. Khoản này chỉ chuyển sau khi yêu cầu hoàn được xử lý, và trừ phần đã hoàn.'
                        : <>{s.status === 'Scheduled' && !s.paidAt ? 'Dự kiến chuyển' : 'Lên lịch'} {dayjs(s.scheduledAt).format('DD/MM/YYYY')}
                          {s.paidAt && ` · đã chuyển ${dayjs(s.paidAt).format('DD/MM/YYYY')}`}</>}
                    </p>
                  </div>
                  <NhanTrangThai sacThai={tt?.sacThai ?? 'trung'} icon={tt?.icon} className="flex-shrink-0">{tt?.chu ?? s.status}</NhanTrangThai>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LỊCH SỬ GIAO DỊCH */}
      <div className="bg-card border border-line p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-sans font-bold text-base text-ink flex items-center gap-2">
            <ArrowRightLeft size={16} /> Lịch sử giao dịch
          </h2>
        </div>

        <p className="text-xs text-ink-mute mt-2 flex items-start gap-1.5 leading-relaxed">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          Đây là các bút toán từ cùng một nguồn sổ cái, KHÔNG phải tiền vào ví. Cộng hết các loại lại
          để tính doanh thu là đếm hai lần — tiền vé và quyết toán là hai mặt của cùng một dòng tiền.
        </p>

        {/* BỘ LỌC */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <NhomTab nhan="Lọc theo loại khoản" dangChon={loai ?? ''} cacTab={LOAI.map((l) => ({ khoa: l.value, nhan: l.label, dem: dem[l.value] }))}
            onChon={(v) => ds.datBoLoc({ loai: v || null })} />
          {/* MLACP-612: một bộ chọn khoảng ngày dùng chung cả web (components/bang/ChonKy — Radix Popover + react-day-picker)
              thay cho hai ô <input type="date"> của trình duyệt: hai ô gốc hiện định dạng theo ngôn ngữ MÁY (yyyy-mm-dd
              trên máy đặt tiếng Anh) và bắt chọn hai lần. URL gõ tay sai khoảng vẫn được báo ở dòng lỗi bên dưới. */}
          <ChonKy coTheBoTrong tenLoc="Ngày giao dịch"
            tu={tuNgay && denNgay && !loiNgay ? tuNgay : undefined} den={tuNgay && denNgay && !loiNgay ? denNgay : undefined}
            onChon={(k) => ds.datBoLoc({ tu: k?.tu ?? null, den: k?.den ?? null })} />
          {coLoc && (
            <button type="button" onClick={() => ds.xoaBoLoc()}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              Xoá lọc
            </button>
          )}
        </div>
        {loiNgay && <p id="loi-ngay-tai-chinh" role="alert" className="mt-2 text-sm font-semibold text-danger">{loiNgay} Danh sách đang hiện mọi ngày.</p>}

        <div className="mt-5">
        <KhungTai dangTai={ds.dangTai} loi={ds.loi} taiLai={ds.taiLai} tenVung="danh sách giao dịch" rong={rows.length === 0}
          noiDungRong={coLoc ? 'Không có giao dịch nào khớp bộ lọc. Bỏ bớt bộ lọc để xem thêm.' : 'Chưa có giao dịch nào đi qua phòng trà.'}>
          <PhanTrang ds={ds} tenDonVi="giao dịch" idDanhSach="ds-giao-dich" className="mb-3" />
          <div id="ds-giao-dich" tabIndex={-1} className={`divide-y divide-line focus:outline-none ${ds.laDuLieuCu ? 'opacity-60' : ''}`}>
            {rows.map((r) => {
              const Icon = iconTheoLoai(r.type)
              return (
                <div key={`${r.type}-${r.id}`} className="py-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon size={15} className="text-ink-mute mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      {/* MLACP-655: `title` là câu tiếng Việt backend dựng (loại tiền, đợt, buổi diễn, nghệ sĩ). `description`
                          là chú thích nội bộ của sổ cái ("Settlement #<mã> payout") và mã tham chiếu là GUID — chủ phòng trà
                          không đọc được, nên không in nữa (chủ dự án 05/10/2026: "xem không hiểu gì cả"). Backend cũ chưa
                          có `title` thì rơi về nhãn loại, không in chuỗi nội bộ. */}
                      <p className="text-sm text-ink">{r.title || nhanLoai(r.type)}</p>
                      <p className="text-xs text-ink-mute mt-0.5">
                        {dayjs(r.createdAt).format('HH:mm DD/MM/YYYY')}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-ink tabular-nums flex-shrink-0">{fmtTien(r.amount)}</p>
                </div>
              )
            })}
          </div>

        {ds.soTrang > 1 && <PhanTrang ds={ds} tenDonVi="giao dịch" idDanhSach="ds-giao-dich" className="mt-3" />}
        </KhungTai>
        </div>
      </div>

      <p className="text-xs text-ink-mute leading-relaxed">
        Tiền ủng hộ hiện ở đây là tiền <strong className="text-ink-soft">thu hộ nghệ sĩ</strong>, không phải
        doanh thu của bạn. Việc chuyển tiếp cho nghệ sĩ làm ở{' '}
        <Link to="/owner/donations" className="text-ink hover:underline">mục Tiền ủng hộ nghệ sĩ</Link>.
      </p>
    </div>
  )
}

export default OwnerFinancePage
