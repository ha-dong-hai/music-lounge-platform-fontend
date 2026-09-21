import { useState, useEffect } from 'react'
import { Landmark, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAdminBankAccounts, reviewBankAccount } from '../../services/adminServices'
import BankAccountsTable from '../../components/admin/bank-accounts/BankAccountsTable'
import BankAccountReviewModal from '../../components/admin/bank-accounts/BankAccountReviewModal'

const AdminBankAccountsPage = () => {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  // 'all' | 'verified' | 'unverified' → param verified: undefined | true | false
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [counts, setCounts] = useState({ total: 0, verified: 0, unverified: 0 })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [reviewTarget, setReviewTarget] = useState(null)
  const [processingDecision, setProcessingDecision] = useState(null) // true | false | null (approve?)

  // 1. FETCH COUNTS (3 request song song — pattern stats)
  const fetchCounts = async () => {
    try {
      const [allRes, verifiedRes, unverifiedRes] = await Promise.all([
        getAdminBankAccounts({ page: 1, pageSize: 1 }).catch(() => null),
        getAdminBankAccounts({ page: 1, pageSize: 1, verified: true }).catch(() => null),
        getAdminBankAccounts({ page: 1, pageSize: 1, verified: false }).catch(() => null),
      ])
      setCounts({
        total: allRes?.success ? allRes.data.totalCount : 0,
        verified: verifiedRes?.success ? verifiedRes.data.totalCount : 0,
        unverified: unverifiedRes?.success ? unverifiedRes.data.totalCount : 0,
      })
    } catch (err) {
      console.error('Lỗi load counts:', err)
    }
  }

  useEffect(() => { fetchCounts() }, [])

  // 2. FETCH DANH SÁCH
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true)
      try {
        const params = {
          page: pagination.page,
          pageSize: 10,
          verified: verifiedFilter === 'verified' ? true : verifiedFilter === 'unverified' ? false : undefined,
        }
        Object.keys(params).forEach(k => params[k] === undefined && delete params[k])

        const res = await getAdminBankAccounts(params)
        if (res.success) {
          setAccounts(res.data.items)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        }
      } catch (err) {
        console.error('Lỗi load bank accounts:', err)
        toast.error('Failed to load bank accounts')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAccounts()
  }, [pagination.page, verifiedFilter, refreshTrigger])

  // 3. ĐỔI FILTER → VỀ TRANG 1
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [verifiedFilter])

  // 4. ⭐ REVIEW — payload { approve, note } (khác venue!)
  const handleDecision = async (approve, note) => {
    if (!reviewTarget || processingDecision !== null) return
    setProcessingDecision(approve)
    try {
      const res = await reviewBankAccount(reviewTarget.id, approve, note)
      if (res.success) {
        toast.success(approve ? 'Bank account approved!' : 'Bank account rejected!')
        setReviewTarget(null)
        setRefreshTrigger(t => t + 1)
        fetchCounts()
      } else {
        toast.error(res.message || 'Operation failed.')
      }
    } catch (err) {
      const beMessage = err?.response?.data?.message
      toast.error(beMessage || 'Operation failed.')
    } finally {
      setProcessingDecision(null)
    }
  }

  // 3 thẻ stats — đồng thời là filter
  const cards = [
    { key: 'all', label: 'Total', value: counts.total, icon: <Landmark size={24} className="text-[#C3B665]" />, iconBg: 'bg-[#C3B665]/10', activeStyle: 'border-[#C3B665] ring-1 ring-[#C3B665]' },
    { key: 'verified', label: 'Verified', value: counts.verified, icon: <CheckCircle2 size={24} className="text-green-400" />, iconBg: 'bg-green-500/10', activeStyle: 'border-green-500 ring-1 ring-green-500' },
    { key: 'unverified', label: 'Pending Review', value: counts.unverified, icon: <Clock size={24} className="text-yellow-400" />, iconBg: 'bg-yellow-500/10', activeStyle: 'border-yellow-500 ring-1 ring-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Landmark size={28} className="text-[#C3B665]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Bank Accounts</h1>
          <p className="text-gray-400 text-sm">
            Verify lounge payout bank accounts before donations & ticket revenue can be transferred.
          </p>
        </div>
      </div>

      {/* STATS CARDS (clickable filter) */}
      <div className="grid grid-cols-3 gap-4">
        {cards.map(card => (
          <button
            key={card.key}
            onClick={() => setVerifiedFilter(card.key)}
            className={`bg-gray-900 border rounded-xl p-5 flex items-center gap-4 text-left transition-all ${
              verifiedFilter === card.key ? card.activeStyle : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className={`p-3 ${card.iconBg} rounded-lg flex-shrink-0`}>{card.icon}</div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <BankAccountsTable
        accounts={accounts}
        isLoading={isLoading}
        pagination={pagination}
        onReview={setReviewTarget}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      {/* REVIEW MODAL */}
      {reviewTarget && (
        <BankAccountReviewModal
          account={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onDecision={handleDecision}
          isProcessing={processingDecision}
        />
      )}
    </div>
  )
}

export default AdminBankAccountsPage