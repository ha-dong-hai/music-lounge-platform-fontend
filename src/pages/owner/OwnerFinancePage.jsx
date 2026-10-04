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
import { loiKhoangNgay } from '../../utils/boLocBuoiDien'
import OChiSo from '../../components/bang/OChiSo'
import ChonKy from '../../components/bang/ChonKy'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Nhãn loại giao dịch. Giá trị gửi lên API là chữ thường; giá trị backend TRẢ VỀ trong trường
// `type` có thể khác hoa/thường, nên so sánh luôn hạ về chữ thường.
const LOAI = [
  { value: '', label: 'Tất cả' },
  { value: 'payment', label: 'Tiền vé', icon: Ticket },
  { value: 'donation', label: 'Tiền ủng hộ (thu hộ)', icon: Heart },
  { value: 'settlement', label: 'Quyết toán', icon: Landmark },
]

const iconTheoLoai = (type) => {
  const t = String(type || '').toLowerCase()
  if (t.includes('payment') || t.includes('ticket')) return Ticket
  if (t.includes('donation')) return Heart
  if (t.includes('settlement')) return Landmark
  return ArrowRightLeft
}

const TRANG_THAI_QUYET_TOAN = {
  Released: { chu: 'Đã chuyển', mau: 'text-success bg-success/10' },
  Scheduled: { chu: 'Đã lên lịch', mau: 'text-warning bg-warning/10' },
  PendingReview: { chu: 'Chờ xét', mau: 'text-warning bg-warning/10' },
  Cancelled: { chu: 'Đã huỷ', mau: 'text-ink-soft bg-line-strong/10' },
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
              const tt = TRANG_THAI_QUYET_TOAN[s.status]
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 bg-sunken/70 border border-line px-4 py-3">
                  <div>
                    <p className="text-sm text-ink tabular-nums">{fmtTien(s.amount)}</p>
                    <p className="text-xs text-ink-mute mt-0.5">
                      Lên lịch {dayjs(s.scheduledAt).format('DD/MM/YYYY')}
                      {s.paidAt && ` · đã chuyển ${dayjs(s.paidAt).format('DD/MM/YYYY')}`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0 ${tt?.mau ?? 'text-ink-soft bg-line-strong/10'}`}>
                    {tt?.chu ?? s.status}
                  </span>
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
          <NhomTab nhan="Lọc theo loại khoản" dangChon={loai ?? ''} cacTab={LOAI.map((l) => ({ khoa: l.value, nhan: l.label }))}
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
                      <p className="text-sm text-ink">{r.description || r.type}</p>
                      <p className="text-xs text-ink-mute mt-0.5 break-all">
                        {dayjs(r.createdAt).format('HH:mm DD/MM/YYYY')}
                        {r.referenceId && ` · ${r.referenceId}`}
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
