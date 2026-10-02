// src/pages/public/TransparencyHubPage.jsx
//
// TRANG MINH BẠCH TIỀN ỦNG HỘ — cửa công khai, không cần đăng nhập.
//
// VÌ SAO TRANG NÀY RA ĐỜI
// Sao kê tiền ủng hộ của từng nghệ sĩ (`/performers/:id/donations`) đã có từ trước và viết rất kỹ, nhưng
// TRƯỚC ĐÓ CHỈ VÀO ĐƯỢC TỪ HAI CHỖ, cả hai đều nằm sâu:
//   1. "Vé & danh sách của tôi" → tab Ủng hộ (MyDonationsTab.jsx) — PHẢI ĐĂNG NHẬP, và chỉ thấy
//      nghệ sĩ mà chính mình đã tặng tiền.
//   2. Trang nghệ sĩ (PerformerPage.jsx) — mà trang đó lại chỉ vào được từ line-up trong chi
//      tiết một buổi diễn cụ thể.
// Nghĩa là người ngoài KHÔNG có đường nào tìm ra trang minh bạch. Một cam kết minh bạch mà phải
// biết trước mới tìm thấy thì chưa phải là minh bạch. Trang này là cửa vào đó, và được đặt ở chân
// trang — chỗ xuất hiện trên MỌI trang công khai.
//
// VÌ SAO PHẢI GOM NGHỆ SĨ TỪ BUỔI DIỄN, KHÔNG GỌI THẲNG DANH SÁCH
// Backend KHÔNG có endpoint công khai nào liệt kê nghệ sĩ: `PerformersController` gắn
// `[Authorize(Policy = Policies.RequireOwner)]` ở CẤP LỚP, nên `GET /performers` chỉ chủ phòng trà
// gọi được. Hai endpoint công khai về tiền ủng hộ đều theo TỪNG nghệ sĩ
// (`/performers/{id}/donations` và `/donations/summary`, DonationsController).
// Danh sách buổi diễn công khai chỉ trả về TÊN nghệ sĩ (`performerNames`,
// LoungeShowMappingExtensions.cs:40) — không có id nên không dẫn link được. Chỉ CHI TIẾT buổi diễn
// mới trả `PerformerSummaryDto` có `id` và `acceptsDonation`.
// Vì vậy trang này lấy vài buổi diễn gần nhất rồi đọc chi tiết từng buổi để gom nghệ sĩ. Có giới
// hạn số buổi (SO_BUOI_QUET) để không bắn quá nhiều yêu cầu cho một trang công khai.
// TRẦN: chỉ thấy nghệ sĩ của 10 buổi mới nhất; nghệ sĩ lâu không diễn sẽ không có ở đây.
//
// ĐỀ NGHỊ CHO BACKEND (làm được thì bỏ hẳn vòng gom này): một endpoint công khai
// `GET /performers/public` trả danh sách nghệ sĩ có nhận tiền ủng hộ. Khi có, trang này gọi một lần.
//
// LÀM LẠI 30/09/2026 ("tờ chương trình"): ba chặng in như một danh sách đánh số của tờ chương trình, không còn ba
// thẻ biểu tượng; danh sách nghệ sĩ là các dòng liên kết (không hiệu ứng hiện dần); tải hỏng — kể cả khi API trả
// success=false — là trạng thái lỗi riêng có nút thử lại (bản cũ coi success=false là "chưa có nghệ sĩ nào").
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getShows, getShowDetail } from '../../services/showServices'
import { anhChuCai } from '../../utils/anhChuCai'
import LienKetMuiTen from '../../components/shared/LienKetMuiTen'
import MuiTenLuyen from '../../components/shared/MuiTenLuyen'

// Quét bao nhiêu buổi diễn gần nhất để gom nghệ sĩ. Mỗi buổi là một yêu cầu chi tiết, nên con số
// này là đánh đổi giữa "đủ nghệ sĩ để trang không trống" và "đừng bắn quá nhiều yêu cầu".
const SO_BUOI_QUET = 10

const CHANG = [
  ['Nền tảng thu', 'Khoản ủng hộ vào tài khoản giữ hộ của nền tảng ngay khi bạn thanh toán xong.'],
  ['Chuyển cho phòng trà', 'Tới kỳ chi trả, nền tảng chuyển phần của nghệ sĩ về phòng trà nơi họ biểu diễn.'],
  ['Phòng trà trả nghệ sĩ', 'Phòng trà chuyển cho nghệ sĩ và báo lại. Chính nghệ sĩ là người xác nhận đã nhận được.'],
]

const NUT_VIEN = 'inline-flex items-center justify-center min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors'

const TransparencyHubPage = () => {
  const [ngheSi, setNgheSi] = useState(null) // null = đang tải, [] = tải xong mà không có ai
  const [loi, setLoi] = useState(false)

  const gom = useCallback(async () => {
    setLoi(false)
    setNgheSi(null)
    try {
      const ds = await getShows({ page: 1, pageSize: SO_BUOI_QUET, sortBy: 'Newest', includeSoldOut: true })
      if (!ds?.success) throw new Error('buoi-dien')
      const buoi = ds.data?.items ?? []
      if (buoi.length === 0) { setNgheSi([]); return }

      // allSettled: một buổi lỗi không được làm hỏng cả trang.
      const chiTiet = await Promise.allSettled(buoi.map((b) => getShowDetail(b.id)))

      // Gộp theo id nghệ sĩ, giữ lại nơi họ vừa diễn để người xem có ngữ cảnh.
      const theoId = new Map()
      for (const kq of chiTiet) {
        if (kq.status !== 'fulfilled' || !kq.value?.success) continue
        const show = kq.value.data
        for (const p of show?.performers ?? []) {
          // Chỉ hiện người CÓ nhận tiền ủng hộ — người không nhận thì trang sao kê rỗng, đưa vào chỉ gây hiểu nhầm.
          if (!p?.id || !p.acceptsDonation) continue
          if (!theoId.has(p.id)) {
            theoId.set(p.id, { id: p.id, name: p.name, avatarUrl: p.avatarUrl ?? null, buoiGanNhat: show?.name ?? null })
          }
        }
      }
      setNgheSi([...theoId.values()])
    } catch {
      setLoi(true)
      setNgheSi([])
    }
  }, [])

  useEffect(() => { const chay = async () => { await gom() }; chay() }, [gom])

  return (
    <div className="bg-stock text-ink pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16">
        <p className="text-ink-mute">Công khai · không cần đăng nhập</p>
        <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.05] mt-2">Tiền ủng hộ đi đâu, đến khi nào</h1>
        <p className="mt-5 text-lg text-ink-soft max-w-[60ch]">
          Khi bạn tặng tiền cho một nghệ sĩ, khoản đó không chuyển thẳng tới họ. Nó đi qua hai chặng chuyển tiền, và
          bạn xem được từng khoản đang nằm ở đâu — kể cả khi bạn không phải người đã tặng.
        </p>

        {/* Đường đi của tiền, in như phần mục của một tờ chương trình. */}
        <ol className="mt-10 border-y-2 border-ink divide-y divide-ink/20">
          {CHANG.map(([ten, mo], i) => (
            <li key={ten} className="grid grid-cols-[3rem_minmax(0,1fr)] sm:grid-cols-[4rem_14rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-5">
              <span className="font-mono text-2xl text-ink-mute row-span-2 sm:row-span-1" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <p className="font-display text-2xl leading-tight">{ten}</p>
              <p className="text-ink-soft">{mo}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 max-w-[60ch] border-l-4 border-ink pl-4 text-ink-soft">
          Sao kê công khai <strong className="text-ink">không bao giờ</strong> hiển thị số tài khoản, mã chuyển khoản hay
          ảnh chứng từ. Bạn chỉ thấy tiền đang ở chặng nào, khoản nào quá hạn, và nghệ sĩ đã xác nhận nhận được hay chưa.
        </p>

        <section aria-labelledby="nghe-si-td" className="mt-14">
          <h2 id="nghe-si-td" className="text-4xl">Xem sao kê của nghệ sĩ</h2>
          <p className="mt-2 text-ink-soft">Nghệ sĩ có nhận tiền ủng hộ trong {SO_BUOI_QUET} buổi diễn mới nhất.</p>

          <div className="mt-5" aria-live="polite">
            {ngheSi === null ? (
              <div className="h-56 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải danh sách nghệ sĩ" />
            ) : loi ? (
              <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
                <p>Danh sách nghệ sĩ chưa tải được. Sao kê của từng nghệ sĩ vẫn mở được từ trang nghệ sĩ trong mỗi buổi diễn.</p>
                <button type="button" onClick={gom} className={NUT_VIEN}>Thử lại</button>
              </div>
            ) : ngheSi.length === 0 ? (
              <div className="border-2 border-ink p-6">
                <p>Chưa có nghệ sĩ nào nhận tiền ủng hộ trong các buổi diễn gần đây. Bạn vẫn mở được sao kê của bất kỳ nghệ sĩ nào từ phần Nghệ sĩ trong trang buổi diễn.</p>
                <LienKetMuiTen to="/shows" className="mt-2">Xem các buổi diễn</LienKetMuiTen>
              </div>
            ) : (
              <ul className="border-y-2 border-ink divide-y divide-ink/20">
                {ngheSi.map((p) => (
                  <li key={p.id} className="relative flex items-center gap-4 py-4 px-3 sm:px-4 hover:bg-card">
                    <img src={p.avatarUrl || anhChuCai(p.name)} alt="" loading="lazy" width="56" height="56" className="w-14 h-14 object-cover border border-ink flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/performers/${p.id}/donations`} className="font-display text-2xl leading-tight break-words after:absolute after:inset-0 hover:underline underline-offset-4 decoration-1">
                        {p.name}
                      </Link>
                      {p.buoiGanNhat && <p className="text-ink-mute truncate">Gần nhất: {p.buoiGanNhat}</p>}
                    </div>
                    <span className="inline-flex items-center gap-2.5 font-semibold whitespace-nowrap" aria-hidden="true">Xem sao kê <MuiTenLuyen rong={36} /></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default TransparencyHubPage
