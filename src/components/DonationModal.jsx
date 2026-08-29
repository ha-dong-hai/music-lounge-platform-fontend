import { useState } from 'react';
import { DollarSign, Loader2, Heart } from 'lucide-react';
import { donationService } from '../services/donationService';
import toast from 'react-hot-toast';
import './DonationModal.css';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 5000000];

export default function DonationModal({ isOpen, onClose, livestreamId }) {
  const [amount, setAmount] = useState(100000);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (amount < 10000) {
      toast.error('Minimum donation is 10,000 VND');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await donationService.donate(livestreamId, amount, message);
      if (res.success && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        toast.error('Failed to initiate donation');
      }
    } catch (err) {
      toast.error('Failed to process donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="donation-overlay" onClick={onClose}>
      <div className="donation-modal" onClick={e => e.stopPropagation()}>
        <div className="donation-header">
          <Heart size={48} className="donation-icon" />
          <h2>Support the Performer</h2>
          <p>Show your appreciation with a donation</p>
        </div>

        <div className="donation-amount-grid">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              className={`btn-amount ${amount === amt ? 'selected' : ''}`}
              onClick={() => setAmount(amt)}
            >
              {amt.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="custom-amount-wrapper">
          <label>Custom Amount</label>
          <div className="custom-amount-input">
            <DollarSign size={20} color="#fbbf24" />
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={10000}
              step={10000}
            />
            <span>VND</span>
          </div>
        </div>

        <div className="donation-message">
          <label>Message (Optional)</label>
          <textarea
            placeholder="Write a message to show on screen..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="donation-actions">
          <button className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn-submit-donation" onClick={handleSubmit} disabled={isSubmitting || !livestreamId}>
            {isSubmitting ? <Loader2 size={20} className="auth-btn-spinner" /> : <Heart size={20} />}
            Donate {amount.toLocaleString()} VND
          </button>
        </div>
      </div>
    </div>
  );
}
