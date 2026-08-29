import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ticketTierService } from '../../../services/ticketTierService';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import './TicketTierModal.css';

const ticketTierSchema = z.object({
  zoneId: z.string().nullable().optional(),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  accessType: z.enum(['Physical', 'Livestream']),
  totalCapacity: z.coerce.number().min(1, 'Capacity is required'),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
  saleStart: z.string().min(1, 'Sale start is required'),
  saleEnd: z.string().min(1, 'Sale end is required'),
});

export default function TicketTierModal({ isOpen, onClose, showId, showStartTime, showFormat, zones = [], tierToEdit, onSuccess }) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(ticketTierSchema),
    defaultValues: {
      zoneId: '',
      name: '',
      description: '',
      accessType: 'Physical',
      totalCapacity: '',
      prices: [{
        name: 'Standard',
        price: '',
        saleStart: dayjs().format('YYYY-MM-DDTHH:mm'),
        saleEnd: dayjs(showStartTime).format('YYYY-MM-DDTHH:mm'),
      }],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (tierToEdit) {
        reset({
          zoneId: tierToEdit.zoneId ? tierToEdit.zoneId.toString() : '',
          name: tierToEdit.name,
          description: tierToEdit.description || '',
          accessType: tierToEdit.accessType,
          totalCapacity: tierToEdit.totalCapacity?.toString() || '',
          price: tierToEdit.prices?.[0]?.price || '',
          saleStart: tierToEdit.prices?.[0] ? dayjs(tierToEdit.prices[0].saleStart).format('YYYY-MM-DDTHH:mm') : dayjs().format('YYYY-MM-DDTHH:mm'),
          saleEnd: tierToEdit.prices?.[0] ? dayjs(tierToEdit.prices[0].saleEnd).format('YYYY-MM-DDTHH:mm') : dayjs(showStartTime).format('YYYY-MM-DDTHH:mm'),
        });
      } else {
        reset({
          zoneId: '',
          name: '',
          description: '',
          accessType: showFormat === 'Online' ? 'Livestream' : 'Physical',
          totalCapacity: '',
          price: '',
          saleStart: dayjs().format('YYYY-MM-DDTHH:mm'),
          saleEnd: dayjs(showStartTime).format('YYYY-MM-DDTHH:mm'),
        });
      }
    }
  }, [isOpen, showFormat, showStartTime, tierToEdit, reset]);

  const selectedZoneId = register('zoneId').onChange; // Will use manual onChange

  const handleZoneChange = (e) => {
    const zid = e.target.value;
    if (zid) {
      const zone = zones.find(z => z.id.toString() === zid.toString());
      if (zone) {
        reset((formValues) => ({
          ...formValues,
          zoneId: zid,
          name: zone.name,
          totalCapacity: zone.capacity
        }));
      }
    } else {
      reset((formValues) => ({
        ...formValues,
        zoneId: ''
      }));
    }
  };

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const payload = {
        showId: Number(showId),
        name: data.name,
        description: data.description,
        accessType: data.accessType,
        zoneId: data.accessType === 'Physical' && data.zoneId ? Number(data.zoneId) : null,
        totalCapacity: Number(data.totalCapacity),
        prices: [{
          name: 'Standard',
          price: Number(data.price),
          quota: null,
          purchaseChannel: 'Online',
          saleStart: new Date(data.saleStart).toISOString(),
          saleEnd: new Date(data.saleEnd).toISOString(),
        }],
      };

      let res;
      if (tierToEdit) {
        res = await ticketTierService.update(tierToEdit.id, payload);
      } else {
        res = await ticketTierService.create(payload);
      }

      if (res.success) {
        toast.success(tierToEdit ? 'Cập nhật giá vé thành công' : 'Thêm giá vé thành công');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu giá vé thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tier-modal-overlay">
      <div className="tier-modal-content">
        <div className="tier-modal-header">
          <h2>{tierToEdit ? 'Cập nhật Giá Vé' : 'Cấu hình Giá Vé'}</h2>
          <button className="tier-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="tier-modal-body">
          <div className="owner-form-grid">
            <div className="owner-form-group">
              <label>Loại Vé (Ticket Type)</label>
              <select 
                {...register('accessType')}
                disabled={!!tierToEdit}
                onChange={(e) => {
                  register('accessType').onChange(e);
                  if (e.target.value === 'Livestream') {
                    reset((prev) => ({ ...prev, zoneId: '' }));
                  }
                }}
              >
                {showFormat !== 'Online' && <option value="Physical">Offline Ticket (Physical)</option>}
                {showFormat !== 'Offline' && <option value="Livestream">Online Ticket (Livestream)</option>}
              </select>
            </div>
            
            {watch('accessType') === 'Physical' && (
              <div className="owner-form-group">
                <label>Khu vực (Area)</label>
                <select 
                  {...register('zoneId')} 
                  disabled={!!tierToEdit}
                  onChange={(e) => {
                    register('zoneId').onChange(e);
                    handleZoneChange(e);
                  }}
                >
                  <option value="">-- Chọn Khu vực --</option>
                  {zones?.map(z => (
                    <option key={z.id} value={z.id}>{z.name} (Sức chứa: {z.capacity})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="owner-form-group">
            <label>Tên Hạng Vé (Tier Name)</label>
            <input
              type="text"
              {...register('name')}
              placeholder="Ví dụ: Khu vực VIP, Early Bird..."
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="owner-form-error">{errors.name.message}</span>}
          </div>
            
          <div className="owner-form-group">
            <label>Total Capacity (Tickets)</label>
            <input
              type="number"
              {...register('totalCapacity')}
              className={errors.totalCapacity ? 'input-error' : ''}
            />
            {errors.totalCapacity && <span className="owner-form-error">{errors.totalCapacity.message}</span>}
          </div>

          <div className="owner-form-group">
            <label>Price (VND)</label>
            <input
              type="number"
              {...register('price')}
              disabled={!!tierToEdit}
              placeholder="e.g. 500000"
              className={errors.price ? 'input-error' : ''}
            />
            {errors.price && <span className="owner-form-error">{errors.price.message}</span>}
          </div>

          <div className="owner-form-grid">
            <div className="owner-form-group">
              <label>Sale Start</label>
              <input
                type="datetime-local"
                {...register('saleStart')}
                disabled={!!tierToEdit}
                className={errors.saleStart ? 'input-error' : ''}
              />
              {errors.saleStart && <span className="owner-form-error">{errors.saleStart.message}</span>}
            </div>
            <div className="owner-form-group">
              <label>Sale End</label>
              <input
                type="datetime-local"
                {...register('saleEnd')}
                disabled={!!tierToEdit}
                className={errors.saleEnd ? 'input-error' : ''}
              />
              {errors.saleEnd && <span className="owner-form-error">{errors.saleEnd.message}</span>}
            </div>
          </div>

          <div className="tier-modal-actions">
            <button type="button" className="owner-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="owner-btn-save" disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="auth-btn-spinner" /> : null}
              Save Tier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
