import axiosClient from '../config/axios';

// viewingSessionId: mã phiên xem lần trước của CHÍNH trình duyệt này (MLACP-513, PR #373). Có mã thì backend dùng lại phiên
// đó thay vì tính thêm một thiết bị — trước đây tải lại trang 2 lần là bị chặn "đang xem trên 2 thiết bị" (đo khi chạy Mux
// thật 01/10/2026). Backend chưa có PR này thì bỏ qua tham số — gửi trước vô hại.
export const getLivestreamDetail = async (id, viewingSessionId) => {
  return axiosClient.get(`/livestreams/${id}`, { params: viewingSessionId ? { viewingSessionId } : undefined });
};

export const getChatHistory = async (id, params = {}) => {
  return axiosClient.get(`/livestreams/${id}/chat`, { params });
};

export const sendHeartbeat = async (id, sessionId) => {
  return axiosClient.post(`/livestreams/${id}/heartbeat`, { sessionId });
};

// --- Owner/Staff vận hành (RequireVenueOperator ở backend) ---

export const createLivestream = async ({ showId, isFree = false, chatEnabled = true }) => {
  return axiosClient.post('/livestreams', { showId, isFree, chatEnabled });
};

// Nhạy cảm — RTMP URL + Stream Key để cắm phần mềm phát (OBS...), không hiển thị cho khán giả.
export const getLivestreamCredentials = async (id) => {
  return axiosClient.get(`/livestreams/${id}/credentials`);
};

export const startLivestream = async (id) => {
  return axiosClient.post(`/livestreams/${id}/start`);
};

export const endLivestream = async (id) => {
  return axiosClient.post(`/livestreams/${id}/end`);
};

// Bật/tắt khung chat của một buổi phát (chủ hoặc nhân viên đúng phòng trà).
// Dùng khi chat bị spam giữa buổi diễn. Tắt chat KHÔNG làm mất tin nhắn cũ.
export const setChatEnabled = async (id, enabled) => {
  return axiosClient.post(`/livestreams/${id}/chat-enabled`, { enabled });
};

// ADMIN cắt sóng một buổi phát. `reason` BẮT BUỘC — đây là can thiệp từ ngoài vào buổi diễn đang
// chạy, phải trả lời được câu "vì sao cắt" về sau. Không dùng cho việc kết thúc bình thường —
// đó là endLivestream của người vận hành.
export const terminateLivestream = async (id, reason) => {
  return axiosClient.post(`/livestreams/${id}/terminate`, { reason });
};
