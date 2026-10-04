// src/pages/public/PerformerPage.jsx
//
// TRANG NGHỆ SĨ (công khai, không cần đăng nhập). Nghệ sĩ KHÔNG có tài khoản — hồ sơ do phòng trà quản lý.
//
// GHI CHÚ CHO ĐỘI FE:
// - MỘT endpoint trả cả hai thứ: GET /lounge-shows/by-performer/{id} trả PerformerDetailDto = thông tin nghệ sĩ + danh
//   sách buổi diễn ĐÃ PHÂN TRANG bên trong (`shows.items`). Không có endpoint "chi tiết nghệ sĩ" riêng — đừng đi tìm.
// - MẶC ĐỊNH CHỈ TRẢ BUỔI SẮP DIỄN. Muốn xem cả buổi đã diễn phải gửi includeEnded=true — nên có nút bật/tắt và nói
//   rõ đang xem loại nào (nghệ sĩ chưa có lịch mới sẽ trông như chưa từng diễn ở đâu).
//
// LÀM LẠI 30/09/2026 (thế giới "tờ chương trình", cùng khuôn với trang phòng trà):
// - 404 và lỗi tải là HAI trạng thái khác nhau (bản cũ: lỗi mạng cũng in "Không tìm thấy nghệ sĩ").
// - Lịch diễn dùng DongBuoiDien (dòng dùng chung), không còn lưới thẻ phóng ảnh khi rê chuột; ngày giờ qua ngayVietNam.
// - Giới thiệu dài được cắt bằng DoanVanDai. Nút lọc có aria-pressed.
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getShowsByPerformer } from '../../services/showServices'
import { anhChuCai } from '../../utils/anhChuCai'
import DongBuoiDien from '../../components/program/DongBuoiDien'
import DoanVanDai from '../../components/shared/DoanVanDai'
import LienKetMuiTen from '../../components/shared/LienKetMuiTen'
import { tieuDeRieng } from '../../utils/tieuDeTrang'

const CO_TRANG = 12
const NUT_VIEN = 'inline-flex items-center justify-center min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink'

const PerformerPage = () => {
  const { performerId } = useParams()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loi, setLoi] = useState(null) // null | 'khong-co' | 'tai'
  const [xemDaDien, setXemDaDien] = useState(false)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoi(null)
    try {
      const res = await getShowsByPerformer(performerId, { includeEnded: xemDaDien, page, pageSize: CO_TRANG })
      if (!res.success) throw new Error('nghe-si')
      setData(res.data)
    } catch (err) {
      setLoi(err.response?.status === 404 ? 'khong-co' : 'tai')
    } finally {
      setIsLoading(false)
    }
  }, [performerId, xemDaDien, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading && !data) {
    return <div className="min-h-[70vh] bg-stock" aria-busy="true" aria-label="Đang tải trang nghệ sĩ"><div className="h-72 bg-board animate-pulse" /></div>
  }

  if (!data) {
    return (
      <div className="min-h-[70vh] bg-stock flex flex-col items-center justify-center text-ink px-4 text-center">
        <title>{tieuDeRieng('Nghệ sĩ')}</title>
        <h1 className="text-4xl mb-4">{loi === 'khong-co' ? 'Không tìm thấy nghệ sĩ này.' : 'Trang nghệ sĩ chưa tải được.'}</h1>
        {loi === 'tai' && <button type="button" onClick={load} className={`${NUT_VIEN} mb-3`}>Thử lại</button>}
        <LienKetMuiTen to="/shows">Xem các buổi diễn</LienKetMuiTen>
      </div>
    )
  }

  const shows = data.shows?.items ?? []
  const totalPages = data.shows?.totalPages ?? 1

  return (
    <div className="min-h-[70vh] bg-stock text-ink pb-24">
      {/* MLACP-602: tiêu đề tab theo tên nghệ sĩ. */}
      <title>{tieuDeRieng(data.name)}</title>
      {/* ĐẦU TRANG — khối sơn then, cùng khuôn với trang phòng trà */}
      <section className="bg-board text-lamp" aria-labelledby="ten-nghe-si">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 lg:py-14 flex flex-col sm:flex-row gap-6 sm:gap-10 sm:items-end">
          <img src={data.avatarUrl || anhChuCai(data.name)} alt="" width="160" height="160"
            className="w-32 h-32 sm:w-40 sm:h-40 object-cover border-2 border-lamp/40 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-lamp-mute">Nghệ sĩ</p>
            <h1 id="ten-nghe-si" className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] text-lamp break-words mt-1">{data.name}</h1>
            {(data.genres?.length ?? 0) > 0 && (
              <p className="mt-3"><span className="text-lamp-mute">Thể loại: </span>{data.genres.map((g) => g.name).join(', ')}</p>
            )}
            <p className="mt-4">
              <LienKetMuiTen to={`/performers/${performerId}/donations`} nen="muc">Xem sao kê tiền ủng hộ</LienKetMuiTen>
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {data.bio && (
          <section aria-labelledby="gioi-thieu-td" className="pt-10 max-w-[65ch]">
            <h2 id="gioi-thieu-td" className="text-4xl mb-4">Giới thiệu</h2>
            <DoanVanDai nhanMo="Đọc tiếp phần giới thiệu" nhanDong="Thu gọn phần giới thiệu" className="text-lg leading-relaxed text-ink-soft">{data.bio}</DoanVanDai>
          </section>
        )}

        <section aria-labelledby="lich-td" className="pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <h2 id="lich-td" className="text-5xl">{xemDaDien ? 'Mọi buổi diễn' : 'Lịch diễn sắp tới'}</h2>
            {/* Cần vì mặc định backend chỉ trả buổi sắp diễn. */}
            <button type="button" aria-pressed={xemDaDien} onClick={() => { setXemDaDien((v) => !v); setPage(1) }} className={NUT_VIEN}>
              {xemDaDien ? 'Chỉ xem buổi sắp tới' : 'Xem cả buổi đã diễn'}
            </button>
          </div>

          {loi === 'tai' ? (
            <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
              <p>Lịch diễn chưa tải được.</p>
              <button type="button" onClick={load} className={NUT_VIEN}>Thử lại</button>
            </div>
          ) : isLoading ? (
            <div className="h-64 border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải lịch diễn" />
          ) : shows.length === 0 ? (
            <div className="border-2 border-ink p-6">
              <p>{xemDaDien ? 'Nghệ sĩ này chưa có buổi diễn nào trên sàn.' : 'Nghệ sĩ này chưa có buổi diễn nào sắp tới.'}</p>
            </div>
          ) : (
            <ol className="border-y-2 border-ink">
              {shows.map((s) => <DongBuoiDien key={s.id} b={s} />)}
            </ol>
          )}

          {!isLoading && totalPages > 1 && (
            <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-4 mt-6">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className={NUT_VIEN}>Trang trước</button>
              <p className="font-mono text-sm">Trang {page} trên {totalPages}</p>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={NUT_VIEN}>Trang sau</button>
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}

export default PerformerPage
