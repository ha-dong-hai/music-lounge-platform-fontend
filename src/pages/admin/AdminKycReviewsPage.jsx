// src/pages/admin/AdminKycReviewsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Mỗi dòng là MỘT NGƯỜI, nhưng có tới HAI giấy tờ được duyệt ĐỘC LẬP: CCCD và hồ sơ thuế.
//   Duyệt CCCD không tự duyệt hồ sơ thuế, nên hai khối có nút riêng, không gộp một nút "Duyệt".
// - TỪ CHỐI thì lý do LÀ BẮT BUỘC (backend chặn). Người gửi phải biết phải sửa gì — "bị từ chối"
//   mà không kèm lý do là họ không làm được gì tiếp, và sẽ gửi lại y nguyên.
// - `withholdingWouldStopIfApproved`: duyệt hồ sơ thuế này sẽ NGỪNG việc tạm giữ thuế của người đó.
//   Đây là hệ quả về tiền, nên phải nói ra trước khi bấm, không để Admin phát hiện sau.
// - `citizenCardNumberUnreadable` / `taxCodeUnreadable`: backend giải mã không được (khoá mã hoá đổi
//   hoặc dữ liệu hỏng). Đừng hiển thị ô trống như thể người dùng chưa khai — phải nói rõ là đọc
//   không được và cần người dùng gửi lại.
// - Xem ảnh CCCD của người khác thì backend GHI LOG. Chỉ mở khi thật cần xem.
import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, ShieldCheck, ShieldAlert, ExternalLink, AlertTriangle, CheckCircle2, XCircle, X, IdCard, FileText,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getKycReviewQueue, reviewKycDocument, getUserCitizenCardImage } from '../../services/adminServices'

const TABS = [
  { key: 'Pending', label: 'Chờ duyệt' },
  { key: 'Approved', label: 'Đã duyệt' },
  { key: 'Rejected', label: 'Đã từ chối' },
]

const STATUS_CHIP = {
  Pending: 'bg-yellow-500/10 text-warning border-yellow-500/30',
  Approved: 'bg-green-500/10 text-success border-green-500/30',
  Rejected: 'bg-red-500/10 text-danger border-red-500/30',
}

const ReviewModal = ({ target, onClose, onSaved }) => {
  // target = { item, document: 'CitizenCard' | 'TaxProfile', approve: bool }
  const [note, setNote] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const laTuChoi = !target.approve

  const submit = async (e) => {
    e.preventDefault()
    // Backend bắt buộc lý do khi từ chối — chặn ngay ở đây để người dùng không phải đi một vòng lỗi.
    if (laTuChoi && !note.trim()) {
      toast.error('Từ chối thì phải ghi lý do — người gửi cần biết phải sửa gì.')
      return
    }
    setIsBusy(true)
    try {
      await reviewKycDocument(target.item.userId, target.document, {
        approve: target.approve,
        note: note.trim() || null,
      })
      toast.success(target.approve ? 'Đã duyệt giấy tờ.' : 'Đã từ chối kèm lý do.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được.')
    } finally { setIsBusy(false) }
  }

  const tenGiayTo = target.document === 'CitizenCard' ? 'CCCD' : 'hồ sơ thuế'
  const canhBaoThue = target.approve && target.document === 'TaxProfile' && target.item.withholdingWouldStopIfApproved

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">
            {target.approve ? 'Duyệt' : 'Từ chối'} {tenGiayTo}
          </h2>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-sunken/70 border border-line rounded-lg p-3">
            <p className="text-sm text-ink font-medium">{target.item.fullName}</p>
            <p className="text-xs text-ink-mute mt-0.5">{target.item.email}</p>
          </div>

          {canhBaoThue && (
            <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle size={13} className="mt-px flex-shrink-0" />
              Duyệt hồ sơ thuế này sẽ NGỪNG việc tạm giữ thuế với người đó. Đây là thay đổi về tiền, hãy chắc chắn mã số thuế đúng.
            </p>
          )}

          <div>
            <label className="text-xs text-ink-mute">
              Ghi chú {laTuChoi && <span className="text-danger">* (bắt buộc khi từ chối)</span>}
            </label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 resize-none"
              placeholder={laTuChoi
                ? 'Ví dụ: ảnh mặt sau bị mờ, không đọc được số; hãy chụp lại rõ hơn.'
                : 'Không bắt buộc.'} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                target.approve ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {target.approve ? 'Duyệt' : 'Từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const DocBlock = ({ icon: Icon, title, status, children, onApprove, onReject, coDuLieu }) => (
  <div className="bg-sunken/70 border border-line rounded-lg p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={15} className="text-ink-mute flex-shrink-0" />
        <span className="text-sm text-ink font-medium">{title}</span>
      </div>
      {status && (
        <span className={`px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${STATUS_CHIP[status] ?? 'bg-line-strong/10 text-ink-soft border-line-strong/30'}`}>
          {status}
        </span>
      )}
    </div>

    <div className="mt-2 space-y-1">{children}</div>

    {coDuLieu && status === 'Pending' && (
      <div className="mt-3 flex gap-2">
        <button onClick={onApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/40 text-success text-xs font-bold hover:bg-green-500/20">
          <CheckCircle2 size={13} /> Duyệt
        </button>
        <button onClick={onReject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/40 text-danger text-xs font-bold hover:bg-red-500/20">
          <XCircle size={13} /> Từ chối
        </button>
      </div>
    )}
  </div>
)

const AdminKycReviewsPage = () => {
  const [tab, setTab] = useState('Pending')
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [target, setTarget] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getKycReviewQueue({ status: tab, pageSize: 50 })
      if (res.success) setItems(res.data.items ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được hàng đợi định danh.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const xemAnh = async (userId, side) => {
    try {
      const blob = await getUserCitizenCardImage(userId, side)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không mở được ảnh.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">Duyệt định danh</h1>
        <p className="text-ink-soft text-sm leading-relaxed">
          Mỗi người có tới hai giấy tờ được duyệt riêng: CCCD và hồ sơ thuế. Từ chối thì bắt buộc ghi lý do.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tab === t.key
              ? 'bg-sunken border-brand/40 text-brand-text'
              : 'bg-page border-line text-ink-soft hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-10 text-center">
          <ShieldCheck size={28} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">Không có hồ sơ nào trong mục này.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={it.userId} className="bg-card border border-line rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-ink font-bold">{it.fullName}</p>
                  <p className="text-xs text-ink-mute mt-0.5">{it.email}</p>
                  {it.dateOfBirth && (
                    <p className="text-xs text-ink-mute mt-0.5">Ngày sinh: {dayjs(it.dateOfBirth).format('DD/MM/YYYY')}</p>
                  )}
                </div>
                {it.hasBusinessLicense && (
                  <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs">Có giấy phép kinh doanh</span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <DocBlock
                  icon={IdCard}
                  title="Căn cước công dân"
                  status={it.citizenCardReviewStatus}
                  coDuLieu={!!it.citizenCardSubmittedAt}
                  onApprove={() => setTarget({ item: it, document: 'CitizenCard', approve: true })}
                  onReject={() => setTarget({ item: it, document: 'CitizenCard', approve: false })}
                >
                  {!it.citizenCardSubmittedAt ? (
                    <p className="text-xs text-ink-mute">Chưa gửi.</p>
                  ) : (
                    <>
                      {it.citizenCardNumberUnreadable ? (
                        <p className="text-xs text-danger flex items-start gap-1.5">
                          <AlertTriangle size={12} className="mt-px flex-shrink-0" />
                          Hệ thống không đọc lại được số CCCD — cần người dùng gửi lại.
                        </p>
                      ) : (
                        <p className="text-xs text-ink-soft tabular-nums">{it.citizenCardNumberMasked}</p>
                      )}
                      <p className="text-xs text-ink-mute">
                        Gửi lúc {dayjs(it.citizenCardSubmittedAt).format('HH:mm DD/MM/YYYY')}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => xemAnh(it.userId, 'front')}
                          className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline">
                          <ExternalLink size={11} /> Mặt trước
                        </button>
                        <button onClick={() => xemAnh(it.userId, 'back')}
                          className="inline-flex items-center gap-1 text-xs text-brand-text hover:underline">
                          <ExternalLink size={11} /> Mặt sau
                        </button>
                      </div>
                    </>
                  )}
                </DocBlock>

                <DocBlock
                  icon={FileText}
                  title="Hồ sơ thuế"
                  status={it.taxProfileReviewStatus}
                  coDuLieu={!!it.taxProfileSubmittedAt}
                  onApprove={() => setTarget({ item: it, document: 'TaxProfile', approve: true })}
                  onReject={() => setTarget({ item: it, document: 'TaxProfile', approve: false })}
                >
                  {!it.taxProfileSubmittedAt ? (
                    <p className="text-xs text-ink-mute">Chưa gửi.</p>
                  ) : (
                    <>
                      <p className="text-xs text-ink-soft">{it.businessType}</p>
                      {it.taxCodeUnreadable ? (
                        <p className="text-xs text-danger flex items-start gap-1.5">
                          <AlertTriangle size={12} className="mt-px flex-shrink-0" />
                          Không đọc lại được mã số thuế — cần người dùng gửi lại.
                        </p>
                      ) : (
                        <p className="text-xs text-ink-soft tabular-nums">MST {it.taxCode}</p>
                      )}
                      {it.legalName && <p className="text-xs text-ink-mute">{it.legalName}</p>}
                      <p className="text-xs text-ink-mute">
                        Gửi lúc {dayjs(it.taxProfileSubmittedAt).format('HH:mm DD/MM/YYYY')}
                      </p>
                      {it.withholdingWouldStopIfApproved && (
                        <p className="text-xs text-warning/90 flex items-start gap-1.5 pt-1">
                          <ShieldAlert size={12} className="mt-px flex-shrink-0" />
                          Duyệt sẽ ngừng tạm giữ thuế của người này.
                        </p>
                      )}
                    </>
                  )}
                </DocBlock>
              </div>
            </li>
          ))}
        </ul>
      )}

      {target && (
        <ReviewModal target={target} onClose={() => setTarget(null)} onSaved={load} />
      )}
    </div>
  )
}

export default AdminKycReviewsPage
