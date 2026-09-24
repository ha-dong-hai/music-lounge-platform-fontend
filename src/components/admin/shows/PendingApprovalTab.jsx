// src/components/admin/shows/PendingApprovalTab.jsx
//
// Tab hiển thị SHOW CHỜ DUYỆT — tức các show ở trạng thái "Pending" sau khi owner bấm "Gửi duyệt".
// ĐÂY KHÁC VỚI PendingModerationTab (tab "Flagged by system") — tab đó lấy từ /moderations/pending,
// chỉ hiện các nội dung bị hệ thống AI flag. Còn tab này lấy từ /lounge-shows?status=Pending, liệt kê
// TẤT CẢ show mà owner đã gửi duyệt và đang chờ admin quyết định.
//
// Luồng phía owner: Tạo show (Draft) → chuẩn bị đủ điều kiện → bấm "Gửi duyệt" → show thành Pending
// Luồng phía admin: Xem danh sách ở tab này → bấm "Review" → Approve hoặc Reject
//   - Approve → show chuyển sang Published, owner bắt đầu bán vé được
//   - Reject → show quay về Draft, owner sửa lại rồi gửi lại
//
// API duyệt: POST /moderations/shows/{showId}/review { decision: 'Approved'|'Rejected', reviewNote }
// API lấy danh sách: GET /lounge-shows { status: 'Pending' }
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, ChevronLeft, ChevronRight, Check, X, Eye, Clock, Send,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getShows } from '../../../services/showServices'
import { reviewShowModeration } from '../../../services/adminServices'
import { FormatBadge } from './ShowBadges'

const PendingApprovalTab = () => {
  const [shows, setShows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  // Review modal
  const [reviewingShow, setReviewingShow] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [processingDecision, setProcessingDecision] = useState(null) // 'approve' | 'reject' | null

  const fetchPending = async () => {
    setIsLoading(true)
    try {
      const res = await getShows({
        page: pagination.page,
        pageSize: 10,
        status: 'Pending',
      })
      if (res.success) {
        setShows(res.data.items || [])
        setPagination(prev => ({
          ...prev,
          totalPages: res.data.totalPages || 1,
          totalCount: res.data.totalCount || 0,
        }))
      }
    } catch (err) {
      console.error('Fetch pending shows error:', err)
      toast.error('Không thể tải danh sách show chờ duyệt')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [pagination.page])

  // ===== REVIEW MODAL =====
  const openReview = (show) => {
    setReviewingShow(show)
    setReviewNote('')
  }

  const closeReview = () => {
    if (processingDecision) return
    setReviewingShow(null)
    setReviewNote('')
  }

  const handleDecision = async (decision) => {
    if (!reviewingShow || processingDecision) return

    // Từ chối BẮT BUỘC ghi lý do: owner nhận được lý do này là thứ DUY NHẤT cho biết phải sửa gì.
    if (decision === 'reject' && !reviewNote.trim()) {
      toast.error('Cần ghi lý do khi từ chối để chủ phòng trà biết phải sửa gì.')
      return
    }

    setProcessingDecision(decision)
    try {
      const res = await reviewShowModeration(
        reviewingShow.id,
        decision === 'approve' ? 'Approved' : 'Rejected',
        reviewNote || '',
      )

      if (res.success) {
        toast.success(
          decision === 'approve'
            ? 'Đã duyệt! Show đã chuyển sang Published — owner có thể bắt đầu bán vé.'
            : 'Đã từ chối buổi diễn. Owner sẽ nhận được lý do.',
        )
        setReviewingShow(null)
        setReviewNote('')
        fetchPending()
      } else {
        toast.error(res.message || 'Thao tác thất bại.')
      }
    } catch (err) {
      const beMessage = err?.response?.data?.message
      toast.error(beMessage || 'Thao tác thất bại. Thử lại.')
    } finally {
      setProcessingDecision(null)
    }
  }

  // ===== PAGINATION =====
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between p-4 border-t border-line">
        <p className="text-sm text-ink-mute">
          Page {pagination.page} / {pagination.totalPages} (Total: {pagination.totalCount})
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ===== HEADER INFO ===== */}
      <div className="bg-card border border-line rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
            <Clock size={20} className="text-warning" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Shows awaiting your approval</p>
            <p className="text-xs text-ink-mute">
              Owner đã gửi duyệt — cần admin review trước khi show được đăng và bắt đầu bán vé.
            </p>
          </div>
        </div>
        {!isLoading && (
          <span className={`text-2xl font-bold ${pagination.totalCount > 0 ? 'text-warning' : 'text-success'}`}>
            {pagination.totalCount}
          </span>
        )}
      </div>

      {/* ===== TABLE ===== */}
      <div className="bg-card border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-sunken/80 border-b border-line">
              <tr>
                <th className="p-4 text-brand-text font-semibold text-sm">Show name</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Lounge</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Format</th>
                <th className="p-4 text-brand-text font-semibold text-sm">Schedule</th>
                <th className="p-4 text-brand-text font-semibold text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-ink-mute">
                    <Loader2 size={24} className="mx-auto animate-spin text-brand-text" />
                  </td>
                </tr>
              ) : shows.length > 0 ? (
                shows.map(show => (
                  <tr key={show.id} className="border-b border-line hover:bg-card/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={show.coverImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${show.name || 'Show'}&backgroundColor=1f2937`}
                          alt={show.name}
                          className="w-10 h-10 rounded-lg object-cover border border-line"
                        />
                        <div>
                          <p className="text-sm text-ink font-medium">{show.name}</p>
                          <p className="text-xs text-ink-mute mt-0.5">ID: {show.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-ink-soft text-sm">{show.loungeName}</td>
                    <td className="p-4"><FormatBadge format={show.format} /></td>
                    <td className="p-4 text-ink-soft text-sm">
                      {dayjs(show.scheduledStart).format('HH:mm DD/MM/YYYY')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/shows/${show.id}`}
                          className="inline-flex items-center gap-1.5 text-brand-text border border-brand/30 hover:bg-brand-hover/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                        >
                          <Eye size={14} /> View detail
                        </Link>
                        <button
                          onClick={() => openReview(show)}
                          className="inline-flex items-center gap-1.5 bg-brand text-on-brand px-3 py-1.5 rounded-md text-xs font-bold hover:bg-brand-hover transition-colors"
                        >
                          <Send size={14} /> Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-ink-mute">
                    <Check size={32} className="mx-auto mb-3 text-success/50" />
                    <p className="font-medium">No shows pending approval</p>
                    <p className="text-xs mt-1">All submitted shows have been reviewed!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && shows.length > 0 && renderPagination()}
      </div>

      {/* ===== REVIEW MODAL ===== */}
      {reviewingShow && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={closeReview}
        >
          <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" />

          <div
            className="relative bg-card border-2 border-brand/40 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex-none flex items-center gap-3 p-6 border-b border-line">
              <div className="w-11 h-11 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center flex-shrink-0">
                <Send size={20} className="text-brand-text" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-ink">Review show</h2>
                <p className="text-sm text-ink-mute truncate">
                  {reviewingShow.name} • ID #{reviewingShow.id}
                </p>
              </div>
              <button
                onClick={closeReview}
                disabled={processingDecision}
                className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Show summary card */}
              <div className="bg-sunken/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={reviewingShow.coverImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${reviewingShow.name}&backgroundColor=1f2937`}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-line flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{reviewingShow.name}</p>
                    <p className="text-xs text-ink-mute mt-0.5">{reviewingShow.loungeName}</p>
                    <p className="text-xs text-ink-mute">
                      {dayjs(reviewingShow.scheduledStart).format('HH:mm — dddd, DD/MM/YYYY')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <FormatBadge format={reviewingShow.format} />
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-yellow-500/10 text-warning border-yellow-500/20">
                    Pending
                  </span>
                </div>
              </div>

              {/* Suggestion: xem chi tiết trước */}
              <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <Eye size={14} className="text-sky-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-sky-700">
                  Nên xem{' '}
                  <Link
                    to={`/admin/shows/${reviewingShow.id}`}
                    className="underline font-bold hover:text-brand-text"
                  >
                    trang chi tiết
                  </Link>
                  {' '}để kiểm tra nội dung, hạng vé, nghệ sĩ trước khi duyệt.
                </p>
              </div>

              {/* Review note */}
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-2">
                  Ghi chú duyệt{' '}
                  <span className="text-ink-mute">(bắt buộc khi từ chối)</span>
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Lý do duyệt / từ chối..."
                  disabled={processingDecision}
                  className="w-full px-4 py-2.5 bg-page border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-brand/50 resize-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* FOOTER: 2 nút */}
            <div className="flex-none flex flex-col sm:flex-row gap-3 p-6 border-t border-line">
              <button
                onClick={() => handleDecision('approve')}
                disabled={processingDecision}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingDecision === 'approve'
                  ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý...</>
                  : <><Check size={18} strokeWidth={3} /> Duyệt</>}
              </button>
              <button
                onClick={() => handleDecision('reject')}
                disabled={processingDecision}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingDecision === 'reject'
                  ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý...</>
                  : <><X size={18} strokeWidth={3} /> Từ chối</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingApprovalTab
