// src/pages/TrangLoiUngDung.jsx
//
// MLACP-697: TRANG LỖI CỦA ỨNG DỤNG (errorElement của route gốc). Trước đây router không có trang lỗi nào nên mọi lỗi lúc
// dựng trang hiện nguyên màn "Unexpected Application Error!" tiếng Anh kèm vết ngăn xếp của React Router.
//
// Hai trường hợp, nói khác nhau:
//  1. KHÔNG TẢI ĐƯỢC TỆP CỦA TRANG (web vừa cập nhật, tab đang mở bản cũ — xem utils/loiTaiTep.js): không phải lỗi của người
//     dùng và tải lại là hết. Trang tự tải lại theo lịch giãn dần, có đếm ngược; hết lượt thì để nút bấm tay.
//  2. LỖI KHÁC (lỗi mã thật): KHÔNG tự tải lại — tải lại chỉ che lỗi và có thể lặp vô hạn. Nói ngắn, cho nút tải lại và lối
//     về trang chủ; chi tiết kỹ thuật gập lại để người dùng chép gửi khi báo lỗi.
//
// Liên kết ở đây là <a href> THƯỜNG (tải lại cả trang), không dùng <Link>: bản mã đang chạy đã hỏng hoặc đã cũ, điều hướng
// trong ứng dụng sẽ lại đòi đúng tệp vừa thiếu.
// Hình thức theo pages/NotFoundPage.jsx (cùng họ "trang báo lỗi").
import { useEffect, useState } from 'react'
import { useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { laLoiTaiTep, lanThuKeTiep, KHOA_THU_LAI } from '../utils/loiTaiTep'

const docTrangThai = () => { try { return JSON.parse(sessionStorage.getItem(KHOA_THU_LAI) || 'null') } catch { return null } }
const ghiTrangThai = (lan) => { try { sessionStorage.setItem(KHOA_THU_LAI, JSON.stringify({ lan, luc: Date.now() })) } catch { /* bị chặn: vẫn tải lại */ } }

const NUT = 'inline-flex items-center justify-center min-h-[44px] px-5 text-sm font-semibold border-2 border-ink'

const TrangLoiUngDung = () => {
  const { t } = useTranslation()
  const loi = useRouteError()
  const thieuTep = laLoiTaiTep(loi)
  // Tính MỘT lần lúc trang lỗi hiện ra (không tính lại mỗi lần vẽ, kẻo mỗi nhịp đếm ngược lại tăng số lần thử).
  const [keTiep] = useState(() => (thieuTep ? lanThuKeTiep(docTrangThai(), Date.now()) : null))
  const [conGiay, setConGiay] = useState(keTiep?.choGiay ?? 0)

  useEffect(() => {
    if (!keTiep) return undefined
    if (conGiay <= 0) { ghiTrangThai(keTiep.lan); window.location.reload(); return undefined }
    const hen = setTimeout(() => setConGiay((s) => s - 1), 1000)
    return () => clearTimeout(hen)
  }, [keTiep, conGiay])

  useEffect(() => { if (!thieuTep) console.error('[TrangLoiUngDung]', loi) }, [thieuTep, loi])

  return (
    <section aria-labelledby="tieu-de-loi-ung-dung" className="min-h-screen bg-stock text-ink px-4 sm:px-8 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-ink-mute">{thieuTep ? t('Bản mới') : t('Lỗi hiển thị')}</p>
        <h1 id="tieu-de-loi-ung-dung" className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] mt-2">
          {thieuTep ? t('MusicLounge vừa được cập nhật.') : t('Trang này gặp lỗi khi hiển thị.')}
        </h1>
        <p className="mt-5 text-lg text-ink-soft max-w-[55ch]" role="status">
          {thieuTep
            ? (keTiep
              ? (conGiay > 0
                ? t('Trang bạn đang mở là bản cũ nên cần tải lại để dùng tiếp. Tự tải lại sau {{giay}} giây…', { giay: conGiay })
                : t('Trang bạn đang mở là bản cũ. Đang tải lại…'))
              : t('Đã thử tải lại vài lần nhưng chưa được. Kiểm tra kết nối mạng rồi bấm "Tải lại trang".'))
            : t('Dữ liệu của bạn không bị ảnh hưởng. Hãy tải lại trang; nếu vẫn gặp, gửi cho chúng tôi phần chi tiết bên dưới.')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => window.location.reload()} className={`${NUT} bg-ink text-lamp hover:bg-board`}>{t('Tải lại trang')}</button>
          <a href="/" className={`${NUT} bg-card text-ink hover:bg-ink hover:text-lamp`}>{t('Về trang chủ')}</a>
        </div>
        {!thieuTep && (
          <details className="mt-8 text-sm text-ink-mute">
            <summary className="cursor-pointer min-h-[44px] inline-flex items-center font-semibold text-ink-soft">{t('Chi tiết kỹ thuật')}</summary>
            <pre className="mt-2 p-3 bg-card border border-line whitespace-pre-wrap [overflow-wrap:anywhere] font-mono text-xs">
              {String(loi?.message ?? loi?.statusText ?? loi ?? '')}{'\n'}{window.location.pathname}
            </pre>
          </details>
        )}
      </div>
    </section>
  )
}

export default TrangLoiUngDung
