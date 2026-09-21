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
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, Wallet, Landmark, Clock, CheckCircle2, ArrowRightLeft, Ticket, Heart, Info,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getMyEarnings, getMyTransactions } from '../../services/userServices'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Nhãn loại giao dịch. Giá trị gửi lên API là chữ thường; giá trị backend TRẢ VỀ trong trường
// `type` có thể khác hoa/thường, nên so sánh luôn hạ về chữ thường.
const LOAI = [
  { value: '', label: 'Tất cả' },
  { value: 'payment', label: 'Tiền vé', icon: Ticket },
  { value: 'donation', label: 'Donate (thu hộ)', icon: Heart },
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
  Released: { chu: 'Đã chuyển', mau: 'text-success bg-green-500/10' },
  Scheduled: { chu: 'Đã lên lịch', mau: 'text-warning bg-yellow-500/10' },
  PendingReview: { chu: 'Chờ xét', mau: 'text-warning bg-yellow-500/10' },
  Cancelled: { chu: 'Đã huỷ', mau: 'text-ink-soft bg-line-strong/10' },
}

const OwnerFinancePage = () => {
  const [earnings, setEarnings] = useState(null)
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loai, setLoai] = useState('')
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async () => {
    setIsLoading(true)
    // Hai nguồn độc lập: tổng hợp lỗi thì danh sách vẫn phải hiện, và ngược lại.
    const [e, t] = await Promise.allSettled([
      getMyEarnings(),
      getMyTransactions({
        type: loai || undefined,
        // Ô ngày trả về "YYYY-MM-DD"; backend nhận DateTimeOffset nên gửi nguyên chuỗi là đủ.
        from: tuNgay || undefined,
        to: denNgay || undefined,
        page,
        pageSize: 20,
      }),
    ])
    setEarnings(e.status === 'fulfilled' && e.value?.success ? e.value.data : null)
    if (t.status === 'fulfilled' && t.value?.success) {
      setRows(t.value.data?.items ?? [])
      setTotalPages(t.value.data?.totalPages ?? 1)
    } else {
      setRows([])
    }
    if (e.status !== 'fulfilled' && t.status !== 'fulfilled') {
      toast.error('Không tải được số liệu tiền.')
    }
    setIsLoading(false)
  }, [loai, tuNgay, denNgay, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // Đổi bộ lọc thì về trang 1, nếu không sẽ xin trang 5 của một danh sách chỉ còn 2 trang.
  // Đặt lại ngay trong handler chứ không trong useEffect: đặt state trong thân effect gây render
  // lặp và gọi API hai lượt cho mỗi lần đổi lọc.
  const doiLoc = (fn) => { fn(); setPage(1) }

  if (isLoading && !earnings && rows.length === 0) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1 flex items-center gap-2">
          <Wallet size={24} className="text-brand-text" /> Tiền &amp; quyết toán
        </h1>
        <p className="text-ink-soft text-sm leading-relaxed">
          Tổng quan tiền bạn được nhận, và lịch sử từng giao dịch đã đi qua phòng trà.
        </p>
      </div>

      {/* TỔNG QUAN */}
      {earnings ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-line rounded-xl p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-ink-mute">Tổng đã ghi nhận</p>
              <Wallet size={17} className="text-brand-text flex-shrink-0" />
            </div>
            <p className="text-2xl font-bold text-ink mt-1.5 tabular-nums">{fmtTien(earnings.totalEarned)}</p>
          </div>
          <div className="bg-card border border-line rounded-xl p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-ink-mute">Đã chuyển cho bạn</p>
              <CheckCircle2 size={17} className="text-success flex-shrink-0" />
            </div>
            <p className="text-2xl font-bold text-ink mt-1.5 tabular-nums">{fmtTien(earnings.completedSettlement)}</p>
          </div>
          <div className="bg-card border border-line rounded-xl p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-ink-mute">Chờ chuyển</p>
              <Clock size={17} className="text-warning flex-shrink-0" />
            </div>
            <p className="text-2xl font-bold text-ink mt-1.5 tabular-nums">{fmtTien(earnings.pendingSettlement)}</p>
            <p className="text-xs text-ink-mute mt-1.5 leading-relaxed">
              {earnings.pendingSettlementCount} đợt đã chốt nhưng chưa tới ngày chuyển.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-yellow-500/30 rounded-xl p-5">
          <p className="text-sm text-ink-soft">Không tải được phần tổng quan. Danh sách giao dịch bên dưới vẫn đúng.</p>
        </div>
      )}

      {/* QUYẾT TOÁN GẦN ĐÂY */}
      {(earnings?.recentSettlements?.length ?? 0) > 0 && (
        <div className="bg-card border border-line rounded-xl p-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Landmark size={16} /> Các đợt quyết toán gần đây
          </h2>
          <p className="text-xs text-ink-mute mt-0.5 mb-4 leading-relaxed">
            Backend trả 10 đợt gần nhất. Muốn xem đầy đủ thì lọc &quot;Quyết toán&quot; ở danh sách bên dưới.
          </p>
          <div className="space-y-2">
            {earnings.recentSettlements.map((s) => {
              const tt = TRANG_THAI_QUYET_TOAN[s.status]
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 bg-sunken/70 border border-line rounded-lg px-4 py-3">
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
      <div className="bg-card border border-line rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
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
          <div className="flex flex-wrap gap-2">
            {LOAI.map((l) => (
              <button key={l.value} onClick={() => doiLoc(() => setLoai(l.value))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  loai === l.value ? 'border-brand bg-brand/10 text-brand-text' : 'border-line text-ink-soft hover:bg-sunken'
                }`}>
                {l.label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-ink-mute block">Từ ngày</label>
            <input type="date" value={tuNgay} onChange={(e) => doiLoc(() => setTuNgay(e.target.value))}
              className="mt-1 px-3 py-1.5 bg-page border border-line rounded-lg text-sm text-ink" />
          </div>
          <div>
            <label className="text-xs text-ink-mute block">Đến ngày</label>
            <input type="date" value={denNgay} onChange={(e) => doiLoc(() => setDenNgay(e.target.value))}
              className="mt-1 px-3 py-1.5 bg-page border border-line rounded-lg text-sm text-ink" />
          </div>
          {(tuNgay || denNgay || loai) && (
            <button onClick={() => doiLoc(() => { setLoai(''); setTuNgay(''); setDenNgay('') })}
              className="px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-medium hover:bg-sunken">
              Xoá lọc
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 size={22} className="animate-spin text-brand-text" /></div>
        ) : rows.length === 0 ? (
          <p className="mt-5 text-sm text-ink-mute">Không có giao dịch nào khớp bộ lọc.</p>
        ) : (
          <div className="mt-5 divide-y divide-line">
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
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-line text-sm text-ink-soft hover:bg-sunken disabled:opacity-40">
              Trước
            </button>
            <span className="text-sm text-ink-mute">Trang {page}/{totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-line text-sm text-ink-soft hover:bg-sunken disabled:opacity-40">
              Sau
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-ink-mute leading-relaxed">
        Tiền donate hiện ở đây là tiền <strong className="text-ink-soft">thu hộ nghệ sĩ</strong>, không phải
        doanh thu của bạn. Việc chuyển tiếp cho nghệ sĩ làm ở{' '}
        <Link to="/owner/donations" className="text-brand-text hover:underline">màn Donate</Link>.
      </p>
    </div>
  )
}

export default OwnerFinancePage
