// src/utils/khuQuay.js
//
// MLACP-590: các trang "đứng quầy" trong khu phòng trà — việc của NHÂN VIÊN trong đêm diễn (soát vé, bán vé tại
// quầy, đơn gọi món). Chủ phòng trà vẫn vào được (toàn quyền, và phòng nhỏ thì chủ hay đứng thay), nhưng qua một lối
// riêng chứ không nằm lẫn trong thực đơn quản lý. Chế độ suy ra TỪ ĐƯỜNG DẪN, không giữ state: tải lại trang hay mở
// link trực tiếp vẫn đúng chế độ.
// "Phát trực tuyến" KHÔNG nằm ở đây: với chủ, trang đó còn là nơi tạo phiên phát và khai VCPMC trước khi gửi duyệt.
export const DUONG_QUAY = ['/owner/operate', '/owner/fnb-orders']

// So theo RANH GIỚI ĐOẠN (L-12): "/owner/operate-x" không phải trang quầy.
export const laDuongQuay = (pathname = '') => {
  const p = pathname.replace(/\/+$/, '')
  return DUONG_QUAY.some((d) => p === d || p.startsWith(d + '/'))
}
