import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const [integrityIssues, setIntegrityIssues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchIntegrity = async (showToast = false) => {
    try {
      const res = await adminService.checkLedgerIntegrity();
      if (res.success) {
        setIntegrityIssues(res.data);
        if (showToast) toast.success('Ledger check completed');
      }
    } catch (err) {
      toast.error('Failed to run ledger check');
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchIntegrity();
      setIsLoading(false);
    };
    init();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchIntegrity(true);
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="admin-dash-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Loading Admin System...</span>
      </div>
    );
  }

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-header">
        <div className="admin-dash-title-group">
          <ShieldCheck size={28} className="admin-dash-icon" />
          <div>
            <h1 className="admin-dash-title">Admin Dashboard</h1>
            <p className="admin-dash-subtitle">System Overview & Integrity Checks</p>
          </div>
        </div>
      </div>

      <div className="admin-dash-content">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Financial Ledger Integrity</h2>
            <button 
              className="admin-btn-outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? 'auth-btn-spinner' : ''} />
              Run Check
            </button>
          </div>

          <div className="admin-panel-body">
            {!integrityIssues || integrityIssues.length === 0 ? (
              <div className="admin-integrity-success">
                <CheckCircle size={40} className="text-green-500" />
                <h3>All Systems Go</h3>
                <p>No discrepancies found in the financial ledger.</p>
              </div>
            ) : (
              <div className="admin-integrity-issues">
                <div className="admin-alert-banner">
                  <AlertTriangle size={24} />
                  <div>
                    <strong>Warning!</strong>
                    <span> Found {integrityIssues.length} issue(s) in the ledger.</span>
                  </div>
                </div>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Account ID</th>
                        <th>Type</th>
                        <th>Expected Balance</th>
                        <th>Actual Balance</th>
                        <th>Discrepancy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {integrityIssues.map((issue, idx) => (
                        <tr key={idx}>
                          <td>{issue.accountId}</td>
                          <td>{issue.accountType}</td>
                          <td>{issue.expectedBalance?.toLocaleString()} VND</td>
                          <td className="text-red-400">{issue.actualBalance?.toLocaleString()} VND</td>
                          <td>{(issue.expectedBalance - issue.actualBalance)?.toLocaleString()} VND</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>System Jobs</h2>
          </div>
          <div className="admin-panel-body">
            <div className="admin-jobs-grid">
              <div className="admin-job-card">
                <h4>Reconciliation Job</h4>
                <p>Runs daily to reconcile pending tickets and wallet balances.</p>
                <button 
                  className="admin-btn-secondary"
                  onClick={() => adminService.triggerJob('ReconciliationJob').then(() => toast.success('Job triggered')).catch(() => toast.error('Failed to trigger job'))}
                >
                  Trigger Manually
                </button>
              </div>
              
              <div className="admin-job-card">
                <h4>Reminder Emails Job</h4>
                <p>Sends out reminder emails 24h before a show starts.</p>
                <button 
                  className="admin-btn-secondary"
                  onClick={() => adminService.triggerJob('ReminderJob').then(() => toast.success('Job triggered')).catch(() => toast.error('Failed to trigger job'))}
                >
                  Trigger Manually
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
