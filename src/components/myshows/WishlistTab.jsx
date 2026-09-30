// src/components/myshows/WishlistTab.jsx
//
// TAB "YÊU THÍCH" của trang Vé của tôi: các buổi diễn người dùng đã lưu, in bằng cùng kiểu dòng với trang Buổi diễn.
// Bỏ lưu là gỡ dòng khỏi danh sách ngay; lỗi thì trả dòng về chỗ cũ và báo. Lỗi tải là trạng thái riêng có nút thử lại
// (bản cũ nuốt lỗi và hiện "danh sách trống" — nói sai sự thật).
// PHÂN TRANG (01/10/2026): bản cũ gọi GET /wishlist không tham số → backend trả trang đầu 10 mục (WishlistController,
// pageSize mặc định 10) và không có nút trang tiếp: buổi lưu thứ 11 trở đi không bao giờ hiện. Nay dùng
// hooks/useDanhSachMayChu (tiền tố URL 'thich' vì trang Vé của tôi còn tab khác).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import DongBuoiDien from '../program/DongBuoiDien'
import { getWishlist, toggleWishlist } from '../../services/interactionServices'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../bang/PhanTrang'

const WishlistTab = () => {
  const dsTrang = useDanhSachMayChu({ khoa: ['yeu-thich'], goi: getWishlist, tien: 'thich' })
  // Dòng vừa bỏ lưu ẩn ngay (không chờ tải lại); lỗi thì hiện lại. Tải lại xong thì dòng đó tự không còn trong dữ liệu.
  const [daBo, setDaBo] = useState(() => new Set())
  const [dangBo, setDangBo] = useState(null)
  const ds = dsTrang.dangTai ? null : dsTrang.items.filter((b) => !daBo.has(b.id))
  const loi = Boolean(dsTrang.loi)

  const boLuu = async (b) => {
    if (dangBo) return
    setDangBo(b.id)
    setDaBo((cu) => new Set(cu).add(b.id))
    try {
      await toggleWishlist(b.id, true)
      toast.success('Đã bỏ khỏi danh sách yêu thích.')
      // Tải lại để dòng của trang sau dồn lên và dòng đếm đúng; hook tự kẹp về trang cuối nếu trang này hết dòng.
      await dsTrang.taiLai()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa bỏ được. Hãy thử lại.')
    } finally {
      setDaBo((cu) => { const moi = new Set(cu); moi.delete(b.id); return moi })
      setDangBo(null)
    }
  }
  if (ds === null) return <div className="h-64 border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải danh sách yêu thích" />
  if (loi) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
        <p>Danh sách yêu thích chưa tải được.</p>
        <button type="button" onClick={() => dsTrang.taiLai()} className="min-h-[44px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Thử lại</button>
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
    <div className="space-y-4">
      <PhanTrang ds={dsTrang} tenDonVi="buổi đã lưu" idDanhSach="ds-yeu-thich" />
      <ol id="ds-yeu-thich" tabIndex={-1} className={`border-y-2 border-ink focus:outline-none ${dsTrang.laDuLieuCu ? 'opacity-60' : ''}`}>
        {ds.map((b) => <DongBuoiDien key={b.id} b={b} daLuu dangLuu={dangBo === b.id} onDoiLuu={boLuu} />)}
      </ol>
      <PhanTrang ds={dsTrang} tenDonVi="buổi đã lưu" idDanhSach="ds-yeu-thich" />
    </div>
  )
}

export default WishlistTab
