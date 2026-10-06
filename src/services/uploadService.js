import api from '../config/axios';

export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadCitizenCardImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/uploads/citizen-card-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadModel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/uploads/models', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMyUploads: async () => {
    const response = await api.get('/api/v1/uploads/mine');
    return response.data;
  },

  deleteUpload: async (id) => {
    const response = await api.delete(`/api/v1/uploads/${id}`);
    return response.data;
  },
};
