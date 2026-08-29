// src/pages/admin/AdminAccountsPage.jsx
import { useState, useEffect, useMemo } from 'react'
import { Search, Eye, Ban, Unlock, User as UserIcon, ShieldCheck, Users as UsersIcon, X, Building2, Loader2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import toast from 'react-hot-toast'

// --- HELPER COMPONENTS ---
const RoleBadge = ({ role }) => {
  const r = (role || '').toLowerCase()
  const styles = {
    admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    owner: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    user: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    audience: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  }
  const labels = { admin: 'Admin', owner: 'Chủ phòng trà', user: 'Người dùng', audience: 'Người dùng' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[r] || styles.user}`}>
      {labels[r] || role}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  const isActive = status === true || status === 'active' || status === 'Active'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${isActive ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
      {isActive ? 'Hoạt động' : 'Bị khóa'}
    </span>
  )
}

// --- MAIN COMPONENT ---
const AdminAccountsPage = () => {
  const [accounts, setAccounts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAcc, setSelectedAcc] = useState(null)
  const [page, setPage] = useState(1)

  // Fetch users from real API
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        pageSize: 50,
        ...(searchQuery && { searchText: searchQuery }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' }),
      }
      const res = await adminService.getUsers(params)
      if (res?.success) {
        setAccounts(res.data?.items || [])
        setTotalCount(res.data?.totalCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('Không thể tải danh sách tài khoản')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchUsers()
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Stats from current data
  const stats = useMemo(() => ({
    total: totalCount,
    users: accounts.filter(a => (a.role || '').toLowerCase() === 'audience' || (a.role || '').toLowerCase() === 'user').length,
    owners: accounts.filter(a => (a.role || '').toLowerCase() === 'owner').length,
    banned: accounts.filter(a => a.isActive === false).length,
  }), [accounts, totalCount])

  // Handlers
  const handleToggleBan = async (id) => {
    const acc = accounts.find(a => a.id === id)
    if ((acc?.role || '').toLowerCase() === 'admin') {
      toast.error('Không thể khóa tài khoản Admin!')
      return
    }
    try {
      if (acc.isActive) {
        await adminService.deactivateUser(id)
        toast.success('Đã khóa tài khoản')
      } else {
        await adminService.reactivateUser(id)
        toast.success('Đã mở khóa tài khoản')
      }
      // Update local state
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))
      if (selectedAcc?.id === id) {
        setSelectedAcc(prev => ({ ...prev, isActive: !prev.isActive }))
      }
    } catch (err) {
      toast.error('Thao tác thất bại')
    }
  }

  const clearFilters = () => {
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const isActive = (acc) => acc.isActive !== false

  return (
    <div className="space-y-6">

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={clearFilters}
          className={`bg-gray-900 border rounded-xl p-5 flex items-center gap-4 text-left transition-all ${roleFilter === 'all' && statusFilter === 'all' ? 'border-[#C3B665] ring-1 ring-[#C3B665]' : 'border-gray-800 hover:border-gray-700'}`}>
          <div className="p-3 bg-[#C3B665]/10 rounded-lg"><UsersIcon size={24} className="text-[#C3B665]" /></div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tổng tài khoản</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
        </button>

        <button onClick={() => { setRoleFilter('Audience'); setStatusFilter('all') }}
          className={`bg-gray-900 border rounded-xl p-5 flex items-center gap-4 text-left transition-all ${roleFilter === 'Audience' ? 'border-gray-400 ring-1 ring-gray-400' : 'border-gray-800 hover:border-gray-700'}`}>
          <div className="p-3 bg-gray-500/10 rounded-lg"><UserIcon size={24} className="text-gray-400" /></div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Người dùng</p>
            <p className="text-2xl font-bold text-white">{stats.users}</p>
          </div>
        </button>

        <button onClick={() => { setRoleFilter('Owner'); setStatusFilter('all') }}
          className={`bg-gray-900 border rounded-xl p-5 flex items-center gap-4 text-left transition-all ${roleFilter === 'Owner' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-800 hover:border-gray-700'}`}>
          <div className="p-3 bg-blue-500/10 rounded-lg"><Building2 size={24} className="text-blue-400" /></div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Chủ phòng trà</p>
            <p className="text-2xl font-bold text-white">{stats.owners}</p>
          </div>
        </button>

        <button onClick={() => { setStatusFilter('banned'); setRoleFilter('all') }}
          className={`bg-gray-900 border rounded-xl p-5 flex items-center gap-4 text-left transition-all ${statusFilter === 'banned' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-800 hover:border-gray-700'}`}>
          <div className="p-3 bg-red-500/10 rounded-lg"><Ban size={24} className="text-red-400" /></div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Bị khóa</p>
            <p className="text-2xl font-bold text-white">{stats.banned}</p>
          </div>
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Tìm tên, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full md:w-auto px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer">
          <option value="all">Tất cả vai trò</option>
          <option value="Audience">Người dùng</option>
          <option value="Owner">Chủ phòng trà</option>
          <option value="Admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="banned">Bị khóa</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#C3B665]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-black/40 border-b border-gray-800">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tài khoản</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vai trò</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <p className="text-sm text-white font-medium">{acc.fullName || acc.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{acc.email}{acc.phoneNumber ? ` | ${acc.phoneNumber}` : ''}</p>
                      </td>
                      <td className="p-4"><RoleBadge role={acc.role} /></td>
                      <td className="p-4"><StatusBadge status={isActive(acc) ? 'active' : 'banned'} /></td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedAcc(acc)} className="p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors" title="Xem chi tiết">
                            <Eye size={16} />
                          </button>
                          {(acc.role || '').toLowerCase() !== 'admin' && (
                            <button onClick={() => handleToggleBan(acc.id)}
                              className={`p-2 rounded-lg transition-colors ${isActive(acc) ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                              title={isActive(acc) ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
                              {isActive(acc) ? <Ban size={16} /> : <Unlock size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-gray-500">
                      <UsersIcon size="32" className="mx-auto mb-3 opacity-50" />
                      Không tìm thấy tài khoản nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedAcc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedAcc(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C3B665]/10 border border-[#C3B665]/30 flex items-center justify-center">
                  <UserIcon size={24} className="text-[#C3B665]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedAcc.fullName || selectedAcc.name}</h2>
                  <p className="text-sm text-gray-500">{selectedAcc.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAcc(null)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
            </div>

            <div className="space-y-4 border-t border-gray-800 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                  <p className="text-sm text-white font-medium">{selectedAcc.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Vai trò</p>
                  <RoleBadge role={selectedAcc.role} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                  <StatusBadge status={isActive(selectedAcc) ? 'active' : 'banned'} />
                </div>
              </div>

              {(selectedAcc.role || '').toLowerCase() === 'owner' && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Thông tin Chủ phòng trà</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5"><Building2 size={14} /> Phòng trà:</span>
                    <span className="text-white font-medium">{selectedAcc.loungeName || 'N/A'}</span>
                  </div>
                </div>
              )}

              {(selectedAcc.role || '').toLowerCase() === 'admin' && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-purple-400" />
                  <p className="text-sm text-purple-300">Tài khoản Quản trị viên Hệ thống</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {(selectedAcc.role || '').toLowerCase() !== 'admin' && (
                <button onClick={() => handleToggleBan(selectedAcc.id)}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${isActive(selectedAcc) ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                  {isActive(selectedAcc) ? <><Ban size={18} /> Khóa tài khoản</> : <><Unlock size={18} /> Mở khóa tài khoản</>}
                </button>
              )}
              <button onClick={() => setSelectedAcc(null)}
                className={`py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors ${(selectedAcc.role || '').toLowerCase() === 'admin' ? 'flex-1' : 'px-6'}`}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAccountsPage