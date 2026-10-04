// src/i18n/index.js
//
// CHUYỂN NGỮ GIAO DIỆN (03/10/2026). Trước ngày này web KHÔNG có lớp dịch nào (đo trên mọi nhánh của repo): nút VN/EN chỉ đổi
// Accept-Language gửi backend, nên chọn EN thì giao diện vẫn tiếng Việt xen câu lỗi tiếng Anh — chủ dự án: "chức năng chuyển
// ngữ bị lỗi". Chủ dự án chọn: dịch PHẦN KHÁN GIẢ trước (đầu/chân trang, trang chủ, buổi diễn, phòng trà, đăng nhập, thanh
// toán…); màn chủ phòng trà / nhân viên / admin vẫn tiếng Việt (các layout đó không có nút chuyển ngữ).
//
// CÁCH LÀM: i18next + react-i18next, KHOÁ LÀ CHÍNH CÂU TIẾNG VIỆT (keySeparator/nsSeparator = false). Câu nào chưa có bản tiếng
// Anh thì i18next trả lại khoá → hiện tiếng Việt, nên giao diện tiếng Việt KHÔNG THỂ đổi vì lớp dịch.
// i18next ghi cách này "possible – but not recommended" (https://www.i18next.com/principles/fallback): sửa câu tiếng Việt thì
// phải sửa cả khoá trong en.json. Bù lại bằng scripts/kiem-dich.mjs: báo câu t('…') chưa có bản dịch và mục en.json không
// còn câu nào dùng (câu tiếng Việt đã bị sửa).
//
// DỮ LIỆU do người dùng nhập (tên buổi diễn, mô tả, lời bình) KHÔNG dịch. Câu từ backend đi theo Accept-Language (axios.js).
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import 'dayjs/locale/en'
import en from './en.json'
import { datBoDich } from './k'

// MLACP-604 (04/10/2026): việc chuyển ngữ đang TẠM DỪNG giữa chừng (MLACP-583: en.json mới có một phần câu). Để nút đổi
// ngôn ngữ hiện ra thì người chọn English nhận một trang nửa Anh nửa Việt — tệ hơn không có nút. Cờ này tắt cả nút (ở
// Header) lẫn việc đọc lựa chọn cũ trong máy người dùng: ai từng chọn English cũng quay về tiếng Việt, không bị kẹt ở bản
// dịch dở mà không còn nút để đổi lại. Dịch xong thì đổi về true — không cần sửa gì khác.
export const BAT_DOI_NGON_NGU = false

export const docNgonNgu = () => {
  if (!BAT_DOI_NGON_NGU) return 'vi'
  try { return localStorage.getItem('lang') === 'en' ? 'en' : 'vi' } catch { return 'vi' }
}

const apDung = (lang) => {
  dayjs.locale(lang === 'en' ? 'en' : 'vi')
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}

const lang = docNgonNgu()
apDung(lang)

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: {} } },
  lng: lang,
  fallbackLng: false,
  keySeparator: false,
  nsSeparator: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false }, // React tự thoát ký tự
})

i18n.on('languageChanged', apDung)
// Hàm tiện ích (src/utils) dịch qua td() của ./k — cắm bộ dịch thật vào đây.
datBoDich((s, p) => i18n.t(s, p))

// Số vùng "luôn tiếng Việt" đang mở (VungTiengViet.jsx — khu chủ phòng trà / admin). > 0 thì máy chủ trả câu tiếng Việt.
let soVungViet = 0
/** Mở một vùng luôn tiếng Việt; trả hàm đóng (dùng làm cleanup của useEffect). Đóng xong trả dayjs về ngôn ngữ đã chọn. */
export const batVungViet = () => {
  soVungViet++
  return () => {
    soVungViet = Math.max(0, soVungViet - 1)
    if (soVungViet === 0) apDung(i18n.language)
  }
}
/** Ngôn ngữ gửi máy chủ (Accept-Language, src/config/axios.js). */
export const ngonNguGuiMayChu = () => (soVungViet > 0 ? 'vi' : docNgonNgu())

/** Đổi ngôn ngữ giao diện + ghi nhớ (axios đọc cùng khoá 'lang' để gửi Accept-Language). */
export const doiNgonNgu = (lang) => {
  try { localStorage.setItem('lang', lang) } catch { /* trình duyệt chặn lưu: vẫn đổi trong phiên này */ }
  return i18n.changeLanguage(lang)
}

/**
 * Đánh dấu một câu SẼ được dịch ở chỗ khác (hằng số ngoài component: nhãn menu, bảng trạng thái…). Trả nguyên câu; component
 * gọi t(bien) lúc vẽ. Không có dấu này thì scripts/kiem-dich.mjs không thấy câu nằm trong hằng số để đòi bản dịch.
 */
export { k, td } from './k'

/** Dùng ngoài component (hàm tiện ích định dạng ngày, toast). Trong component dùng useTranslation(). */
export const t = (...a) => i18n.t(...a)
export const laTiengAnh = () => i18n.language === 'en'

export default i18n
