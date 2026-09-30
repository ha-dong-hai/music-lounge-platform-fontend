import { Loader2, ChevronLeft, ChevronRight, Building2, FileText, ShieldAlert } from 'lucide-react'
import dayjs from 'dayjs'
import { VenueStatusBadge, LicenseBadge } from './VenueBadges'
import { anhChuCai } from '../../../utils/anhChuCai'

// Component thuần UI: nhận data đã lọc + callbacks từ cha.
// `onViewDossier` mở HỒ SƠ ĐÃ NỘP. Bản trước nút này là <Link to={`/lounge/{id}`}> mở thẳng trang
// giới thiệu công khai — xem mục "VÌ SAO CÓ FILE NÀY" trong VenueDossierModal.jsx.
const VenuesTable = ({ venues, isLoading, pagination, onPageChange, onViewDossier, onReview, onPenalize }) => {
  return (
    <div className="bg-card border border-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-sunken border-b-2 border-ink">
            <tr>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Phòng trà</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Chủ phòng trà</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Địa chỉ</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Giấy phép</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Trạng thái</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Ngày</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-ink-mute">
                  <Loader2 size={24} className="mx-auto animate-spin text-ink" />
                </td>
              </tr>
            ) : venues.length > 0 ? (
              venues.map(v => (
                <tr key={v.loungeId} className="hover:bg-sunken/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.primaryImageUrl || anhChuCai(v.name || 'V')}
                        alt={v.name}
                        className="w-10 h-10 object-cover border border-line flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-ink font-medium truncate">{v.name}</p>
                        <p className="text-xs text-ink-mute">#{v.loungeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-ink-soft font-medium">{v.ownerName}</p>
                    <p className="text-xs text-ink-mute mt-0.5">{v.ownerEmail}</p>
                    <p className="text-xs text-ink-mute">{v.ownerPhone}</p>
                  </td>
                  <td className="p-4 max-w-[240px]">
                    <p className="text-sm text-ink-soft truncate">{v.fullAddress || '—'}</p>
                  </td>
                  <td className="p-4"><LicenseBadge hasLicense={v.hasBusinessLicense} /></td>
                  <td className="p-4"><VenueStatusBadge status={v.status} /></td>
                  <td className="p-4 text-sm text-ink-soft">{dayjs(v.createdAt).format('DD/MM/YYYY')}</td>
                  <td className="p-4 text-right">
                    {/* "Xem hồ sơ" mở hồ sơ ĐÃ NỘP (chủ, địa chỉ, giấy phép kinh doanh) — đó mới là
                        thứ cần đọc trước khi bấm Duyệt. Liên kết sang trang công khai vẫn còn,
                        nhưng nằm bên trong hồ sơ như việc phụ. */}
                    <button
                      onClick={() => onViewDossier?.(v)}
                      className="inline-flex items-center gap-1.5 text-ink border border-ink/30 hover:bg-board/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                    >
                      <FileText size={12} /> Xem hồ sơ
                    </button>
                    {/* Phòng trà ở Pending không hiện công khai và không bán vé được — không duyệt
                        thì chủ phòng trà treo vô thời hạn. */}
                    {onReview && v.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => onReview(v, 'Approved')}
                          className="ml-2 inline-flex items-center gap-1.5 text-success border border-success/40 hover:bg-success/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => onReview(v, 'Rejected')}
                          className="ml-2 inline-flex items-center gap-1.5 text-danger border border-danger/40 hover:bg-danger/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {/* Ra án phạt: KHÔNG hiện cho hồ sơ chưa duyệt (Pending/Rejected) — phòng trà
                        chưa hoạt động thì phạt không có nghĩa, và duyệt hồ sơ là việc khác hẳn. */}
                    {onPenalize && !['Pending', 'Rejected'].includes(v.status) && (
                      <button
                        onClick={() => onPenalize(v)}
                        className="ml-2 inline-flex items-center gap-1.5 text-warning border border-warning/40 hover:bg-warning/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        <ShieldAlert size={12} /> Án phạt
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center text-ink-mute">
                  <Building2 size="32" className="mx-auto mb-3 opacity-50" />
                  Không tìm thấy venue nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!isLoading && venues.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-line">
          <p className="text-sm text-ink-mute">
            Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.totalCount} venue)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Trang trước">
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Trang sau">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VenuesTable