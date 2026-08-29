import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Camera, MapPin, Edit, Plus, Calendar, Settings } from 'lucide-react';
import { loungeService } from '../../services/loungeService';
import { showService } from '../../services/showService';
import { uploadFileToFirebase } from '../../utils/firebaseUpload';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import './LoungeManagerPage.css';

export default function LoungeManagerPage() {
  const { id } = useParams();
  const [lounge, setLounge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchLoungeAndShows = async () => {
    setIsLoading(true);
    try {
      const loungeRes = await loungeService.getDetail(id);
      
      if (loungeRes.success) setLounge(loungeRes.data);
    } catch (err) {
      toast.error('Failed to load lounge manager');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoungeAndShows();
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
      const path = `lounges/${id}_cover_${Date.now()}`;
      const url = await uploadFileToFirebase(file, path);
      
      const res = await loungeService.setCoverImage(id, url);
      if (res.success || res.status === 204 || !res.message) {
        toast.success('Cover image updated');
        setLounge((prev) => ({ ...prev, primaryImageUrl: url }));
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="lounge-mgr-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Loading lounge...</span>
      </div>
    );
  }

  if (!lounge) {
    return (
      <div className="lounge-mgr-loading">
        <h3>Lounge not found</h3>
        <Link to="/owner/dashboard" className="owner-back-link">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="lounge-mgr-page">
      <div className="lounge-mgr-header">
        <Link to="/owner/dashboard" className="owner-back-link">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        <div className="lounge-mgr-actions">
          <Link to={`/owner/lounges/${id}/edit`} className="owner-btn-secondary">
            <Edit size={16} />
            Edit Info
          </Link>
        </div>
      </div>

      <div className="lounge-mgr-cover">
        {lounge.primaryImageUrl ? (
          <img src={lounge.primaryImageUrl} alt={lounge.name} className="lounge-mgr-cover-img" />
        ) : (
          <div className="lounge-mgr-cover-placeholder">
            <span>No Cover Image</span>
          </div>
        )}
        <div className="lounge-mgr-cover-overlay">
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

      <div className="lounge-mgr-info">
        <h1 className="lounge-mgr-title">{lounge.name}</h1>
        <p className="lounge-mgr-address">
          <MapPin size={16} />
          {lounge.fullAddress || `${lounge.street}, ${lounge.ward}, ${lounge.district}, ${lounge.city}`}
        </p>
        {lounge.description && (
          <p className="lounge-mgr-desc">{lounge.description}</p>
        )}
      </div>

      <div className="lounge-mgr-content">
        <div className="lounge-mgr-section">
          <div className="lounge-mgr-section-header">
            <h2>Cấu hình Khu Vực (Areas/Zones)</h2>
            <Link to={`/owner/lounges/${id}/zones`} className="owner-btn-secondary">
              <MapPin size={16} />
              Quản lý Khu vực & Bản đồ 2D
            </Link>
          </div>
          <div className="p-6 text-gray-400">
            Sử dụng công cụ này để vẽ bản đồ chỗ ngồi và chia khu vực (Ví dụ: Khu VIP, Bàn Đứng...) cho Lounge của bạn.
          </div>

          <div className="lounge-mgr-section-header mt-8">
            <h2>Thông tin mở rộng khác</h2>
          </div>
          <div className="p-6 text-gray-400">
            Quản lý Tour thực tế ảo 360 và Nhân viên (sẽ được tích hợp sau).
          </div>
        </div>
      </div>
    </div>
  );
}
