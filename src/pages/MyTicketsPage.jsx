import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket, Loader2, Calendar, MapPin, QrCode, Eye, ChevronRight,
} from 'lucide-react';
import { ticketService } from '../services/ticketService';
import Pagination from '../components/Pagination';
import dayjs from 'dayjs';
import './MyTicketsPage.css';

const STATUS_STYLES = {
  Confirmed: { bg: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.2)' },
  Used: { bg: 'rgba(156, 163, 175, 0.08)', color: '#9ca3af', border: 'rgba(156, 163, 175, 0.2)' },
  Cancelled: { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
  Refunded: { bg: 'rgba(249, 115, 22, 0.08)', color: '#f97316', border: 'rgba(249, 115, 22, 0.2)' },
  PendingTransfer: { bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const res = await ticketService.getMyTickets({ page, pageSize: 10 });
        if (res.success) {
          setTickets(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, [page]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="tickets-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Loading tickets...</span>
      </div>
    );
  }

  return (
    <div className="tickets-page">
      <div className="tickets-header">
        <h1 className="tickets-title">
          <Ticket size={24} />
          My Tickets
        </h1>
        <span className="tickets-count">
          {tickets?.totalCount || 0} ticket{(tickets?.totalCount || 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {tickets?.items?.length > 0 ? (
        <>
          <div className="tickets-list">
            {tickets.items.map((ticket) => {
              const statusStyle = STATUS_STYLES[ticket.status] || STATUS_STYLES.Confirmed;
              const isExpanded = expandedTicket === ticket.id;

              return (
                <div key={ticket.id} className="ticket-card">
                  <div
                    className="ticket-card-main"
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                  >
                    <div className="ticket-card-left">
                      <div className="ticket-date-badge">
                        <span className="ticket-date-month">
                          {dayjs(ticket.showScheduledStart).format('MM')}
                        </span>
                        <span className="ticket-date-day">
                          {dayjs(ticket.showScheduledStart).format('DD')}
                        </span>
                      </div>
                    </div>

                    <div className="ticket-card-info">
                      <h3 className="ticket-show-name">{ticket.showName}</h3>
                      <div className="ticket-meta">
                        <span>
                          <MapPin size={13} />
                          {ticket.loungeName}{ticket.loungeCity ? `, ${ticket.loungeCity}` : ''}
                        </span>
                        <span>
                          <Calendar size={13} />
                          {dayjs(ticket.showScheduledStart).format('HH:mm')}
                        </span>
                      </div>
                      <div className="ticket-tags">
                        <span className="ticket-tier-tag">{ticket.tierName}</span>
                        <span className="ticket-price-tag">{ticket.priceName}</span>
                      </div>
                    </div>

                    <div className="ticket-card-right">
                      <span
                        className="ticket-status"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          borderColor: statusStyle.border,
                        }}
                      >
                        {ticket.status}
                      </span>
                      <span className="ticket-amount">{formatPrice(ticket.pricePaid)}</span>
                      <ChevronRight
                        size={16}
                        className={`ticket-expand-icon ${isExpanded ? 'ticket-expand-icon--open' : ''}`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ticket-card-expanded">
                      {ticket.qrCode && (
                        <div className="ticket-qr-section">
                          <div className="ticket-qr-placeholder">
                            <QrCode size={32} />
                            <span className="ticket-qr-code">{ticket.qrCode}</span>
                          </div>
                          <p className="ticket-qr-hint">Show this QR code at the venue for check-in</p>
                        </div>
                      )}
                      <div className="ticket-detail-grid">
                        <div className="ticket-detail-item">
                          <span className="ticket-detail-label">Ticket ID</span>
                          <span className="ticket-detail-value">{ticket.id.slice(0, 8)}...</span>
                        </div>
                        <div className="ticket-detail-item">
                          <span className="ticket-detail-label">Access Type</span>
                          <span className="ticket-detail-value">{ticket.accessType}</span>
                        </div>
                        <div className="ticket-detail-item">
                          <span className="ticket-detail-label">Purchased</span>
                          <span className="ticket-detail-value">
                            {dayjs(ticket.purchasedAt).format('DD/MM/YYYY HH:mm')}
                          </span>
                        </div>
                      </div>
                      <Link to={`/shows/${ticket.showId}`} className="ticket-view-show">
                        <Eye size={16} />
                        View Show Details
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            page={tickets.page}
            totalPages={Math.ceil(tickets.totalCount / tickets.pageSize)}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="tickets-empty">
          <Ticket size={48} />
          <h3>No tickets yet</h3>
          <p>Your purchased tickets will appear here</p>
          <Link to="/" className="tickets-discover-btn">Discover Shows</Link>
        </div>
      )}
    </div>
  );
}
