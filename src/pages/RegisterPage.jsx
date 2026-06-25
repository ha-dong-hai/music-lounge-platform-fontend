import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import toast from 'react-hot-toast';

import { authService } from '../services/authService';
import { uploadFileToFirebase } from '../utils/firebaseUpload';


import RoleSelection from './register/RoleSelection';
import AudienceInfoStep from './register/AudienceInfoStep';
import GenreStep from './register/GenreStep';
import AtmosphereStep from './register/AtmosphereStep';
import MoodStep from './register/MoodStep';
import OwnerInfoStep from './register/OwnerInfoStep';
import OwnerVerifyStep from './register/OwnerVerifyStep';
import OwnerCompletionStep from './register/OwnerCompletionStep';

import './auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();

  
  const [role, setRole] = useState(null); 
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '', 
  });

  
  const [preferences, setPreferences] = useState({
    genres: [],
    atmospheres: [],
    moods: [],
  });

  
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => {
    if (step === 1) {
      setRole(null);
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(1);
  };

  
  const handleAudienceInfoSubmit = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    nextStep(); 
  };

  const togglePreference = (category, id) => {
    setPreferences((prev) => {
      const currentList = prev[category];
      const isSelected = currentList.includes(id);
      return {
        ...prev,
        [category]: isSelected
          ? currentList.filter((item) => item !== id)
          : [...currentList, id],
      };
    });
  };

  const submitAudienceRegistration = async () => {
    setIsLoading(true);
    try {
      
      const res = await authService.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || null,
        
        
        
      });

      if (res.result === 1) {
        
        
        console.log('Saved preferences (mock):', preferences);

        toast.success('Registration successful! Please verify your email.');
        navigate('/verify-email', { state: { email: formData.email } });
      } else {
        toast.error(res.error?.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleOwnerInfoSubmit = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    nextStep(); 
  };

  const submitOwnerRegistration = async (verifyData) => {
    setIsLoading(true);
    try {
      
      const timestamp = Date.now();
      const uploadPromises = verifyData.verificationFiles.map((file, index) => {
        const verifyPath = `owner_verification/${formData.email}_${timestamp}_doc_${index}`;
        return uploadFileToFirebase(file, verifyPath);
      });

      const verificationUrls = await Promise.all(uploadPromises);

      
      const registerRes = await authService.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
      });

      if (registerRes.result === 1) {
        
        console.log('Mock: Update Owner Verification Info', {
          userId: registerRes.data?.id,
          loungeName: verifyData.loungeName,
          province: verifyData.province,
          ward: verifyData.ward,
          addressNote: verifyData.addressNote,
          atmospheres: verifyData.atmospheres,
          capacity: verifyData.capacity,
          verificationDocumentUrls: verificationUrls,
          StorageProvider: 'Firebase',
        });

        
        nextStep();
      } else {
        toast.error(registerRes.error?.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during registration and file upload.');
    } finally {
      setIsLoading(false);
    }
  };

  
  const totalSteps = role === 'Audience' ? 4 : role === 'Owner' ? 3 : 0;
  const progressPercent = role && step > 0 ? (step / totalSteps) * 100 : 0;

  return (
    <div className={`auth-page ${role === 'Owner' && step === 3 ? '' : 'wizard-page'}`}>



      <div className={`auth-card wizard-card ${step === 0 ? 'wizard-card--wide' : ''} ${role === 'Owner' && step === 2 ? 'wizard-card--extra-wide' : ''}`}>
        {}
        {role && step > 0 && step <= totalSteps && (
          <div className="wizard-progress">
            <div
              className="wizard-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {}
        {!(role === 'Owner' && step === 3) && ( 
           <div className="wizard-header">
             <div className="auth-logo-icon auth-logo-icon--small mb-2">
               <Music size={20} />
             </div>
             <span className="wizard-brand">Music Lounge</span>
           </div>
        )}

        {}
        <div className="wizard-content">
          {!role && step === 0 && (
            <RoleSelection key="role" onSelectRole={handleRoleSelect} />
          )}

          {}
          {role === 'Audience' && step === 1 && (
            <AudienceInfoStep key="aud-info" defaultValues={formData} onNext={handleAudienceInfoSubmit} onPrev={prevStep} />
          )}
          {role === 'Audience' && step === 2 && (
            <GenreStep
              key="aud-genre"
              selectedGenres={preferences.genres}
              onToggleGenre={(id) => togglePreference('genres', id)}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {role === 'Audience' && step === 3 && (
            <AtmosphereStep
              key="aud-atmos"
              selectedAtmospheres={preferences.atmospheres}
              onToggleAtmosphere={(id) => togglePreference('atmospheres', id)}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {role === 'Audience' && step === 4 && (
            <MoodStep
              key="aud-mood"
              selectedMoods={preferences.moods}
              onToggleMood={(id) => togglePreference('moods', id)}
              onSubmit={submitAudienceRegistration}
              onPrev={prevStep}
              isLoading={isLoading}
            />
          )}

          {}
          {role === 'Owner' && step === 1 && (
            <OwnerInfoStep key="own-info" defaultValues={formData} onNext={handleOwnerInfoSubmit} onPrev={prevStep} />
          )}
          {role === 'Owner' && step === 2 && (
            <OwnerVerifyStep key="own-verify" onSubmit={submitOwnerRegistration} onPrev={prevStep} isLoading={isLoading} />
          )}
          {role === 'Owner' && step === 3 && (
            <OwnerCompletionStep key="own-done" />
          )}
        </div>

        {}
        {(!role || (role === 'Audience' && step === 1) || (role === 'Owner' && step === 1)) && (
          <p className="auth-footer mt-6">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
