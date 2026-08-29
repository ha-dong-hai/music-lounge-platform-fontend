import { useEffect, useState } from 'react';
import { Banknote, Loader2, Clock, CheckCircle, Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import Pagination from '../../components/Pagination';
import RefundProcessModal from './components/RefundProcessModal';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import './AdminRefundsPage.css';

export default function AdminRefundsPage() {
  const [refundsData, setRefundsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRefunds = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPendingRefunds({ page, pageSize: 15 });
      if (res.success) {
        setRefundsData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load refund requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleOpenProcessModal = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <Banknote size={28} className="admin-dash-icon" />
          <div>
            <h1 className="admin-dash-title">Refund Requests</h1>
            <p className="admin-dash-subtitle">Review and process user ticket cancellations</p>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="admin-table-loading">
              <Loader2 size={24} className="auth-btn-spinner" />
              <span>Loading requests...</span>
            </div>
          ) : refundsData?.items?.length > 0 ? (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>User</th>
                    <th>Ticket ID</th>
                    <th>Date Requested</th>
                    <th>Requested Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refundsData.items.map((req) => (
                    <tr key={req.id}>
                      <td>#{req.id}</td>
                      <td>{req.userEmail || `User ${req.userId}`}</td>
                      <td>#{req.ticketId}</td>
                      <td>{dayjs(req.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                      <td style={{ fontWeight: 600 }}>{req.requestedAmount?.toLocaleString()} VND</td>
                      <td>
                        <span className="admin-status-pending">
                          <Clock size={14} /> Pending
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="admin-btn-secondary"
                          onClick={() => handleOpenProcessModal(req)}
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-table-empty">
              <CheckCircle size={40} color="#22c55e" style={{ opacity: 0.8 }} />
              <h3>All caught up!</h3>
              <p>There are no pending refund requests at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {refundsData?.totalCount > 0 && (
        <div style={{ marginTop: 24 }}>
          <Pagination
            page={refundsData.page}
            totalPages={Math.ceil(refundsData.totalCount / refundsData.pageSize)}
            onPageChange={setPage}
          />
        </div>
      )}

      <RefundProcessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
        onSuccess={() => fetchRefunds()}
      />
    </div>
  );
}
