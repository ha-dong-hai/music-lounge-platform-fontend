import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { firebaseApp, isFirebaseConfigured } from './firebase';

// src/config/firebaseMessaging.js
//
// GHI CHÚ CHO ĐỘI FE:
// - Thông báo đẩy trên web cần BA thứ, thiếu một là không chạy:
//     1. Cấu hình Firebase (đã có, dùng chung với đăng nhập Google)
//     2. Khoá VAPID (VITE_FIREBASE_VAPID_KEY) — lấy ở Firebase Console > Project settings >
//        Cloud Messaging > Web Push certificates
//     3. Service worker ở gốc tên miền: public/firebase-messaging-sw.js
// - Service worker không đọc được biến môi trường của Vite, nên cấu hình được truyền qua query
//   string lúc đăng ký. Đây là cấu hình public (không phải secret), an toàn để nằm trong URL.
// - `isSupported()` phải được kiểm TRƯỚC khi gọi getMessaging: Safari cũ và một số trình duyệt
//   trong ứng dụng không hỗ trợ, và getMessaging sẽ ném lỗi chứ không trả null.
// - Mỗi trình duyệt / thiết bị có một mã riêng. Đăng xuất thì nên gỡ mã của thiết bị đó, nếu không
//   người đăng nhập sau trên cùng máy sẽ nhận thông báo của người trước.

export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const laCauHinhDuPush = Boolean(isFirebaseConfigured && vapidKey);

const dangKySW = async () => {
  if (!('serviceWorker' in navigator)) return null;
  // Truyền cấu hình qua query string để service worker đọc lại được.
  const thamSo = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  });
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${thamSo.toString()}`);
};

// Trả về mã thiết bị, hoặc null kèm lý do rõ ràng để giao diện nói được vì sao không bật được.
// KHÔNG tự gọi Notification.requestPermission ở chỗ khác: trình duyệt chỉ cho hỏi quyền khi có
// hành động của người dùng, hỏi lúc tải trang là bị chặn vĩnh viễn.
export const layMaThietBi = async () => {
  if (!laCauHinhDuPush) {
    return { token: null, lyDo: 'Hệ thống chưa cấu hình thông báo đẩy (thiếu khoá VAPID).' };
  }
  if (!(await isSupported())) {
    return { token: null, lyDo: 'Trình duyệt này không hỗ trợ thông báo đẩy.' };
  }

  const quyen = await Notification.requestPermission();
  if (quyen !== 'granted') {
    return { token: null, lyDo: 'Bạn chưa cho phép trình duyệt hiện thông báo.' };
  }

  const registration = await dangKySW();
  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration ?? undefined,
  });
  return token
    ? { token, lyDo: null }
    : { token: null, lyDo: 'Không lấy được mã thiết bị từ Firebase.' };
};

// Gỡ mã ở phía Firebase. Gỡ ở backend là việc riêng (unregisterDevice) — phải làm cả hai,
// vì gỡ một bên thì bên kia vẫn còn nghĩ thiết bị này đang nhận thông báo.
export const xoaMaThietBi = async () => {
  if (!laCauHinhDuPush || !(await isSupported())) return false;
  const messaging = getMessaging(firebaseApp);
  return deleteToken(messaging);
};
