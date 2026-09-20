import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

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

// Interceptor Request: Tự động gắn token (đọc từ store, không phải localStorage thô)
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Gọi refresh token thô, không qua axiosClient để tránh lặp lại chính interceptor này
const refreshAuthToken = async (refreshToken) => {
  const res = await axios.post(
    `${axiosClient.defaults.baseURL}/auth/refresh`,
    { refreshToken }
  );
  return res.data.data; // AuthResultDto
};

let refreshPromise = null;

// Interceptor Response: Trả về thẳng data để service xử lý; 401 thì thử refresh 1 lần trước khi logout
axiosClient.interceptors.response.use(
  (response) => {
    // 204 hoặc body rỗng: trả về phong bì chuẩn để service không phải kiểm undefined riêng.
    if (response.status === 204 || response.data === '' || response.data == null) {
      return { success: true, data: null, message: null };
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      const { refreshToken, logout, login } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAuthToken(refreshToken).finally(() => {
            refreshPromise = null;
          });
        }
        const authResult = await refreshPromise;
        login(authResult);
        originalRequest.headers.Authorization = `Bearer ${authResult.token}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;