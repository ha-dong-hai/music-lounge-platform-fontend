// src/pages/public/PerformerDonationsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — ĐÂY LÀ TRANG MINH BẠCH, KHÔNG PHẢI TRANG THỐNG KÊ:
// - Không cần đăng nhập. Người vào đây là khán giả đã tặng tiền, muốn biết tiền đã tới nghệ sĩ chưa.
//   Vì vậy thứ tự ưu tiên là: tiền đang nằm ở đâu → khoản nào quá hạn → rồi mới tới tổng số.
// - Tiền đi QUA HAI CHẶNG: khán giả → nền tảng → phòng trà → nghệ sĩ. `stage` cho biết đang ở chặng
//   nào; DÙNG `stageLabel` để hiện (backend trả sẵn tiếng Việt), dùng `stage` để so sánh trong code.
// - Trừ `totalGross`, MỌI SỐ TIỀN trong summary là PHẦN CỦA NGHỆ SĨ, chia theo nơi tiền đang nằm.
//   Đừng cộng totalGross với các số còn lại — hai đơn vị khác nhau, cộng vào là ra số vô nghĩa.
// - `policy.statements` là các câu đã soạn sẵn kèm số phần trăm CỦA CHÍNH KHOẢN ĐANG ÁP DỤNG. Hiện
//   nguyên văn, KHÔNG tự tính lại từ `performerShareRate` — tỉ lệ có thể đã đổi sau các khoản cũ.
// - `performerShareRate` / `platformCommissionRate` là PHÂN SỐ (0.88 = 88%), không phải phần trăm.
// - `gross` có thể null ở dữ liệu cũ không công khai số tiền. `donationsWithHiddenAmount` cho biết có
//   bao nhiêu khoản như vậy — phải hiện con số đó, nếu không người xem tưởng tổng bị tính sai.
// - Trang này KHÔNG BAO GIỜ có số tài khoản, mã chuyển khoản hay ảnh chứng từ. `hasTransferReceipt`
//   chỉ nói là CÓ chứng từ được lưu. Đừng thêm gì vào đây mà backend không công khai.
// - Nút "Nhật ký bằng chứng" chỉ hiện với Admin và gọi endpoint riêng của Admin. Ẩn nút không phải
//   là bảo mật — backend vẫn chặn 403 — nhưng hiện nút cho người không bấm được là vô nghĩa.
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Loader2, ArrowLeft, Heart, Landmark, Building2, AlertTriangle, CheckCircle2, XCircle,
  Clock, FileCheck2, ShieldCheck, X, Link2Off,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getPerformerPublicDonations, getPerformerDonationSummary } from '../../services/donationServices'
import { getDonationEvidence } from '../../services/adminServices'
import { useAuthStore } from '../../store/useAuthStore'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const fmtPhanTram = (r) => `${(Number(r || 0) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`

// Màu theo chặng: xám = còn trên đường, xanh = nghệ sĩ đã xác nhận nhận được, đỏ = nghệ sĩ nói chưa.
const MAU_CHANG = {
  PlatformHolding: 'text-ink-soft bg-line/40',
  VenueHolding: 'text-sky-700 bg-blue-500/10',
  VenueReportedPaid: 'text-warning bg-yellow-500/10',
  PerformerConfirmed: 'text-success bg-green-500/10',
  PerformerDisputed: 'text-danger bg-red-500/10',
}

const OCard = ({ title, value, note, icon: Icon, color }) => (
  <div className="bg-card border border-line rounded-xl p-5">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-ink-mute">{title}</p>
      <Icon size={18} className={`flex-shrink-0 ${color}`} />
    </div>
    <p className="text-xl font-bold text-ink mt-1.5 tabular-nums">{value}</p>
    {note && <p className="text-xs text-ink-mute mt-2 leading-relaxed">{note}</p>}
  </div>
)

// ===== NHẬT KÝ BẰNG CHỨNG (CHỈ ADMIN) =====
// Chuỗi băm nối tiếp: mỗi dòng băm cả dòng trước. `chainIntact = false` nghĩa là có dòng bị sửa,
// bị xoá hoặc bị chèn sau khi ghi — đây là thứ dùng khi nghệ sĩ và phòng trà nói khác nhau về
// việc đã chuyển tiền chưa, nên khi chuỗi đứt thì phải nói thẳng và nói rõ đứt từ dòng nào.
const EvidenceModal = ({ donationId, onClose }) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const chay = async () => {
      setIsLoading(true)
      try {
        const res = await getDonationEvidence(donationId)
        if (res.success) setData(res.data)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không tải được nhật ký bằng chứng.')
      } finally {
        setIsLoading(false)
      }
    }
    chay()
  }, [donationId])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex-none flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">Nhật ký bằng chứng · khoản #{donationId}</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isLoading ? (
            <div className="py-14 flex justify-center"><Loader2 size={26} className="animate-spin text-brand-text" /></div>
          ) : !data ? (
            <p className="text-sm text-ink-mute">Không có dữ liệu.</p>
          ) : (
            <>
              {data.chainIntact ? (
                <div className="flex items-start gap-2 p-4 rounded-lg border border-green-500/25 bg-green-500/5">
                  <ShieldCheck size={18} className="text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-ink-soft leading-relaxed">
                    Chuỗi bằng chứng còn nguyên: không dòng nào bị sửa, xoá hay chèn thêm sau khi ghi.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                  <Link2Off size={18} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-ink font-medium">Chuỗi bằng chứng bị đứt</p>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                      Có dòng đã bị sửa, bị xoá hoặc bị chèn thêm sau khi ghi
                      {data.firstBrokenSequence != null && ` — lệch từ dòng #${data.firstBrokenSequence}`}.
                      Nhật ký này không còn dùng làm bằng chứng được; cần điều tra ở tầng dữ liệu.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {(data.events ?? []).map((e) => {
                  const dongLoi = data.firstBrokenSequence != null && e.sequence >= data.firstBrokenSequence
                  return (
                    <div key={e.sequence}
                      className={`p-4 rounded-lg border ${dongLoi ? 'border-red-500/30 bg-red-500/5' : 'border-line bg-sunken/70'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-ink-mute font-mono flex-shrink-0">#{e.sequence}</span>
                          <p className="text-sm text-ink font-medium">{e.eventType}</p>
                        </div>
                        <p className="text-xs text-ink-mute flex-shrink-0">
                          {dayjs(e.occurredAt).format('HH:mm:ss DD/MM/YYYY')}
                        </p>
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        {e.amount != null && (
                          <p className="text-ink-soft">Số tiền: <span className="text-ink tabular-nums">{fmtTien(e.amount)}</span></p>
                        )}
                        {e.actorUserId != null && (
                          <p className="text-ink-soft">Người thực hiện: <span className="text-ink-soft">#{e.actorUserId}</span></p>
                        )}
                        {e.reference && (
                          <p className="text-ink-soft break-all">Mã tham chiếu: <span className="text-ink-soft font-mono">{e.reference}</span></p>
                        )}
                        {e.evidenceUrl && (
                          <a href={e.evidenceUrl} target="_blank" rel="noreferrer"
                            className="text-brand-text hover:underline inline-flex items-center gap-1">
                            <FileCheck2 size={12} /> Xem chứng từ
                          </a>
                        )}
                      </div>

                      {e.detail && <p className="text-xs text-ink-mute mt-2 leading-relaxed">{e.detail}</p>}

                      {/* Băm hiện dạng rút gọn: đủ để đối chiếu mắt thường, không làm ngập giao diện. */}
                      <p className="text-xs text-ink-mute mt-2 font-mono break-all" title={e.hash}>
                        hash {String(e.hash).slice(0, 16)}…
                        {e.previousHash && <> · prev {String(e.previousHash).slice(0, 16)}…</>}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const PerformerDonationsPage = () => {
  const { performerId } = useParams()
  const role = useAuthStore((s) => s.user?.role)
  const laAdmin = role === 'Admin'

  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [evidenceId, setEvidenceId] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    // Hai nguồn độc lập: sao kê tổng hợp lỗi thì bảng chi tiết vẫn phải hiện, và ngược lại.
    const [tong, ds] = await Promise.allSettled([
      getPerformerDonationSummary(performerId),
      getPerformerPublicDonations(performerId, { page, pageSize: 20 }),
    ])
    setSummary(tong.status === 'fulfilled' && tong.value?.success ? tong.value.data : null)
    if (ds.status === 'fulfilled' && ds.value?.success) {
      setRows(ds.value.data?.items ?? [])
      setTotalPages(ds.value.data?.totalPages ?? 1)
    } else {
      setRows([])
    }
    if (tong.status !== 'fulfilled' && ds.status !== 'fulfilled') {
      toast.error('Không tải được sao kê donate.')
    }
    setIsLoading(false)
  }, [performerId, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-text" />
      </div>
    )
  }

  const chuaToiNgheSi = summary
    ? Number(summary.heldByPlatform || 0) + Number(summary.heldByVenue || 0)
    : 0

  return (
    <div className="min-h-screen bg-page text-ink pb-20">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-brand-text mb-6">
          <ArrowLeft size={18} /> Về trang chủ
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Heart size={26} className="text-brand-text" />
          <h1 className="text-2xl font-bold">
            Sao kê donate {summary?.performerName ? `· ${summary.performerName}` : ''}
          </h1>
        </div>
        <p className="text-sm text-ink-mute leading-relaxed mb-8">
          Tiền donate đi qua hai chặng: nền tảng thu, chuyển cho phòng trà, rồi phòng trà chuyển cho
          nghệ sĩ. Trang này cho biết từng khoản đang ở chặng nào. Không hiển thị số tài khoản, mã
          chuyển khoản hay ảnh chứng từ.
        </p>

        {!summary ? (
          <div className="bg-card border border-yellow-500/30 rounded-xl p-6 flex items-start gap-3 mb-6">
            <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink-soft leading-relaxed">
              Không tải được phần tổng hợp. Bảng chi tiết bên dưới (nếu có) vẫn đúng.
            </p>
          </div>
        ) : (
          <>
            {/* TIỀN ĐANG Ở ĐÂU — thứ người xem cần biết trước tiên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <OCard title="Nghệ sĩ đã xác nhận nhận được" value={fmtTien(summary.confirmedByPerformer)}
                icon={CheckCircle2} color="text-success"
                note="Nghệ sĩ tự bấm xác nhận, không phải phòng trà khai." />
              <OCard title="Nền tảng còn giữ" value={fmtTien(summary.heldByPlatform)}
                icon={Landmark} color="text-ink-soft"
                note="Chưa tới kỳ chuyển cho phòng trà." />
              <OCard title="Phòng trà còn giữ" value={fmtTien(summary.heldByVenue)}
                icon={Building2} color="text-sky-700"
                note={`Hạn chuyển cho nghệ sĩ: ${summary.policy?.venuePayoutDays ?? '—'} ngày.`} />
              <OCard title="Quá hạn tại phòng trà" value={fmtTien(summary.overdueAtVenue)}
                icon={AlertTriangle} color={summary.overdueCount > 0 ? 'text-danger' : 'text-ink-mute'}
                note={summary.overdueCount > 0
                  ? `${summary.overdueCount} khoản đã quá hạn mà chưa báo chuyển.`
                  : 'Không có khoản nào quá hạn.'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-card border border-line rounded-xl p-5">
                <p className="text-sm text-ink-mute">Tổng khán giả đã tặng</p>
                <p className="text-xl font-bold text-ink mt-1.5 tabular-nums">{fmtTien(summary.totalGross)}</p>
                <p className="text-xs text-ink-mute mt-2 leading-relaxed">
                  {summary.donationCount} khoản. Đây là số khán giả trả, chưa trừ phí và thuế — các số
                  khác trên trang là phần của nghệ sĩ.
                  {summary.donationsWithHiddenAmount > 0 && (
                    <> Có {summary.donationsWithHiddenAmount} khoản cũ không công khai số tiền nên không
                    được cộng vào.</>
                  )}
                </p>
              </div>
              <div className="bg-card border border-line rounded-xl p-5">
                <p className="text-sm text-ink-mute">Phần của nghệ sĩ</p>
                <p className="text-xl font-bold text-brand-text mt-1.5 tabular-nums">{fmtTien(summary.totalForPerformer)}</p>
                <p className="text-xs text-ink-mute mt-2 leading-relaxed">
                  Chưa tới tay nghệ sĩ: {fmtTien(chuaToiNgheSi)}.
                  {summary.paidLateCount > 0 && ` Có ${summary.paidLateCount} khoản được chuyển sau hạn.`}
                </p>
              </div>
              <div className="bg-card border border-line rounded-xl p-5">
                <p className="text-sm text-ink-mute">Nghệ sĩ nói chưa nhận được</p>
                <p className={`text-xl font-bold mt-1.5 tabular-nums ${Number(summary.disputedByPerformer) > 0 ? 'text-danger' : 'text-ink'}`}>
                  {fmtTien(summary.disputedByPerformer)}
                </p>
                <p className="text-xs text-ink-mute mt-2 leading-relaxed">
                  Phòng trà đã báo đã chuyển nhưng nghệ sĩ phản hồi là chưa nhận được.
                </p>
              </div>
            </div>

            {/* CHÍNH SÁCH — hiện nguyên văn câu backend soạn, không tự tính lại */}
            {summary.policy && (
              <div className="bg-card border border-line rounded-xl p-6 mt-4">
                <h2 className="text-base font-semibold text-ink">Chính sách đang áp dụng</h2>
                <ul className="mt-3 space-y-2">
                  {(summary.policy.statements ?? []).map((c, i) => (
                    <li key={i} className="text-sm text-ink-soft leading-relaxed flex items-start gap-2">
                      <span className="text-ink-mute mt-1.5">•</span>{c}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-line flex flex-wrap gap-x-8 gap-y-2 text-xs text-ink-mute">
                  <span>Nghệ sĩ nhận: <span className="text-ink-soft">{fmtPhanTram(summary.policy.performerShareRate)}</span></span>
                  <span>Phí nền tảng: <span className="text-ink-soft">{fmtPhanTram(summary.policy.platformCommissionRate)}</span></span>
                  <span>Hạn phòng trà chuyển: <span className="text-ink-soft">{summary.policy.venuePayoutDays} ngày</span></span>
                  <span>Nhắc trước hạn: <span className="text-ink-soft">{summary.policy.venueWarningDays} ngày</span></span>
                  <span>
                    Hoàn tiền donate: <span className="text-ink-soft">{summary.policy.refundable ? 'có' : 'không'}</span>
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* TỪNG KHOẢN */}
        <h2 className="text-base font-semibold text-ink mt-8 mb-3">Từng khoản donate</h2>

        {rows.length === 0 ? (
          <div className="bg-card border border-line rounded-xl p-10 text-center">
            <p className="text-sm text-ink-mute">Chưa có khoản donate nào được công khai.</p>
          </div>
        ) : (
          <div className="bg-card border border-line rounded-xl divide-y divide-line">
            {rows.map((d) => (
              <div key={d.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${MAU_CHANG[d.stage] ?? 'text-ink-soft bg-line/40'}`}>
                        {d.stageLabel}
                      </span>
                      {d.overdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-danger text-xs font-medium">
                          <AlertTriangle size={11} /> Quá hạn
                        </span>
                      )}
                      {d.paidLate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 text-warning text-xs">
                          <Clock size={11} /> Chuyển sau hạn
                        </span>
                      )}
                      {d.hasTransferReceipt && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs"
                          title="Có chứng từ được lưu; bản thân chứng từ không công khai">
                          <FileCheck2 size={11} /> Có chứng từ
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-ink mt-2">{d.showName}</p>
                    <p className="text-xs text-ink-mute mt-0.5">
                      {d.venueName} · {dayjs(d.showDate).format('DD/MM/YYYY')} · từ{' '}
                      {d.donorDisplayName || 'người tặng ẩn danh'}
                    </p>
                    {d.message && (
                      <p className="text-sm text-ink-soft mt-2 italic border-l-2 border-line pl-3 leading-relaxed">
                        “{d.message}”
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    {/* gross null = khoản cũ không công khai số tiền, nói rõ thay vì hiện 0đ */}
                    <p className="text-lg font-bold text-ink tabular-nums">
                      {d.gross != null ? fmtTien(d.gross) : <span className="text-sm text-ink-mute font-normal">không công khai số tiền</span>}
                    </p>
                    {d.performerAmount != null && (
                      <p className="text-xs text-ink-mute mt-0.5">
                        nghệ sĩ nhận <span className="text-brand-text tabular-nums">{fmtTien(d.performerAmount)}</span>
                      </p>
                    )}
                    {laAdmin && (
                      <button onClick={() => setEvidenceId(d.id)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                        <ShieldCheck size={13} /> Nhật ký bằng chứng
                      </button>
                    )}
                  </div>
                </div>

                {/* DÒNG THỜI GIAN CỦA MỘT KHOẢN — mốc nào chưa có thì không hiện, không hiện "—" */}
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-mute">
                  {d.paidAt && <span>Thanh toán {dayjs(d.paidAt).format('DD/MM/YYYY')}</span>}
                  {d.platformPaidVenueAt && <span>Nền tảng chuyển phòng trà {dayjs(d.platformPaidVenueAt).format('DD/MM/YYYY')}</span>}
                  {d.venueAcknowledgedAt && (
                    <span>
                      Phòng trà xác nhận {dayjs(d.venueAcknowledgedAt).format('DD/MM/YYYY')}
                      {d.venueAcknowledgedAutomatically && ' (tự động)'}
                    </span>
                  )}
                  {d.payoutDueAt && <span>Hạn chuyển nghệ sĩ {dayjs(d.payoutDueAt).format('DD/MM/YYYY')}</span>}
                  {d.venueReportedPaidAt && <span>Phòng trà báo đã chuyển {dayjs(d.venueReportedPaidAt).format('DD/MM/YYYY')}</span>}
                  {d.performerRespondedAt && (
                    <span className="inline-flex items-center gap-1">
                      {d.performerResponse === 'Confirmed'
                        ? <CheckCircle2 size={11} className="text-success" />
                        : <XCircle size={11} className="text-danger" />}
                      Nghệ sĩ phản hồi {dayjs(d.performerRespondedAt).format('DD/MM/YYYY')}
                    </span>
                  )}
                  {d.performerAskedToConfirm && !d.performerRespondedAt && (
                    <span className="text-warning/80">Đang chờ nghệ sĩ xác nhận</span>
                  )}
                </div>
              </div>
            ))}
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

      {evidenceId != null && (
        <EvidenceModal donationId={evidenceId} onClose={() => setEvidenceId(null)} />
      )}
    </div>
  )
}

export default PerformerDonationsPage
