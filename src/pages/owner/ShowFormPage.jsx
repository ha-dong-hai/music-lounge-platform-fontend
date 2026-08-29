import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Save, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { showService } from '../../services/showService';
import { subscriptionService } from '../../services/subscriptionService';
import toast from 'react-hot-toast';
import './ShowFormPage.css';
import dayjs from 'dayjs';

const showSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  format: z.enum(['Offline', 'Online', 'Hybrid']),
  scheduledStart: z.string().min(1, 'Start date is required'),
  scheduledEnd: z.string().optional(),
  offlineQuota: z.coerce.number().optional(),
  performances: z.array(z.object({
    performerName: z.string().min(1, 'Performer name is required'),
    role: z.string().min(1, 'Role is required (e.g. Main, Guest)'),
  })).optional(),
});

export default function ShowFormPage() {
  const { id, loungeId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mySub, setMySub] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(showSchema),
    defaultValues: {
      name: '',
      description: '',
      format: 'Offline',
      scheduledStart: '',
      scheduledEnd: '',
      offlineQuota: '',
      performances: [{ performerName: '', role: 'Main' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'performances',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isEditing) {
          const subRes = await subscriptionService.getMySubscription().catch(() => ({ success: true, data: null }));
          if (subRes && subRes.success) {
            setMySub(subRes.data);
          }
          setIsLoading(false);
          return;
        }

        // isEditing
        const [showRes, subRes] = await Promise.all([
          showService.getDetail(id),
          subscriptionService.getMySubscription().catch(() => ({ success: true, data: null }))
        ]);

        if (subRes && subRes.success) {
          setMySub(subRes.data);
        }

        if (showRes.success && showRes.data) {
          const show = showRes.data;
          reset({
            name: show.name,
            description: show.description || '',
            format: show.format,
            scheduledStart: dayjs(show.scheduledStart).format('YYYY-MM-DDTHH:mm'),
            scheduledEnd: show.scheduledEnd ? dayjs(show.scheduledEnd).format('YYYY-MM-DDTHH:mm') : '',
            offlineQuota: show.offlineQuota || '',
            performances: show.performers?.map((p, i) => ({
              performerName: p.name,
              role: i === 0 ? 'Main' : 'Guest',
            })) || [{ performerName: '', role: 'Main' }],
          });
        }
      } catch (err) {
        toast.error('Failed to load data');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing, reset, navigate]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      // Map frontend schema to backend command
      const payload = {
        name: data.name,
        description: data.description,
        format: data.format,
        scheduledStart: new Date(data.scheduledStart).toISOString(),
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd).toISOString() : null,
        categoryId: null, // MVP: hardcoded or omitted
        offlineQuota: data.offlineQuota ? Number(data.offlineQuota) : null,
        genreIds: [], // MVP
        performances: data.performances?.map((p, i) => ({
          performerName: p.performerName,
          role: p.role,
          orderIndex: i,
          acceptsDonation: false,
        })) || [],
      };

      if (isEditing) {
        // Update uses slightly different payload in UpdateLoungeShowCommand
        await showService.update(id, payload);
        toast.success('Show updated successfully');
        navigate(`/owner/shows/${id}`);
      } else {
        payload.loungeId = Number(loungeId);
        const res = await showService.create(payload);
        if (res.success) {
          toast.success('Show created successfully');
          navigate(`/owner/shows/${res.data}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save show');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="lounge-form-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Loading show...</span>
      </div>
    );
  }

  const backUrl = isEditing ? `/owner/shows/${id}` : `/owner/lounges/${loungeId}`;
  const isSubActive = mySub && mySub.status === 'Active' && dayjs(mySub.expiresAt).isAfter(dayjs());

  return (
    <div className="lounge-form-page">
      {!isSubActive && (
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>Yêu cầu:</strong> Bạn cần gói dịch vụ đang hoạt động để tạo show mới.</span>
          <Link to="/owner/subscriptions" style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>
            Mua gói dịch vụ
          </Link>
        </div>
      )}
      
      <div className="lounge-form-header">
        <Link to={backUrl} className="owner-back-link">
          <ArrowLeft size={18} />
          Back
        </Link>
        <h1 className="lounge-form-title">
          {isEditing ? 'Edit Show' : 'Create New Show'}
        </h1>
      </div>

      <div className="lounge-form-content">
        <form onSubmit={handleSubmit(onSubmit)} className="owner-form-card">
          <div className="owner-form-section">
            <h3>General Details</h3>
            
            <div className="owner-form-group">
              <label>Show Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Acoustic Night Live"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="owner-form-error">{errors.name.message}</span>}
            </div>

            <div className="owner-form-group">
              <label>Description</label>
              <textarea
                {...register('description')}
                placeholder="What is this show about?"
                rows={4}
                className={errors.description ? 'input-error' : ''}
              />
              {errors.description && <span className="owner-form-error">{errors.description.message}</span>}
            </div>

            <div className="owner-form-grid">
              <div className="owner-form-group">
                <label>Format</label>
                <select {...register('format')}>
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="owner-form-group">
                <label>Offline Capacity (Optional)</label>
                <input
                  type="number"
                  {...register('offlineQuota')}
                  placeholder="e.g. 200"
                />
              </div>
            </div>
          </div>

          <div className="owner-form-section">
            <h3>
              <CalendarIcon size={18} />
              Schedule
            </h3>
            <div className="owner-form-grid">
              <div className="owner-form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  {...register('scheduledStart')}
                  className={errors.scheduledStart ? 'input-error' : ''}
                />
                {errors.scheduledStart && <span className="owner-form-error">{errors.scheduledStart.message}</span>}
              </div>

              <div className="owner-form-group">
                <label>End Time (Optional)</label>
                <input
                  type="datetime-local"
                  {...register('scheduledEnd')}
                />
              </div>
            </div>
          </div>

          <div className="owner-form-section">
            <div className="show-form-section-header">
              <h3>Performers</h3>
              <button 
                type="button" 
                className="owner-btn-icon"
                onClick={() => append({ performerName: '', role: 'Guest' })}
              >
                <Plus size={14} /> Add Performer
              </button>
            </div>

            <div className="show-form-performers">
              {fields.map((item, index) => (
                <div key={item.id} className="show-form-performer-row">
                  <div className="owner-form-group">
                    <input
                      type="text"
                      {...register(`performances.${index}.performerName`)}
                      placeholder="Performer Name"
                    />
                  </div>
                  <div className="owner-form-group">
                    <select {...register(`performances.${index}.role`)}>
                      <option value="Main">Main Act</option>
                      <option value="Guest">Guest</option>
                      <option value="Opening">Opening</option>
                    </select>
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className="show-form-remove-btn"
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>


          <div className="owner-form-actions">
            <Link to={backUrl} className="owner-btn-cancel">
              Cancel
            </Link>
            <button type="submit" className="owner-btn-save" disabled={isSaving || !isSubActive}>
              {isSaving ? (
                <>
                  <Loader2 size={18} className="auth-btn-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Show
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
