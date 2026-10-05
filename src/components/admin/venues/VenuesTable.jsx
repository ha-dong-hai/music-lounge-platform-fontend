import { Loader2, Building2, FileText, ShieldAlert } from 'lucide-react'
import dayjs from 'dayjs'
import DaCho from '../../bang/DaCho'
import { VenueStatusBadge, LicenseBadge } from './VenueBadges'
import { anhChuCai } from '../../../utils/anhChuCai'

// Component thuần UI: nhận data đã lọc + callbacks từ cha.
// `onViewDossier` mở HỒ SƠ ĐÃ NỘP. Bản trước nút này là <Link to={`/lounge/{id}`}> mở thẳng trang
// giới thiệu công khai — xem mục "VÌ SAO CÓ FILE NÀY" trong VenueDossierModal.jsx.
const VenuesTable = ({ venues, isLoading, onViewDossier, onReview, onPenalize }) => {
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
                <tr key={v.loungeId} className="hover:bg-sunken transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.primaryImageUrl || anhChuCai(v.name || 'V')}
                        alt={v.name}
                        className="w-10 h-10 object-cover border border-line flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-ink font-medium truncate">{v.name}</p>
                        {v.fullAddress && <p className="text-xs text-ink-mute truncate">{v.fullAddress}</p>}
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
                  <td className="p-4 text-sm text-ink-soft">
                    {dayjs(v.createdAt).format('DD/MM/YYYY')}
                    {/* Chỉ hồ sơ ĐANG CHỜ DUYỆT mới có tuổi chờ; hồ sơ đã quyết thì ngày nộp là đủ. */}
                    {v.status === 'Pending' && <span className="block mt-1"><DaCho luc={v.createdAt} /></span>}
                  </td>
                  <td className="p-4 text-right">
                    {/* "Xem hồ sơ" mở hồ sơ ĐÃ NỘP (chủ, địa chỉ, giấy phép kinh doanh) — đó mới là
                        thứ cần đọc trước khi bấm Duyệt. Liên kết sang trang công khai vẫn còn,
                        nhưng nằm bên trong hồ sơ như việc phụ. */}
                    <button
                      onClick={() => onViewDossier?.(v)}
                      className="inline-flex items-center gap-1.5 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp"
                    >
                      <FileText size={12} /> Xem hồ sơ
                    </button>
                    {/* Phòng trà ở Pending không hiện công khai và không bán vé được — không duyệt
                        thì chủ phòng trà treo vô thời hạn. */}
                    {onReview && v.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => onReview(v, 'Approved')}
                          className="ml-2 inline-flex items-center gap-1.5 justify-center min-h-[44px] px-4 border-2 border-success bg-card text-success text-sm font-semibold hover:bg-success hover:text-lamp"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => onReview(v, 'Rejected')}
                          className="ml-2 inline-flex items-center gap-1.5 justify-center min-h-[44px] px-4 border-2 border-danger bg-card text-danger text-sm font-semibold hover:bg-danger hover:text-lamp"
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
                        className="ml-2 inline-flex items-center gap-1.5 justify-center min-h-[44px] px-4 border-2 border-warning bg-card text-warning text-sm font-semibold hover:bg-warning hover:text-board"
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

    </div>
  )
}

export default VenuesTable