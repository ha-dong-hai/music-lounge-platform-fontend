// src/i18n/index.js
//
// ĐA NGÔN NGỮ (vi / en) — GHI CHÚ CHO ĐỘI FE:
// - Dùng react-i18next. Trong component: `const { t } = useTranslation()` rồi `t('header.login')`.
// - Từ điển nằm ở src/i18n/locales/{vi,en}/*.js, chia theo khu vực (common, auth, home, show, myShows).
//   Thêm chữ mới thì thêm vào CẢ HAI ngôn ngữ, cùng một key. Thiếu bản en thì i18next tự rơi về vi.
// - Ngôn ngữ được nhớ trong localStorage('lang') — giữ đúng key cũ mà Header đã dùng.
// - Đổi ngôn ngữ là đổi NGAY (không tải lại trang): mọi component dùng useTranslation tự render lại.
//   Đồng thời cập nhật <html lang> (trình đọc màn hình / SEO) và locale của dayjs (tên thứ, tháng).
// - Thông báo lỗi của zod (src/schemas/authSchema.js) là KEY dịch, được dịch ở chỗ hiển thị (AuthField).
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import 'dayjs/locale/en'

import vi from './locales/vi'
import en from './locales/en'

export const SUPPORTED_LANGS = ['vi', 'en']
const LUU_KEY = 'lang'

const docNgonNguDaLuu = () => {
  try {
    const lang = localStorage.getItem(LUU_KEY)
    return SUPPORTED_LANGS.includes(lang) ? lang : 'vi'
  } catch {
    return 'vi'
  }
}

const apDungNgonNgu = (lang) => {
  dayjs.locale(lang)
  if (typeof document !== 'undefined') document.documentElement.lang = lang
  try { localStorage.setItem(LUU_KEY, lang) } catch { /* chế độ riêng tư: bỏ qua */ }
}

const ngonNguBanDau = docNgonNguDaLuu()

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: ngonNguBanDau,
  fallbackLng: 'vi',
  interpolation: { escapeValue: false }, // React đã tự escape
  returnNull: false,
})

apDungNgonNgu(ngonNguBanDau)
i18n.on('languageChanged', apDungNgonNgu)

/** Locale dùng cho Intl / toLocaleString theo ngôn ngữ hiện tại. */
export const currentLocale = () => (i18n.language === 'en' ? 'en-US' : 'vi-VN')

export default i18n
