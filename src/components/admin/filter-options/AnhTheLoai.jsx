// src/components/admin/filter-options/AnhTheLoai.jsx
//
// Ô "ẢNH TRÊN TRANG CHỦ" của một thể loại (MLACP-581, 03/10/2026). Chủ dự án hỏi vì sao trang Admin không có chỗ thêm
// ảnh cho thể loại: trước đây thẻ thể loại ở trang chủ chỉ MƯỢN ảnh của một buổi hòa nhạc thuộc thể loại đó.
// Ảnh riêng KHÔNG bắt buộc — chưa đặt thì trang chủ vẫn mượn ảnh như cũ, nên ô này nói rõ điều đó thay vì để trống.
//
// - Chọn tệp là LƯU NGAY (tải lên /uploads/images → PUT /admin/genres/{id}/image). Không đi qua form "Sửa": PUT sửa tên
//   ghi đè mọi trường nó nhận, nên ảnh có endpoint riêng (backend) và nút riêng (đây).
// - "Gỡ ảnh" → DELETE …/image: thẻ quay về mượn ảnh buổi diễn.
import { useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadImage } from '../../../services/userServices'
import { setGenreImage, clearGenreImage } from '../../../services/adminServices'

const NUT = 'inline-flex items-center gap-1.5 justify-center min-h-[44px] px-3 text-sm font-semibold transition-colors disabled:opacity-40'

const AnhTheLoai = ({ theLoai, onDoi }) => {
  const [dangLam, setDangLam] = useState(false)
  const anh = theLoai.imageUrl

  const datAnh = async (file) => {
    if (!file) return
    setDangLam(true)
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      const res = await setGenreImage(theLoai.id, up.data?.url ?? up.data)
      if (!res.success) throw new Error(res.message)
      toast.success(`Đã đặt ảnh cho "${theLoai.name}".`)
      onDoi()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không đặt được ảnh.')
    } finally { setDangLam(false) }
  }

  const goAnh = async () => {
    setDangLam(true)
    try {
      const res = await clearGenreImage(theLoai.id)
      if (!res.success) throw new Error(res.message)
      toast.success(`Đã gỡ ảnh — "${theLoai.name}" quay về dùng ảnh buổi hòa nhạc.`)
      onDoi()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không gỡ được ảnh.')
    } finally { setDangLam(false) }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 whitespace-normal">
      {anh
        ? <img src={anh} alt={`Ảnh thể loại ${theLoai.name}`} className="w-20 aspect-[4/3] object-cover border border-ink flex-shrink-0" />
        : <span className="text-xs text-ink-mute max-w-[9rem] leading-snug" title="Trang chủ đang mượn ảnh của một buổi hòa nhạc thuộc thể loại này">Chưa đặt · đang dùng ảnh buổi diễn</span>}
      <div className="flex gap-2">
        <label className={`${NUT} cursor-pointer border-2 border-ink bg-card text-ink hover:bg-ink hover:text-lamp ${dangLam ? 'pointer-events-none opacity-40' : ''}`}>
          {dangLam ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Upload size={14} aria-hidden="true" />}
          {anh ? 'Đổi ảnh' : 'Đặt ảnh'}
          <input type="file" accept="image/*" className="sr-only" disabled={dangLam} aria-label={`${anh ? 'Đổi' : 'Đặt'} ảnh cho thể loại ${theLoai.name}`}
            onChange={(e) => { datAnh(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {anh && (
          <button type="button" onClick={goAnh} disabled={dangLam} aria-label={`Gỡ ảnh của thể loại ${theLoai.name}`}
            className={`${NUT} bg-line/30 text-ink-soft hover:bg-danger/15 hover:text-danger`}>
            <X size={14} aria-hidden="true" /> Gỡ ảnh
          </button>
        )}
      </div>
    </div>
  )
}

export default AnhTheLoai
