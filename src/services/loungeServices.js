import axiosClient from '../config/axios';

export const getLoungeDetail = async (id) => {
  return axiosClient.get(`/lounges/${id}`);
};

export const getLoungeZones = async (loungeId, activeOnly = true) => {
  return axiosClient.get(`/lounges/${loungeId}/zones`, { params: { activeOnly } });
};

export const getLounges = async (params = {}) => {
  return axiosClient.get('/lounges', { params });
};

// ===== HỒ SƠ PHÒNG TRÀ (chủ phòng trà tự quản) =====
// LƯU Ý QUAN TRỌNG SAU KHI TẠO: token hiện tại của chủ CHƯA có claim lounge_id (nó được cấp lúc đăng
// nhập). Phải gọi refresh token ngay sau khi tạo phòng trà, nếu không các màn Owner khác sẽ không
// nhận ra chủ đã có phòng trà.
// Địa chỉ: Street + Ward + City là bắt buộc, District tùy chọn (cấp huyện đã bãi bỏ từ 01/07/2025 nên
// giao diện không hỏi nữa, chỉ gửi lại giá trị cũ nếu bản ghi đã có).
export const createLounge = async (payload) => {
  return axiosClient.post('/lounges', payload);
};

export const updateLounge = async (loungeId, payload) => {
  return axiosClient.put(`/lounges/${loungeId}`, payload);
};

// Ảnh đại diện và giấy phép đều nhận URL, không nhận file: tải file lên /uploads/images trước
// (xem uploadImage trong userServices) rồi gửi URL nhận được vào đây.
export const setLoungeImage = async (loungeId, imageUrl) => {
  return axiosClient.put(`/lounges/${loungeId}/image`, { imageUrl });
};

// Giấy phép kinh doanh là giấy tờ định danh doanh nghiệp: backend chuyển file sang vùng lưu RIÊNG TƯ
// ngay khi nhận, nên URL này KHÔNG mở trực tiếp được. Muốn xem phải gọi getLoungeBusinessLicense.
export const setLoungeBusinessLicense = async (loungeId, documentUrl) => {
  return axiosClient.put(`/lounges/${loungeId}/business-license`, { documentUrl });
};

// Trả về chính FILE (nhị phân), không phải JSON — nên phải xin blob và KHÔNG đi qua interceptor
// bóc data như các lời gọi khác. Chỉ chủ phòng trà đó hoặc Admin xem được; Admin xem thì có ghi log.
export const getLoungeBusinessLicense = async (loungeId) => {
  return axiosClient.get(`/lounges/${loungeId}/business-license`, { responseType: 'blob' });
};

// ===== NHÂN VIÊN PHÒNG TRÀ =====
// Nhân viên là TÀI KHOẢN ĐÃ CÓ trên hệ thống được chủ gán vào phòng trà — không phải tạo tài khoản mới.
// Quy tắc của backend: MỖI TÀI KHOẢN chỉ làm nhân viên ở ĐÚNG MỘT phòng trà đang hoạt động tại một
// thời điểm. Gán một người đang làm ở phòng trà khác sẽ bị từ chối — hiện nguyên câu backend trả về,
// vì "email này đang làm chỗ khác" và "lỗi hệ thống" là hai chuyện khác nhau với người đang thao tác.
export const getLoungeStaff = async (loungeId) => {
  return axiosClient.get(`/lounges/${loungeId}/staff`);
};

// Tra cứu người dùng theo email để mời làm nhân viên. Cố tình CHỬ trả vai trò: endpoint này không
// phải công cụ tra thông tin người khác. 404 nếu email không có tài khoản.
export const lookupUserByEmail = async (email) => {
  return axiosClient.get('/lounges/staff/lookup', { params: { email } });
};

export const assignStaff = async (loungeId, userId) => {
  return axiosClient.post(`/lounges/${loungeId}/staff`, { userId });
};

// Gọi là "deactivate": bản ghi được giữ lại kèm mốc thời gian, không xóa lịch sử đã từng làm việc.
export const deactivateStaff = async (loungeId, staffId) => {
  return axiosClient.delete(`/lounges/${loungeId}/staff/${staffId}`);
};

// ===== KHU VỰC CHỖ NGỒI =====
// Khu vực là không gian vật lý trong phòng trà (sân khấu, tầng trên, ban công...). Hạng vé có thể
// trỏ tới một khu vực qua ZoneId, nên đặt khu vực trước rồi mới tạo hạng vé gắn vào.
// Xoá khu vực là "ngừng hoạt động" (deactivate), không xoá thật — vé cũ còn tham chiếu tới nó.
export const createZone = async (loungeId, { name, description = null, capacity }) => {
  return axiosClient.post(`/lounges/${loungeId}/zones`, { name, description, capacity });
};

// PUT ghi đè cả ba trường — gửi lại đầy đủ.
export const updateZone = async (zoneId, { name, description = null, capacity }) => {
  return axiosClient.put(`/lounges/zones/${zoneId}`, { name, description, capacity });
};

export const deactivateZone = async (zoneId) => {
  return axiosClient.delete(`/lounges/zones/${zoneId}`);
};

// Vị trí khu vực trên SƠ ĐỒ 2D. Toạ độ và kích thước là số thực, tính theo đơn vị của sơ đồ chứ
// không phải pixel — FE tự quy đổi khi vẽ. Gửi đủ cả 6 trường, PUT ghi đè.
export const setZoneLayout2D = async (loungeId, zoneId, { x, y, width, height, rotationDeg = 0, color = null }) => {
  return axiosClient.put(`/lounges/${loungeId}/zones/${zoneId}/layout-2d`, { x, y, width, height, rotationDeg, color });
};

export const setZoneLayout3D = async (loungeId, zoneId, { x, y, z }) => {
  return axiosClient.put(`/lounges/${loungeId}/zones/${zoneId}/layout-3d`, { x, y, z });
};

// Ảnh sơ đồ mặt bằng dùng làm NỀN cho sơ đồ 2D. Truyền null để bỏ ảnh nền.
export const setAreaLayoutImage = async (loungeId, imageUrl) => {
  return axiosClient.put(`/lounges/${loungeId}/area-layout-image`, { imageUrl });
};

// ===== THƯ VIỆN ẢNH =====
export const addGalleryImage = async (loungeId, { imageUrl, caption = null }) => {
  return axiosClient.post(`/lounges/${loungeId}/gallery`, { imageUrl, caption });
};

export const removeGalleryImage = async (loungeId, imageId) => {
  return axiosClient.delete(`/lounges/${loungeId}/gallery/${imageId}`);
};

// Gửi TOÀN BỘ danh sách id theo thứ tự mong muốn, không phải chỉ cái bị đổi chỗ.
export const reorderGalleryImages = async (loungeId, orderedImageIds) => {
  return axiosClient.put(`/lounges/${loungeId}/gallery/order`, { orderedImageIds });
};

// ===== MÔ HÌNH 3D =====
// Một file .glb/.gltf duy nhất cho cả không gian phòng trà. Tải file lên /uploads/models trước.
export const setLoungeModel3D = async (loungeId, modelUrl) => {
  return axiosClient.put(`/lounges/${loungeId}/model-3d`, { modelUrl });
};

// ===== TOUR 360° =====
// Tour gồm nhiều SCENE (ảnh 360° của một điểm đứng), mỗi scene có HOTSPOT để nhảy sang scene khác.
// Endpoint đọc là CÔNG KHAI (khán giả xem được), các endpoint sửa chỉ dành cho chủ.
export const getLoungeTour = async (loungeId) => {
  return axiosClient.get(`/lounges/${loungeId}/tour`);
};

// Thêm một scene từ ảnh 360° ĐÃ CÓ sẵn (tải lên /uploads/images trước).
export const addTourScene = async (loungeId, { imageUrl, name = null }) => {
  return axiosClient.post(`/lounges/${loungeId}/tour/scenes`, { imageUrl, name });
};

// Ghép nhiều ảnh thường thành MỘT ảnh 360°. Việc ghép chạy NỀN và mất thời gian, nên endpoint này
// trả về một đơn ghép (attempt) — hỏi lại trạng thái qua getTourStitchAttempt, đừng chờ ảnh ngay.
export const stitchTourScene = async (loungeId, { sourceImageUrls, name = null }) => {
  return axiosClient.post(`/lounges/${loungeId}/tour/scenes/stitch`, { sourceImageUrls, name });
};

export const getTourStitchAttempt = async (loungeId, attemptId) => {
  return axiosClient.get(`/lounges/${loungeId}/tour/scenes/stitch/${attemptId}`);
};

export const removeTourScene = async (loungeId, sceneId) => {
  return axiosClient.delete(`/lounges/${loungeId}/tour/scenes/${sceneId}`);
};

// Vị trí ĐÁNH DẤU của scene TRÊN ẢNH MẶT BẰNG (area-layout-image) — ghi chú cũ ở đây sai:
// nó KHÔNG quyết định thứ tự hay hướng di chuyển, chỉ là chấm định vị trên bản đồ để khán giả biết
// cảnh 360° đó nằm ở đâu trong phòng trà.
// X/Y theo PHẦN TRĂM 0–100. Backend bắt hai giá trị phải CÙNG có hoặc CÙNG null; gửi cả hai null
// là xoá chấm định vị. Điền một cái bỏ một cái là bị từ chối.
export const setTourScenePosition = async (loungeId, sceneId, payload) => {
  return axiosClient.put(`/lounges/${loungeId}/tour/scenes/${sceneId}/position`, payload);
};

// Hotspot: điểm bấm trên ảnh 360° để nhảy sang scene khác. CHỈ có Thêm và Xoá — backend
// không có endpoint sửa, muốn đổi thì xoá rồi thêm lại.
export const addTourHotspot = async (loungeId, sceneId, payload) => {
  return axiosClient.post(`/lounges/${loungeId}/tour/scenes/${sceneId}/hotspots`, payload);
};

export const removeTourHotspot = async (loungeId, hotspotId) => {
  return axiosClient.delete(`/lounges/${loungeId}/tour/hotspots/${hotspotId}`);
};

// ===== XOÁ PHÒNG TRÀ =====
// Backend CHẶN (409) nếu phòng trà còn bất kỳ buổi diễn nào — kể cả buổi đã kết thúc hoặc đã huỷ,
// vì xoá đi là mất lịch sử show. Nghĩa là: phòng trà đã từng hoạt động thì thực tế không xoá được,
// và đó là hành vi đúng. Giao diện phải nói rõ điều này thay vì để chủ bấm rồi nhận lỗi khó hiểu.
// Chỉ Owner sở hữu (hoặc Admin) xoá được — 403 nếu là phòng trà của người khác.
export const deleteLounge = async (loungeId) => axiosClient.delete(`/lounges/${loungeId}`);
