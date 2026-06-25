import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Eye, EyeOff, Phone, Calendar } from 'lucide-react';
import { audienceRegisterSchema } from '../../schemas/authSchema';

export default function AudienceInfoStep({ defaultValues, onNext, onPrev }) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(audienceRegisterSchema),
    defaultValues: {
      fullName: defaultValues?.fullName || '',
      email: defaultValues?.email || '',
      password: defaultValues?.password || '',
      phone: defaultValues?.phone || '',
      dateOfBirth: defaultValues?.dateOfBirth || '',
    },
    mode: 'onTouched',
  });

  const onSubmit = (data) => {
    onNext(data);
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.08, duration: 0.35 },
    }),
  };

  return (
    <div>
      <h2 className="auth-title">Sign Up</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form mt-4" id="audience-form">
        <div className="auth-field">
          <label htmlFor="audience-fullname" className="auth-label">Full Name</label>
          <div className={`auth-input-wrapper ${errors.fullName ? 'auth-input-wrapper--error' : ''}`}>
            <User size={18} className="auth-input-icon" />
            <input
              id="audience-fullname"
              type="text"
              placeholder="John Doe"
              {...register('fullName')}
              className="auth-input"
            />
          </div>
          {errors.fullName && <span className="auth-error">{errors.fullName.message}</span>}
        </div>

        <div className="auth-field-row">
           <div className="auth-field">
            <label htmlFor="audience-dob" className="auth-label">Date of Birth</label>
            <div className={`auth-input-wrapper ${errors.dateOfBirth ? 'auth-input-wrapper--error' : ''}`}>
              <Calendar size={18} className="auth-input-icon" />
              <input
                id="audience-dob"
                type="date"
                {...register('dateOfBirth')}
                className="auth-input"
              />
            </div>
             {errors.dateOfBirth && <span className="auth-error">{errors.dateOfBirth.message}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="audience-phone" className="auth-label">Phone Number</label>
            <div className={`auth-input-wrapper ${errors.phone ? 'auth-input-wrapper--error' : ''}`}>
              <Phone size={18} className="auth-input-icon" />
              <input
                id="audience-phone"
                type="tel"
                placeholder="0912..."
                {...register('phone')}
                className="auth-input"
              />
            </div>
             {errors.phone && <span className="auth-error">{errors.phone.message}</span>}
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="audience-email" className="auth-label">Email</label>
          <div className={`auth-input-wrapper ${errors.email ? 'auth-input-wrapper--error' : ''}`}>
            <Mail size={18} className="auth-input-icon" />
            <input
              id="audience-email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className="auth-input"
            />
          </div>
          {errors.email && <span className="auth-error">{errors.email.message}</span>}
        </div>

        <div className="auth-field">
          <label htmlFor="audience-password" className="auth-label">Password</label>
          <div className={`auth-input-wrapper ${errors.password ? 'auth-input-wrapper--error' : ''}`}>
            <Lock size={18} className="auth-input-icon" />
            <input
              id="audience-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              {...register('password')}
              className="auth-input"
            />
            <button
              type="button"
              className="auth-input-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="auth-error">{errors.password.message}</span>}
        </div>

        <div className="step-navigation">
          <button type="button" className="step-nav-btn step-nav-btn--outline" onClick={onPrev}>
            Back
          </button>
          <button type="submit" className="step-nav-btn">
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
