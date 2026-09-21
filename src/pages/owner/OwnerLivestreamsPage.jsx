// src/pages/owner/OwnerLivestreamsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE: 2 giới hạn dữ liệu thật cần biết trước khi chỉnh sửa trang này —
// 1) Không có endpoint nào cho Owner tự xem trạng thái duyệt Admin của livestream (EventModeration
//    chỉ Admin đọc được qua GET /moderations/pending). Nên trang này không hiển thị được "đang chờ
//    duyệt" một cách chắc chắn — chỉ biết được khi bấm "Bắt đầu phát" thất bại với đúng lý do đó.
// 2) (ĐÃ HẾT ĐÚNG — sửa lại cho khỏi đánh lừa người đọc sau) Ghi chú cũ ở đây nói DTO không có
//    field cho biết đã khai VCPMC hay chưa. Thực ra CÓ: `operatorInfo.vcpmcDeclared` và
//    `operatorInfo.vcpmcRoyaltyReference`, backend làm đúng để giao diện ẩn/hiện form. Trang này
//    trước đây không đọc nên form luôn hiện trống, và chủ phòng trà khai xong không còn chỗ nào
//    xem lại mã mình đã khai. Nay đọc rồi.
//    `operatorInfo` chỉ trả cho người vận hành (chủ, nhân viên được phân công, Admin) — khán giả
//    nhận null, nên mọi chỗ đọc nó phải chịu được null.
import { useState, useEffect, useCallback } from 'react'
import { Radio, Loader2, Copy, Square, Play, ShieldCheck, MessageSquare, MessageSquareOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { getShows, getShowDetail, setVcpmcRoyalty } from '../../services/showServices'
import {
  createLivestream,
  getLivestreamDetail,
  getLivestreamCredentials,
  startLivestream,
  endLivestream,
  setChatEnabled,
} from '../../services/livestreamServices'

const StatusBadge = ({ status }) => {
  const styles = {
    Scheduled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Live: 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse',
    Ended: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    Terminated: 'bg-red-900/20 text-red-500 border-red-900/40',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.Ended}`}>
      {status}
    </span>
  )
}

const ShowLivestreamRow = ({ show, onChanged }) => {
  const [livestream, setLivestream] = useState(undefined) // undefined = đang tải, null = chưa có
  const [credentials, setCredentials] = useState(null)
  const [vcpmcRef, setVcpmcRef] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  // Chi tiết buổi diễn. `show` truyền từ ngoài vào là MỘT DÒNG DANH SÁCH nên KHÔNG có operatorInfo —
  // mã tác quyền đã khai chỉ có ở chi tiết. Trước đây hàm dưới gọi chi tiết rồi bỏ đi, chỉ lấy
  // livestreamId; nay giữ lại.
  const [chiTiet, setChiTiet] = useState(null)

  const loadLivestream = useCallback(async () => {
    try {
      const detailRes = await getShowDetail(show.id)
      setChiTiet(detailRes.success ? detailRes.data : null)
      if (!detailRes.success || !detailRes.data.livestreamId) {
        setLivestream(null)
        return
      }
      const lsRes = await getLivestreamDetail(detailRes.data.livestreamId)
      if (lsRes.success) setLivestream(lsRes.data)
    } catch {
      setChiTiet(null)
      setLivestream(null)
    }
  }, [show.id])

  useEffect(() => {
    loadLivestream()
  }, [loadLivestream])

  const handleCreate = async () => {
    setIsBusy(true)
    try {
      await createLivestream({ showId: show.id })
      toast.success('Đã tạo livestream, đang chờ Admin duyệt.')
      await loadLivestream()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tạo được livestream.')
    } finally {
      setIsBusy(false)
    }
  }

  const handleSaveVcpmc = async () => {
    if (!vcpmcRef.trim()) return
    setIsBusy(true)
    try {
      await setVcpmcRoyalty(show.id, vcpmcRef.trim())
      toast.success('Đã lưu mã tác quyền VCPMC.')
      setVcpmcRef('')
      // Tải lại chi tiết buổi diễn để khối "đã khai" hiện đúng mã vừa lưu, thay vì phải đoán.
      await loadLivestream()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được mã tác quyền.')
    } finally {
      setIsBusy(false)
    }
  }

  const handleStart = async () => {
    setIsBusy(true)
    try {
      await startLivestream(livestream.id)
      toast.success('Đã bắt đầu phát!')
      const credRes = await getLivestreamCredentials(livestream.id)
      if (credRes.success) setCredentials(credRes.data)
      await loadLivestream()
      onChanged?.()
    } catch (err) {
      // Lý do thật từ backend — có thể là "chưa được Admin duyệt" hoặc "chưa khai VCPMC" (xem ghi chú đầu file).
      toast.error(err.response?.data?.message || 'Không bắt đầu phát được.')
    } finally {
      setIsBusy(false)
    }
  }

  const handleEnd = async () => {
    setIsBusy(true)
    try {
      await endLivestream(livestream.id)
      toast.success('Đã kết thúc phát.')
      setCredentials(null)
      await loadLivestream()
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không kết thúc được.')
    } finally {
      setIsBusy(false)
    }
  }

  // Bật/tắt khung chat giữa buổi diễn — dùng khi chat bị spam. Tắt chat KHÔNG làm mất tin nhắn cũ.
  // LƯU Ý: LivestreamDetailDto trên bản đang chạy CHƯA trả chatEnabled (backend đã bổ sung nhưng
  // chưa deploy), nên tạm mặc định là đang bật. Có bản mới thì nút tự hiển thị đúng trạng thái.
  const handleToggleChat = async (enabled) => {
    setIsBusy(true)
    try {
      await setChatEnabled(livestream.id, enabled)
      toast.success(enabled ? 'Đã bật khung chat.' : 'Đã tắt khung chat.')
      await loadLivestream()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được trạng thái chat.')
    } finally {
      setIsBusy(false)
    }
  }

  const handleShowCredentials = async () => {
    setIsBusy(true)
    try {
      const res = await getLivestreamCredentials(livestream.id)
      if (res.success) setCredentials(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lấy được thông tin phát.')
    } finally {
      setIsBusy(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Đã sao chép.')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-bold">{show.name}</p>
          <p className="text-gray-500 text-xs">{new Date(show.scheduledStart).toLocaleString('vi-VN')}</p>
        </div>
        {livestream === undefined ? (
          <Loader2 size={18} className="animate-spin text-gray-500" />
        ) : livestream === null ? (
          <button
            onClick={handleCreate}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C3B665] text-black text-xs font-bold hover:bg-[#d4c87f] disabled:opacity-50"
          >
            <Radio size={14} /> Tạo livestream
          </button>
        ) : (
          <StatusBadge status={livestream.status} />
        )}
      </div>

      {livestream && livestream.status === 'Scheduled' && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          {/* HIỆN MÃ ĐÃ KHAI. Không có khối này thì khai xong không còn chỗ nào xem lại để đối
              chiếu, và không biết mình đã khai hay chưa — trong khi đây là điều kiện bắt buộc để
              bắt đầu phát. */}
          {chiTiet?.operatorInfo?.vcpmcDeclared && (
            <div className="p-3 rounded-lg bg-black/40 border border-gray-800">
              <p className="text-xs text-gray-500">Đã khai mã tác quyền VCPMC</p>
              <p className="text-sm text-white mt-0.5 break-all">
                {chiTiet.operatorInfo.vcpmcRoyaltyReference || '(đã khai, không đọc lại được mã)'}
              </p>
              <p className="text-[11px] text-gray-600 mt-1">Khai lại sẽ ghi đè mã trên.</p>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={vcpmcRef}
              onChange={(e) => setVcpmcRef(e.target.value)}
              placeholder={chiTiet?.operatorInfo?.vcpmcDeclared
                ? 'Nhập mã mới để thay mã đang khai'
                : 'Mã tham chiếu đã thanh toán tác quyền VCPMC'}
              className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-600"
            />
            <button
              onClick={handleSaveVcpmc}
              disabled={isBusy || !vcpmcRef.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50"
            >
              <ShieldCheck size={14} /> {chiTiet?.operatorInfo?.vcpmcDeclared ? 'Thay mã' : 'Lưu VCPMC'}
            </button>
          </div>
          <button
            onClick={handleStart}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/20 disabled:opacity-50"
          >
            <Play size={14} /> Bắt đầu phát
          </button>
        </div>
      )}

      {livestream && livestream.status === 'Live' && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          <button
            onClick={handleEnd}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/20 disabled:opacity-50"
          >
            <Square size={14} className="fill-red-400" /> Kết thúc phát
          </button>
          <button
            onClick={() => handleToggleChat(!(livestream.chatEnabled ?? true))}
            disabled={isBusy}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {(livestream.chatEnabled ?? true)
              ? <><MessageSquareOff size={14} /> Tắt khung chat</>
              : <><MessageSquare size={14} /> Bật khung chat</>}
          </button>
          {!credentials && (
            <button
              onClick={handleShowCredentials}
              disabled={isBusy}
              className="ml-2 text-xs text-gray-400 underline hover:text-white"
            >
              Xem lại RTMP/Stream Key
            </button>
          )}
        </div>
      )}

      {credentials && (
        <div className="mt-4 p-3 bg-black border border-yellow-700/40 rounded-lg">
          <p className="text-yellow-500 text-xs font-bold mb-2">⚠ Không chia sẻ Stream Key cho ai khác</p>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400 truncate">RTMP: {credentials.rtmpUrl}</span>
              <button onClick={() => copyToClipboard(credentials.rtmpUrl)}><Copy size={12} className="text-gray-500 hover:text-white" /></button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400 truncate">Key: {credentials.streamKey}</span>
              <button onClick={() => copyToClipboard(credentials.streamKey)}><Copy size={12} className="text-gray-500 hover:text-white" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const OwnerLivestreamsPage = () => {
  const [shows, setShows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchShows = async () => {
    setIsLoading(true)
    try {
      const res = await getShows({ mine: true, pageSize: 100 })
      if (res.success) {
        setShows(res.data.items.filter((s) => s.format === 'Online'))
      }
    } catch {
      toast.error('Không tải được danh sách show.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShows()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Vận hành Livestream</h1>

      {isLoading ? (
        <Loader2 size={24} className="animate-spin text-gray-500" />
      ) : shows.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
          Bạn chưa có buổi diễn nào ở định dạng Online (chỉ show Online mới có livestream).
        </div>
      ) : (
        <div className="space-y-4">
          {shows.map((show) => (
            <ShowLivestreamRow key={show.id} show={show} onChanged={fetchShows} />
          ))}
        </div>
      )}
    </div>
  )
}

export default OwnerLivestreamsPage
