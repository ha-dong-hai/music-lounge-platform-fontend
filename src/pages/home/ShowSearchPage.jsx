// src/pages/home/ShowSearchPage.jsx
//
// TRANG BUỔI DIỄN — xem tất cả, tìm và lọc. Phục vụ cả /shows và /shows/search (đường dẫn cũ vẫn chạy).
//
// LÀM LẠI 30/09/2026. Trước đây là HAI trang làm gần cùng một việc: /shows (xem tất cả, chỉ có sắp xếp) và
// /shows/search (tìm, lọc qua một hộp thoại). Người dùng phải biết trước là muốn "xem" hay "lọc" để chọn đúng trang.
// Nay là một trang: danh sách + bộ lọc luôn ở cạnh.
//
// NHỮNG THỨ ĐỔI VÀ VÌ SAO (reports/Form lọc vé và màn vận hành.md ở repo backend):
//  - BỘ LỌC NẰM TRONG ĐỊA CHỈ TRANG (src/utils/boLocBuoiDien.js): Quay lại, tải lại, gửi đường dẫn đều giữ nguyên.
//  - Mặc định xếp theo NGÀY DIỄN GẦN NHẤT (bản cũ: theo lúc đăng).
//  - Màn lớn: bộ lọc là cột bên trái luôn mở (Baymard: thanh lọc ngang chỉ ổn tới 6–8 loại bộ lọc; ở đây có 7).
//    Màn nhỏ: nút "Bộ lọc (n)" mở hộp phủ <dialog>, đóng bằng nút "Xem N buổi diễn".
//  - Bộ lọc đang áp in thành hàng nút gỡ phía trên kết quả + "Xoá tất cả" (Baymard: 28% trang thiếu phần này, người
//    dùng quên mình đang lọc và tưởng trang ít hàng).
//  - Danh sách là các DÒNG (DongBuoiDien) chứ không phải lưới thẻ: mỗi dòng in đủ ngày giờ, tên, người hát, phòng
//    trà, giá.
//  - Phân trang có số trang trong địa chỉ (?trang=2). 20 dòng mỗi trang.
//  - 0 kết quả: nói rõ, kèm nút gỡ từng bộ lọc và "Xoá tất cả" (Baymard: lời khuyên chung chung hiếm khi được đọc).
//  - Lỗi tải nằm trong vùng kết quả, bộ lọc vẫn dùng được; có nút thử lại.
//  - Bỏ dữ liệu bịa: bản cũ gắn dòng nhạc "Other" cho buổi không có dòng nhạc.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import toast from 'react-hot-toast'
import DongBuoiDien from '../../components/program/DongBuoiDien'
import BoLocBuoiDien from '../../components/program/BoLocBuoiDien'
import { searchShows, getFilterOptions } from '../../services/showServices'
import { toggleWishlist } from '../../services/interactionServices'
import { useAuthStore } from '../../store/useAuthStore'
import { BO_LOC_RONG, CACH_SAP, boLocDangAp, docBoLoc, ghiBoLoc, thamSoApi } from '../../utils/boLocBuoiDien'

const DANH_MUC_RONG = { genres: [], moods: [], atmospheres: [], cities: [] }
const NUT_VIEN = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 border-2 border-ink bg-card font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-40 disabled:hover:bg-card disabled:hover:text-ink disabled:cursor-not-allowed'

const ShowSearchPage = () => {
  const { user } = useAuthStore()
  const [thamSo, setThamSo] = useSearchParams()
  const chuoiThamSo = thamSo.toString()
  const boLoc = useMemo(() => docBoLoc(new URLSearchParams(chuoiThamSo)), [chuoiThamSo])

  const [danhMuc, setDanhMuc] = useState(DANH_MUC_RONG)
  const [kq, setKq] = useState(null) // null = đang tải; { items, tong, soTrang }
  const [loi, setLoi] = useState(null)
  const [lanTai, setLanTai] = useState(0)
  const [daLuu, setDaLuu] = useState({}) // id -> true/false, ghi đè isWishlisted của API sau khi người dùng bấm
  const [dangLuu, setDangLuu] = useState(null)
  const [oTim, setOTim] = useState(boLoc.q)
  const [qGoc, setQGoc] = useState(boLoc.q)
  if (qGoc !== boLoc.q) { setQGoc(boLoc.q); setOTim(boLoc.q) } // từ khoá đổi từ ngoài (nút gỡ, ô tìm ở đầu trang) → đồng bộ ô
  const hopLoc = useRef(null)
  const tieuDe = useRef(null)

  // Đổi bộ lọc = danh sách khác → về trang 1. Đẩy vào lịch sử (không replace): Quay lại gỡ đúng bước lọc vừa làm.
  const doi = useCallback((moi) => setThamSo(ghiBoLoc({ ...moi, trang: 1 })), [setThamSo])
  const sangTrang = (trang) => {
    setThamSo(ghiBoLoc({ ...boLoc, trang }))
    window.scrollTo({ top: 0 })
    tieuDe.current?.focus()
  }

  // Hộp lọc chỉ dành cho màn nhỏ: đang mở mà màn rộng ra (xoay máy, kéo cửa sổ) thì đóng, nếu không trang bị khoá sau một hộp vô hình.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const dong = () => { if (mq.matches) hopLoc.current?.close() }
    mq.addEventListener('change', dong)
    return () => mq.removeEventListener('change', dong)
  }, [])

  useEffect(() => {
    getFilterOptions()
      .then((res) => { if (res?.success) setDanhMuc({ ...DANH_MUC_RONG, ...res.data }) })
      .catch(() => {}) // không có danh mục thì cột lọc chỉ còn ngày, hình thức, giá — danh sách vẫn dùng được
  }, [])

  useEffect(() => {
    let huy = false
    const tai = async () => {
      setKq(null)
      setLoi(null)
      try {
        const res = await searchShows(thamSoApi(docBoLoc(new URLSearchParams(chuoiThamSo))))
        if (huy) return
        if (!res?.success) throw Object.assign(new Error('search'), { thongBao: res?.message })
        setKq({ items: res.data?.items ?? [], tong: res.data?.totalCount ?? 0, soTrang: res.data?.totalPages ?? 1 })
      } catch (err) {
        if (huy) return
        const ma = err?.response?.status
        // 4xx kèm câu của backend (ví dụ khoảng giá sai) thì in đúng câu đó; còn lại là lỗi kết nối.
        setLoi((ma >= 400 && ma < 500 && err.response?.data?.message) || err.thongBao || 'Danh sách buổi diễn chưa tải được.')
        setKq({ items: [], tong: 0, soTrang: 1 })
      }
    }
    tai()
    return () => { huy = true }
  }, [chuoiThamSo, lanTai])

  const doiLuu = async (b) => {
    if (dangLuu) return
    const dang = daLuu[b.id] ?? Boolean(b.isWishlisted)
    setDangLuu(b.id)
    setDaLuu((m) => ({ ...m, [b.id]: !dang }))
    try {
      await toggleWishlist(b.id, dang)
      toast.success(dang ? 'Đã bỏ khỏi danh sách yêu thích.' : 'Đã lưu vào danh sách yêu thích.')
    } catch (err) {
      setDaLuu((m) => ({ ...m, [b.id]: dang }))
      toast.error(err.response?.data?.message || 'Chưa lưu được. Hãy thử lại.')
    } finally {
      setDangLuu(null)
    }
  }

  const dangAp = boLocDangAp(boLoc, danhMuc)
  // Số bộ lọc trong cột/hộp lọc (không tính từ khoá — từ khoá có ô riêng ở trên).
  const soLoc = dangAp.filter((x) => x.khoa !== 'q').length
  const dangTai = kq === null
  const xoaHet = () => doi({ ...BO_LOC_RONG, sap: boLoc.sap })

  return (
    <div className="min-h-[70vh] bg-stock text-ink pb-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-10">
        <h1 ref={tieuDe} tabIndex={-1} className="text-[clamp(2.75rem,6vw,5rem)] leading-[1.05] break-words focus:outline-none">
          {boLoc.q ? <>Kết quả cho “{boLoc.q}”</> : 'Buổi diễn'}
        </h1>

        <div className="mt-8 grid gap-x-12 lg:grid-cols-[17rem_minmax(0,1fr)]">
          {/* CỘT LỌC — màn lớn */}
          <aside aria-label="Bộ lọc buổi diễn" className="hidden lg:block border-t-2 border-ink pt-5">
            <BoLocBuoiDien boLoc={boLoc} danhMuc={danhMuc} onDoi={doi} />
          </aside>

          <div className="min-w-0">
            {/* THANH TRÊN: tìm, mở bộ lọc (màn nhỏ), sắp xếp */}
            <div className="flex flex-wrap items-end gap-3 border-t-2 border-ink pt-5">
              <form role="search" className="relative flex-1 min-w-[15rem]" onSubmit={(e) => { e.preventDefault(); doi({ ...boLoc, q: oTim.trim() }) }}>
                <label htmlFor="o-tim-buoi-dien" className="block text-sm font-semibold mb-1">Tìm theo tên buổi diễn, nghệ sĩ, phòng trà</label>
                <div className="flex">
                  <input id="o-tim-buoi-dien" type="search" value={oTim} onChange={(e) => setOTim(e.target.value)}
                    className="flex-1 min-w-0 min-h-[48px] px-4 bg-card border-2 border-r-0 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock [&::-webkit-search-cancel-button]:hidden" />
                  <button type="submit" aria-label="Tìm" className="w-12 min-h-[48px] inline-flex items-center justify-center bg-ink text-lamp hover:bg-board transition-colors">
                    <Search size={18} aria-hidden="true" />
                  </button>
                </div>
              </form>

              <button type="button" onClick={() => hopLoc.current?.showModal()} className={`${NUT_VIEN} lg:hidden`}>
                <SlidersHorizontal size={18} aria-hidden="true" /> Bộ lọc{soLoc > 0 ? ` (${soLoc})` : ''}
              </button>

              <label className="block text-sm font-semibold">Sắp xếp
                <select value={boLoc.sap} onChange={(e) => doi({ ...boLoc, sap: e.target.value })}
                  className="block mt-1 min-h-[48px] px-3 bg-card border-2 border-ink text-ink font-normal text-base focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock">
                  {CACH_SAP.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
            </div>

            {/* BỘ LỌC ĐANG ÁP */}
            {dangAp.length > 0 && (
              <ul aria-label="Bộ lọc đang áp" className="flex flex-wrap items-center gap-2 mt-4">
                {dangAp.map((x) => (
                  <li key={x.khoa}>
                    <button type="button" onClick={() => doi(x.go(boLoc))} aria-label={`Gỡ bộ lọc ${x.nhan}`}
                      className="inline-flex items-center gap-2 min-h-[40px] pl-3 pr-2 border border-ink bg-card text-sm font-medium hover:bg-ink hover:text-lamp transition-colors">
                      <span className="break-words">{x.nhan}</span><X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={xoaHet} className="min-h-[40px] px-2 text-sm font-semibold underline underline-offset-4 decoration-2">Xoá tất cả</button>
                </li>
              </ul>
            )}

            <p className="font-mono text-sm text-ink-mute mt-5" role="status">
              {dangTai ? 'Đang tìm…' : loi ? '' : `${kq.tong.toLocaleString('vi-VN')} buổi diễn${kq.soTrang > 1 ? ` · trang ${boLoc.trang} trên ${kq.soTrang}` : ''}`}
            </p>

            {/* KẾT QUẢ */}
            <div className="mt-2">
              {dangTai ? (
                <div className="h-96 border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải danh sách buổi diễn" />
              ) : loi ? (
                <div role="alert" className="border-2 border-ink p-5 sm:p-6">
                  <p className="text-lg">{loi}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button type="button" onClick={() => setLanTai((n) => n + 1)} className="min-h-[44px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Thử lại</button>
                    {dangAp.length > 0 && <button type="button" onClick={xoaHet} className={NUT_VIEN}>Xoá tất cả bộ lọc</button>}
                  </div>
                </div>
              ) : kq.items.length === 0 ? (
                <div className="border-2 border-ink p-6 sm:p-8">
                  <h2 className="text-3xl">{dangAp.length > 0 ? 'Không có buổi diễn nào khớp bộ lọc này.' : 'Chưa có buổi diễn nào đang mở bán.'}</h2>
                  {dangAp.length > 0 ? (
                    <>
                      <p className="text-ink-soft mt-2">Gỡ bớt một bộ lọc ở trên, hoặc xem tất cả.</p>
                      <button type="button" onClick={xoaHet} className="mt-5 min-h-[48px] px-6 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Xem tất cả buổi diễn</button>
                    </>
                  ) : (
                    <>
                      <p className="text-ink-soft mt-2">Phòng trà vẫn ở đó: xem và theo dõi để được báo khi có đêm diễn mới.</p>
                      <Link to="/lounges" className="inline-flex items-center mt-5 min-h-[48px] px-6 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Xem các phòng trà</Link>
                    </>
                  )}
                </div>
              ) : (
                <ol className="border-y-2 border-ink">
                  {kq.items.map((b) => (
                    <DongBuoiDien key={b.id} b={b} daLuu={daLuu[b.id] ?? Boolean(b.isWishlisted)} dangLuu={dangLuu === b.id} onDoiLuu={user ? doiLuu : undefined} />
                  ))}
                </ol>
              )}
            </div>

            {!dangTai && !loi && kq.soTrang > 1 && (
              <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-4 mt-8">
                <button type="button" onClick={() => sangTrang(boLoc.trang - 1)} disabled={boLoc.trang <= 1} className={NUT_VIEN}>Trang trước</button>
                <p className="font-mono text-sm">Trang {boLoc.trang} trên {kq.soTrang}</p>
                <button type="button" onClick={() => sangTrang(boLoc.trang + 1)} disabled={boLoc.trang >= kq.soTrang} className={NUT_VIEN}>Trang sau</button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* HỘP LỌC — màn nhỏ. <dialog> của trình duyệt: giữ focus bên trong, Esc đóng, trả focus về nút đã mở. */}
      <dialog ref={hopLoc} aria-labelledby="tieu-de-hop-loc" className="lg:hidden bg-stock text-ink w-screen h-dvh max-w-none max-h-none m-0 p-0 backdrop:bg-board">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between gap-4 border-b-2 border-ink px-4 py-3">
            <h2 id="tieu-de-hop-loc" className="text-3xl">Bộ lọc</h2>
            <button type="button" onClick={() => hopLoc.current?.close()} aria-label="Đóng bộ lọc" className="w-11 h-11 inline-flex items-center justify-center border border-ink hover:bg-ink hover:text-lamp transition-colors">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <BoLocBuoiDien boLoc={boLoc} danhMuc={danhMuc} onDoi={doi} />
          </div>
          <div className="flex gap-3 border-t-2 border-ink px-4 py-3">
            {soLoc > 0 && <button type="button" onClick={xoaHet} className={NUT_VIEN}>Xoá tất cả</button>}
            <button type="button" onClick={() => hopLoc.current?.close()} className="flex-1 min-h-[48px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">
              {dangTai ? 'Đang tìm…' : `Xem ${kq.tong.toLocaleString('vi-VN')} buổi diễn`}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}

export default ShowSearchPage
