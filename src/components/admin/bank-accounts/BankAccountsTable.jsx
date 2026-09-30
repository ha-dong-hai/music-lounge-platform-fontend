import { Loader2, ChevronLeft, ChevronRight, Wallet, ShieldCheck, Check, X, Star } from 'lucide-react'
import dayjs from 'dayjs'

// ===== BADGES =====
const VerifiedBadge = ({ isVerified }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border whitespace-nowrap ${
    isVerified ? 'bg-success/15 text-success border-success/30' : 'bg-warning/15 text-warning border-warning/30'
  }`}>
    <span className={`w-1.5 h-1.5 ${isVerified ? 'bg-success' : 'bg-warning'}`} />
    {isVerified ? 'Đã xác minh' : 'Chờ duyệt'}
  </span>
)

// Badge tín hiệu xác minh — ok: xanh ✓, sai: đỏ ✗
const SignalBadge = ({ ok, okText, badText, title }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border whitespace-nowrap ${
      ok ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/30'
    }`}
  >
    {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
    {ok ? okText : badText}
  </span>
)

const BankAccountsTable = ({ accounts, isLoading, pagination, onReview, onPageChange }) => {
  return (
    <div className="bg-board border border-ink overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-sunken border-b-2 border-ink">
            <tr>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Tài khoản</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Chủ tài khoản</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Phòng trà / Chủ</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Xác minh</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Trạng thái</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink">Ngày thêm</th>
              <th scope="col" className="p-4 text-sm font-semibold text-ink text-right"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-ink-soft">
                  <Loader2 size={24} className="mx-auto animate-spin text-ink" />
                </td>
              </tr>
            ) : accounts.length > 0 ? (
              accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-board/30 transition-colors">
                  <td className="p-4">
                    <p className="text-sm text-lamp font-medium">{acc.bankName}</p>
                    <p className="text-xs text-ink-soft font-mono mt-0.5">{acc.accountNumberMasked}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-ink-mute">{acc.accountHolder}</p>
                    {!acc.holderNameMatches && (
                      <p className="text-[11px] text-danger/80 mt-0.5">
                        expected: {acc.expectedAccountHolder}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-ink-mute truncate max-w-[160px]">{acc.loungeName}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{acc.ownerName}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      <SignalBadge ok={acc.holderNameMatches} okText="Khớp tên" badText="Lệch tên" title={`Chủ tài khoản "${acc.accountHolder}" — tên phải khớp "${acc.expectedAccountHolder}"`} />
                      <SignalBadge ok={acc.ownerIdentityApproved} okText="Đã định danh" badText="Chưa định danh" title="Định danh chủ phòng trà đã được duyệt" />
                      <SignalBadge ok={!acc.accountNumberUnreadable} okText="Đọc được số" badText="Không đọc được số" title="Máy đọc được số tài khoản" />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <VerifiedBadge isVerified={acc.isVerified} />
                      {acc.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-ink font-bold">
                          <Star size={11} className="fill-ink" aria-hidden="true" /> Mặc định
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-ink-mute">{dayjs(acc.createdAt).format('DD/MM/YYYY')}</td>
                  <td className="p-4 text-right">
                    {/* Review chỉ dành cho tài khoản chưa verified */}
                    {!acc.isVerified && (
                      <button
                        onClick={() => onReview(acc)}
                        className="inline-flex items-center gap-1.5 bg-ink text-lamp px-3 py-1.5 rounded-md text-xs font-bold hover:bg-board transition-colors"
                      >
                        <ShieldCheck size={12} /> Review
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center text-ink-soft">
                  <Wallet size="32" className="mx-auto mb-3 opacity-50" />
                  Chưa có tài khoản nhận tiền nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-ink">
          <p className="text-sm text-ink-soft">
            Trang {pagination.page} / {pagination.totalPages} · {pagination.totalCount} tài khoản
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-ink text-ink-mute hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Trang trước">
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-ink text-ink-mute hover:border-ink hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Trang sau">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BankAccountsTable