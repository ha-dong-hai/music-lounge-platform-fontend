// src/pages/owner/OwnerShowSettingsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — MÀN NÀY CHỨA NHỮNG THAY ĐỔI ẢNH HƯỞNG NGƯỜI ĐÃ MUA VÉ:
// - DỜI LỊCH và ĐỔI HÌNH THỨC không phải sửa thông tin thường. Đổi sang hình thức người mua KHÔNG
//   trả tiền cho (ví dụ họ mua vé xem tại chỗ mà chuyển thành online) là căn cứ hoàn 100% theo chính
//   sách nền tảng. Vì vậy hai việc này có bước xác nhận riêng và nói rõ hệ quả.
// - POSTER AI có HAI kết cục, và phải rẽ theo `data.status` chứ KHÔNG theo mã HTTP. Máy chủ chọn MỘT
//   nhà cung cấp lúc dựng dịch vụ theo thứ tự ưu tiên Gemini → hàng đợi máy trạm → Cloudflare →
//   OpenAI; đó KHÔNG phải chuỗi dự phòng lúc chạy, nhà cung cấp đang dùng mà lỗi thì trả 503 chứ
//   không tự rơi xuống cái sau. MÀN NÀY KHÔNG BIẾT đang chạy cái nào — đừng cố đoán, `status` tồn
//   tại chính vì lý do đó:
//     * 'Succeeded' → ảnh có ngay trong câu trả lời (đường đồng bộ, đo thật ~15–16 giây). Cần một
//       trạng thái CHỜ có điểm kết thúc, không phải vòng hỏi lại.
//     * 'Queued'    → mới nhận đơn, imageUrl rỗng, kèm attemptId (đường máy trạm Google Flow). Ảnh
//       xong sau hàng phút; hỏi lại qua lịch sử và chủ phòng trà nhận thông báo.
//   Bấm lại khi đang có đơn chờ → 409, backend KHÔNG tạo đơn thứ hai.
// - Hạn mức poster AI có hai loại độc lập: hạn mức tính phí theo tháng và giới hạn số lần mỗi buổi
//   diễn. Lần THẤT BẠI không bị trừ ở cả hai (tháng đếm Succeeded/Queued/Rendering, mỗi buổi diễn
//   chỉ đếm Succeeded) — nói rõ câu đó cho người dùng, vì không biết mình có mất lượt hay không là
//   điều khiến người ta không dám bấm lại.
// - ẢNH TRẢ VỀ CÓ THỂ ĐÃ CÓ SẴN CHỮ. Nhà cung cấp chính viết được tiếng Việt có dấu đúng, nên poster
//   là ảnh HOÀN CHỈNH, FE không phủ chữ lên. Nhưng chữ đó do model tự viết: lần đo đầu tiên bên
//   backend, model đã tự bịa ra địa chỉ, hotline, website và Facebook không có thật. Họ chặn bằng
//   danh sách trắng trong prompt rồi, nhưng màn này vẫn phải nhắc chủ phòng trà đọc lại chữ trên ảnh
//   trước khi đăng ra ngoài.
// - Ô "gợi ý phong cách" KHÔNG phải ô viết prompt: máy chủ tự ghép prompt từ dữ liệu buổi diễn, câu
//   của chủ phòng trà chỉ được nối vào cuối. Đừng dựng UI kiểu prompt engineering ở đây.
// - CHẾ ĐỘ PHÁT chỉ có nghĩa với buổi Online/Hybrid.
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Loader2, ArrowLeft, Image as ImageIcon, Sparkles, Upload, CalendarClock, Radio, MonitorPlay,
  AlertTriangle, RefreshCw, CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getShowDetail, generateAiPoster, getAiPosterHistory, setShowPoster,
  rescheduleShow, changeShowFormat, setShowPlaybackMode,
} from '../../services/showServices'
import { uploadImage } from '../../services/userServices'
import { getMySubscription } from '../../services/packageServices'
import ShowCustomValuesSection from '../../components/owner/ShowCustomValuesSection'

const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

const FORMATS = [
  { value: 'Offline', label: 'Tại chỗ' },
  { value: 'Online', label: 'Trực tuyến' },
  { value: 'Hybrid', label: 'Cả hai' },
]

const PLAYBACK_MODES = [
  { value: 'TwoD', label: 'Video phẳng', hint: 'Cách phát thông thường. Mặc định.' },
  { value: 'ThreeD', label: 'Không gian 3D', hint: 'Video được dán lên màn hình sân khấu trong không gian 3D của phòng trà.' },
]

// Ngưng vòng tự hỏi lại sau bao lâu kể từ lúc đặt đơn. Xem giải thích ở effect bên dưới.
const NGUNG_TU_HOI_SAU_PHUT = 15

const ATTEMPT_VIEW = {
  Queued: { label: 'Đang chờ máy trạm', cls: 'text-warning', icon: Clock },
  Rendering: { label: 'Đang tạo ảnh', cls: 'text-sky-700', icon: Loader2 },
  Succeeded: { label: 'Xong', cls: 'text-success', icon: CheckCircle2 },
  Failed: { label: 'Thất bại', cls: 'text-danger', icon: XCircle },
  Expired: { label: 'Hết hạn chờ', cls: 'text-ink-mute', icon: XCircle },
}

const Card = ({ title, subtitle, children, danger = false }) => (
  <div className={`bg-card border rounded-xl p-6 ${danger ? 'border-red-500/30' : 'border-line'}`}>
    <h3 className={`text-base font-semibold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</h3>
    {subtitle && <p className="text-xs text-ink-mute mt-1 leading-relaxed">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </div>
)

const OwnerShowSettingsPage = () => {
  const { id } = useParams()
  const [show, setShow] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  const [styleHint, setStyleHint] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newFormat, setNewFormat] = useState('')
  const [xacNhanDoiLich, setXacNhanDoiLich] = useState(false)
  const [xacNhanDoiHinhThuc, setXacNhanDoiHinhThuc] = useState(false)

  // Số lượt poster AI còn lại trong tháng. Backend CHỈ trả trường này trong câu trả lời của chính
  // lần bấm "tạo poster" (PosterGenerationResultDto.remainingThisMonth) — không có endpoint nào đọc
  // riêng, và gói subscription chỉ cho biết TRẦN (maxAiPostersPerMonthSnapshot) chứ không cho biết
  // đã dùng bao nhiêu. Vì vậy chỗ này để null tới khi người dùng bấm lần đầu, thay vì đoán ra một
  // con số. Đã ghi vào phần cần backend bổ sung.
  const [conLaiThangNay, setConLaiThangNay] = useState(null)

  // Gói đang dùng, để biết TRẦN hạn mức và biết gói có tính năng poster AI hay không.
  // undefined = chưa đọc được, null = chưa đăng ký gói nào (backend trả null, không phải lỗi).
  const [goi, setGoi] = useState(undefined)

  // Chỉ tải lại LỊCH SỬ, không bật cờ đang tải — dùng cho vòng tự hỏi lại. Bật cờ sẽ làm cả màn
  // nhảy về khung chờ mỗi 10 giây trong lúc người dùng đang đọc.
  const taiLaiLichSu = useCallback(async () => {
    try {
      const hRes = await getAiPosterHistory(id)
      if (hRes.success) setHistory(hRes.data ?? [])
    } catch {
      // Hỏi lại thất bại thì im lặng: đây là vòng chạy nền, không phải hành động của người dùng.
      // Lần sau sẽ hỏi lại; báo lỗi mỗi 10 giây thì chỉ làm nhiễu.
    }
  }, [id])

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [sRes, hRes, gRes] = await Promise.allSettled([
        getShowDetail(id), getAiPosterHistory(id), getMySubscription(),
      ])
      if (sRes.status === 'fulfilled' && sRes.value?.success) {
        const d = sRes.value.data
        setShow(d)
        setNewStart(dayjs(d.scheduledStart).format('YYYY-MM-DDTHH:mm'))
        setNewFormat(d.format)
      }
      // Chưa từng tạo poster AI thì backend có thể trả rỗng — đó là trạng thái bình thường.
      if (hRes.status === 'fulfilled' && hRes.value?.success) setHistory(hRes.value.data ?? [])
      // Đọc gói thất bại thì để nguyên undefined: màn hình sẽ KHÔNG chặn nút nào cả, thà để máy chủ
      // từ chối còn hơn tự chặn oan vì một lần gọi lỗi.
      if (gRes.status === 'fulfilled' && gRes.value?.success) setGoi(gRes.value.data ?? null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được buổi diễn.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // Đơn poster do MÁY TRẠM NGOÀI HỆ THỐNG xử lý (máy cá nhân chạy Google Flow). Không có vòng này
  // thì tạo đơn xong màn hình đứng ở "Đang chờ máy trạm" và chủ phòng trà phải tự tải lại trang mới
  // biết ảnh xong — chỗ vướng rõ nhất của hướng dùng máy trạm.
  //
  // Chỉ chạy khi THỰC SỰ có đơn ở Queued/Rendering, và tự dừng khi đơn rời hai trạng thái đó.
  //
  // BA MỐC DƯỚI ĐÂY LẤY TỪ HẰNG SỐ CỦA BACKEND (PosterQueue.cs), không phải phỏng đoán: một lượt
  // chạy được đo chậm nhất ≈ 1,5 phút (49s sinh ảnh + 39s xuất bản), máy trạm giữ đơn tối đa 10
  // phút, và đơn không ai nhận thì nằm chờ tới 6 TIẾNG mới hết hạn. Con số 6 tiếng là lý do phải
  // giảm nhịp rồi dừng: hỏi lại mỗi 10 giây suốt 6 tiếng là hơn hai nghìn lượt gọi trên một tab bị
  // bỏ quên, trong khi máy trạm chỉ bật khi có người ngồi làm việc. Nên: 10 giây cho ba phút đầu
  // (phủ trọn trường hợp bình thường), 30 giây tới phút 15, rồi ngừng và mời bấm "Cập nhật".
  //
  // Vẫn dùng setInterval chứ không setTimeout: mỗi lượt hỏi thành công đều đổi `history` nên effect
  // chạy lại và tự đặt nhịp mới, còn lượt hỏi THẤT BẠI thì không đổi `history` — với setTimeout
  // chuỗi hỏi lại sẽ chết hẳn sau một lần mất mạng, còn interval thì hỏi lại lượt sau.
  useEffect(() => {
    const dangCho = history.find((h) => h.status === 'Queued' || h.status === 'Rendering')
    if (!dangCho) return
    const tuoiPhut = dayjs().diff(dayjs(dangCho.createdAt), 'minute')
    if (tuoiPhut >= NGUNG_TU_HOI_SAU_PHUT) return
    const dinhKy = setInterval(() => { taiLaiLichSu() }, tuoiPhut < 3 ? 10000 : 30000)
    return () => clearInterval(dinhKy)
  }, [history, taiLaiLichSu])

  // Quay về một ảnh đã tạo trước đó. Dùng chính endpoint đặt poster thủ công, nên KHÔNG tốn thêm
  // lần thử nào của hạn mức AI — đó là điểm chính khiến việc này đáng có.
  const dungAnhNay = async (imageUrl) => {
    setBusy('poster')
    try {
      await setShowPoster(id, imageUrl)
      toast.success('Đã đặt ảnh này làm poster.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đặt được poster.')
    } finally { setBusy(null) }
  }

  const taoPosterAi = async () => {
    setBusy('ai')
    try {
      const res = await generateAiPoster(id, styleHint.trim() || null)
      // Trường này có ở CẢ HAI chế độ (mặc định của record nên đường gọi thẳng giữ nguyên hình dạng).
      if (typeof res.data?.remainingThisMonth === 'number') setConLaiThangNay(res.data.remainingThisMonth)
      // Rẽ theo status, KHÔNG theo mã HTTP: hai chế độ nền tảng trả 202 và 200 khác nhau.
      if (res.data?.status === 'Queued') {
        toast.success('Poster đang được tạo, thường mất 1–2 phút. Bạn sẽ nhận thông báo khi xong.', { duration: 6000 })
      } else {
        toast.success('Đã tạo poster.')
      }
      await load()
    } catch (err) {
      const status = err.response?.status
      if (status === 409) {
        toast.error('Đang có một đơn tạo poster chờ xử lý — hãy đợi đơn đó xong.')
      } else if (status === 503) {
        toast.error('Nhà cung cấp AI đang lỗi. Lần thử này không bị trừ vào hạn mức tháng.', { duration: 6000 })
      } else {
        toast.error(err.response?.data?.message || 'Không tạo được poster.')
      }
    } finally { setBusy(null) }
  }

  const taiPosterRieng = async (file) => {
    if (!file) return
    setBusy('upload')
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      await setShowPoster(id, up.data?.url ?? up.data)
      toast.success('Đã đặt poster.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đặt được poster.')
    } finally { setBusy(null) }
  }

  const doiLich = async () => {
    if (!newStart) return
    setBusy('reschedule')
    try {
      await rescheduleShow(id, new Date(newStart).toISOString())
      toast.success('Đã dời lịch buổi diễn.')
      setXacNhanDoiLich(false)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không dời được lịch.', { duration: 6000 })
    } finally { setBusy(null) }
  }

  const doiHinhThuc = async () => {
    setBusy('format')
    try {
      await changeShowFormat(id, newFormat)
      toast.success('Đã đổi hình thức buổi diễn.')
      setXacNhanDoiHinhThuc(false)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được hình thức.', { duration: 6000 })
    } finally { setBusy(null) }
  }

  const doiCheDoPhat = async (mode) => {
    setBusy('playback')
    try {
      await setShowPlaybackMode(id, mode)
      toast.success('Đã đổi chế độ phát.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được chế độ phát.')
    } finally { setBusy(null) }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  if (!show) {
    return (
      <div className="max-w-2xl">
        <Link to="/owner/shows" className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink mb-4">
          <ArrowLeft size={16} /> Về danh sách buổi diễn
        </Link>
        <div className="bg-card border border-line rounded-xl p-6">
          <p className="text-sm text-ink-soft">Không tìm thấy buổi diễn này.</p>
        </div>
      </div>
    )
  }

  const laTrucTuyen = ['Online', 'Hybrid'].includes(show.format)
  const donChoXuLy = history.find((h) => ['Queued', 'Rendering'].includes(h.status))
  const daNgungTuHoi = !!donChoXuLy
    && dayjs().diff(dayjs(donChoXuLy.createdAt), 'minute') >= NGUNG_TU_HOI_SAU_PHUT

  // `/subscriptions/my` trả về gói MỚI NHẤT THEO NGÀY BẮT ĐẦU, KHÔNG lọc theo hiệu lực — nó vẫn trả
  // một gói đã hết hạn kèm `hasAiPosterSnapshot: true`. Lệnh tạo poster thì đòi `Active` VÀ chưa hết
  // hạn. Nên chỉ đọc `hasAiPosterSnapshot` là chưa đủ: gói hết hạn sẽ hiện nút bấm được, bấm vào
  // nhận 422 "Gói subscription hiện tại của bạn không bao gồm tính năng tạo poster AI" — một câu
  // nói sai nguyên nhân, vì gói CÓ tính năng đó, chỉ là đã hết hạn.
  const tranThangNay = goi?.maxAiPostersPerMonthSnapshot ?? null
  const goiConHieuLuc = !!goi && goi.status === 'Active' && dayjs(goi.expiresAt).isAfter(dayjs())
  // Số còn lại ĐỌC TRƯỚC KHI BẤM (MLACP-483). Trước đây trường này chỉ có trong câu trả lời của
  // chính lần bấm, nên muốn biết còn mấy lượt thì phải tiêu một lượt — mà mỗi lượt là tiền thật.
  // Backend đếm bằng cùng một luật với lệnh tạo poster (AiPosterQuota), không phải bản chép lại,
  // nên con số ở đây và câu trả lời của máy chủ không trôi ra khỏi nhau.
  // Ưu tiên số của lần bấm gần nhất vì nó mới hơn số đọc lúc tải trang.
  const conLai = conLaiThangNay ?? goi?.aiPostersRemainingThisMonth ?? null
  const posterDangDungLaAi = !!show.coverImageUrl
    && history.some((h) => h.imageUrl === show.coverImageUrl)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to={`/owner/shows/${id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink mb-3">
          <ArrowLeft size={16} /> Về buổi diễn
        </Link>
        <h1 className="text-2xl font-bold text-ink mb-1">Cài đặt buổi diễn</h1>
        <p className="text-ink-soft text-sm">{show.name}</p>
      </div>

      {/* === POSTER === */}
      <Card
        title="Poster"
        subtitle="Ảnh khán giả thấy đầu tiên khi tìm buổi diễn."
      >
        {show.coverImageUrl && (
          <img src={show.coverImageUrl} alt="" className="w-full h-48 object-cover rounded-lg border border-line mb-4" />
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-ink-mute">Gợi ý phong cách cho AI <span className="text-ink-mute">(không bắt buộc)</span></label>
            <input value={styleHint} onChange={(e) => setStyleHint(e.target.value)} className={inputCls}
              placeholder="VD: tông trầm, nhiều cây xanh" maxLength={300} />
            {/* KHÔNG phải ô viết prompt. Máy chủ tự ghép prompt từ dữ liệu buổi diễn (tên chương
                trình, tên phòng trà, ngày giờ, thể loại) rồi nối câu này vào cuối dưới dạng "Yêu
                cầu thêm từ chủ buổi diễn: …". Nói rõ điều đó ở đây để chủ phòng trà không ngồi mô
                tả lại những thứ hệ thống đã biết. */}
            <p className="text-xs text-ink-mute mt-1 leading-relaxed">
              Chỉ cần một câu về phong cách. Tên chương trình, tên phòng trà và ngày giờ đã được lấy
              sẵn từ thông tin buổi diễn — không cần nhập lại.
            </p>
          </div>

          {/* NÓI RÕ NGUYÊN NHÂN, NHƯNG CHỈ CHẶN KHI CHẮC CHẮN.
              Lệnh tạo poster tìm gói còn hiệu lực trong TẤT CẢ gói của chủ phòng trà, còn màn này chỉ
              thấy gói mới nhất. Một gói cũ dài hạn còn hiệu lực trong khi gói mới nhất đã hết hạn là
              chuyện hiếm nhưng có thể xảy ra — và chặn oan một người thực sự có quyền thì tệ hơn một
              câu lỗi. Nên: gói hết hạn hay gói thiếu tính năng thì chỉ BÁO, vẫn cho bấm để máy chủ
              quyết. Chỉ chặn khi KHÔNG CÓ bản ghi gói nào (goi === null) — lúc đó máy chủ chắc chắn
              từ chối. Chưa đọc được gói (undefined) thì không nói gì và không chặn gì. */}
          {goi === null && (
            <p className="text-xs text-ink-soft leading-relaxed bg-sunken/70 border border-line rounded-lg p-3">
              Bạn chưa đăng ký gói dịch vụ nào nên chưa dùng được poster AI. Bạn vẫn tự tải poster lên
              được. <Link to="/owner/subscription" className="text-brand-text hover:underline">Xem các gói</Link>
            </p>
          )}

          {goi && !goiConHieuLuc && (
            <p className="text-xs text-warning leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
              Gói <b>{goi.packageName}</b> đã hết hạn ngày {dayjs(goi.expiresAt).format('DD/MM/YYYY')} nên
              poster AI tạm thời không dùng được — gói của bạn CÓ tính năng này, chỉ cần gia hạn.{' '}
              <Link to="/owner/subscription" className="underline">Gia hạn gói</Link>
            </p>
          )}

          {goi && goiConHieuLuc && !goi.hasAiPosterSnapshot && (
            <p className="text-xs text-ink-soft leading-relaxed bg-sunken/70 border border-line rounded-lg p-3">
              Gói <b>{goi.packageName}</b> không có tính năng tạo poster bằng AI. Bạn vẫn tự tải poster
              lên được. <Link to="/owner/subscription" className="text-brand-text hover:underline">Xem các gói</Link>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {/* Chỉ chặn khi KHÔNG CÓ gói nào — xem giải thích ở khối báo phía trên. Hết lượt hay gói
                hết hạn thì chỉ báo, vẫn cho bấm, vì hạn mức và hiệu lực đều tính từ gói mới nhất mà
                màn này thấy, còn máy chủ thì xét tất cả gói của chủ phòng trà. */}
            <button onClick={taoPosterAi}
              disabled={busy !== null || !!donChoXuLy || goi === null}
              title={donChoXuLy ? 'Đang có đơn tạo poster chờ xử lý' : undefined}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed">
              {busy === 'ai' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Tạo poster bằng AI
            </button>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken cursor-pointer">
              {busy === 'upload' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              Tự tải poster
              <input type="file" accept="image/*" className="hidden" disabled={busy !== null}
                onChange={(e) => taiPosterRieng(e.target.files?.[0])} />
            </label>
            <button onClick={load} disabled={busy !== null}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-ink-soft text-sm hover:bg-sunken disabled:opacity-50">
              <RefreshCw size={14} /> Cập nhật
            </button>
          </div>

          {/* ĐANG CHỜ Ở ĐƯỜNG ĐỒNG BỘ. Đường chính mất ~15–16 giây (số đo thật của backend), và trong
              suốt quãng đó cửa sổ không có gì đổi ngoài một vòng xoay nhỏ trên nút — đủ lâu để người
              ta tưởng máy treo và bấm đi chỗ khác. Nói luôn con số để cái chờ có điểm kết thúc. */}
          {busy === 'ai' && (
            <p className="text-xs text-ink-soft flex items-start gap-2 leading-relaxed bg-sunken/70 border border-line rounded-lg p-3">
              <Loader2 size={13} className="mt-px flex-shrink-0 animate-spin" />
              Đang tạo poster, thường khoảng 20 giây. Xin đừng rời trang.
            </p>
          )}

          {/* Hạn mức tháng, hiện NGAY KHI MỞ TRANG chứ không chờ bấm — xem chú thích ở `conLai`. */}
          {(conLai !== null || tranThangNay !== null) && (
            <p className="text-xs text-ink-mute leading-relaxed">
              {conLai !== null ? (
                <>
                  Còn <span className={`font-semibold ${conLai === 0 ? 'text-warning' : 'text-ink-soft'}`}>{conLai}</span>
                  {tranThangNay !== null && <> trong {tranThangNay}</>} lượt poster AI trong tháng này.
                  {conLai === 0 && ' Hạn mức làm mới vào đầu tháng sau.'}
                </>
              ) : (
                <>Gói của bạn có <span className="text-ink-soft font-semibold">{tranThangNay}</span> poster AI mỗi tháng.</>
              )}
            </p>
          )}

          {/* NHẮC ĐỌC LẠI CHỮ TRÊN ẢNH. Poster từ nhà cung cấp chính là ảnh HOÀN CHỈNH, có chữ tiếng
              Việt do model tự viết — không phải ảnh nền để mình in chữ lên. Điều đó tiện, nhưng lần
              đo đầu tiên của backend model đã tự bịa ra một địa chỉ, một hotline, một website và một
              Facebook không có thật. Họ đã chặn bằng danh sách trắng trong prompt và chạy lại thì
              sạch, nhưng đây vẫn là mô hình sinh ảnh, không phải máy in.
              Điều kiện: poster đang dùng TRÙNG với một ảnh trong lịch sử AI của buổi diễn này. Backend
              có cờ `PosterByAi` trên bản ghi nhưng KHÔNG trả ra DTO nào, nên suy từ lịch sử — cách này
              chính xác hơn một cờ, vì nó bám đúng tấm ảnh đang treo. */}
          {posterDangDungLaAi && (
            <p className="text-xs text-ink-soft flex items-start gap-2 leading-relaxed">
              <AlertTriangle size={13} className="mt-px flex-shrink-0 text-warning/80" />
              <span>
                Poster này do AI tạo, và chữ trên ảnh cũng do AI viết. Trước khi đăng, đọc lại tên
                chương trình và ngày giờ. Trên ảnh <b>không được có</b> địa chỉ, số điện thoại,
                website hay giá vé — thấy những thứ đó nghĩa là AI tự bịa, hãy tạo lại hoặc tự tải
                poster khác lên.
              </span>
            </p>
          )}

          {donChoXuLy && (
            <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
              <Clock size={13} className="mt-px flex-shrink-0" />
              {daNgungTuHoi ? (
                <span>
                  Đơn đã đặt hơn {NGUNG_TU_HOI_SAU_PHUT} phút mà chưa xong, nên trang đã ngưng tự hỏi lại.
                  Đơn vẫn còn hiệu lực và chờ tối đa 6 tiếng — bấm <b>Cập nhật</b> để xem, hoặc chờ thông báo.
                </span>
              ) : (
                <span>
                  Poster đang được tạo, thường mất 1–2 phút. Nếu không có máy trạm nào trực thì đơn chờ tối đa 6 tiếng
                  rồi hết hạn — khi đó bạn có thể tự tải poster lên.
                </span>
              )}
            </p>
          )}

          {history.length > 0 && (
            <div>
              <p className="text-xs text-ink-mute mb-2">Lần tạo gần đây</p>
              <ul className="space-y-1.5">
                {history.slice(0, 5).map((h) => {
                  const v = ATTEMPT_VIEW[h.status] ?? { label: h.status, cls: 'text-ink-soft', icon: ImageIcon }
                  const laPosterDangDung = !!h.imageUrl && h.imageUrl === show.coverImageUrl
                  return (
                    <li key={h.id} className="bg-sunken/70 border border-line rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className={`inline-flex items-center gap-1.5 ${v.cls}`}>
                          <v.icon size={12} className={h.status === 'Rendering' ? 'animate-spin' : ''} /> {v.label}
                        </span>
                        <span className="text-ink-mute">{dayjs(h.createdAt).format('HH:mm DD/MM')}</span>
                      </div>

                      {/* ẢNH CỦA LẦN TẠO THÀNH CÔNG. Trước đây màn này không đọc `imageUrl` nên lịch
                          sử chỉ hiện chữ "Xong" mà không có ảnh — chủ phòng trà không xem lại được
                          mình đã tạo ra gì. Điều đó đáng kể vì SỐ LẦN THỬ MỖI BUỔI DIỄN CÓ GIỚI HẠN:
                          muốn quay về một ảnh đã tạo trước đó thì phải thấy nó.
                          Máy trạm xong thì backend tự gắn ảnh mới vào buổi diễn, nên ảnh mới nhất
                          thường đang là poster — đánh dấu rõ để khỏi bấm lại vô ích. */}
                      {h.imageUrl && (
                        <div className="mt-2 flex items-start gap-2">
                          <img src={h.imageUrl} alt="Poster đã tạo"
                            className="w-20 h-20 object-cover rounded-md border border-line flex-shrink-0" />
                          <div className="min-w-0">
                            {laPosterDangDung ? (
                              <p className="text-xs text-success">Đang dùng làm poster</p>
                            ) : (
                              <button onClick={() => dungAnhNay(h.imageUrl)} disabled={busy !== null}
                                className="px-2.5 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken disabled:opacity-50">
                                Dùng ảnh này
                              </button>
                            )}
                            <a href={h.imageUrl} target="_blank" rel="noreferrer"
                              className="block text-xs text-ink-mute hover:text-brand-text mt-1.5">
                              Xem ảnh gốc
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Lý do thất bại của ĐÚNG lần đó. Trước đây chỉ hiện "lỗi gần nhất" ở cuối
                          danh sách, nên không biết lỗi thuộc lần nào.

                          Nói TRƯỚC chuyện hạn mức, rồi mới tới câu lỗi. Câu lỗi là nguyên văn của
                          nhà cung cấp (thường tiếng Anh, đôi khi kèm mã nội bộ) — backend cố ý
                          không đưa nó vào thông báo cho người dùng, chỉ trả về đây để chủ phòng
                          trà đối chiếu. Đọc một dòng tiếng Anh lạ mà không biết mình có bị trừ lượt
                          hay không là điều khiến người ta không dám bấm lại. Lần thất bại KHÔNG bị
                          trừ ở cả hai loại hạn mức: hạn mức tháng chỉ đếm Succeeded/Queued/Rendering,
                          còn giới hạn mỗi buổi diễn chỉ đếm Succeeded. */}
                      {h.errorMessage && (
                        <div className="mt-1.5">
                          {['Failed', 'Expired'].includes(h.status) && (
                            <p className="text-xs text-ink-soft leading-relaxed">
                              Lần này không bị trừ lượt nào — chỉ lần tạo được ảnh mới tính vào hạn mức.
                            </p>
                          )}
                          <p className="text-xs text-danger/90 mt-1 leading-relaxed break-words">{h.errorMessage}</p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* === CHẾ ĐỘ PHÁT === */}
      {laTrucTuyen && (
        <Card title="Chế độ phát" subtitle="Chỉ áp dụng cho buổi diễn có phát trực tuyến.">
          <div className="space-y-2">
            {PLAYBACK_MODES.map((m) => {
              const dangChon = (show.playbackMode ?? 'TwoD') === m.value
              return (
                <button key={m.value} onClick={() => doiCheDoPhat(m.value)} disabled={busy !== null || dangChon}
                  className={`w-full text-left p-4 rounded-lg border transition-colors disabled:cursor-default ${dangChon
                    ? 'bg-sunken border-brand/40'
                    : 'bg-sunken/70 border-line hover:border-line'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-medium inline-flex items-center gap-2 ${dangChon ? 'text-brand-text' : 'text-ink'}`}>
                      <MonitorPlay size={15} /> {m.label}
                    </span>
                    {dangChon && <CheckCircle2 size={15} className="text-brand-text flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-ink-mute mt-1 leading-relaxed">{m.hint}</p>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* === DỜI LỊCH === */}
      <Card
        title="Dời lịch buổi diễn"
        danger
        subtitle="Thay đổi này ảnh hưởng tới người ĐÃ MUA VÉ. Hệ thống sẽ thông báo cho họ, và họ có quyền theo chính sách của buổi diễn."
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-ink-mute">Giờ bắt đầu mới</label>
            <input type="datetime-local" value={newStart} onChange={(e) => { setNewStart(e.target.value); setXacNhanDoiLich(false) }}
              className={inputCls} />
            <p className="text-xs text-ink-mute mt-1">
              Hiện tại: {dayjs(show.scheduledStart).format('HH:mm DD/MM/YYYY')}
            </p>
          </div>

          {!xacNhanDoiLich ? (
            <button onClick={() => setXacNhanDoiLich(true)} disabled={busy !== null || !newStart}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-danger text-sm font-bold hover:bg-red-500/10 disabled:opacity-50">
              <CalendarClock size={15} /> Dời lịch
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
              <p className="text-xs text-danger leading-relaxed flex items-start gap-1.5">
                <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                Dời sang {dayjs(newStart).format('HH:mm DD/MM/YYYY')}? Người đã mua vé sẽ được thông báo.
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setXacNhanDoiLich(false)} disabled={busy !== null}
                  className="flex-1 py-2 border border-line-strong text-ink-soft rounded-lg text-sm font-medium hover:bg-sunken disabled:opacity-50">
                  Huỷ
                </button>
                <button onClick={doiLich} disabled={busy !== null}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50">
                  {busy === 'reschedule' && <Loader2 size={15} className="animate-spin" />} Xác nhận dời lịch
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* === ĐỔI HÌNH THỨC === */}
      <Card
        title="Đổi hình thức"
        danger
        subtitle="Đổi sang hình thức mà người mua KHÔNG trả tiền cho là căn cứ hoàn 100% theo chính sách nền tảng."
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-ink-mute">Hình thức mới</label>
            <select value={newFormat} onChange={(e) => { setNewFormat(e.target.value); setXacNhanDoiHinhThuc(false) }} className={inputCls}>
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <p className="text-xs text-ink-mute mt-1">
              Hiện tại: {FORMATS.find((f) => f.value === show.format)?.label ?? show.format}
            </p>
          </div>

          {newFormat !== show.format && (
            !xacNhanDoiHinhThuc ? (
              <button onClick={() => setXacNhanDoiHinhThuc(true)} disabled={busy !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-danger text-sm font-bold hover:bg-red-500/10 disabled:opacity-50">
                <Radio size={15} /> Đổi hình thức
              </button>
            ) : (
              <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
                <p className="text-xs text-danger leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                  Người đã mua vé cho hình thức cũ có thể được hoàn 100% tiền vé. Vẫn đổi?
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setXacNhanDoiHinhThuc(false)} disabled={busy !== null}
                    className="flex-1 py-2 border border-line-strong text-ink-soft rounded-lg text-sm font-medium hover:bg-sunken disabled:opacity-50">
                    Huỷ
                  </button>
                  <button onClick={doiHinhThuc} disabled={busy !== null}
                    className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50">
                    {busy === 'format' && <Loader2 size={15} className="animate-spin" />} Xác nhận đổi
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* TIÊU CHÍ RIÊNG — đây là chỗ đã hứa ở CustomCriteriaSection (màn Hồ sơ phòng trà) */}
      <ShowCustomValuesSection showId={id} />
    </div>
  )
}

export default OwnerShowSettingsPage
