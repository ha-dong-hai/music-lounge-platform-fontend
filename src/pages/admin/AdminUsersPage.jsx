import { useEffect, useState } from 'react';
import { Users as UsersIcon, Loader2, Search, Filter, Ban, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import Pagination from '../../components/Pagination';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import './AdminUsersPage.css';

export default function AdminUsersPage() {
  const [usersData, setUsersData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = { page, pageSize: 15 };
      if (searchText) params.searchText = searchText;
      if (role) params.role = role;
      if (isActive !== '') params.isActive = isActive === 'true';

      const res = await adminService.getUsers(params);
      if (res.success) {
        setUsersData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role, isActive]); // Search is triggered on form submit or debounce

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await adminService.deactivateUser(userId);
        toast.success('User deactivated');
      } else {
        await adminService.reactivateUser(userId);
        toast.success('User reactivated');
      }
      fetchUsers(); // refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <UsersIcon size={28} className="admin-dash-icon" />
          <div>
            <h1 className="admin-dash-title">User Management</h1>
            <p className="admin-dash-subtitle">View and manage all registered accounts</p>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-filters-bar">
          <form className="admin-search-form" onSubmit={handleSearchSubmit}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button type="submit" className="admin-btn-secondary">Search</button>
          </form>

          <div className="admin-filters-group">
            <Filter size={16} color="var(--text-muted)" />
            <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              <option value="Audience">Audience</option>
              <option value="LoungeStaff">Lounge Staff</option>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
            </select>

            <select value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="admin-panel-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="admin-table-loading">
              <Loader2 size={24} className="auth-btn-spinner" />
              <span>Loading users...</span>
            </div>
          ) : usersData?.items?.length > 0 ? (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.items.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.fullName} />
                            ) : (
                              <span>{user.fullName.charAt(0)}</span>
                            )}
                          </div>
                          <span>{user.fullName}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`admin-role-badge role-${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{dayjs(user.createdAt).format('DD/MM/YYYY')}</td>
                      <td>
                        {user.isActive ? (
                          <span className="admin-status-active"><CheckCircle size={14} /> Active</span>
                        ) : (
                          <span className="admin-status-inactive"><Ban size={14} /> Inactive</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {user.role !== 'Admin' && (
                          <button
                            className="admin-btn-action"
                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                            title={user.isActive ? 'Deactivate User' : 'Reactivate User'}
                          >
                            {user.isActive ? <Ban size={16} color="#ef4444" /> : <CheckCircle size={16} color="#22c55e" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-table-empty">
              <UsersIcon size={32} />
              <p>No users found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {usersData?.totalCount > 0 && (
        <div style={{ marginTop: 24 }}>
          <Pagination
            page={usersData.page}
            totalPages={Math.ceil(usersData.totalCount / usersData.pageSize)}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
