import { useState, useEffect, useCallback } from 'react';
import { X, Minus, Plus, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ticketService } from '../services/ticketService';
import toast from 'react-hot-toast';
import './BookingModal.css';

const STEPS = {
  SELECT: 'select',
  HOLD: 'hold',
  RESULT: 'result',
};

export default function BookingModal({ show, onClose }) {
  const [step, setStep] = useState(STEPS.SELECT);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isHolding, setIsHolding] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [holdData, setHoldData] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for hold expiration
  useEffect(() => {
    if (!holdData?.expiresAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((new Date(holdData.expiresAt) - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        toast.error('Hold expired. Please try again.');
        setStep(STEPS.SELECT);
        setHoldData(null);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [holdData?.expiresAt]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleHold = async () => {
    if (!selectedPrice) return;
    setIsHolding(true);
    try {
      const res = await ticketService.holdTicket({
        priceId: selectedPrice.id,
        quantity,
      });
      if (res.success && res.data) {
        setHoldData(res.data);
        setStep(STEPS.HOLD);
      } else {
        toast.error(res.message || 'Failed to hold tickets');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to hold tickets');
    } finally {
      setIsHolding(false);
    }
  };

  const handlePurchase = async () => {
    if (!holdData?.holdId) return;
    setIsPurchasing(true);
    try {
      const res = await ticketService.purchaseTicket({ holdId: holdData.holdId });
      if (res.success && res.data) {
        if (res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        } else {
          setStep(STEPS.RESULT);
          toast.success('Tickets purchased successfully!');
        }
      } else {
        toast.error(res.message || 'Purchase failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancelHold = useCallback(async () => {
    if (!holdData?.holdId) return;
    try {
      await ticketService.cancelHold(holdData.holdId);
    } catch {
      // silently fail
    }
    setHoldData(null);
    setStep(STEPS.SELECT);
  }, [holdData?.holdId]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const tiers = show?.ticketTiers || [];
  const totalAmount = selectedPrice ? selectedPrice.price * quantity : 0;

  return (
    <div className="booking-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-header">
          <h2 className="booking-title">
            {step === STEPS.SELECT && 'Select Tickets'}
            {step === STEPS.HOLD && 'Confirm Purchase'}
            {step === STEPS.RESULT && 'Booking Complete'}
          </h2>
          <button className="booking-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="booking-body">
          {/* STEP 1: Select tier & price */}
          {step === STEPS.SELECT && (
            <>
              <div className="booking-show-info">
                <h3>{show?.name}</h3>
                <p>{show?.lounge?.name}</p>
              </div>

              {tiers.length === 0 ? (
                <div className="booking-empty">
                  <AlertCircle size={24} />
                  <p>No tickets available for this show.</p>
                </div>
              ) : (
                <div className="booking-tiers">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="booking-tier">
                      <h4 className="booking-tier-name">
                        {tier.name}
                        <span className="booking-tier-type">{tier.accessType}</span>
                      </h4>
                      {tier.description && <p className="booking-tier-desc">{tier.description}</p>}

                      <div className="booking-prices">
                        {tier.prices?.map((price) => {
                          const isAvailable = price.availableSlots == null || price.availableSlots > 0;
                          const isOnSale = new Date(price.saleStart) <= Date.now() && new Date(price.saleEnd) >= Date.now();
                          const isSelected = selectedPrice?.id === price.id;

                          return (
                            <button
                              key={price.id}
                              className={`booking-price-btn ${isSelected ? 'booking-price-btn--selected' : ''}`}
                              onClick={() => {
                                setSelectedTier(tier);
                                setSelectedPrice(price);
                                setQuantity(1);
                              }}
                              disabled={!isAvailable || !isOnSale}
                            >
                              <span className="booking-price-name">{price.name}</span>
                              <span className="booking-price-amount">{formatPrice(price.price)}</span>
                              {!isAvailable && <span className="booking-price-sold">Sold out</span>}
                              {isAvailable && price.availableSlots != null && (
                                <span className="booking-price-slots">{price.availableSlots} left</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPrice && (
                <div className="booking-quantity">
                  <span className="booking-quantity-label">Quantity</span>
                  <div className="booking-quantity-controls">
                    <button
                      className="booking-qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="booking-qty-value">{quantity}</span>
                    <button
                      className="booking-qty-btn"
                      onClick={() => {
                        const max = selectedPrice.availableSlots != null
                          ? Math.min(5, selectedPrice.availableSlots)
                          : 5;
                        setQuantity(Math.min(max, quantity + 1));
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="booking-summary">
                <div className="booking-summary-row">
                  <span>Total</span>
                  <span className="booking-summary-total">{formatPrice(totalAmount)}</span>
                </div>
                <button
                  className="booking-action-btn"
                  onClick={handleHold}
                  disabled={!selectedPrice || isHolding}
                >
                  {isHolding ? (
                    <>
                      <Loader2 size={18} className="auth-btn-spinner" />
                      Reserving...
                    </>
                  ) : (
                    'Reserve Tickets'
                  )}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Hold confirmation */}
          {step === STEPS.HOLD && (
            <>
              <div className="booking-hold-timer">
                <Clock size={20} />
                <span>Expires in <strong>{formatCountdown(countdown)}</strong></span>
              </div>

              <div className="booking-hold-details">
                <div className="booking-detail-row">
                  <span>Show</span>
                  <span>{show?.name}</span>
                </div>
                <div className="booking-detail-row">
                  <span>Tier</span>
                  <span>{selectedTier?.name}</span>
                </div>
                <div className="booking-detail-row">
                  <span>Price</span>
                  <span>{selectedPrice?.name} × {quantity}</span>
                </div>
                <div className="booking-detail-row booking-detail-row--total">
                  <span>Total</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="booking-hold-actions">
                <button
                  className="booking-action-btn"
                  onClick={handlePurchase}
                  disabled={isPurchasing || countdown <= 0}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 size={18} className="auth-btn-spinner" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
                <button
                  className="booking-cancel-btn"
                  onClick={handleCancelHold}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Success */}
          {step === STEPS.RESULT && (
            <div className="booking-success">
              <CheckCircle size={48} />
              <h3>Booking Confirmed!</h3>
              <p>Your tickets have been booked. Check "My Tickets" for details.</p>
              <button className="booking-action-btn" onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
