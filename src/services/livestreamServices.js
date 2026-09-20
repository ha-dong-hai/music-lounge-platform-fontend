import axiosClient from '../config/axios';

export const getLivestreamDetail = async (id) => {
  return axiosClient.get(`/livestreams/${id}`);
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
