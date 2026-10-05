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
//
// LÀM LẠI 30/09/2026 (thế giới "tờ chương trình"):
// - Bảy thẻ số rời thay bằng MỘT BẢNG "tiền đang ở đâu": ba dòng chính cộng ra dòng tổng, dòng "trong đó" thụt vào,
//   số canh phải — đọc như một tờ sao kê. Số "khán giả đã tặng" (khác đơn vị) tách ra ngoài bảng.
// - Nhãn chặng dùng NhanTrangThai (biểu tượng + chữ, không chỉ màu — WCAG 2.2 SC 1.4.1).
// - Tải hỏng cả hai nguồn là một trạng thái riêng có nút thử lại (bản cũ: một toast rồi in "Chưa có khoản nào" — nói sai).
// - Nhật ký bằng chứng mở trong <dialog> của trình duyệt (giữ focus, Esc đóng) thay cho lớp phủ tự vẽ.
// - Chữ "donate" đổi thành "tiền ủng hộ": trang cho khán giả Việt, backend chưa có i18n.
import { useBieuPhi } from '../../hooks/useBieuPhi'
import { chiaUngHo, dong, phanTram } from '../../utils/bieuPhi'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, XCircle, Clock, FileCheck2, ShieldCheck, Link2Off, RefreshCw, X } from 'lucide-react'
import { getPerformerPublicDonations, getPerformerDonationSummary } from '../../services/donationServices'
import { getDonationEvidence } from '../../services/adminServices'
import { useAuthStore } from '../../store/useAuthStore'
import NhanTrangThai from '../../components/shared/NhanTrangThai'
import { ngayDayDu, gioTrongNgay } from '../../utils/ngayVietNam'
import { maNgan } from '../../utils/format'
import LienKetMuiTen from '../../components/shared/LienKetMuiTen'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`
const NUT_VIEN = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink'

// Sắc thái theo chặng: còn trên đường = chờ, nghệ sĩ đã xác nhận = tốt, nghệ sĩ nói chưa nhận = xấu.
const SAC_THAI_CHANG = {
  PlatformHolding: 'cho',
  VenueHolding: 'cho',
  VenueReportedPaid: 'trung',
  PerformerConfirmed: 'tot',
  PerformerDisputed: 'xau',
}

// ===== NHẬT KÝ BẰNG CHỨNG (CHỈ ADMIN) =====
// Chuỗi băm nối tiếp: mỗi dòng băm cả dòng trước. `chainIntact = false` nghĩa là có dòng bị sửa,
// bị xoá hoặc bị chèn sau khi ghi — đây là thứ dùng khi nghệ sĩ và phòng trà nói khác nhau về
// việc đã chuyển tiền chưa, nên khi chuỗi đứt thì phải nói thẳng và nói rõ đứt từ dòng nào.
const HopNhatKy = ({ donationId, onClose }) => {
  const ref = useRef(null)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loi, setLoi] = useState(null)

  useEffect(() => { ref.current?.showModal() }, [])

  useEffect(() => {
    const chay = async () => {
      setIsLoading(true)
      try {
        const res = await getDonationEvidence(donationId)
        if (!res.success) throw new Error('nhat-ky')
        setData(res.data)
      } catch (err) {
        setLoi(err.response?.data?.message || 'Nhật ký bằng chứng chưa tải được.')
      } finally {
        setIsLoading(false)
      }
    }
    chay()
  }, [donationId])

  return (
    <dialog ref={ref} aria-labelledby="nhat-ky-td" onClose={onClose}
      className="bg-card text-ink border-2 border-ink shadow-lift w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] p-0 m-auto backdrop:bg-board/80">
      <div className="sticky top-0 bg-card flex items-start justify-between gap-4 p-5 border-b-2 border-ink">
        <h2 id="nhat-ky-td" className="text-3xl">Nhật ký bằng chứng · khoản #{maNgan(donationId)}</h2>
        <button type="button" autoFocus onClick={() => ref.current?.close()} aria-label="Đóng nhật ký"
          className="inline-flex items-center justify-center w-11 h-11 border-2 border-ink hover:bg-ink hover:text-lamp flex-shrink-0">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="h-40 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải nhật ký" />
        ) : loi ? (
          <p role="alert">{loi}</p>
        ) : (
          <>
            {data.chainIntact ? (
              <p className="flex items-start gap-2 p-4 border-2 border-success">
                <ShieldCheck size={18} className="text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                Chuỗi bằng chứng còn nguyên: không dòng nào bị sửa, xoá hay chèn thêm sau khi ghi.
              </p>
            ) : (
              <div className="flex items-start gap-2 p-4 border-2 border-danger">
                <Link2Off size={18} className="text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Chuỗi bằng chứng bị đứt</p>
                  <p className="text-ink-soft mt-1">
                    Có dòng đã bị sửa, bị xoá hoặc bị chèn thêm sau khi ghi
                    {data.firstBrokenSequence != null && ` — lệch từ dòng #${data.firstBrokenSequence}`}.
                    Nhật ký này không còn dùng làm bằng chứng được; cần điều tra ở tầng dữ liệu.
                  </p>
                </div>
              </div>
            )}

            <ol className="mt-4 border-y-2 border-ink divide-y divide-ink/20">
              {(data.events ?? []).map((e) => {
                const dongLoi = data.firstBrokenSequence != null && e.sequence >= data.firstBrokenSequence
                return (
                  <li key={e.sequence} className={`py-4 ${dongLoi ? 'border-l-4 border-danger pl-3' : ''}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold"><span className="font-mono text-sm text-ink-mute mr-2">#{e.sequence}</span>{e.eventType}</p>
                      <p className="font-mono text-sm text-ink-mute">{gioTrongNgay(e.occurredAt)} · {ngayDayDu(e.occurredAt)}</p>
                    </div>
                    <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                      {e.amount != null && <><dt className="text-ink-mute">Số tiền</dt><dd className="font-mono">{fmtTien(e.amount)}</dd></>}
                      {e.actorUserId != null && <><dt className="text-ink-mute">Người thực hiện</dt><dd className="font-mono">#{maNgan(e.actorUserId)}</dd></>}
                      {e.reference && <><dt className="text-ink-mute">Mã tham chiếu</dt><dd className="font-mono break-all">{e.reference}</dd></>}
                      {e.evidenceUrl && (
                        <><dt className="text-ink-mute">Chứng từ</dt><dd>
                          <LienKetMuiTen href={e.evidenceUrl} nho>Xem chứng từ</LienKetMuiTen>
                        </dd></>
                      )}
                    </dl>
                    {e.detail && <p className="text-sm text-ink-soft mt-2">{e.detail}</p>}
                    {/* Băm hiện dạng rút gọn: đủ để đối chiếu mắt thường, không làm ngập giao diện. */}
                    <p className="text-xs text-ink-mute mt-2 font-mono break-all" title={e.hash}>
                      hash {String(e.hash).slice(0, 16)}…
                      {e.previousHash && <> · prev {String(e.previousHash).slice(0, 16)}…</>}
                    </p>
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </div>
    </dialog>
  )
}

// MLACP-661 (chủ dự án 05/10/2026: "minh bạch mỗi khoản trừ trên tiền ủng hộ… rõ ràng, ngắn gọn, đủ"). Một khoản ủng hộ được
// chia thế nào — số của CHÍNH khoản đó. Thiếu một phần (khoản cũ trước khi có bản ghi thanh toán) thì chỉ in phần nghệ sĩ.
const ChiaKhoan = ({ d }) => {
  const du = [d.gross, d.platformFee, d.taxWithheld, d.venueRetained, d.performerAmount].every((v) => v != null)
  if (!du) {
    return d.performerAmount != null
      ? <p className="text-sm text-ink-mute mt-0.5">nghệ sĩ nhận <span className="font-mono text-ink">{fmtTien(d.performerAmount)}</span></p>
      : null
  }
  const dong4 = [
    ['Phí nền tảng', d.platformFee],
    ['Thuế khấu trừ', d.taxWithheld],
    ['Phòng trà giữ lại', d.venueRetained],
  ].filter(([, v]) => Number(v) > 0)
  return (
    <dl className="mt-1 grid grid-cols-[auto_auto] justify-end gap-x-3 text-sm">
      {dong4.map(([nhan, v]) => (
        <div key={nhan} className="contents">
          <dt className="text-ink-mute">{nhan}</dt><dd className="font-mono text-ink-soft text-right">−{fmtTien(v)}</dd>
        </div>
      ))}
      <dt className="font-semibold border-t border-ink/30 pt-0.5">Nghệ sĩ nhận</dt>
      <dd className="font-mono font-semibold border-t border-ink/30 pt-0.5 text-right">{fmtTien(d.performerAmount)}</dd>
    </dl>
  )
}

// Mỗi 100.000đ ủng hộ (mức đang áp dụng cho khoản MỚI) được chia thế nào. Chưa tải được biểu phí thì không in số.
const ViDuChia = () => {
  const { data } = useBieuPhi()
  if (!data) return null
  const dk = data.donation
  const c = chiaUngHo(dk, 100000)
  const hang = [
    ['Nghệ sĩ nhận', dk.performerShareRate, c.ngheSi, true],
    ['Phí nền tảng', dk.platformCommissionRate, c.phi],
    ['Thuế GTGT khấu trừ', dk.vatRate, c.gtgt],
    ['Thuế TNCN khấu trừ', dk.personalIncomeTaxRate, c.tncn],
    ['Phòng trà giữ lại', dk.venueShareRate, c.phongTra],
  ].filter(([, , v]) => v > 0)
  return (
    <div className="mt-4 max-w-md">
      <p className="font-semibold">Mỗi {dong(c.tong)} ủng hộ được chia:</p>
      <dl className="mt-2 grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 text-sm">
        {hang.map(([nhan, r, v, dam]) => (
          <div key={nhan} className="contents">
            <dt className={dam ? 'font-semibold' : 'text-ink-soft'}>{nhan}</dt>
            <dd className="font-mono text-ink-mute text-right">{phanTram(r)}</dd>
            <dd className={`font-mono text-right ${dam ? 'font-semibold' : ''}`}>{dong(v)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-ink-soft">Thuế chỉ khấu trừ khi phòng trà là hộ hoặc cá nhân kinh doanh; phòng trà là doanh nghiệp tự kê khai thuế nên giữ luôn phần đó. Tỉ lệ được chốt lúc thanh toán thành công.</p>
    </div>
  )
}

const PerformerDonationsPage = () => {
  const { performerId } = useParams()
  const role = useAuthStore((s) => s.user?.role)
  const laAdmin = role === 'Admin'
  // Cùng truy vấn với ViDuChia (react-query dùng chung bộ nhớ đệm) — có biểu phí thì ví dụ bằng tiền thay câu chia tiền chung.
  const coBieuPhi = Boolean(useBieuPhi().data)

  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [loiDs, setLoiDs] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [evidenceId, setEvidenceId] = useState(null)
  const [capNhatLuc, setCapNhatLuc] = useState(null)

  // `im = true` là làm mới NGẦM: giữ nguyên nội dung đang hiển thị thay vì thay cả trang bằng khung
  // chờ. Bắt buộc phải tách như vậy, nếu không cứ 45 giây trang lại nháy trắng một lần dưới tay
  // người đang đọc — vừa khó chịu vừa làm mất chỗ họ đang cuộn tới.
  const load = useCallback(async (im = false) => {
    if (!im) setIsLoading(true)
    // Hai nguồn độc lập: sao kê tổng hợp lỗi thì bảng chi tiết vẫn phải hiện, và ngược lại.
    const [tong, ds] = await Promise.allSettled([
      getPerformerDonationSummary(performerId),
      getPerformerPublicDonations(performerId, { page, pageSize: 20 }),
    ])
    const tongOk = tong.status === 'fulfilled' && tong.value?.success
    const dsOk = ds.status === 'fulfilled' && ds.value?.success
    // Làm mới ngầm mà hỏng thì GIỮ số đang hiện: mốc "Cập nhật lúc" đứng yên là tín hiệu số liệu đang cũ dần.
    if (tongOk) setSummary(tong.value.data)
    else if (!im) setSummary(null)
    if (dsOk) {
      setRows(ds.value.data?.items ?? [])
      setTotalPages(ds.value.data?.totalPages ?? 1)
      setLoiDs(false)
    } else if (!im) {
      setRows([])
      setLoiDs(true)
    }
    if (tongOk || dsOk) setCapNhatLuc(new Date())
    if (!im) setIsLoading(false)
  }, [performerId, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // TỰ LÀM MỚI — và vì sao KHÔNG phải là "thời gian thực".
  // Cập nhật đẩy thật sẽ phải đi qua SignalR, nhưng `LivestreamHub.cs:15` gắn `[Authorize]`: người
  // chưa đăng nhập KHÔNG kết nối được, mà đây lại đúng là trang cho người chưa đăng nhập. Nên cách
  // trung thực nhất hiện có là hỏi lại máy chủ theo chu kỳ và NÓI RÕ số liệu cũ tới mức nào bằng
  // mốc "Cập nhật lúc" — thay vì gắn nhãn "realtime" cho một thứ không phải vậy.
  // Dừng hẳn khi tab bị ẩn: không ai đang đọc thì hỏi máy chủ chỉ tốn pin và băng thông.
  useEffect(() => {
    const dinhKy = setInterval(() => {
      if (!document.hidden) load(true)
    }, 45000)
    // Quay lại tab thì làm mới ngay, khỏi phải chờ hết một chu kỳ.
    const khiHien = () => { if (!document.hidden) load(true) }
    document.addEventListener('visibilitychange', khiHien)
    return () => {
      clearInterval(dinhKy)
      document.removeEventListener('visibilitychange', khiHien)
    }
  }, [load])

  if (isLoading) {
    return <div className="min-h-[70vh] bg-stock" aria-busy="true" aria-label="Đang tải sao kê"><div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10"><div className="h-80 bg-ink/5 animate-pulse" /></div></div>
  }

  if (!summary && loiDs) {
    return (
      <div className="min-h-[70vh] bg-stock text-ink flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl mb-4">Sao kê chưa tải được.</h1>
        <button type="button" onClick={() => load()} className={NUT_VIEN}>Thử lại</button>
      </div>
    )
  }

  const chuaToiNgheSi = summary ? Number(summary.heldByPlatform || 0) + Number(summary.heldByVenue || 0) : 0
  const coQuaHan = (summary?.overdueCount ?? 0) > 0
  const coTranhChap = Number(summary?.disputedByPerformer || 0) > 0

  return (
    <div className="min-h-[70vh] bg-stock text-ink pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10">
        <p className="text-ink-soft">
          <LienKetMuiTen to={`/performers/${performerId}`} lui nho>
            {summary?.performerName ? `Trang nghệ sĩ ${summary.performerName}` : 'Trang nghệ sĩ'}
          </LienKetMuiTen>
        </p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] mt-2">
          Sao kê tiền ủng hộ{summary?.performerName ? <><br /><span className="text-ink-soft">{summary.performerName}</span></> : null}
        </h1>
        <p className="mt-4 max-w-[65ch] text-lg text-ink-soft leading-relaxed">
          Tiền ủng hộ đi qua hai chặng: nền tảng thu, chuyển cho phòng trà, rồi phòng trà chuyển cho nghệ sĩ. Trang này
          cho biết từng khoản đang ở chặng nào. Không hiển thị số tài khoản, mã chuyển khoản hay ảnh chứng từ.{' '}
          <Link to="/minh-bach" className="text-ink underline underline-offset-4">Cách tiền đi qua từng chặng</Link>.
        </p>

        {/* Mốc cập nhật — nói thẳng số liệu cũ tới đâu (lý do ở khối tự làm mới phía trên). */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5">
          <p className="font-mono text-sm text-ink-mute" aria-live="polite">
            {capNhatLuc ? `Cập nhật lúc ${gioTrongNgay(capNhatLuc)}:${String(capNhatLuc.getSeconds()).padStart(2, '0')} · tự làm mới mỗi 45 giây` : 'Đang chờ số liệu…'}
          </p>
          <button type="button" onClick={() => load(true)} className="inline-flex items-center gap-1.5 min-h-[44px] px-1 font-semibold hover:text-ink-soft">
            <RefreshCw size={15} aria-hidden="true" /> Làm mới ngay
          </button>
        </div>

        {!summary ? (
          <p role="alert" className="mt-8 flex items-start gap-2 border-2 border-warning p-5">
            <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
            Phần tổng hợp chưa tải được. Danh sách từng khoản bên dưới vẫn đúng.
          </p>
        ) : (
          <>
            {/* TIỀN ĐANG Ở ĐÂU — cùng một đơn vị (phần của nghệ sĩ), nên đặt chung một bảng có dòng tổng. */}
            <section aria-labelledby="dang-o-dau-td" className="mt-10">
              <h2 id="dang-o-dau-td" className="text-4xl">Phần của nghệ sĩ đang ở đâu</h2>
              <table className="mt-4 w-full border-y-2 border-ink">
                <caption className="sr-only">Phần tiền của nghệ sĩ, chia theo nơi tiền đang nằm</caption>
                {/* Ba dòng chính chia HẾT phần của nghệ sĩ theo chặng (PublicDonationStatement.Summarize: PlatformHolding,
                    VenueHolding, và VenueReportedPaidAt != null gồm cả ba chặng VenueReportedPaid/PerformerConfirmed/
                    PerformerDisputed) nên cộng lại ra dòng tổng. Dòng "trong đó" thụt vào là TẬP CON của dòng ngay trên:
                    quá hạn chỉ xảy ra khi phòng trà còn giữ (overdue = !reportedPaid && now > dueAt). Bản cũ đặt năm số
                    ngang hàng và bỏ sót nhóm "đã báo chuyển, chờ nghệ sĩ xác nhận" — cộng lại không ra tổng. */}
                <tbody className="divide-y divide-ink/20">
                  <tr>
                    <th scope="row" className="py-3 pr-4 text-left font-normal">
                      Nền tảng còn giữ
                      <span className="block text-sm text-ink-mute">Chưa tới kỳ chuyển cho phòng trà.</span>
                    </th>
                    <td className="py-3 text-right font-mono whitespace-nowrap">{fmtTien(summary.heldByPlatform)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-3 pr-4 text-left font-normal">
                      Phòng trà còn giữ
                      <span className="block text-sm text-ink-mute">Hạn chuyển cho nghệ sĩ: {summary.policy?.venuePayoutDays ?? '—'} ngày.</span>
                    </th>
                    <td className="py-3 text-right font-mono whitespace-nowrap">{fmtTien(summary.heldByVenue)}</td>
                  </tr>
                  <tr className={`text-sm ${coQuaHan ? 'text-danger' : 'text-ink-soft'}`}>
                    <th scope="row" className="py-2 pl-6 pr-4 text-left font-normal">
                      <span className="inline-flex items-center gap-1.5">{coQuaHan && <AlertTriangle size={15} aria-hidden="true" />}Trong đó đã quá hạn</span>
                      <span className="block text-ink-mute">{coQuaHan ? `${summary.overdueCount} khoản đã quá hạn mà phòng trà chưa báo chuyển.` : 'Không có khoản nào quá hạn.'}</span>
                    </th>
                    <td className="py-2 text-right font-mono whitespace-nowrap">{fmtTien(summary.overdueAtVenue)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-3 pr-4 text-left font-normal">
                      Phòng trà báo đã chuyển cho nghệ sĩ
                      <span className="block text-sm text-ink-mute">Là lời khai của phòng trà. Chỉ nghệ sĩ mới xác nhận được là đã nhận.</span>
                    </th>
                    <td className="py-3 text-right font-mono whitespace-nowrap">{fmtTien(summary.reportedPaidToPerformer)}</td>
                  </tr>
                  <tr className="text-sm text-ink-soft">
                    <th scope="row" className="py-2 pl-6 pr-4 text-left font-normal">
                      Trong đó nghệ sĩ đã xác nhận nhận được
                      <span className="block text-ink-mute">Nghệ sĩ tự bấm xác nhận.</span>
                    </th>
                    <td className="py-2 text-right font-mono whitespace-nowrap">{fmtTien(summary.confirmedByPerformer)}</td>
                  </tr>
                  <tr className={`text-sm ${coTranhChap ? 'text-danger' : 'text-ink-soft'}`}>
                    <th scope="row" className="py-2 pl-6 pr-4 text-left font-normal">
                      Trong đó nghệ sĩ báo chưa nhận được
                      <span className="block text-ink-mute">Đã mở khiếu nại.</span>
                    </th>
                    <td className="py-2 text-right font-mono whitespace-nowrap">{fmtTien(summary.disputedByPerformer)}</td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-ink">
                  <tr>
                    <th scope="row" className="py-3 pr-4 text-left">
                      Tổng phần của nghệ sĩ
                      <span className="block text-sm font-normal text-ink-mute">
                        Chưa tới tay nghệ sĩ: {fmtTien(chuaToiNgheSi)}.{summary.paidLateCount > 0 && ` Có ${summary.paidLateCount} khoản được chuyển sau hạn.`}
                      </span>
                    </th>
                    <td className="py-3 text-right font-mono font-semibold whitespace-nowrap">{fmtTien(summary.totalForPerformer)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Khác đơn vị (tiền khán giả trả, chưa trừ phí và thuế) — tách ra ngoài bảng để không ai cộng lẫn. */}
              <p className="mt-5 max-w-[65ch] text-ink-soft">
                Khán giả đã tặng tổng cộng <span className="font-mono text-ink">{fmtTien(summary.totalGross)}</span> qua {summary.donationCount} khoản.
                Đây là số khán giả trả, chưa trừ phí và thuế.
                {summary.donationsWithHiddenAmount > 0 && <> Có {summary.donationsWithHiddenAmount} khoản cũ không công khai số tiền nên không được cộng vào.</>}
              </p>
            </section>

            {/* CHÍNH SÁCH — hiện nguyên văn câu backend soạn, không tự tính lại */}
            {summary.policy && (
              <section aria-labelledby="chinh-sach-td" className="mt-10">
                <h2 id="chinh-sach-td" className="text-4xl">Chính sách đang áp dụng</h2>
                {/* MLACP-661: một ví dụ bằng tiền thay dãy phần trăm rời — câu "phần còn lại gồm phí, thuế theo loại hình và phần
                    phòng trà giữ lại" không cho người đọc biết mỗi phần bao nhiêu. Số đọc từ biểu phí máy chủ (useBieuPhi).
                    Có ví dụ thì bỏ câu chia tiền chung chung của backend (bắt đầu "Nghệ sĩ nhận …") — mọi ý của nó đã nằm trong
                    bảng; câu đó vẫn giữ ở backend cho bản web khác đang đọc. Backend đổi câu thì chỉ hiện thừa, không mất ý. */}
                <ViDuChia />
                <ul className="mt-4 max-w-[65ch] list-disc pl-5 space-y-2 text-ink-soft">
                  {(summary.policy.statements ?? [])
                    .filter((c) => !(coBieuPhi && c.startsWith('Nghệ sĩ nhận')))
                    .map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </section>
            )}
          </>
        )}

        {/* TỪNG KHOẢN */}
        <section aria-labelledby="tung-khoan-td" className="mt-12">
          <h2 id="tung-khoan-td" className="text-4xl mb-4">Từng khoản ủng hộ</h2>

          {loiDs ? (
            <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
              <p>Danh sách từng khoản chưa tải được.</p>
              <button type="button" onClick={() => load()} className={NUT_VIEN}>Thử lại</button>
            </div>
          ) : rows.length === 0 ? (
            <p className="border-2 border-ink p-6">Chưa có khoản ủng hộ nào được công khai.</p>
          ) : (
            <ol className="border-y-2 border-ink divide-y divide-ink/20">
              {rows.map((d) => (
                <li key={d.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <NhanTrangThai sacThai={SAC_THAI_CHANG[d.stage] ?? 'trung'}>{d.stageLabel}</NhanTrangThai>
                        {d.overdue && <NhanTrangThai sacThai="xau" icon={AlertTriangle}>Quá hạn</NhanTrangThai>}
                        {d.paidLate && <NhanTrangThai sacThai="cho">Chuyển sau hạn</NhanTrangThai>}
                        {/* Chỉ nói là CÓ chứng từ được lưu; bản thân chứng từ không công khai. */}
                        {d.hasTransferReceipt && <NhanTrangThai sacThai="trung" icon={FileCheck2}>Có chứng từ</NhanTrangThai>}
                      </div>
                      <p className="font-display text-2xl leading-tight mt-2 break-words">{d.showName}</p>
                      <p className="text-ink-soft mt-0.5">
                        {d.venueName} · <span className="font-mono text-sm">{ngayDayDu(d.showDate)}</span> · từ {d.donorDisplayName || 'người tặng ẩn danh'}
                      </p>
                      {d.message && (
                        <blockquote className="mt-2 border-l-2 border-ink pl-3 italic text-ink-soft break-words">“{d.message}”</blockquote>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      {/* gross null = khoản cũ không công khai số tiền, nói rõ thay vì hiện 0 đ */}
                      {d.gross != null
                        ? <p className="font-mono text-lg">{fmtTien(d.gross)}</p>
                        : <p className="text-sm text-ink-mute">Không công khai số tiền</p>}
                      {/* MLACP-661: chia đủ từng phần của chính khoản này (số backend chốt lúc VNPay xác nhận) — bản cũ chỉ in
                          "nghệ sĩ nhận", phần chênh không ai giải thích. Năm dòng cộng đúng bằng số khán giả trả. */}
                      <ChiaKhoan d={d} />
                      {laAdmin && (
                        <button type="button" onClick={() => setEvidenceId(d.id)} className={`${NUT_VIEN} mt-2 text-sm`}>
                          <ShieldCheck size={15} aria-hidden="true" /> Nhật ký bằng chứng
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DÒNG THỜI GIAN CỦA MỘT KHOẢN — mốc nào chưa có thì không hiện, không hiện "—" */}
                  <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-mute" aria-label={`Các mốc của khoản #${maNgan(d.id)}`}>
                    {d.paidAt && <li>Thanh toán {ngayDayDu(d.paidAt)}</li>}
                    {d.platformPaidVenueAt && <li>Nền tảng chuyển phòng trà {ngayDayDu(d.platformPaidVenueAt)}</li>}
                    {d.venueAcknowledgedAt && <li>Phòng trà xác nhận {ngayDayDu(d.venueAcknowledgedAt)}{d.venueAcknowledgedAutomatically && ' (tự động)'}</li>}
                    {d.payoutDueAt && <li>Hạn chuyển nghệ sĩ {ngayDayDu(d.payoutDueAt)}</li>}
                    {d.venueReportedPaidAt && <li>Phòng trà báo đã chuyển {ngayDayDu(d.venueReportedPaidAt)}</li>}
                    {d.performerRespondedAt && (
                      <li className="inline-flex items-center gap-1">
                        {d.performerResponse === 'Confirmed'
                          ? <CheckCircle2 size={14} className="text-success" aria-hidden="true" />
                          : <XCircle size={14} className="text-danger" aria-hidden="true" />}
                        Nghệ sĩ {d.performerResponse === 'Confirmed' ? 'xác nhận đã nhận' : 'báo chưa nhận'} {ngayDayDu(d.performerRespondedAt)}
                      </li>
                    )}
                    {d.performerAskedToConfirm && !d.performerRespondedAt && (
                      <li className="inline-flex items-center gap-1 text-warning"><Clock size={14} aria-hidden="true" /> Đang chờ nghệ sĩ xác nhận</li>
                    )}
                  </ul>
                </li>
              ))}
            </ol>
          )}

          {totalPages > 1 && (
            <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-4 mt-6">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className={NUT_VIEN}>Trang trước</button>
              <p className="font-mono text-sm">Trang {page} trên {totalPages}</p>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={NUT_VIEN}>Trang sau</button>
            </nav>
          )}
        </section>
      </div>

      {evidenceId != null && <HopNhatKy donationId={evidenceId} onClose={() => setEvidenceId(null)} />}
    </div>
  )
}

export default PerformerDonationsPage
