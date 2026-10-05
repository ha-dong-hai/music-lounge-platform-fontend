import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { ngonNguGuiMayChu } from '../i18n';


// ĐỊA CHỈ MÁY CHỦ — đọc từ biến môi trường, rơi về máy chủ hiện tại nếu không đặt.
// Vì sao cần: trước đây địa chỉ này dán cứng, nên muốn trỏ sang môi trường khác (máy cá nhân, bản
// thử) là phải sửa mã rồi build lại. Dự án đã có sẵn cơ chế biến môi trường (Firebase đang dùng),
// chỉ chỗ này là chưa theo.
// GIÁ TRỊ MẶC ĐỊNH GIỮ NGUYÊN máy chủ đang chạy, nên không đặt biến thì mọi thứ y như cũ.
//
// LƯU Ý KHI ĐƯA FE LÊN TÊN MIỀN THẬT: máy chủ hiện chỉ cho ĐÚNG MỘT origin là http://localhost:5173
// (Cors__AllowedOrigins__0). Đổi địa chỉ này sang tên miền thật mà chưa thêm origin đó ở máy chủ thì
// trình duyệt chặn mọi lời gọi — và nó hiện ra dưới dạng "lỗi mạng" khó đoán, không phải lỗi CORS
// rõ ràng. Phải nhờ backend thêm origin TRƯỚC khi đổi.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://musiclounge-api.azurewebsites.net/api/v1',
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

// NGÔN NGỮ THÔNG ĐIỆP TỪ MÁY CHỦ — backend song ngữ Việt/Anh theo Accept-Language (MLACP-487/489,
// NgonNguYeuCau.cs). Không gửi thì trình duyệt tự gửi ngôn ngữ CỦA MÁY, nên người dùng đặt trình duyệt
// tiếng Anh thấy lỗi tiếng Anh giữa giao diện tiếng Việt (đo 30/09: "Tickets can only be checked in
// while the concert is running." trên màn soát vé). Lấy theo lựa chọn ngôn ngữ của chính trang web
// (localStorage 'lang', Header.jsx), mặc định 'vi' — đúng phương án A đã chọn ở MLACP-407.
// 03/10/2026: khu chủ phòng trà / admin luôn tiếng Việt (src/i18n/VungTiengViet.jsx) nên đọc qua ngonNguGuiMayChu().
const ngonNgu = () => ngonNguGuiMayChu();


// Interceptor Request: Tự động gắn token (đọc từ store, không phải localStorage thô) và ngôn ngữ
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = ngonNgu();
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
    // LỖI THEO TỪNG Ô: backend trả { message: "Dữ liệu gửi lên không hợp lệ.", errors: { DateOfBirth: ["…"] } }.
    // Mọi màn hình chỉ hiện `message`, nên người dùng chỉ thấy câu chung mà không biết sai ô nào (đo 30/09:
    // gửi hồ sơ CCCD thiếu ngày sinh). Gộp lý do cụ thể vào `message` ở MỘT chỗ này để mọi form đều hưởng,
    // thay vì sửa từng catch. Giữ nguyên `errors` cho màn nào muốn tô đỏ đúng ô.
    const data = error.response?.data;
    if (data && typeof data === 'object' && data.errors && typeof data.errors === 'object') {
      const lyDo = Object.values(data.errors).flat().filter((x) => typeof x === 'string' && x.trim());
      if (lyDo.length) data.message = [...new Set(lyDo)].join(' ');
    }

    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    // 429 (giới hạn 100 lời gọi/phút/IP của backend): thử lại MỘT lần sau Retry-After, chỉ với lời gọi ĐỌC (GET) — lặp
    // lại lệnh ghi có thể tạo đơn/thanh toán hai lần. Đo 05/10/2026: ngay sau khi 6 người mua vé từ cùng một mạng, màn
    // "Phát trực tuyến" của chủ phòng trà báo "Chưa tải được danh sách" dù chỉ cần đợi vài giây là được. Trần 10 giây để
    // người dùng không ngồi chờ vô hạn; quá trần thì để màn hình báo lỗi như cũ.
    if (status === 429 && !originalRequest?._retry429 && (originalRequest?.method ?? 'get').toLowerCase() === 'get') {
      const giay = Number(error.response?.headers?.['retry-after']);
      const cho = Number.isFinite(giay) && giay > 0 ? giay * 1000 : 3000;
      if (cho <= 10000) {
        originalRequest._retry429 = true;
        await new Promise((r) => setTimeout(r, cho));
        return axiosClient(originalRequest);
      }
    }

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