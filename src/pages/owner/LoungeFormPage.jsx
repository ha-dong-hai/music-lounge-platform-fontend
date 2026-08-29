import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Save, MapPin } from 'lucide-react';
import { loungeService } from '../../services/loungeService';
import toast from 'react-hot-toast';
import './LoungeFormPage.css';

const loungeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  street: z.string().min(2, 'Street is required'),
  ward: z.string().min(2, 'Ward is required'),
  district: z.string().min(2, 'District is required'),
  city: z.string().min(2, 'City is required'),
});

export default function LoungeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loungeSchema),
    defaultValues: {
      name: '',
      description: '',
      street: '',
      ward: '',
      district: '',
      city: '',
    },
  });

  useEffect(() => {
    if (isEditing) {
      const fetchLounge = async () => {
        try {
          const res = await loungeService.getDetail(id);
          if (res.success && res.data) {
            const lounge = res.data;
            reset({
              name: lounge.name,
              description: lounge.description || '',
              street: lounge.street || '',
              ward: lounge.ward || '',
              district: lounge.district || '',
              city: lounge.city || '',
            });
          }
        } catch (err) {
          toast.error('Failed to load lounge details');
          navigate('/owner/dashboard');
        } finally {
          setIsLoading(false);
        }
      };
      fetchLounge();
    }
  }, [id, isEditing, reset, navigate]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await loungeService.update(id, data);
        toast.success('Lounge updated successfully');
        navigate(`/owner/lounges/${id}`);
      } else {
        const res = await loungeService.create(data);
        if (res.success) {
          toast.success('Lounge created successfully');
          navigate(`/owner/lounges/${res.data}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lounge');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="lounge-form-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Loading lounge...</span>
      </div>
    );
  }

  return (
    <div className="lounge-form-page">
      <div className="lounge-form-header">
        <Link to={isEditing ? `/owner/lounges/${id}` : '/owner/dashboard'} className="owner-back-link">
          <ArrowLeft size={18} />
          Back
        </Link>
        <h1 className="lounge-form-title">
          {isEditing ? 'Edit Lounge' : 'Create New Lounge'}
        </h1>
      </div>

      <div className="lounge-form-content">
        <form onSubmit={handleSubmit(onSubmit)} className="owner-form-card">
          <div className="owner-form-section">
            <h3>General Information</h3>
            <div className="owner-form-group">
              <label>Lounge Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. The Acoustic Hub"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="owner-form-error">{errors.name.message}</span>}
            </div>

            <div className="owner-form-group">
              <label>Description</label>
              <textarea
                {...register('description')}
                placeholder="Describe your lounge, its vibe, and what makes it special..."
                rows={4}
              />
            </div>
          </div>

          <div className="owner-form-section">
            <h3>
              <MapPin size={18} />
              Location Details
            </h3>
            
            <div className="owner-form-grid">
              <div className="owner-form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  {...register('street')}
                  placeholder="e.g. 123 Music St"
                  className={errors.street ? 'input-error' : ''}
                />
                {errors.street && <span className="owner-form-error">{errors.street.message}</span>}
              </div>

              <div className="owner-form-group">
                <label>Ward</label>
                <input
                  type="text"
                  {...register('ward')}
                  placeholder="e.g. Ward 1"
                  className={errors.ward ? 'input-error' : ''}
                />
                {errors.ward && <span className="owner-form-error">{errors.ward.message}</span>}
              </div>

              <div className="owner-form-group">
                <label>District</label>
                <input
                  type="text"
                  {...register('district')}
                  placeholder="e.g. District 1"
                  className={errors.district ? 'input-error' : ''}
                />
                {errors.district && <span className="owner-form-error">{errors.district.message}</span>}
              </div>

              <div className="owner-form-group">
                <label>City</label>
                <input
                  type="text"
                  {...register('city')}
                  placeholder="e.g. Ho Chi Minh City"
                  className={errors.city ? 'input-error' : ''}
                />
                {errors.city && <span className="owner-form-error">{errors.city.message}</span>}
              </div>
            </div>
          </div>

          <div className="owner-form-actions">
            <Link
              to={isEditing ? `/owner/lounges/${id}` : '/owner/dashboard'}
              className="owner-btn-cancel"
            >
              Cancel
            </Link>
            <button type="submit" className="owner-btn-save" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={18} className="auth-btn-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Lounge
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
