import { Loader2, ChevronLeft, ChevronRight, Wallet, ShieldCheck, Check, X, Star } from 'lucide-react'
import dayjs from 'dayjs'

// ===== BADGES =====
const VerifiedBadge = ({ isVerified }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
    isVerified ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-green-400' : 'bg-yellow-400'}`} />
    {isVerified ? 'Verified' : 'Pending review'}
  </span>
)

// Badge tín hiệu xác minh — ok: xanh ✓, sai: đỏ ✗
const SignalBadge = ({ ok, okText, badText, title }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border whitespace-nowrap ${
      ok ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/30'
    }`}
  >
    {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
    {ok ? okText : badText}
  </span>
)

const BankAccountsTable = ({ accounts, isLoading, pagination, onReview, onPageChange }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-black/40 border-b border-gray-800">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank Account</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Holder</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Lounge / Owner</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Added</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-500">
                  <Loader2 size={24} className="mx-auto animate-spin text-[#C3B665]" />
                </td>
              </tr>
            ) : accounts.length > 0 ? (
              accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <p className="text-sm text-white font-medium">{acc.bankName}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{acc.accountNumberMasked}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-200">{acc.accountHolder}</p>
                    {!acc.holderNameMatches && (
                      <p className="text-[11px] text-red-400/80 mt-0.5">
                        expected: {acc.expectedAccountHolder}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-300 truncate max-w-[160px]">{acc.loungeName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{acc.ownerName}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      <SignalBadge ok={acc.holderNameMatches} okText="Name match" badText="Name mismatch" title={`"${acc.accountHolder}" vs "${acc.expectedAccountHolder}"`} />
                      <SignalBadge ok={acc.ownerIdentityApproved} okText="Identity" badText="No identity" title="Owner identity approved" />
                      <SignalBadge ok={!acc.accountNumberUnreadable} okText="Readable" badText="Unreadable" title="Account number readable by OCR" />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <VerifiedBadge isVerified={acc.isVerified} />
                      {acc.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#C3B665] font-bold">
                          <Star size={11} className="fill-[#C3B665]" /> Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">{dayjs(acc.createdAt).format('DD/MM/YYYY')}</td>
                  <td className="p-4 text-right">
                    {/* Review chỉ dành cho tài khoản chưa verified */}
                    {!acc.isVerified && (
                      <button
                        onClick={() => onReview(acc)}
                        className="inline-flex items-center gap-1.5 bg-[#C3B665] text-black px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#d4c87f] transition-colors"
                      >
                        <ShieldCheck size={12} /> Review
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-500">
                  <Wallet size="32" className="mx-auto mb-3 opacity-50" />
                  No bank accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Page {pagination.page} / {pagination.totalPages} (Total: {pagination.totalCount})
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BankAccountsTable