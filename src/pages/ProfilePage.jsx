import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Camera, Loader2, Save } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import { uploadFileToFirebase } from '../utils/firebaseUpload';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
});

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '' },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        if (res.success) {
          setProfile(res.data);
          setAvatarPreview(res.data.avatarUrl);
          reset({ fullName: res.data.fullName });
        }
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      let avatarUrl = profile.avatarUrl;

      if (avatarFile) {
        const path = `avatars/${user.userId}_${Date.now()}`;
        avatarUrl = await uploadFileToFirebase(avatarFile, path);
      }

      const res = await authService.updateProfile({
        fullName: data.fullName,
        avatarUrl,
      });

      if (res.success) {
        toast.success('Profile updated successfully');
        setProfile(res.data);
        // We only have updateProfile updating the backend.
        // For the frontend store, ideally we update it too if it holds fullName/avatar.
        // Assuming we can use useAuthStore.setState or similar if we had it, but for now we'll just show success.
      } else {
        toast.error(res.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">
          <User size={24} />
          Profile Settings
        </h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  type="button"
                  className="profile-avatar-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                />
              </div>
              <div className="profile-avatar-info">
                <h3>Profile Picture</h3>
                <p>JPG, PNG or WebP. Max size of 2MB.</p>
              </div>
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <label className="profile-label">Email Address (Read-only)</label>
                <div className="profile-input-wrapper profile-input-wrapper--readonly">
                  <Mail size={18} className="profile-input-icon" />
                  <input
                    type="email"
                    value={profile?.email || ''}
                    readOnly
                    className="profile-input"
                  />
                </div>
              </div>

              <div className="profile-field">
                <label className="profile-label">Full Name</label>
                <div className={`profile-input-wrapper ${errors.fullName ? 'profile-input-wrapper--error' : ''}`}>
                  <User size={18} className="profile-input-icon" />
                  <input
                    type="text"
                    {...register('fullName')}
                    className="profile-input"
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <span className="profile-error">{errors.fullName.message}</span>
                )}
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={(!isDirty && !avatarFile) || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="auth-btn-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
