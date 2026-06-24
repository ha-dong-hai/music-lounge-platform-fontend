import axiosInstance from '../config/axios';

export const authService = {
  
  register: async ({ email, password, fullName, phone }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ result: 1, data: { email, id: 'mock-id-123' } });
      }, 1000);
    });
  },

  
  verifyEmail: async ({ email, verificationCode }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ result: 1, message: 'Verified successfully' });
      }, 1000);
    });
  },

  
  resendVerificationCode: async ({ email }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ result: 1, message: 'Code resent' });
      }, 1000);
    });
  },

  
  login: async ({ email, password }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          result: 1, 
          data: { 
            accessToken: 'mock-token', 
            email, 
            fullName: 'Mock User',
            role: 'Audience'
          } 
        });
      }, 1000);
    });
  },

  
  getProfile: async () => {
    const response = await axiosInstance.get('/api/Auth/me');
    return response.data;
  },

  
  updateProfile: async ({ fullName, phone, avatarUrl }) => {
    const response = await axiosInstance.put('/api/Auth/profile', {
      fullName,
      phone,
      avatarUrl,
    });
    return response.data;
  },

  
  updateCitizenCard: async ({ citizenCardNumber, citizenCardFrontImageUrl, citizenCardBackImageUrl, storageProvider }) => {
    const response = await axiosInstance.put('/api/Auth/citizen-card', {
      citizenCardNumber,
      citizenCardFrontImageUrl,
      citizenCardBackImageUrl,
      storageProvider: storageProvider || 'Firebase',
    });
    return response.data;
  },

  
  deleteAccount: async () => {
    const response = await axiosInstance.delete('/api/Auth/account');
    return response.data;
  },
};
