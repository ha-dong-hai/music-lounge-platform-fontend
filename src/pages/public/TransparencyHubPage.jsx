// src/pages/public/TransparencyHubPage.jsx
//
// TRANG MINH BẠCH TIỀN ỦNG HỘ — cửa công khai, không cần đăng nhập.
//
// VÌ SAO TRANG NÀY RA ĐỜI
// Sao kê donate của từng nghệ sĩ (`/performers/:id/donations`) đã có từ trước và viết rất kỹ, nhưng
// TRƯỚC ĐÓ CHỈ VÀO ĐƯỢC TỪ HAI CHỖ, cả hai đều nằm sâu:
//   1. "Vé & danh sách của tôi" → tab Ủng hộ (MyDonationsTab.jsx:78) — PHẢI ĐĂNG NHẬP, và chỉ thấy
//      nghệ sĩ mà chính mình đã tặng tiền.
//   2. Trang nghệ sĩ (PerformerPage.jsx:106) — mà trang đó lại chỉ vào được từ line-up trong chi
//      tiết một buổi diễn cụ thể (ShowIntro.jsx:47).
// Nghĩa là người ngoài KHÔNG có đường nào tìm ra trang minh bạch. Một cam kết minh bạch mà phải
// biết trước mới tìm thấy thì chưa phải là minh bạch. Trang này là cửa vào đó, và được đặt ở chân
// trang — chỗ xuất hiện trên MỌI trang công khai.
//
// VÌ SAO PHẢI GOM NGHỆ SĨ TỪ BUỔI DIỄN, KHÔNG GỌI THẲNG DANH SÁCH
// Backend KHÔNG có endpoint công khai nào liệt kê nghệ sĩ: `PerformersController` gắn
// `[Authorize(Policy = Policies.RequireOwner)]` ở CẤP LỚP, nên `GET /performers` chỉ chủ phòng trà
// gọi được. Hai endpoint donate công khai duy nhất đều theo TỪNG nghệ sĩ
// (`/performers/{id}/donations` và `/donations/summary`, DonationsController).
// Danh sách buổi diễn công khai chỉ trả về TÊN nghệ sĩ (`performerNames`,
// LoungeShowMappingExtensions.cs:40) — không có id nên không dẫn link được. Chỉ CHI TIẾT buổi diễn
// mới trả `PerformerSummaryDto` có `id` và `acceptsDonation` (dòng 73).
// Vì vậy trang này lấy vài buổi diễn gần nhất rồi đọc chi tiết từng buổi để gom nghệ sĩ. Có giới
// hạn số buổi (SO_BUOI_QUET) để không bắn quá nhiều yêu cầu cho một trang công khai.
//
// ĐỀ NGHỊ CHO BACKEND (làm được thì bỏ hẳn vòng gom này): một endpoint công khai
// `GET /performers/public` trả danh sách nghệ sĩ có nhận donate. Khi có, trang này gọi một lần.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShieldCheck, Landmark, Building2, ArrowRight, RefreshCw } from 'lucide-react'
import { getShows, getShowDetail } from '../../services/showServices'
import Skeleton from '../../components/shared/Skeleton'
import Reveal from '../../components/shared/Reveal'

// Quét bao nhiêu buổi diễn gần nhất để gom nghệ sĩ. Mỗi buổi là một yêu cầu chi tiết, nên con số
// này là đánh đổi giữa "đủ nghệ sĩ để trang không trống" và "đừng bắn quá nhiều yêu cầu".
const SO_BUOI_QUET = 10

const TransparencyHubPage = () => {
  const [ngheSi, setNgheSi] = useState(null) // null = đang tải, [] = tải xong mà không có ai
  const [loi, setLoi] = useState(false)

  const gom = useCallback(async () => {
    setLoi(false)
    setNgheSi(null)
    try {
      const ds = await getShows({ page: 1, pageSize: SO_BUOI_QUET, sortBy: 'Newest', includeSoldOut: true })
      const buoi = ds?.success ? (ds.data?.items ?? []) : []
      if (buoi.length === 0) { setNgheSi([]); return }

      // allSettled: một buổi lỗi không được làm hỏng cả trang.
      const chiTiet = await Promise.allSettled(buoi.map((b) => getShowDetail(b.id)))

      // Gộp theo id nghệ sĩ, giữ lại nơi họ vừa diễn để người xem có ngữ cảnh.
      const theoId = new Map()
      for (const kq of chiTiet) {
        if (kq.status !== 'fulfilled' || !kq.value?.success) continue
        const show = kq.value.data
        for (const p of show?.performers ?? []) {
          // Chỉ hiện người CÓ nhận donate — người không nhận thì trang sao kê rỗng, đưa vào chỉ gây hiểu nhầm.
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

  // Bọc trong hàm async như PerformerDonationsPage:201 — cùng một mẫu cho cả hai trang công khai.
  useEffect(() => { const chay = async () => { await gom() }; chay() }, [gom])

  return (
    <div className="bg-page text-ink">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-8 flex-shrink-0 bg-brand-text/70" aria-hidden="true" />
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-brand-text">
            Công khai · không cần đăng nhập
          </p>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight mb-4">
          Tiền ủng hộ đi đâu, đến khi nào
        </h1>
        <p className="text-ink-soft leading-relaxed max-w-2xl mb-10">
          Khi bạn tặng tiền cho một nghệ sĩ, khoản đó không chuyển thẳng tới họ. Nó đi qua hai chặng,
          và bạn xem được từng khoản đang nằm ở chặng nào — kể cả khi bạn không phải người đã tặng.
        </p>

        {/* Ba chặng: giải thích đường đi của tiền trước khi đưa người xem vào sao kê từng nghệ sĩ. */}
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Landmark, ten: 'Nền tảng thu', mo: 'Khoản ủng hộ vào tài khoản giữ hộ của nền tảng ngay khi bạn thanh toán xong.' },
            { icon: Building2, ten: 'Chuyển cho phòng trà', mo: 'Tới kỳ chi trả, nền tảng chuyển phần của nghệ sĩ về phòng trà nơi họ biểu diễn.' },
            { icon: Heart, ten: 'Phòng trà trả nghệ sĩ', mo: 'Phòng trà chuyển cho nghệ sĩ và báo lại. Chính nghệ sĩ là người bấm xác nhận đã nhận được.' },
          ].map((b, i) => (
            <li key={b.ten} className="bg-card border border-line rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <b.icon size={18} className="text-brand-text flex-shrink-0" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-ink-mute tabular-nums">Chặng {i + 1}</span>
              </div>
              <p className="font-semibold text-ink mb-1.5">{b.ten}</p>
              <p className="text-sm text-ink-soft leading-relaxed">{b.mo}</p>
            </li>
          ))}
        </ol>

        <div className="flex items-start gap-3 rounded-xl border border-line bg-card px-5 py-4 mb-12">
          <ShieldCheck size={18} className="text-brand-text flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-sm text-ink-soft leading-relaxed">
            Sao kê công khai <strong className="text-ink font-semibold">không bao giờ</strong> hiển thị số tài
            khoản, mã chuyển khoản hay ảnh chứng từ. Bạn chỉ thấy tiền đang ở chặng nào, khoản nào
            quá hạn, và nghệ sĩ đã xác nhận nhận được hay chưa.
          </p>
        </div>

        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink">Xem sao kê của nghệ sĩ</h2>
            <p className="text-sm text-ink-mute mt-1">Những nghệ sĩ có nhận ủng hộ trong các đêm diễn gần đây.</p>
          </div>
          <button
            onClick={gom}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-line bg-card text-sm font-medium text-ink-soft hover:border-brand hover:text-ink transition-colors flex-shrink-0"
          >
            <RefreshCw size={15} /> Tải lại
          </button>
        </div>

        {ngheSi === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-line rounded-xl p-5 flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : ngheSi.length === 0 ? (
          <div className="bg-card border border-line rounded-xl p-8 text-center">
            <p className="text-ink font-medium mb-1">
              {loi ? 'Chưa tải được danh sách nghệ sĩ.' : 'Chưa có nghệ sĩ nào nhận ủng hộ trong các đêm diễn gần đây.'}
            </p>
            <p className="text-sm text-ink-soft leading-relaxed">
              {loi
                ? 'Bạn thử bấm Tải lại. Nếu vẫn không được, sao kê của từng nghệ sĩ vẫn xem được từ trang nghệ sĩ trong mỗi đêm diễn.'
                : 'Bạn vẫn mở được sao kê của bất kỳ nghệ sĩ nào từ phần Nghệ sĩ trong trang chi tiết đêm diễn.'}
            </p>
            <Link to="/shows" className="inline-flex items-center gap-2 min-h-[44px] mt-4 text-sm font-semibold text-brand-text hover:underline">
              Xem các đêm diễn <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ngheSi.map((p, i) => (
              <Reveal as="li" key={p.id} delay={Math.min(i, 5) * 60}>
                <Link
                  to={`/performers/${p.id}/donations`}
                  className="group flex items-center gap-3 bg-card border border-line rounded-xl p-5 hover:border-line-strong transition-colors h-full"
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" loading="lazy"
                      className="w-12 h-12 rounded-full object-cover border border-line flex-shrink-0" />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-sunken border border-line flex items-center justify-center flex-shrink-0">
                      <Heart size={18} className="text-ink-mute" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink truncate group-hover:text-brand-text transition-colors">
                      {p.name}
                    </span>
                    {p.buoiGanNhat && (
                      <span className="block text-xs text-ink-mute truncate mt-0.5">{p.buoiGanNhat}</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-text mt-1.5">
                      Xem sao kê <ArrowRight size={12} />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TransparencyHubPage
