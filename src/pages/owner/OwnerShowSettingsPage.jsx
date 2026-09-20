// src/pages/owner/OwnerShowSettingsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — MÀN NÀY CHỨA NHỮNG THAY ĐỔI ẢNH HƯỞNG NGƯỜI ĐÃ MUA VÉ:
// - DỜI LỊCH và ĐỔI HÌNH THỨC không phải sửa thông tin thường. Đổi sang hình thức người mua KHÔNG
//   trả tiền cho (ví dụ họ mua vé xem tại chỗ mà chuyển thành online) là căn cứ hoàn 100% theo chính
//   sách nền tảng. Vì vậy hai việc này có bước xác nhận riêng và nói rõ hệ quả.
// - POSTER AI có HAI chế độ tuỳ cấu hình nền tảng, và phải rẽ theo `data.status` chứ KHÔNG theo mã
//   HTTP: chế độ hàng đợi trả 202 với status 'Queued' và imageUrl = null (ảnh mất 50–90 giây mới
//   xong, chủ nhận thông báo), chế độ gọi thẳng trả 200 kèm ảnh ngay.
//   Bấm lại khi đang có đơn chờ → 409, backend KHÔNG tạo đơn thứ hai.
// - Hạn mức poster AI có hai loại độc lập: hạn mức tính phí theo tháng (chỉ trừ khi thành công) và
//   giới hạn số lần thử mỗi buổi diễn (tính cả lần thất bại). Lần thất bại vì lỗi nhà cung cấp AI
//   (503) KHÔNG bị trừ hạn mức tháng.
// - Poster từ chế độ hàng đợi là ẢNH NỀN KHÔNG CHỮ và có dấu của nhà cung cấp ở góc dưới phải —
//   đừng đặt chữ quan trọng vào góc đó.
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

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

const FORMATS = [
  { value: 'Offline', label: 'Tại chỗ' },
  { value: 'Online', label: 'Trực tuyến' },
  { value: 'Hybrid', label: 'Cả hai' },
]

const PLAYBACK_MODES = [
  { value: 'TwoD', label: 'Video phẳng', hint: 'Cách phát thông thường. Mặc định.' },
  { value: 'ThreeD', label: 'Không gian 3D', hint: 'Video được dán lên màn hình sân khấu trong không gian 3D của phòng trà.' },
]

const ATTEMPT_VIEW = {
  Queued: { label: 'Đang chờ máy trạm', cls: 'text-yellow-400', icon: Clock },
  Rendering: { label: 'Đang tạo ảnh', cls: 'text-blue-400', icon: Loader2 },
  Succeeded: { label: 'Xong', cls: 'text-green-400', icon: CheckCircle2 },
  Failed: { label: 'Thất bại', cls: 'text-red-400', icon: XCircle },
  Expired: { label: 'Hết hạn chờ', cls: 'text-gray-500', icon: XCircle },
}

const Card = ({ title, subtitle, children, danger = false }) => (
  <div className={`bg-gray-900 border rounded-xl p-6 ${danger ? 'border-red-500/30' : 'border-gray-800'}`}>
    <h3 className={`text-base font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>{title}</h3>
    {subtitle && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{subtitle}</p>}
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

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [sRes, hRes] = await Promise.allSettled([getShowDetail(id), getAiPosterHistory(id)])
      if (sRes.status === 'fulfilled' && sRes.value?.success) {
        const d = sRes.value.data
        setShow(d)
        setNewStart(dayjs(d.scheduledStart).format('YYYY-MM-DDTHH:mm'))
        setNewFormat(d.format)
      }
      // Chưa từng tạo poster AI thì backend có thể trả rỗng — đó là trạng thái bình thường.
      if (hRes.status === 'fulfilled' && hRes.value?.success) setHistory(hRes.value.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được buổi diễn.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const taoPosterAi = async () => {
    setBusy('ai')
    try {
      const res = await generateAiPoster(id, styleHint.trim() || null)
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
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  if (!show) {
    return (
      <div className="max-w-2xl">
        <Link to="/owner/shows" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-4">
          <ArrowLeft size={16} /> Về danh sách buổi diễn
        </Link>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">Không tìm thấy buổi diễn này.</p>
        </div>
      </div>
    )
  }

  const laTrucTuyen = ['Online', 'Hybrid'].includes(show.format)
  const donChoXuLy = history.find((h) => ['Queued', 'Rendering'].includes(h.status))

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to={`/owner/shows/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-3">
          <ArrowLeft size={16} /> Về buổi diễn
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">Cài đặt buổi diễn</h1>
        <p className="text-gray-400 text-sm">{show.name}</p>
      </div>

      {/* === POSTER === */}
      <Card
        title="Poster"
        subtitle="Ảnh khán giả thấy đầu tiên khi tìm buổi diễn."
      >
        {show.coverImageUrl && (
          <img src={show.coverImageUrl} alt="" className="w-full h-48 object-cover rounded-lg border border-gray-800 mb-4" />
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500">Gợi ý phong cách cho AI</label>
            <input value={styleHint} onChange={(e) => setStyleHint(e.target.value)} className={inputCls}
              placeholder="VD: tối giản, tông vàng đồng, nhạc jazz" />
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Poster do AI tạo là ảnh nền không chữ, và có dấu của nhà cung cấp ở góc dưới phải —
              đừng đặt chữ quan trọng vào góc đó khi thiết kế thêm.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={taoPosterAi} disabled={busy !== null || !!donChoXuLy}
              title={donChoXuLy ? 'Đang có đơn tạo poster chờ xử lý' : undefined}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold hover:bg-[#d4c87f] disabled:opacity-40 disabled:cursor-not-allowed">
              {busy === 'ai' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Tạo poster bằng AI
            </button>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 cursor-pointer">
              {busy === 'upload' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              Tự tải poster
              <input type="file" accept="image/*" className="hidden" disabled={busy !== null}
                onChange={(e) => taiPosterRieng(e.target.files?.[0])} />
            </label>
            <button onClick={load} disabled={busy !== null}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 disabled:opacity-50">
              <RefreshCw size={14} /> Cập nhật
            </button>
          </div>

          {donChoXuLy && (
            <p className="text-xs text-yellow-400 flex items-start gap-1.5 leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
              <Clock size={13} className="mt-px flex-shrink-0" />
              Poster đang được tạo, thường mất 1–2 phút. Nếu không có máy trạm nào trực thì đơn chờ tối đa 6 tiếng
              rồi hết hạn — khi đó bạn có thể tự tải poster lên.
            </p>
          )}

          {history.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Lần tạo gần đây</p>
              <ul className="space-y-1.5">
                {history.slice(0, 5).map((h) => {
                  const v = ATTEMPT_VIEW[h.status] ?? { label: h.status, cls: 'text-gray-400', icon: ImageIcon }
                  return (
                    <li key={h.id} className="flex items-center justify-between gap-3 text-xs bg-black/40 border border-gray-800 rounded-lg px-3 py-2">
                      <span className={`inline-flex items-center gap-1.5 ${v.cls}`}>
                        <v.icon size={12} className={h.status === 'Rendering' ? 'animate-spin' : ''} /> {v.label}
                      </span>
                      <span className="text-gray-600">{dayjs(h.createdAt).format('HH:mm DD/MM')}</span>
                    </li>
                  )
                })}
              </ul>
              {history.some((h) => h.errorMessage) && (
                <p className="text-xs text-gray-600 mt-2">
                  Lỗi gần nhất: {history.find((h) => h.errorMessage)?.errorMessage}
                </p>
              )}
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
                    ? 'bg-gray-800 border-[#C3B665]/40'
                    : 'bg-black/40 border-gray-800 hover:border-gray-700'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-medium inline-flex items-center gap-2 ${dangChon ? 'text-[#C3B665]' : 'text-white'}`}>
                      <MonitorPlay size={15} /> {m.label}
                    </span>
                    {dangChon && <CheckCircle2 size={15} className="text-[#C3B665] flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.hint}</p>
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
            <label className="text-xs text-gray-500">Giờ bắt đầu mới</label>
            <input type="datetime-local" value={newStart} onChange={(e) => { setNewStart(e.target.value); setXacNhanDoiLich(false) }}
              className={inputCls} />
            <p className="text-xs text-gray-600 mt-1">
              Hiện tại: {dayjs(show.scheduledStart).format('HH:mm DD/MM/YYYY')}
            </p>
          </div>

          {!xacNhanDoiLich ? (
            <button onClick={() => setXacNhanDoiLich(true)} disabled={busy !== null || !newStart}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-500/10 disabled:opacity-50">
              <CalendarClock size={15} /> Dời lịch
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
              <p className="text-xs text-red-400 leading-relaxed flex items-start gap-1.5">
                <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                Dời sang {dayjs(newStart).format('HH:mm DD/MM/YYYY')}? Người đã mua vé sẽ được thông báo.
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setXacNhanDoiLich(false)} disabled={busy !== null}
                  className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
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
            <label className="text-xs text-gray-500">Hình thức mới</label>
            <select value={newFormat} onChange={(e) => { setNewFormat(e.target.value); setXacNhanDoiHinhThuc(false) }} className={inputCls}>
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Hiện tại: {FORMATS.find((f) => f.value === show.format)?.label ?? show.format}
            </p>
          </div>

          {newFormat !== show.format && (
            !xacNhanDoiHinhThuc ? (
              <button onClick={() => setXacNhanDoiHinhThuc(true)} disabled={busy !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-500/10 disabled:opacity-50">
                <Radio size={15} /> Đổi hình thức
              </button>
            ) : (
              <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
                <p className="text-xs text-red-400 leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                  Người đã mua vé cho hình thức cũ có thể được hoàn 100% tiền vé. Vẫn đổi?
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setXacNhanDoiHinhThuc(false)} disabled={busy !== null}
                    className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
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
    </div>
  )
}

export default OwnerShowSettingsPage
