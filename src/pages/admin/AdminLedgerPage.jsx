// src/pages/admin/AdminLedgerPage.jsx
import { useState, useEffect, useMemo } from 'react'
import { Search, Download, Receipt, Eye, X, Music2, Loader2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

// --- HELPER COMPONENTS ---
const PurposeBadge = ({ purpose }) => {
  const p = (purpose || '').toLowerCase()
  let type = 'default'
  if (p.includes('ticket') || p.includes('vé')) type = 'ticket'
  else if (p.includes('donat')) type = 'donate'
  else if (p.includes('package') || p.includes('subscription') || p.includes('gói')) type = 'package'

  const styles = {
    ticket: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    donate: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    package: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    default: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[type]}`}>
      {purpose}
    </span>
  )
}

const AdminLedgerPage = () => {
  const [ledger, setLedger] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPurpose, setFilterPurpose] = useState('all')
  const [selectedTx, setSelectedTx] = useState(null)

  // Fetch ledger from real API
  useEffect(() => {
    const fetchLedger = async () => {
      setIsLoading(true)
      try {
        const res = await adminService.getLedger({ page: 1, pageSize: 100 })
        if (res?.success) {
          const items = Array.isArray(res.data) ? res.data : (res.data?.items || [])
          setLedger(items)
        }
      } catch (err) {
        console.error('Failed to fetch ledger:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLedger()
  }, [])

  const filteredLedger = useMemo(() => {
    let result = [...ledger]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(tx =>
        (tx.id || '').toString().toLowerCase().includes(q) ||
        (tx.sender || tx.senderName || '').toLowerCase().includes(q) ||
        (tx.receiver || tx.receiverName || '').toLowerCase().includes(q) ||
        (tx.purpose || tx.type || '').toLowerCase().includes(q)
      )
    }
    if (filterPurpose !== 'all') {
      result = result.filter(tx => {
        const p = (tx.purpose || tx.type || '').toLowerCase()
        if (filterPurpose === 'ticket') return p.includes('ticket') || p.includes('vé')
        if (filterPurpose === 'donate') return p.includes('donat')
        if (filterPurpose === 'package') return p.includes('package') || p.includes('subscription') || p.includes('gói')
        return true
      })
    }
    return result
  }, [ledger, searchQuery, filterPurpose])

  const totalAmount = filteredLedger.reduce((sum, tx) => sum + (tx.amount || 0), 0)
  const totalFee = filteredLedger.reduce((sum, tx) => sum + (tx.fee || tx.platformFee || 0), 0)

  const handleExportCSV = () => {
    toast.success('Đang xuất file CSV...')
    const headers = ['Mã GD', 'Người gửi', 'Người nhận', 'Mục đích', 'Số tiền', 'Phí', 'Ngày']
    const rows = filteredLedger.map(tx => [
      tx.id, tx.sender || tx.senderName, tx.receiver || tx.receiverName,
      tx.purpose || tx.type, tx.amount, tx.fee || tx.platformFee || 0,
      dayjs(tx.date || tx.createdAt).format('DD/MM/YYYY HH:mm')
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger_${dayjs().format('YYYYMMDD')}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Sổ cái Giao dịch</h1>
          <p className="text-gray-400 text-sm">Theo dõi tất cả giao dịch tài chính trên nền tảng.</p>
        </div>
        <button onClick={handleExportCSV}
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors border border-gray-700">
          <Download size={16} /> Xuất CSV
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Tổng giao dịch</p>
          <p className="text-2xl font-bold text-white">{filteredLedger.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Tổng doanh thu</p>
          <p className="text-2xl font-bold text-[#C3B665]">{totalAmount.toLocaleString('vi-VN')}đ</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Tổng phí nền tảng</p>
          <p className="text-2xl font-bold text-green-400">{totalFee.toLocaleString('vi-VN')}đ</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Tìm mã giao dịch, người gửi, người nhận..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50" />
        </div>
        <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)}
          className="w-full md:w-auto px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer">
          <option value="all">Tất cả mục đích</option>
          <option value="ticket">Mua vé</option>
          <option value="donate">Donate</option>
          <option value="package">Package</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/40 border-b border-gray-800">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã GD</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Người gửi</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Người nhận</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mục đích</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Số tiền</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ngày</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLedger.length > 0 ? (
                filteredLedger.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 text-sm text-white font-mono">{tx.id || tx.transactionId}</td>
                    <td className="p-4 text-sm text-gray-300">{tx.sender || tx.senderName || 'N/A'}</td>
                    <td className="p-4 text-sm text-gray-300">{tx.receiver || tx.receiverName || 'N/A'}</td>
                    <td className="p-4"><PurposeBadge purpose={tx.purpose || tx.type || 'Transaction'} /></td>
                    <td className="p-4 text-sm text-[#C3B665] font-bold text-right">{(tx.amount || 0).toLocaleString('vi-VN')}đ</td>
                    <td className="p-4 text-sm text-gray-400">{dayjs(tx.date || tx.createdAt).format('HH:mm DD/MM/YYYY')}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedTx(tx)} className="p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-500">
                    <Receipt size={32} className="mx-auto mb-3 opacity-50" />
                    Không tìm thấy giao dịch nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedTx(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#C3B665]/10 rounded-full"><Receipt size={24} className="text-[#C3B665]" /></div>
                <div>
                  <h2 className="text-xl font-bold text-white">Chi tiết Giao dịch</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedTx.id || selectedTx.transactionId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
            </div>

            <div className="space-y-3 border-t border-gray-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Người gửi</span>
                <span className="text-white font-medium">{selectedTx.sender || selectedTx.senderName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Người nhận</span>
                <span className="text-white font-medium">{selectedTx.receiver || selectedTx.receiverName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Mục đích</span>
                <PurposeBadge purpose={selectedTx.purpose || selectedTx.type || ''} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Số tiền</span>
                <span className="text-[#C3B665] font-bold">{(selectedTx.amount || 0).toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Phí nền tảng</span>
                <span className="text-green-400 font-medium">{(selectedTx.fee || selectedTx.platformFee || 0).toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ngày</span>
                <span className="text-white">{dayjs(selectedTx.date || selectedTx.createdAt).format('HH:mm - DD/MM/YYYY')}</span>
              </div>
              {(selectedTx.note || selectedTx.description) && (
                <div className="bg-black/30 border border-gray-800 rounded-lg p-3 mt-2">
                  <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
                  <p className="text-sm text-gray-300">{selectedTx.note || selectedTx.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLedgerPage