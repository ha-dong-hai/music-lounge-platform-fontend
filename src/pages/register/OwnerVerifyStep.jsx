import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store, MapPin, Users, UploadCloud, CheckCircle, Loader2, X } from 'lucide-react';
import { ownerVerifySchema } from '../../schemas/authSchema';
import { ATMOSPHERES } from '../../constants/preferences';

export default function OwnerVerifyStep({ onSubmit, onPrev, isLoading }) {
  const [verificationFiles, setVerificationFiles] = useState([]);
  const [selectedAtmospheres, setSelectedAtmospheres] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ownerVerifySchema),
    defaultValues: {
      loungeName: '',
      province: '',
      ward: '',
      addressNote: '',
      capacity: '',
    },
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setVerificationFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (indexToRemove) => {
    setVerificationFiles(verificationFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleAtmosphereChange = (e) => {
    const value = e.target.value;
    if (value && !selectedAtmospheres.find(a => a.id.toString() === value)) {
      const selectedItem = ATMOSPHERES.find(a => a.id.toString() === value);
      if (selectedItem) {
        setSelectedAtmospheres([...selectedAtmospheres, selectedItem]);
      }
    }
    
    e.target.value = '';
  };

  const removeAtmosphere = (idToRemove) => {
    setSelectedAtmospheres(selectedAtmospheres.filter(a => a.id !== idToRemove));
  };

  const submitForm = (data) => {
    if (verificationFiles.length === 0) return;
    
    onSubmit({ 
      ...data, 
      atmospheres: selectedAtmospheres.map(a => a.id),
      verificationFiles 
    });
  };

  return (
    <div>
      <h2 className="auth-title">Verification Information</h2>
      
      <form onSubmit={handleSubmit(submitForm)} className="auth-form mt-4" id="verify-form">
        
        <div className="auth-field">
          <label className="auth-label">Lounge Name</label>
          <div className={`auth-input-wrapper ${errors.loungeName ? 'auth-input-wrapper--error' : ''}`}>
            <Store size={18} className="auth-input-icon" />
            <input
              type="text"
              placeholder="e.g. Moonlight Lounge"
              {...register('loungeName')}
              className="auth-input"
            />
          </div>
          {errors.loungeName && <span className="auth-error">{errors.loungeName.message}</span>}
        </div>

        <div className="auth-field-group">
           <label className="auth-label auth-label--group-title">Address</label>
           
           <div className="auth-field-row">
             <div className="auth-field">
               <label className="auth-label auth-label-opt">Province / City</label>
               <div className={`auth-input-wrapper ${errors.province ? 'auth-input-wrapper--error' : ''}`}>
                 <input
                   type="text"
                   {...register('province')}
                   className="auth-input"
                 />
               </div>
               {errors.province && <span className="auth-error">{errors.province.message}</span>}
             </div>

             <div className="auth-field">
               <label className="auth-label auth-label-opt">Ward / Commune</label>
               <div className={`auth-input-wrapper ${errors.ward ? 'auth-input-wrapper--error' : ''}`}>
                 <input
                   type="text"
                   {...register('ward')}
                   className="auth-input"
                 />
               </div>
               {errors.ward && <span className="auth-error">{errors.ward.message}</span>}
             </div>
           </div>

           <div className="auth-field mt-3">
             <label className="auth-label auth-label-opt">Note (Street, Building, etc.)</label>
             <div className={`auth-input-wrapper ${errors.addressNote ? 'auth-input-wrapper--error' : ''}`}>
               <MapPin size={18} className="auth-input-icon" />
               <input
                 type="text"
                 {...register('addressNote')}
                 className="auth-input"
               />
             </div>
           </div>
        </div>

        <div className="auth-field-group">
           <label className="auth-label auth-label--group-title">Characteristics</label>
           
           <div className="auth-field">
             <label className="auth-label auth-label-opt">Atmosphere</label>
             <div className="auth-select-wrapper">
               <select onChange={handleAtmosphereChange} className="auth-input auth-select" defaultValue="">
                 <option value="" disabled>Select atmosphere...</option>
                 {ATMOSPHERES.map(type => (
                   <option key={type.id} value={type.id}>{type.name}</option>
                 ))}
               </select>
             </div>
             
             {}
             {selectedAtmospheres.length > 0 && (
               <div className="selected-chips-container mt-2">
                 {selectedAtmospheres.map(atm => (
                   <div key={atm.id} className="selected-chip">
                     {atm.name}
                     <button type="button" onClick={() => removeAtmosphere(atm.id)} className="chip-remove-btn">
                       <X size={12} />
                     </button>
                   </div>
                 ))}
               </div>
             )}
           </div>

           <div className="auth-field mt-3">
             <label className="auth-label auth-label-opt">Capacity</label>
             <div className={`auth-input-wrapper ${errors.capacity ? 'auth-input-wrapper--error' : ''}`}>
               <Users size={18} className="auth-input-icon" />
               <input
                 type="number"
                 placeholder="e.g. 100"
                 {...register('capacity')}
                 className="auth-input"
               />
             </div>
             {errors.capacity && <span className="auth-error">{errors.capacity.message}</span>}
           </div>
        </div>

        <div className="auth-field-group">
          <label className="auth-label auth-label--group-title">Verification Information</label>
          <p className="auth-disclaimer text-left mt-1 mb-2" style={{ textAlign: 'left', marginTop: '4px', marginBottom: '8px' }}>Please provide License, Certification, etc. by File/Image to be verified.
          </p>
          
          <div className="upload-box upload-box--large">
            <input 
              type="file" 
              accept="image/*,.pdf" 
              multiple
              onChange={handleFileChange}
              id="upload-verify"
              className="hidden-file-input"
            />
            <label htmlFor="upload-verify" className="upload-label">
                <div className="upload-prompt">
                  <UploadCloud size={32} className="upload-icon" />
                  <span>Choose files or drag and drop here</span>
                </div>
            </label>
          </div>

          {verificationFiles.length > 0 && (
            <div className="file-list mt-3">
              {verificationFiles.map((file, idx) => (
                <div key={idx} className="file-list-item">
                  <div className="file-list-info">
                    <CheckCircle size={16} className="file-list-icon" />
                    <span className="file-list-name">{file.name}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(idx)} className="file-remove-btn">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="step-navigation">
          <button type="button" className="step-nav-btn step-nav-btn--outline" onClick={onPrev} disabled={isLoading}>
            Back
          </button>
          <button 
            type="submit" 
            className="step-nav-btn" 
            disabled={verificationFiles.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="auth-btn-spinner" />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
