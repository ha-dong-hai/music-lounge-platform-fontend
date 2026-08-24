import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'https://musiclounge-api.azurewebsites.net/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: (params) => {
    const parts = [];
    for (const key in params) {
      const value = params[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Nếu là mảng: genreIds=1&genreIds=2
          value.forEach(v => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
        } else {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
      }
    }
    return parts.join('&');
  }
});

// Interceptor Request: Tự động gắn token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: Trả về thẳng data để service xử lý
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Xử lý lỗi tập trung (VD: 401 thì logout)
    if (error.response?.status === 401) {
      console.warn('Unauthorized! Cần đăng nhập lại.');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;