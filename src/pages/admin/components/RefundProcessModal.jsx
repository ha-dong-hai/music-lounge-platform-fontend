import { useState } from 'react';
import { X, Loader2, CheckCircle, Ban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminService } from '../../../services/adminService';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const refundSchema = z.object({
  decision: z.enum(['Approved', 'Rejected']),
  approvedAmount: z.string().optional(),
}).refine(data => {
  if (data.decision === 'Approved' && (!data.approvedAmount || Number(data.approvedAmount) <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Approved amount must be greater than 0 if approved",
  path: ["approvedAmount"]
});

export default function RefundProcessModal({ isOpen, onClose, request, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      decision: 'Approved',
      approvedAmount: request?.requestedAmount?.toString() || '',
    },
  });

  const decision = watch('decision');

  // Reset form when request changes
  useState(() => {
    if (request) {
      reset({
        decision: 'Approved',
        approvedAmount: request.requestedAmount?.toString() || '',
      });
    }
  }, [request]);

  const onSubmit = async (data) => {
    setIsProcessing(true);
    try {
      const payload = {
        decision: data.decision,
        approvedAmount: data.decision === 'Approved' ? Number(data.approvedAmount) : null,
      };

      const res = await adminService.processRefund(request.id, payload);
      if (res.success || res.status === 204 || !res.message) {
        toast.success(`Refund request ${data.decision.toLowerCase()}`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="tier-modal-overlay">
      <div className="tier-modal-content" style={{ maxWidth: '500px' }}>
        <div className="tier-modal-header">
          <h2>Process Refund Request</h2>
          <button className="tier-modal-close" onClick={onClose} disabled={isProcessing}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="tier-modal-body">
          <div className="admin-refund-summary" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ margin: '0 0 8px' }}><strong>User:</strong> {request.userEmail}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Requested Date:</strong> {dayjs(request.createdAt).format('DD/MM/YYYY HH:mm')}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Ticket Original Price:</strong> {request.ticketPrice?.toLocaleString()} VND</p>
            <p style={{ margin: '0', color: 'var(--text-primary)' }}><strong>Requested Amount:</strong> {request.requestedAmount?.toLocaleString()} VND</p>
          </div>

          <div className="owner-form-group">
            <label>Decision</label>
            <select {...register('decision')}>
              <option value="Approved">Approve</option>
              <option value="Rejected">Reject</option>
            </select>
          </div>

          {decision === 'Approved' && (
            <div className="owner-form-group">
              <label>Approved Amount (VND)</label>
              <input
                type="number"
                {...register('approvedAmount')}
                placeholder="e.g. 500000"
                className={errors.approvedAmount ? 'input-error' : ''}
              />
              {errors.approvedAmount && <span className="owner-form-error">{errors.approvedAmount.message}</span>}
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                You can approve a partial refund by entering an amount less than the requested amount.
              </p>
            </div>
          )}

          <div className="tier-modal-actions" style={{ marginTop: '16px', padding: 0, borderTop: 'none' }}>
            <button type="button" className="owner-btn-cancel" onClick={onClose} disabled={isProcessing}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`owner-btn-save ${decision === 'Rejected' ? 'btn-danger' : ''}`}
              style={decision === 'Rejected' ? { background: '#ef4444', color: '#fff' } : {}}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 size={16} className="auth-btn-spinner" /> : (decision === 'Approved' ? <CheckCircle size={16} /> : <Ban size={16} />)}
              {decision === 'Approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
