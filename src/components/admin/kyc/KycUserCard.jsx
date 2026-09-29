// src/components/admin/kyc/KycUserCard.jsx
import dayjs from 'dayjs'
import { IdCard, FileText, ExternalLink, AlertTriangle, ShieldAlert } from 'lucide-react'
import KycDocBlock from './KycDocBlock'

const KycUserCard = ({ item, onViewImage, onReview }) => (
  <li className="bg-card border border-line rounded-xl p-5">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <p className="text-ink font-bold">{item.fullName}</p>
        <p className="text-xs text-ink-mute mt-0.5">{item.email}</p>
        {item.dateOfBirth && (
          <p className="text-xs text-ink-mute mt-0.5">Ngày sinh: {dayjs(item.dateOfBirth).format('DD/MM/YYYY')}</p>
        )}
      </div>
      {item.hasBusinessLicense && (
        <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs">Có giấy phép kinh doanh</span>
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

      {/* ===== CCCD ===== */}
      <KycDocBlock
        icon={IdCard}
        title="Căn cước công dân"
        status={item.citizenCardReviewStatus}
        coDuLieu={!!item.citizenCardSubmittedAt}
        onApprove={() => onReview(item, 'CitizenCard', true)}
        onReject={() => onReview(item, 'CitizenCard', false)}
      >
        {!item.citizenCardSubmittedAt ? (
          <p className="text-xs text-ink-mute">Chưa gửi.</p>
        ) : (
          <>
            {item.citizenCardNumberUnreadable ? (
              <p className="text-xs text-danger flex items-start gap-1.5">
                <AlertTriangle size={12} className="mt-px flex-shrink-0" />
                Hệ thống không đọc lại được số CCCD — cần người dùng gửi lại.
              </p>
            ) : (
              <p className="text-xs text-ink-soft tabular-nums">{item.citizenCardNumberMasked}</p>
            )}
            <p className="text-xs text-ink-mute">
              Gửi lúc {dayjs(item.citizenCardSubmittedAt).format('HH:mm DD/MM/YYYY')}
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => onViewImage(item.userId, 'front')}
                className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline">
                <ExternalLink size={11} /> Mặt trước
              </button>
              <button onClick={() => onViewImage(item.userId, 'back')}
                className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline">
                <ExternalLink size={11} /> Mặt sau
              </button>
            </div>
          </>
        )}
      </KycDocBlock>

      {/* ===== HỒ SƠ THUẾ ===== */}
      <KycDocBlock
        icon={FileText}
        title="Hồ sơ thuế"
        status={item.taxProfileReviewStatus}
        coDuLieu={!!item.taxProfileSubmittedAt}
        onApprove={() => onReview(item, 'TaxProfile', true)}
        onReject={() => onReview(item, 'TaxProfile', false)}
      >
        {!item.taxProfileSubmittedAt ? (
          <p className="text-xs text-ink-mute">Chưa gửi.</p>
        ) : (
          <>
            <p className="text-xs text-ink-soft">{item.businessType}</p>
            {item.taxCodeUnreadable ? (
              <p className="text-xs text-danger flex items-start gap-1.5">
                <AlertTriangle size={12} className="mt-px flex-shrink-0" />
                Không đọc lại được mã số thuế — cần người dùng gửi lại.
              </p>
            ) : (
              <p className="text-xs text-ink-soft tabular-nums">MST {item.taxCode}</p>
            )}
            {item.legalName && <p className="text-xs text-ink-mute">{item.legalName}</p>}
            <p className="text-xs text-ink-mute">
              Gửi lúc {dayjs(item.taxProfileSubmittedAt).format('HH:mm DD/MM/YYYY')}
            </p>
            {item.withholdingWouldStopIfApproved && (
              <p className="text-xs text-warning/90 flex items-start gap-1.5 pt-1">
                <ShieldAlert size={12} className="mt-px flex-shrink-0" />
                Duyệt sẽ ngừng tạm giữ thuế của người này.
              </p>
            )}
          </>
        )}
      </KycDocBlock>
    </div>
  </li>
)

export default KycUserCard