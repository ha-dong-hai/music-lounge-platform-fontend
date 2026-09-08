// src/pages/admin/AdminAccountsPage.jsx
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getAdminStats, getAdminUsers, getAdminUserDetail, toggleUserBan } from '../../services/adminServices'
import StatsCards from '../../components/admin/accounts/StatsCards'
import AccountsFilterBar from '../../components/admin/accounts/AccountsFilterBar'
import AccountsTable from '../../components/admin/accounts/AccountsTable'
import AccountDetailModal from '../../components/admin/accounts/AccountDetailModal'

// --- MAIN COMPONENT: giữ State + Logic, giao UI cho các component con ---
const AdminAccountsPage = () => {
  // State dữ liệu bảng
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  // State Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // State Stats Cards
  const [stats, setStats] = useState({ total: 0, users: 0, owners: 0, banned: 0 })

  // State Modal
  const [selectedAcc, setSelectedAcc] = useState(null)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // 1. GỌI API LẤY STATS (Chạy 1 lần)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch (err) { console.error('Lỗi load stats:', err) }
    }
    fetchStats()
  }, [])

  // 2. GỌI API LẤY DANH SÁCH (Có debounce 500ms cho search)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = {
          page: pagination.page,
          pageSize: 10,
          searchText: searchQuery || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          isActive: statusFilter !== 'all' ? (statusFilter === 'active') : undefined
        }
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key])

        const res = await getAdminUsers(params)
        if (res.success) {
          setAccounts(res.data.items)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        }
      } catch (err) {
        console.error('Lỗi load users:', err)
        toast.error('Không thể tải danh sách tài khoản')
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, roleFilter, statusFilter, pagination.page])

  // Khi đổi filter thì reset về trang 1
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchQuery, roleFilter, statusFilter])

  // 3. HANDLER: Bấm thẻ thống kê -> lọc
  const handleSelectFilter = (role, status) => {
    setRoleFilter(role)
    setStatusFilter(status)
  }

  // 4. HANDLER: Xem chi tiết user
  const handleViewDetail = async (id) => {
    setSelectedAcc({})
    setIsModalLoading(true)
    try {
      const res = await getAdminUserDetail(id)
      if (res.success) { setSelectedAcc(res.data) }
    } catch (err) {
      toast.error('Không thể tải chi tiết tài khoản')
      setSelectedAcc(null)
    } finally {
      setIsModalLoading(false)
    }
  }

  // 5. HANDLER: Khóa / Mở khóa (cập nhật đồng thời bảng + modal + stats)
  const handleToggleBan = async (id, currentStatus) => {
    if (isUpdating) return
    const acc = accounts.find(a => a.id === id)
    if (acc?.role === 'Admin') {
      toast.error('Không thể khóa tài khoản Admin!')
      return
    }

    setIsUpdating(true)
    try {
      await toggleUserBan(id, currentStatus)
      toast.success(currentStatus ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản')

      const newStatus = !currentStatus

      // Cập nhật bảng
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: newStatus } : a))
      // Cập nhật modal nếu đang mở
      if (selectedAcc?.id === id) {
        setSelectedAcc(prev => ({ ...prev, isActive: newStatus }))
      }
      // Cập nhật thẻ thống kê (mở khóa -> giảm, khóa -> tăng)
      setStats(prevStats => ({
        ...prevStats,
        banned: newStatus ? prevStats.banned - 1 : prevStats.banned + 1
      }))
    } catch (err) {
      toast.error('Thao tác thất bại')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* === STATS CARDS === */}
      <StatsCards 
        stats={stats} 
        roleFilter={roleFilter} 
        statusFilter={statusFilter} 
        onSelectFilter={handleSelectFilter} 
      />

      {/* === FILTERS & SEARCH === */}
      <AccountsFilterBar 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        roleFilter={roleFilter} setRoleFilter={setRoleFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
      />

      {/* === TABLE === */}
      <AccountsTable 
        accounts={accounts} 
        isLoading={isLoading} 
        isUpdating={isUpdating} 
        pagination={pagination}
        onViewDetail={handleViewDetail} 
        onToggleBan={handleToggleBan} 
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} 
      />

      {/* === MODAL CHI TIẾT === */}
      <AccountDetailModal 
        selectedAcc={selectedAcc}
        isModalLoading={isModalLoading}
        isUpdating={isUpdating}
        onClose={() => setSelectedAcc(null)}
        onToggleBan={handleToggleBan}
      />
    </div>
  )
}

export default AdminAccountsPage