import { Mail, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OwnerCompletionStep() {
  return (
    <div
      className="completion-step text-center"
    >
      <div 
        className="completion-icon-wrapper"
      >
        <Mail size={48} className="completion-icon" />
        <div
           className="completion-badge"
        >
          <CheckCircle size={24} />
        </div>
      </div>

      <h2 
        className="auth-title mt-6"
      >
        Thank you for registering
      </h2>
      
      <p 
        className="auth-subtitle mb-8"
      >
        Your account is currently being verified by our team.<br/>
        Please keep an eye on your email for the latest updates regarding your account.
      </p>

      <div>
        <Link to="/login" className="auth-btn" style={{ textDecoration: 'none' }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}
