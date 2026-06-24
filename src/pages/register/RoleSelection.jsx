import { Headphones, Store } from 'lucide-react';

export default function RoleSelection({ onSelectRole }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  };

  return (
    <div className="role-selection">
      <h2
        className="auth-title"
      >
        Sign Up
      </h2>
      <p
        className="auth-subtitle"
      >
        You want to register as...
      </p>

      <div className="role-cards-container">
        <button
          className="role-card"
          onClick={() => onSelectRole('Audience')}
        >
          <div className="role-card-icon">
            <Headphones size={32} />
          </div>
          <h3 className="role-card-title">Audience</h3>
          <p className="role-card-desc">Enjoy your favorite music spaces</p>
        </button>

        <button
          className="role-card"
          onClick={() => onSelectRole('Owner')}
        >
          <div className="role-card-icon">
            <Store size={32} />
          </div>
          <h3 className="role-card-title">Event Owner</h3>
          <p className="role-card-desc">Manage your music venues and events</p>
        </button>
      </div>
    </div>
  );
}
