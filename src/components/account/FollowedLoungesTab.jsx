// src/components/account/FollowedLoungesTab.jsx
//
// LÀM LẠI 30/09/2026:
// - Sửa lỗi: khối catch của "Tắt thông báo" không nhận `err` mà vẫn đọc `err.response` → ReferenceError, lỗi mạng
//   biến thành lỗi JavaScript không ai thấy thay vì một thông báo.
// - Hai nút nằm TRONG <Link> (HTML cấm phần tử tương tác lồng nhau; bản cũ phải chặn preventDefault) → mỗi phòng
//   trà là một dòng: tên là liên kết, hai nút đứng riêng bên phải.
// - Tải hỏng là trạng thái riêng có nút thử lại (bản cũ console.log rồi in "Bạn chưa theo dõi phòng trà nào" — sai).
// - "Tắt thông báo" là nút bật/tắt có aria-pressed; bỏ theo dõi xong có thể hoàn tác ngay trong thông báo.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BellOff, Bell } from 'lucide-react'
import { getFollowedLounges, toggleFollowLounge, getMutedLounges, muteLounge, unmuteLounge } from '../../services/interactionServices'
import { anhChuCai } from '../../utils/anhChuCai'

const NUT = 'inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 border-2 text-sm font-semibold transition-colors disabled:opacity-60'

const FollowedLoungesTab = () => {
  const [ds, setDs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loiTai, setLoiTai] = useState(false)
  // Trần: 100 phòng trà đầu (backend kẹp pageSize 100). Danh sách cập nhật lạc quan + Hoàn tác nên giữ một mảng tại chỗ
  // thay vì phân trang máy chủ; vượt 100 thì nói ra. Đường nâng cấp: useDanhSachMayChu + PhanTrang (bỏ theo dõi thì taiLai).
  const [tongTheoDoi, setTongTheoDoi] = useState(0)
  const [dangBo, setDangBo] = useState(null)
  // Tắt thông báo KHÁC với bỏ theo dõi: vẫn theo dõi để phòng trà còn trong danh sách,
  // nhưng không nhận thông báo mỗi lần họ đăng buổi diễn mới.
  const [mutedIds, setMutedIds] = useState([])
  const [dangTat, setDangTat] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoiTai(false)
    try {
      const res = await getFollowedLounges({ page: 1, pageSize: 100 })
      if (!res.success) throw new Error('theo-doi')
      setDs(res.data.items || [])
      setTongTheoDoi(res.data.totalCount ?? (res.data.items || []).length)
    } catch {
      setLoiTai(true)
    } finally {
      setIsLoading(false)
    }
    try {
      const res = await getMutedLounges()
      if (res.success) setMutedIds((res.data ?? []).map((m) => m.loungeId ?? m.id))
    } catch {
      // Danh sách phụ: hỏng thì mọi nút hiện "Tắt thông báo" — bấm vẫn đúng, chỉ không biết trạng thái cũ.
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const doiThongBao = async (lounge) => {
    if (dangTat) return
    const daTat = mutedIds.includes(lounge.id)
    setDangTat(lounge.id)
    try {
      if (daTat) {
        await unmuteLounge(lounge.id)
        setMutedIds((p) => p.filter((x) => x !== lounge.id))
      } else {
        await muteLounge(lounge.id)
        setMutedIds((p) => [...p, lounge.id])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa đổi được thông báo. Hãy thử lại.')
    } finally {
      setDangTat(null)
    }
  }

  const theoDoiLai = async (lounge, viTri) => {
    try {
      await toggleFollowLounge(lounge.id, false) // false = đang không theo dõi → BE POST
      setDs((p) => { const moi = [...p]; moi.splice(Math.min(viTri, moi.length), 0, lounge); return moi })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa theo dõi lại được.')
    }
  }

  // Cập nhật lạc quan: bỏ khỏi danh sách ngay, lỗi thì trả lại.
  const boTheoDoi = async (lounge) => {
    if (dangBo) return
    setDangBo(lounge.id)
    const truoc = ds
    const viTri = ds.findIndex((l) => l.id === lounge.id)
    setDs((p) => p.filter((l) => l.id !== lounge.id))
    try {
      await toggleFollowLounge(lounge.id, true) // true = đang theo dõi → BE DELETE
      toast((t) => (
        <span className="flex items-center gap-3">
          Đã bỏ theo dõi {lounge.name}.
          <button type="button" className="underline font-semibold min-h-[44px]" onClick={() => { toast.dismiss(t.id); theoDoiLai(lounge, viTri) }}>Hoàn tác</button>
        </span>
      ), { duration: 8000 })
    } catch (err) {
      setDs(truoc)
      toast.error(err.response?.data?.message || 'Chưa bỏ theo dõi được. Hãy thử lại.')
    } finally {
      setDangBo(null)
    }
  }

  return (
    <section aria-labelledby="theo-doi-td">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h2 id="theo-doi-td" className="text-4xl">
          Phòng trà đang theo dõi{!isLoading && !loiTai && <span className="font-mono text-xl text-ink-mute"> · {ds.length}</span>}
        </h2>
        <Link to="/lounges" className="inline-flex items-center min-h-[44px] font-semibold underline underline-offset-4">Tìm phòng trà khác</Link>
      </div>

      {isLoading ? (
        <div className="h-48 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải danh sách theo dõi" />
      ) : loiTai ? (
        <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
          <p>Danh sách theo dõi chưa tải được.</p>
          <button type="button" onClick={load} className={`${NUT} border-ink hover:bg-ink hover:text-lamp`}>Thử lại</button>
        </div>
      ) : ds.length === 0 ? (
        <div className="border-2 border-ink p-6">
          <p>Bạn chưa theo dõi phòng trà nào. Theo dõi một phòng trà để được báo khi họ đăng buổi diễn mới.</p>
          <Link to="/lounges" className="inline-flex items-center min-h-[44px] mt-2 font-semibold underline underline-offset-4">Xem các phòng trà</Link>
        </div>
      ) : (
        <>
        {tongTheoDoi > 100 && (
          <p role="note" className="mb-3 text-sm text-ink-soft">
            Đang hiện 100 phòng trà đầu tiên trên {tongTheoDoi.toLocaleString('vi-VN')} phòng trà bạn theo dõi.
          </p>
        )}
        <ul className="border-y-2 border-ink divide-y divide-ink/20">
          {ds.map((l) => {
            const daTat = mutedIds.includes(l.id)
            return (
              <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
                <img src={l.primaryImageUrl || anhChuCai(l.name)} alt="" width="64" height="64" loading="lazy" className="w-16 h-16 object-cover border border-ink flex-shrink-0" />
                <div className="min-w-0 flex-1 basis-40">
                  <Link to={`/lounge/${l.id}`} className="font-display text-2xl leading-tight break-words hover:underline underline-offset-4 decoration-1">{l.name}</Link>
                  <p className="text-ink-mute">{[l.district, l.city].filter(Boolean).join(', ')}</p>
                  {daTat && <p className="text-sm text-ink-soft inline-flex items-center gap-1 mt-0.5"><BellOff size={14} aria-hidden="true" /> Không nhận thông báo buổi diễn mới</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-pressed={daTat} onClick={() => doiThongBao(l)} disabled={dangTat === l.id}
                    aria-label={`Tắt thông báo từ ${l.name}`}
                    className={`${NUT} ${daTat ? 'border-ink bg-ink text-lamp' : 'border-ink hover:bg-ink hover:text-lamp'}`}>
                    {daTat ? <BellOff size={16} aria-hidden="true" /> : <Bell size={16} aria-hidden="true" />} Tắt thông báo
                  </button>
                  <button type="button" onClick={() => boTheoDoi(l)} disabled={dangBo === l.id}
                    aria-label={`Bỏ theo dõi ${l.name}`}
                    className={`${NUT} border-ink/40 text-ink-soft hover:border-danger hover:text-danger`}>
                    Bỏ theo dõi
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        </>
      )}
    </section>
  )
}

export default FollowedLoungesTab
