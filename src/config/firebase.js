import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Backend (GoogleTokenVerifier.cs) chỉ chấp nhận Firebase ID token (issuer
// https://securetoken.google.com/<projectId>) — KHÔNG PHẢI raw Google OAuth ID token. Đăng nhập
// Google ở FE bắt buộc phải đi qua Firebase Authentication (signInWithPopup + getIdToken()), không
// dùng thư viện Google OAuth thuần (vd @react-oauth/google) cho việc này.
//
// Lấy config thật tại: Firebase Console > dự án "sign-in-52d07" > Project settings > Your apps
// > Web app (tạo mới nếu chưa có) > SDK setup and configuration. Đây là config public, an toàn để
// nhúng vào bundle frontend (không phải secret) — khác hoàn toàn với file admin-sdk JSON backend
// đang dùng riêng ở server.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const googleAuthProvider = new GoogleAuthProvider();
