// src/components/myshows/WishlistTab.jsx
//
// TAB "YÊU THÍCH" của trang Vé của tôi: các buổi diễn người dùng đã lưu, in bằng cùng kiểu dòng với trang Buổi diễn.
// Bỏ lưu là gỡ dòng khỏi danh sách ngay; lỗi thì trả dòng về chỗ cũ và báo. Lỗi tải là trạng thái riêng có nút thử lại
// (bản cũ nuốt lỗi và hiện "danh sách trống" — nói sai sự thật).
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import DongBuoiDien from '../program/DongBuoiDien'
import { getWishlist, toggleWishlist } from '../../services/interactionServices'

const WishlistTab = () => {
  const [ds, setDs] = useState(null) // null = đang tải
  const [loi, setLoi] = useState(false)
  const [lanTai, setLanTai] = useState(0)
  const [dangBo, setDangBo] = useState(null)

  useEffect(() => {
    let huy = false
    getWishlist()
      .then((res) => {
        if (huy) return
        if (!res?.success) throw new Error('wishlist')
        setDs(res.data?.items ?? res.data ?? []); setLoi(false)
      })
      .catch(() => { if (!huy) { setLoi(true); setDs([]) } })
    return () => { huy = true }
  }, [lanTai])

  const boLuu = async (b) => {
    if (dangBo) return
    const truoc = ds
    setDangBo(b.id)
    setDs((cu) => cu.filter((x) => x.id !== b.id))
    try {
      await toggleWishlist(b.id, true)
      toast.success('Đã bỏ khỏi danh sách yêu thích.')
    } catch (err) {
      setDs(truoc)
      toast.error(err.response?.data?.message || 'Chưa bỏ được. Hãy thử lại.')
    } finally {
      setDangBo(null)
    }
  }

  if (ds === null) return <div className="h-64 border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải danh sách yêu thích" />
  if (loi) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
        <p>Danh sách yêu thích chưa tải được.</p>
        <button type="button" onClick={() => { setDs(null); setLanTai((n) => n + 1) }} className="min-h-[44px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Thử lại</button>
      </div>
    )
  }
  if (ds.length === 0) {
    return (
      <div className="border-2 border-ink p-6 sm:p-8">
        <p className="text-lg">Bạn chưa lưu buổi diễn nào.</p>
        <p className="text-ink-soft mt-1">Bấm “Lưu” ở một buổi diễn để giữ nó lại đây.</p>
        <Link to="/shows" className="inline-flex items-center min-h-[44px] mt-5 px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Xem các buổi diễn</Link>
      </div>
    )
  }
  return (
    <ol className="border-y-2 border-ink">
      {ds.map((b) => <DongBuoiDien key={b.id} b={b} daLuu dangLuu={dangBo === b.id} onDoiLuu={boLuu} />)}
    </ol>
  )
}

export default WishlistTab
