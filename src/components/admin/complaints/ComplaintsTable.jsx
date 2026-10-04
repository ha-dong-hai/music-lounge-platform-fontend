import { Eye, Loader2, MessageSquareWarning } from 'lucide-react'
import dayjs from 'dayjs'
import DaCho from '../../bang/DaCho'
import { CategoryBadge, StatusBadge, TARGET_TYPE_LABELS } from './ComplaintBadges'
import { maNgan } from '../../../utils/format'

// Component thuần UI: nhận data đã lọc + callbacks từ cha
const ComplaintsTable = ({ complaints, isLoading, onViewDetail }) => {
  return (
    <div className="bg-card border border-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-sunken border-b-2 border-ink">
            <tr>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">#ID</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Phân loại</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Nội dung</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Đối tượng</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Số điện thoại</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Trạng thái</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Ngày gửi</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="p-10 text-center text-ink-mute">
                  <Loader2 size={24} className="mx-auto animate-spin text-ink" />
                </td>
              </tr>
            ) : complaints.length > 0 ? (
              complaints.map(c => (
                <tr key={c.id} className="hover:bg-sunken/30 transition-colors cursor-pointer" onClick={() => onViewDetail(c)}>
                  <td className="p-4 font-mono text-xs text-ink">#{maNgan(c.id)}</td>
                  <td className="p-4"><CategoryBadge category={c.category} /></td>
                  <td className="p-4 max-w-[280px]">
                    <p className="text-sm text-ink-soft truncate">{c.description || '—'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-ink-soft">
                      {TARGET_TYPE_LABELS[c.targetType] || c.targetType} <span className="text-ink-mute">#{maNgan(c.targetId)}</span>
                    </p>
                  </td>
                  <td className="p-4 text-sm text-ink-soft font-mono">{c.contactPhone || '—'}</td>
                  <td className="p-4"><StatusBadge status={c.status} /></td>
                  <td className="p-4 text-sm text-ink-soft">
                    {dayjs(c.createdAt).format('HH:mm DD/MM/YYYY')}
                    {/* Khiếu nại CHƯA xử lý xong (chưa có resolvedAt) mới ghi tuổi chờ. */}
                    {!c.resolvedAt && <span className="block mt-1"><DaCho luc={c.createdAt} /></span>}
                  </td>
                  <td className="p-4 text-center">
                    {/* Cả hàng bấm được bằng chuột, nhưng <tr> không nhận focus: nút này là lối vào cho bàn phím và trình đọc màn
                        hình. Bản cũ là một nút KHÔNG có onClick (chỉ ăn theo sự kiện của hàng) và không có tên. */}
                    <button type="button" onClick={(e) => { e.stopPropagation(); onViewDetail(c) }} aria-label={`Xem khiếu nại #${maNgan(c.id)}`} className="w-11 h-11 border-2 border-ink text-ink hover:bg-ink hover:text-lamp transition-colors inline-flex items-center justify-center">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-10 text-center text-ink-mute">
                  <MessageSquareWarning size="32" className="mx-auto mb-3 opacity-50" />
                  Chưa có khiếu nại nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
    </div>
  )
}

export default ComplaintsTable