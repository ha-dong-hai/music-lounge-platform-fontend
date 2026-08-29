import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Camera, Edit, Tag, Music, Globe, Users, PlayCircle, Send, Map, Video, Trash2 } from 'lucide-react';
import { showService } from '../../services/showService';
import { ticketTierService } from '../../services/ticketTierService';
import { loungeService } from '../../services/loungeService';
import { uploadFileToFirebase } from '../../utils/firebaseUpload';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import TicketTierModal from './components/TicketTierModal';
import './ShowManagerPage.css';

export default function ShowManagerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [ticketTiers, setTicketTiers] = useState([]);
  const [tierToEdit, setTierToEdit] = useState(null);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [showRes, tiersRes] = await Promise.all([
        showService.getDetail(id),
        ticketTierService.getByShow(id),
      ]);
      
      if (showRes.success) {
        setShow(showRes.data);
        const lId = showRes.data.lounge?.id;
        if (lId) {
          const zonesRes = await loungeService.getZones(lId);
          if (zonesRes.success) setZones(zonesRes.data.items || zonesRes.data);
        }
      }
      if (tiersRes.success) setTicketTiers(tiersRes.data);
    } catch (err) {
      toast.error('Failed to load show manager');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const path = `shows/${id}_cover_${Date.now()}`;
      const url = await uploadFileToFirebase(file, path);
      
      const res = await showService.setCoverImage(id, url);
      if (res.success || res.status === 204 || !res.message) {
        toast.success('Cover image updated');
        setShow((prev) => ({ ...prev, coverImageUrl: url }));
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!ticketTiers.length) {
      toast.error('You must add at least one ticket tier before publishing.');
      return;
    }
    
    setIsPublishing(true);
    try {
      await showService.publish(id);
      toast.success('Show published successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish show');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteTier = async (tierId) => {
    alert('Hệ thống hiện tại chưa hỗ trợ xóa hạng vé sau khi đã tạo để đảm bảo toàn vẹn dữ liệu.');
  };

  const handleEditTier = (tier) => {
    setTierToEdit(tier);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setTierToEdit(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="lounge-mgr-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Loading show...</span>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="lounge-mgr-loading">
        <h3>Show not found</h3>
        <Link to="/owner/dashboard" className="owner-back-link">Return to Dashboard</Link>
      </div>
    );
  }

  const offlineTiers = ticketTiers.filter(t => t.accessType === 'Physical');
  const onlineTiers = ticketTiers.filter(t => t.accessType === 'Livestream');

  return (
    <div className="show-mgr-page">
      <div className="show-mgr-header">
        <Link to={`/owner/lounges/${show.loungeId}`} className="owner-back-link">
          <ArrowLeft size={18} />
          Back to Lounge
        </Link>
        <div className="show-mgr-actions">
          {show.status === 'Draft' && (
            <button 
              className="owner-btn-primary"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? <Loader2 size={16} className="auth-btn-spinner" /> : <Send size={16} />}
              Publish Show
            </button>
          )}
          {(show.format === 'Online' || show.format === 'Hybrid') && show.status !== 'Draft' && (
            <Link to={`/owner/shows/${id}/studio`} className="owner-btn-primary" style={{ background: '#e11d48' }}>
              <Video size={16} />
              Live Studio
            </Link>
          )}
          <Link to={`/owner/shows/${id}/map`} className="owner-btn-secondary">
            <Map size={16} />
            Seating Map
          </Link>
          <Link to={`/owner/shows/${id}/edit`} className="owner-btn-secondary">
            <Edit size={16} />
            Edit Info
          </Link>
        </div>
      </div>

      <div className="show-mgr-cover">
        {show.coverImageUrl ? (
          <img src={show.coverImageUrl} alt={show.name} className="show-mgr-cover-img" />
        ) : (
          <div className="show-mgr-cover-placeholder">
            <span>No Cover Image</span>
          </div>
        )}
        <div className="show-mgr-cover-overlay">
          <button 
            className="lounge-mgr-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 size={16} className="auth-btn-spinner" /> : <Camera size={16} />}
            {isUploading ? 'Uploading...' : 'Change Cover'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/png,image/webp"
            hidden
          />
        </div>
      </div>

      <div className="show-mgr-info">
        <div className="show-mgr-title-row">
          <h1 className="show-mgr-title">{show.name}</h1>
          <span className={`show-status-badge status-${show.status?.toLowerCase()}`}>
            {show.status}
          </span>
        </div>
        
        <div className="show-mgr-meta">
          <span><Globe size={16} /> {show.format}</span>
          <span><Users size={16} /> {show.offlineQuota ? `${show.offlineQuota} offline limit` : 'No offline limit'}</span>
        </div>

        {show.description && (
          <p className="show-mgr-desc">{show.description}</p>
        )}

        {show.performers?.length > 0 && (
          <div className="show-mgr-performers">
            <h4 className="show-mgr-subtitle">Performers</h4>
            <div className="show-mgr-performer-list">
              {show.performers.map((p, i) => (
                <div key={i} className="show-performer-tag">
                  <Music size={14} />
                  {p.name} <span className="show-performer-role">({p.role || 'Guest'})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="show-mgr-content">
        <div className="show-mgr-section">
          <div className="show-mgr-section-header">
            <h2>{show.format === 'Online' ? 'Ticket Tiers (Giá vé Online)' : 'Ticket Tiers (Giá vé)'}</h2>
            <button className="owner-btn-secondary" onClick={handleOpenModal}>
              <Tag size={16} />
              {show.format === 'Online' ? 'Thêm Giá Vé Online' : 'Thêm Giá Mới'}
            </button>
          </div>

          <div className="show-mgr-tiers">
            {ticketTiers.length > 0 ? (
              <>
                {offlineTiers.length > 0 && (
                  <div className="tier-group">
                    <h3 style={{ margin: '1rem 0', color: '#c3b665' }}>Vé Offline (Theo Khu Vực)</h3>
                    <div className="tier-list">
                      {offlineTiers.map((tier) => (
                        <div key={tier.id} className="tier-card">
                          <div className="tier-info">
                            <h4>{tier.name}</h4>
                            <p className="tier-meta">
                              Khu vực: {zones.find(z => z.id === tier.zoneId)?.name || 'Chung'} • Sức chứa: {tier.totalCapacity} vé
                            </p>
                            <p className="tier-desc">{tier.description}</p>
                            <div className="tier-price-tags">
                              {tier.prices?.map((p) => (
                                <span key={p.id} className="tier-price-badge">
                                  {p.name}: {p.price.toLocaleString()}đ
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="tier-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="owner-btn-icon" onClick={() => handleEditTier(tier)} title="Sửa">
                              <Edit size={16} />
                            </button>
                            <button className="owner-btn-icon text-red-500" onClick={() => handleDeleteTier(tier.id)} title="Xóa">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onlineTiers.length > 0 && (
                  <div className="tier-group">
                    <h3 style={{ margin: '1rem 0', color: '#c3b665' }}>Vé Online (Livestream)</h3>
                    <div className="tier-list">
                      {onlineTiers.map((tier) => (
                        <div key={tier.id} className="tier-card">
                          <div className="tier-info">
                            <h4>{tier.name}</h4>
                            <p className="tier-desc">{tier.description}</p>
                            <div className="tier-price-tags">
                              {tier.prices?.map((p) => (
                                <span key={p.id} className="tier-price-badge">
                                  {p.name}: {p.price.toLocaleString()}đ
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="tier-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="owner-btn-icon" onClick={() => handleEditTier(tier)} title="Sửa">
                              <Edit size={16} />
                            </button>
                            <button className="owner-btn-icon text-red-500" onClick={() => handleDeleteTier(tier.id)} title="Xóa">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="lounge-mgr-empty">
                <Tag size={32} />
                <p>No ticket tiers added yet.</p>
                <button className="owner-text-link" onClick={() => setIsModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  Thiết lập giá vé khu vực đầu tiên
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <TicketTierModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTierToEdit(null); }}
        showId={id}
        showStartTime={show.scheduledStart}
        showFormat={show.format}
        zones={zones}
        tierToEdit={tierToEdit}
        onSuccess={fetchData}
      />
    </div>
  );
}
