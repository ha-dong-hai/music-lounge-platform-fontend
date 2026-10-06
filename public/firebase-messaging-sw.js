/* eslint-env serviceworker */
/* global importScripts, firebase */

// public/firebase-messaging-sw.js
//
// GHI CHÚ CHO ĐỘI FE:
// - Tệp này PHẢI nằm trong public/ và được phục vụ ở gốc tên miền (/firebase-messaging-sw.js).
//   Firebase Messaging trên web chỉ nhận service worker ở gốc, không nhận đường dẫn lồng.
// - Service worker KHÔNG đọc được import.meta.env (nó không đi qua Vite). Vì vậy cấu hình được
//   truyền qua query string lúc đăng ký (xem src/config/firebaseMessaging.js) và đọc lại ở đây.
//   Đừng dán cứng cấu hình vào đây — mỗi môi trường một dự án Firebase khác nhau.
// - Dùng bản "compat" qua importScripts vì service worker không dùng được cú pháp import của SDK mới.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const thamSo = new URL(self.location).searchParams;

const firebaseConfig = {
  apiKey: thamSo.get('apiKey'),
  authDomain: thamSo.get('authDomain'),
  projectId: thamSo.get('projectId'),
  storageBucket: thamSo.get('storageBucket'),
  messagingSenderId: thamSo.get('messagingSenderId'),
  appId: thamSo.get('appId'),
};

// Thiếu cấu hình thì không khởi tạo — im lặng bỏ qua thay vì ném lỗi trong service worker,
// vì lỗi ở đây không ai nhìn thấy và chỉ làm nhiễu log.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Thông báo nhận được khi trang KHÔNG mở. Trang đang mở thì onMessage ở phía ứng dụng xử lý.
  messaging.onBackgroundMessage((payload) => {
    const tieuDe = payload.notification?.title ?? 'Music Lounge';
    self.registration.showNotification(tieuDe, {
      body: payload.notification?.body ?? '',
      icon: '/favicon.svg',
      data: payload.data ?? {},
    });
  });
}

// Bấm vào thông báo: mở đúng trang liên quan nếu backend gửi kèm đường dẫn, nếu không thì mở trang chủ.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const duongDan = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((danhSach) => {
      // Đã có tab đang mở thì đưa tab đó lên thay vì mở thêm tab mới.
      for (const client of danhSach) {
        if ('focus' in client) {
          client.navigate(duongDan);
          return client.focus();
        }
      }
      return self.clients.openWindow(duongDan);
    })
  );
});
