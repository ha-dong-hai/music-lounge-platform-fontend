// src/components/program/TheGu.jsx
//
// THẺ GU (trang chủ, 03/10/2026) — mỗi dòng nhạc đang có buổi sắp diễn là một tấm thẻ ảnh lớn + số đêm + các đêm gần nhất;
// bấm là sang /shows lọc đúng dòng nhạc đó. Hiện LUÔN (không gập), đặt trên danh sách gu đầy đủ (vẫn gập như cũ).
// Vì sao: khối "Tìm theo gu" bản cũ gập kín — trang chủ chỉ thấy mỗi tiêu đề. Kệ theo chủ đề của Candlelight/Fever và
// duyệt theo thể loại của Songkick (reports/Trang chủ - buổi diễn nổi bật.md).
//
// - Đếm theo MỌI thể loại của buổi (một buổi gắn Bolero + Trữ tình được đếm ở cả hai), không chỉ thể loại đầu.
// - Ảnh: ưu tiên mỗi thẻ một buổi KHÁC nhau (bản xem thử 03/10: Sài Gòn Đêm Mưa gắn 3 dòng nhạc → 3 thẻ cùng một ảnh).
//   Hết buổi chưa dùng thì mới lặp; buổi không ảnh bìa thì ảnh phòng trà; không có gì thì CoverFallback.
// - Tối đa SO_THE thẻ (dòng nhiều buổi nhất trước); phần còn lại vẫn ở danh sách gu đầy đủ bên dưới.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ngayGon } from '../../utils/ngayVietNam'
import CoverFallback from '../shared/CoverFallback'

const SO_THE = 4

const TheGu = ({ buoi = [], anhPhongTra = {} }) => {
  const the = useMemo(() => {
    const nhom = new Map()
    buoi.forEach((b) => (b.genres ?? []).forEach((g) => {
      if (!nhom.has(g.id)) nhom.set(g.id, { id: g.id, ten: g.name, ds: [] })
      nhom.get(g.id).ds.push(b)
    }))
    const xep = [...nhom.values()].sort((a, b) => b.ds.length - a.ds.length || a.ten.localeCompare(b.ten, 'vi')).slice(0, SO_THE)
    // Gán ảnh cho thẻ ÍT lựa chọn nhất trước (bản đầu gán theo thứ tự hiện → thẻ Bolero lấy mất ảnh duy nhất của Trữ tình
    // và Acoustic, cả ba trùng một ảnh — đo 03/10). Thứ tự HIỆN vẫn theo `xep`.
    const daDung = new Set()
    const anhCua = new Map()
    ;[...xep].sort((a, b) => a.ds.filter((x) => x.thumbnail).length - b.ds.filter((x) => x.thumbnail).length).forEach((t) => {
      const coAnh = t.ds.filter((b) => b.thumbnail)
      const chon = coAnh.find((b) => !daDung.has(b.id)) ?? coAnh[0] ?? t.ds[0]
      daDung.add(chon.id)
      anhCua.set(t.id, chon.thumbnail || anhPhongTra[chon.loungeName] || null)
    })
    return xep.map((t) => ({ ...t, anh: anhCua.get(t.id) }))
  }, [buoi, anhPhongTra])

  if (the.length === 0) return null

  return (
    <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10">
      {the.map((t) => (
        <li key={t.id}>
          <Link to={`/shows?the=${t.id}`} className="group block relative aspect-[4/5] overflow-hidden border-2 border-ink bg-board">
            {t.anh
              ? <img src={t.anh} alt="" loading="lazy" width="480" height="600" className="absolute inset-0 w-full h-full object-cover opacity-60 transition-[opacity,transform] duration-500 group-hover:opacity-75 motion-safe:group-hover:scale-[1.03]" />
              : <CoverFallback className="absolute inset-0" />}
            <div className="absolute inset-x-0 bottom-0 bg-board p-4 sm:p-5 text-lamp">
              <p className="font-mono text-xs tracking-[0.15em] text-lamp-mute">{t.ds.length} ĐÊM SẮP DIỄN</p>
              <p className="font-display text-3xl leading-none mt-1.5">{t.ten}</p>
              <p className="text-sm text-lamp-mute mt-2 truncate">
                {t.ds.slice(0, 3).map((b) => `${ngayGon(b.start_date)} ${b.loungeName.replace(/^Phòng trà\s+/i, '')}`).join(' · ')}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default TheGu
