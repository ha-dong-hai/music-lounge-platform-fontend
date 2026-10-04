// src/components/admin/dashboard/ViecCanXuLy.jsx
//
// MLACP-618: KHỐI "VIỆC CẦN XỬ LÝ" đầu trang Tổng quan — các hàng đợi đang có việc, xếp theo độ ưu tiên (utils/viecCho.js:
// quá hạn trước, rồi hạn gần nhất, rồi số việc). Đặt TRÊN các khối số liệu theo kỳ: việc phải làm ngay đứng trước số liệu
// để đọc (NN/g — dashboard vận hành ưu tiên hành động). Khối này là tình trạng LÚC NÀY, không theo bộ chọn kỳ.
//
// Cùng queryKey với huy hiệu trên menu (hooks/useHangDoiViec) nên hai nơi luôn cùng con số, chỉ tốn một yêu cầu.
// Mỗi dòng là một liên kết tới đúng trang đó. Quá hạn: chữ đỏ KÈM biểu tượng (WCAG 1.4.1 — không chỉ dựa vào màu).
// Màn hẹp: tên, số việc và hạn tự xuống dòng trong một vùng co giãn — không tràn ngang ở 390px.
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Clock, CheckCircle2 } from 'lucide-react'
import KhungTai from '../../bang/KhungTai'
import { useHangDoiViec } from '../../../hooks/useHangDoiViec'
import { sapXepTheoUuTien, moTaHan, duongDanCua } from '../../../utils/viecCho'
import { mucTheoDuong } from '../../../layouts/menuQuanTri'

const ViecCanXuLy = () => {
  const { data, isPending, isError, refetch } = useHangDoiViec()
  const ds = sapXepTheoUuTien(data)

  return (
    <section aria-labelledby="viec-can-xu-ly" className="space-y-4">
      {/* Cùng kiểu tiêu đề mục với mọi khối trang số liệu (components/bang/KhoiMuc — luật Q7, 04/10/2026). */}
      <h2 id="viec-can-xu-ly" className="font-sans text-xl font-bold text-ink">
        Việc cần xử lý <span className="ml-2 text-sm font-normal text-ink-mute">lúc này, không theo kỳ đã chọn</span>
      </h2>
      <KhungTai dangTai={isPending} loi={isError} taiLai={refetch} tenVung="việc cần xử lý" caoKhung="h-24"
        rong={ds.length === 0}
        noiDungRong={
          <p className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success flex-shrink-0" aria-hidden="true" />
            Không có việc nào đang chờ ở các hàng đợi.
          </p>
        }>
        <ul className="border-2 border-ink divide-y divide-line bg-card">
          {ds.map((v) => {
            const duong = duongDanCua(v.key)
            const muc = mucTheoDuong[duong]
            const Icon = muc?.icon
            const han = moTaHan(v)
            return (
              <li key={v.key}>
                <Link to={duong} className="flex items-center gap-3 px-4 min-h-[56px] hover:bg-sunken transition-colors">
                  {Icon && <Icon size={18} className="text-ink-soft flex-shrink-0" aria-hidden="true" />}
                  <span className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
                    <span className="font-semibold text-ink">{muc?.nhan ?? v.key}</span>
                    <span className="tabular-nums text-ink">{v.count} việc</span>
                    {han && (
                      <span className={`inline-flex items-center gap-1 text-sm ${han.quaHan ? 'text-danger font-semibold' : 'text-ink-soft'}`}>
                        {han.quaHan ? <AlertTriangle size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}
                        {han.chu}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={18} className="text-ink-mute flex-shrink-0" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      </KhungTai>
    </section>
  )
}

export default ViecCanXuLy
