// src/components/program/BiaDia.jsx
//
// BÌA ĐĨA + ĐĨA THAN 3D — nửa ảnh ở đầu trang buổi diễn. Ảnh buổi diễn (hoặc ảnh phòng trà) in thành BÌA ĐĨA vuông bằng
// <img> HTML; đĩa than three.js (DiaThanCanvas, tải lười) nằm sau bìa và ló ra bên phải. 03/10/2026 — chủ dự án: "chưa
// thấy thành phần three.js nào thể hiện nét hiện đại, công nghệ, có tính tương tác với khách hàng".
//
// VÌ SAO TÁCH HAI PHẦN:
//  - Bìa là HTML nên hiện NGAY khi trang tải (là phần tử lớn nhất của khung nhìn đầu) và đọc được ảnh Firebase không cần
//    CORS; three.js (~vài trăm kB) chỉ tải sau, không chặn trang. Máy không có WebGL / WebGL quá yếu
//    (failIfMajorPerformanceCaveat) → chỉ còn bìa, như một ảnh tĩnh — trang vẫn đủ thông tin.
//  - Kích thước khung theo đơn vị container (cqw/cqh): khung = bìa vuông + phần đĩa ló ra, tỉ lệ 17:10, luôn vừa ô ảnh
//    của đầu trang ở mọi cỡ màn hình mà không cần đo bằng JS.
//
// NÚT QUAY/DỪNG ĐĨA (aria-pressed): đường tương đương bàn phím cho thao tác kéo quay, và là nút DỪNG mà WCAG 2.2.2 đòi
// cho chuyển động tự chạy (buổi đang diễn thì đĩa tự quay). Giảm chuyển động: mặc định không tự quay.
import { lazy, Suspense, useCallback, useState } from 'react'
import { Disc3, Pause } from 'lucide-react'
import CoverFallback from '../shared/CoverFallback'

const DiaThanCanvas = lazy(() => import('./DiaThanCanvas'))

const giamChuyenDong = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const BiaDia = ({ anh, alt, ten, phongTra, ngay, soTietMuc = 0, dangDien = false }) => {
  const [quay, setQuay] = useState(() => dangDien && !giamChuyenDong())
  const [coWebgl, setCoWebgl] = useState(true)
  const khongHoTro = useCallback(() => setCoWebgl(false), [])

  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden [container-type:size]">
      <div className="relative aspect-[17/10] w-[min(90cqw,129cqh)]">
        {coWebgl && (
          <Suspense fallback={null}>
            <DiaThanCanvas ten={ten} phongTra={phongTra} ngay={ngay} soTietMuc={soTietMuc} dangDien={dangDien}
              quay={quay} onKhongHoTro={khongHoTro} />
          </Suspense>
        )}
        {/* Bìa nằm TRÊN canvas nhưng bỏ qua sự kiện chuột: kéo/rê ở đâu trong khung cũng tới đĩa. */}
        <div className="absolute inset-y-0 left-0 aspect-square z-10 pointer-events-none bg-board-soft shadow-lift ring-1 ring-lamp/10">
          {anh ? <img src={anh} alt={alt} fetchPriority="high" className="w-full h-full object-cover" /> : <CoverFallback />}
        </div>
      </div>
      {coWebgl && (
        <button type="button" onClick={() => setQuay((v) => !v)} aria-pressed={quay}
          className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-2 min-h-[44px] px-3 text-sm font-semibold text-lamp hover:text-stock">
          {quay ? <Pause size={18} strokeWidth={1.75} aria-hidden="true" /> : <Disc3 size={18} strokeWidth={1.75} aria-hidden="true" />}
          {quay ? 'Dừng đĩa' : 'Quay đĩa'}
        </button>
      )}
    </div>
  )
}

export default BiaDia
