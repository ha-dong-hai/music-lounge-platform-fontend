// src/components/admin/venues/VenueDossierModal.jsx
//
// HỒ SƠ PHÒNG TRÀ ĐÃ NỘP — thứ Admin cần đọc TRƯỚC KHI bấm Duyệt hay Từ chối.
//
// VÌ SAO CÓ FILE NÀY
// Nút "Xem" ở bảng duyệt phòng trà trước đây dẫn sang `/lounge/{id}` — TRANG GIỚI THIỆU CÔNG KHAI.
// Trang đó dựng cho khán giả đi xem nhạc: ảnh không gian, lịch diễn, nút theo dõi, thực đơn. Nó
// không trả lời được câu hỏi của người đang duyệt: chủ là ai, địa chỉ nào, đã nộp giấy phép kinh
// doanh chưa, giấy đó có thật không. Duyệt một hồ sơ mà chỉ nhìn trang tiếp thị của nó thì việc
// duyệt chỉ còn là hình thức.
//
// (Nút cũ KHÔNG hỏng — `GetLoungeDetailQueryHandler` cho Admin và chính chủ xem được cả phòng trà
// chưa duyệt. Nó chỉ dẫn sai chỗ.)
//
// GIẤY PHÉP KINH DOANH LÀ FILE RIÊNG TƯ
// Backend chuyển file sang vùng lưu riêng ngay khi nhận (SetLoungeBusinessLicenseCommandHandler:47
// gọi `RelocateToPrivateAsync`), nên KHÔNG có URL nào mở thẳng được. Phải gọi
// `GET /lounges/{id}/business-license` để lấy chính file nhị phân. Quyền: chủ phòng trà đó hoặc
// Admin (GetLoungeBusinessLicenseQueryHandler:40). Admin xem thì backend GHI LOG lại
// (dòng 52-56) — đây là giấy tờ định danh doanh nghiệp, không phải ảnh quảng cáo.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X, ExternalLink, FileText, Loader2, Building2, User, MapPin, CalendarDays, AlertTriangle,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getLoungeBusinessLicense } from '../../../services/loungeServices'
import { VenueStatusBadge, LicenseBadge } from './VenueBadges'
import HopThoai, { TieuDeHop } from '../../shared/HopThoai'
import { maNgan } from '../../../utils/format'

const Dong = ({ icon: Icon, nhan, children }) => (
  <div className="flex items-start gap-3 py-3 border-b border-line last:border-b-0">
    <Icon size={16} className="text-ink-mute flex-shrink-0 mt-0.5" />
    <div className="min-w-0 flex-1">
      <p className="text-xs text-ink-mute mb-0.5">{nhan}</p>
      <div className="text-sm text-ink break-words">{children || <span className="text-ink-mute">—</span>}</div>
    </div>
  </div>
)

const VenueDossierModal = ({ venue, onClose, onReview }) => {
  const [dangMo, setDangMo] = useState(false)

  // Cùng cách làm với OwnerLoungePage và AdminKycReviewsPage: xin blob rồi mở tab mới, thu hồi
  // object URL muộn một nhịp vì thu hồi ngay thì tab vừa mở chưa kịp đọc xong.
  const moGiayPhep = async () => {
    setDangMo(true)
    try {
      const blob = await getLoungeBusinessLicense(venue.loungeId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không mở được giấy phép kinh doanh.')
    } finally {
      setDangMo(false)
    }
  }

  const choDuyet = venue.status === 'Pending'

  return (
    <HopThoai onDong={onClose} className="max-w-2xl flex flex-col max-h-[90vh]">

        <div className="flex-none flex justify-between items-start gap-4 p-5 border-b border-line">
          <div className="min-w-0">
            <TieuDeHop><h2 className="text-3xl text-ink truncate">Hồ sơ phòng trà đã nộp</h2></TieuDeHop>
            <p className="text-xs text-ink-mute mt-0.5">#{maNgan(venue.loungeId)} · {venue.name}</p>
          </div>
          <button onClick={onClose} aria-label="Đóng hồ sơ" className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <VenueStatusBadge status={venue.status} />
            <LicenseBadge hasLicense={venue.hasBusinessLicense} />
          </div>

          <div className="border border-line bg-sunken/40 px-4">
            <Dong icon={Building2} nhan="Tên phòng trà">{venue.name}</Dong>
            <Dong icon={User} nhan="Chủ phòng trà">
              <p className="font-medium">{venue.ownerName}</p>
              <p className="text-ink-soft text-xs mt-0.5">{venue.ownerEmail}</p>
              <p className="text-ink-soft text-xs">{venue.ownerPhone}</p>
            </Dong>
            <Dong icon={MapPin} nhan="Địa chỉ đăng ký">{venue.fullAddress}</Dong>
            <Dong icon={CalendarDays} nhan="Ngày nộp hồ sơ">
              {venue.createdAt ? dayjs(venue.createdAt).format('HH:mm · DD/MM/YYYY') : null}
            </Dong>
          </div>

          {/* GIẤY PHÉP KINH DOANH — phần quan trọng nhất của việc duyệt */}
          <div className="mt-4 border border-line p-4">
            <p className="text-sm font-semibold text-ink mb-1">Giấy phép kinh doanh</p>
            {venue.hasBusinessLicense ? (
              <>
                <p className="text-xs text-ink-soft leading-relaxed mb-3">
                  File được lưu ở vùng riêng tư nên mở trong tab mới. Mỗi lần Admin mở đều được hệ
                  thống ghi lại.
                </p>
                <button
                  onClick={moGiayPhep}
                  disabled={dangMo}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-bold hover:bg-board disabled:opacity-60 transition-colors"
                >
                  {dangMo ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                  Mở giấy phép kinh doanh
                </button>
              </>
            ) : (
              <div className="flex items-start gap-2 mt-1">
                <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-ink-soft leading-relaxed">
                  Chủ phòng trà <strong className="text-ink font-semibold">chưa nộp</strong> giấy phép
                  kinh doanh. Không có giấy này thì không có gì để đối chiếu với tên và địa chỉ ở trên.
                </p>
              </div>
            )}
          </div>

          {/* Trang công khai vẫn hữu ích, nhưng là việc PHỤ: xem hồ sơ này sẽ hiện ra sao với khán giả. */}
          <Link
            to={`/lounge/${venue.loungeId}`}
            target="_blank"
            className="inline-flex items-center gap-2 min-h-[44px] mt-4 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ExternalLink size={14} /> Xem trang công khai của phòng trà này
          </Link>
        </div>

        {/* Quyết định nằm ngay dưới hồ sơ: người duyệt bấm khi đang nhìn thấy thứ mình vừa đọc,
            không phải đóng hộp thoại rồi đi tìm lại đúng dòng trong bảng. */}
        {choDuyet && onReview && (
          <div className="flex-none flex flex-wrap justify-end gap-3 p-5 border-t border-line">
            <button
              onClick={() => onReview(venue, 'Rejected')}
              className="min-h-[44px] px-5 border border-danger/40 text-danger text-sm font-bold hover:bg-danger/10 transition-colors"
            >
              Từ chối
            </button>
            <button
              onClick={() => onReview(venue, 'Approved')}
              className="min-h-[44px] px-5 border border-success/40 text-success text-sm font-bold hover:bg-success/10 transition-colors"
            >
              Duyệt
            </button>
          </div>
        )}
      </HopThoai>
  )
}

export default VenueDossierModal
