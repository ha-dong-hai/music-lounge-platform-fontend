import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import './auth.css';

export default function VerifyEmailPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; 

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    if (!email) {
      toast.error('Email not found. Please register again.');
      navigate('/register');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyEmail({ email, verificationCode });

      if (res.result === 1) {
        toast.success('Email verified successfully! Please log in.');
        navigate('/login');
      } else {
        toast.error(res.error?.message || 'Invalid verification code');
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Server connection error';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setIsResending(true);
    try {
      const res = await authService.resendVerificationCode({ email });

      if (res.result === 1) {
        toast.success('Verification code resent!');
        setCooldown(60);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(res.error?.message || 'Failed to resend code');
      }
    } catch (err) {
      toast.error('Server connection error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page">



      <div className="auth-card">
        {}
        <div className="auth-logo">
          <div className="auth-logo-icon auth-logo-icon--verify">
            <MailCheck size={28} />
          </div>
          <h1 className="auth-logo-text">Music Lounge</h1>
        </div>

        <h2 className="auth-title">Verify Email</h2>
        <p className="auth-subtitle">
          Enter the 6-digit code sent to{' '}
          {email ? <strong className="auth-email-highlight">{email}</strong> : 'your email'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form" id="verify-form">
          {}
          <div className="auth-otp-group">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`auth-otp-input ${digit ? 'auth-otp-input--filled' : ''}`}
                id={`otp-${index}`}
              />
            ))}
          </div>

          {}
          <button
            type="submit"
            className="auth-btn mt-4"
            disabled={isLoading || code.join('').length < 6}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="auth-btn-spinner" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>

          {}
          <button
            type="button"
            className="auth-resend-btn"
            id="resend-code"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
          >
            {isResending ? (
              <Loader2 size={16} className="auth-btn-spinner" />
            ) : (
              <RefreshCw size={16} />
            )}
            {cooldown > 0
              ? `Resend code in ${cooldown}s`
              : 'Resend verification code'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login" className="auth-link" id="goto-login-from-verify">
            &larr; Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
