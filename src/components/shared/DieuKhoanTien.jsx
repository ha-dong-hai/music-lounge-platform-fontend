// src/components/shared/DieuKhoanTien.jsx
//
// CÁC KHỐI ĐIỀU KHOẢN TIỀN (MLACP-626, 04/10/2026). Chủ dự án: "các điều khoản liên quan tới tiền tôi muốn được đề cập
// rõ với khách hàng", và "phải cho người khác biết đã được cập nhật lúc nào để có cơ sở tham chiếu".
//
// LUẬT:
//  - Nói TRƯỚC khi khách trả tiền, ngay cạnh nút trả tiền (Luật BVQLNTD 2023 Điều 21: cung cấp thông tin về giá, phí và
//    điều kiện giao dịch trước khi giao dịch).
//  - Mọi con số đọc từ useBieuPhi (máy chủ). Chưa tải được thì KHÔNG in số nào — chỉ dẫn sang trang Điều khoản.
//  - Có ví dụ bằng tiền thật (100.000đ): một tỉ lệ phần trăm không cho người đọc biết họ nhận bao nhiêu.
//  - Mỗi khối ghi "Cập nhật <ngày>" khi biểu phí đã từng đổi, và dẫn tới nhật ký thay đổi ở trang Điều khoản.
import { Link } from 'react-router-dom'
import { useBieuPhi } from '../../hooks/useBieuPhi'
import { dong, phanTram, gioVaNgay, chiaUngHo, chiaVe, dienGiaiThayDoi } from '../../utils/bieuPhi'
import { gioTrongNgay, ngayDayDu } from '../../utils/ngayVietNam'

const DUONG_DAN = '/dieu-khoan#bieu-phi'
const Dong = ({ children }) => <li>{children}</li>
const so = (v) => Number(v).toLocaleString('vi-VN') // 3.5 -> 3,5

// "Cập nhật 16:07 ngày 04/10/2026 · Xem nhật ký thay đổi"
export const DongCapNhat = ({ bieuPhi, className = '' }) => (
  <p className={`text-xs text-ink-mute ${className}`}>
    {bieuPhi?.updatedAt && <>Biểu phí cập nhật {gioTrongNgay(bieuPhi.updatedAt)} ngày {ngayDayDu(bieuPhi.updatedAt)}. </>}
    <Link to={DUONG_DAN} className="underline underline-offset-4 text-ink-soft hover:text-ink">Điều khoản tiền và nhật ký thay đổi</Link>
  </p>
)

// BƯỚC MUA VÉ — ngay dưới "Tổng cộng".
export const GhiChuGiaVe = () => {
  const { data } = useBieuPhi()
  return (
    <div className="text-xs text-ink-soft leading-relaxed space-y-1">
      <p>Đây là số bạn trả. Phí nền tảng và thuế đã nằm trong giá vé, không cộng thêm khoản nào lúc thanh toán.</p>
      {data && <p>Mỗi lần giữ chỗ tối đa {data.ticket.holdMaxQuantity} vé, giữ trong {data.ticket.holdMinutes} phút.</p>}
      <DongCapNhat bieuPhi={data} />
    </div>
  )
}

// HỘP ỦNG HỘ — ngay trên nút "Thanh toán … qua VNPay". `soTien` = số khán giả đang chọn.
export const ChiaTienUngHo = ({ soTien }) => {
  const { data } = useBieuPhi()
  if (!data) {
    return (
      <p className="text-sm text-ink-soft">
        Tiền ủng hộ không hoàn lại. Cách chia tiền xem tại <Link to={DUONG_DAN} className="underline underline-offset-4">Điều khoản tiền</Link>.
      </p>
    )
  }
  const d = data.donation
  const t = Number(soTien) > 0 ? Number(soTien) : 100000
  const c = chiaUngHo(d, t)
  const hang = [
    [`Nghệ sĩ nhận (${phanTram(d.performerShareRate)})`, c.ngheSi, true],
    [`Phí nền tảng (${phanTram(d.platformCommissionRate)})`, c.phi],
    [`Thuế GTGT (${phanTram(d.vatRate)})`, c.gtgt],
    [`Thuế TNCN (${phanTram(d.personalIncomeTaxRate)})`, c.tncn],
    [`Phòng trà giữ lại (${phanTram(d.venueShareRate)})`, c.phongTra],
  ].filter(([, v]) => v > 0)
  return (
    <section aria-labelledby="chia-tien-td" className="border-2 border-ink p-4">
      <h3 id="chia-tien-td" className="font-sans font-bold text-base">Khoản {dong(t)} của bạn được chia thế nào</h3>
      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
        {hang.map(([nhan, v, dam]) => (
          <div key={nhan} className="contents">
            <dt className={dam ? 'font-semibold' : 'text-ink-soft'}>{nhan}</dt>
            <dd className={`font-mono text-right ${dam ? 'font-semibold' : ''}`}>{dong(v)}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-3 space-y-1 text-sm text-ink-soft list-disc pl-5">
        <li><strong className="text-ink">Tiền ủng hộ không hoàn lại</strong> sau khi thanh toán thành công.</li>
        <li>Phòng trà phải chuyển phần của nghệ sĩ trong {d.venuePayoutDays} ngày kể từ khi nhận tiền; quá {d.venueWarningDays} ngày thì phòng trà bị cảnh cáo.</li>
        <li>Thuế chỉ khấu trừ khi phòng trà là hộ hoặc cá nhân kinh doanh.</li>
        <li>Mỗi lần ủng hộ tối đa {dong(d.maxAmount)}.</li>
      </ul>
      <DongCapNhat bieuPhi={data} className="mt-3" />
    </section>
  )
}

// TRANG VÉ — trong mục Huỷ vé.
export const HanHoanTien = () => {
  const { data } = useBieuPhi()
  if (!data) return null
  const r = data.refund
  return (
    <div className="text-sm text-ink-soft space-y-1 mb-4">
      <p>Yêu cầu hoàn tiền được xử lý trong {gioVaNgay(r.reviewHours)}. Quá {gioVaNgay(r.autoApproveAfterHours)} mà chưa ai xử lý thì hệ thống tự duyệt.</p>
      <p>Tiền hoàn về đúng phương thức bạn đã trả nếu chưa quá {r.gatewayRefundWindowDays} ngày kể từ lúc thanh toán; quá hạn đó chúng tôi sẽ hỏi bạn tài khoản nhận tiền.</p>
      <DongCapNhat bieuPhi={data} />
    </div>
  )
}

// TRANG TIỀN CỦA CHỦ PHÒNG TRÀ.
export const PhiThueLichChi = () => {
  const { data, isPending } = useBieuPhi()
  if (isPending) return <div className="h-40 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải biểu phí" />
  if (!data) return null
  const { ticket: v, settlement: s, donation: d } = data
  const vd = chiaVe(v, s, 100000)
  return (
    <section aria-labelledby="phi-thue-td" className="bg-card border border-line p-6">
      <h2 id="phi-thue-td" className="font-sans font-bold text-base text-ink">Phí, thuế và lịch chi</h2>
      <p className="text-sm text-ink-soft mt-1">Áp dụng cho vé bán trực tuyến. Ví dụ tính trên một vé {dong(vd.tong)}.</p>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm content-start">
          <dt className="text-ink-soft">Phí nền tảng ({phanTram(v.platformCommissionRate)})</dt><dd className="font-mono text-right">− {dong(vd.phi)}</dd>
          <dt className="text-ink-soft">Thuế GTGT khấu trừ ({phanTram(v.vatRate)})</dt><dd className="font-mono text-right">− {dong(vd.gtgt)}</dd>
          <dt className="text-ink-soft">Thuế TNCN khấu trừ ({phanTram(v.personalIncomeTaxRate)})</dt><dd className="font-mono text-right">− {dong(vd.tncn)}</dd>
          <dt className="font-semibold border-t border-ink pt-1.5">Bạn nhận</dt><dd className="font-mono font-semibold text-right border-t border-ink pt-1.5">{dong(vd.nhan)}</dd>
        </dl>
        <ul className="space-y-1.5 text-sm text-ink-soft list-disc pl-5">
          <li>Đợt 1 chi sau buổi diễn {gioVaNgay(s.firstTrancheHoursAfterShow)}: {phanTram(s.newVenueFirstTrancheRate)} với phòng trà mới ({dong(vd.dot1)} trong ví dụ), {phanTram(s.standardFirstTrancheRate)} khi điểm đánh giá từ {so(s.standardMinScore)}, {phanTram(s.premiumFirstTrancheRate)} khi điểm từ {so(s.premiumMinScore)} và đã tổ chức xong {s.premiumMinShows} buổi.</li>
          <li>Phần còn lại chi sau buổi diễn {s.finalTrancheDaysAfterShow} ngày.</li>
          <li>Hai khoản thuế chỉ khấu trừ với hộ hoặc cá nhân kinh doanh. Doanh nghiệp đã được duyệt hồ sơ thuế thì không bị khấu trừ.</li>
          <li>{v.walkInCashGoesThroughPlatform ? 'Vé bán tại quầy cũng đi qua nền tảng và chịu phí như trên.' : 'Vé bán tại quầy bằng tiền mặt do bạn thu trực tiếp, không qua nền tảng và không chịu phí.'}</li>
          <li>Tiền ủng hộ nghệ sĩ: nghệ sĩ nhận {phanTram(d.performerShareRate)}, bạn giữ {phanTram(d.venueShareRate)}; bạn phải chuyển phần của nghệ sĩ trong {d.venuePayoutDays} ngày kể từ khi nhận tiền.</li>
        </ul>
      </div>
      <DongCapNhat bieuPhi={data} className="mt-4" />
    </section>
  )
}

// TRANG ĐIỀU KHOẢN — biểu phí đầy đủ + nhật ký thay đổi.
export const BieuPhiDayDu = () => {
  const { data, isPending, isError, refetch } = useBieuPhi()
  if (isPending) return <div className="h-64 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải biểu phí" />
  if (isError || !data) {
    return (
      <p role="alert" className="border-2 border-danger p-4">
        Chưa tải được biểu phí hiện hành. <button type="button" onClick={() => refetch()} className="font-semibold underline underline-offset-4">Tải lại</button>
      </p>
    )
  }
  const { ticket: v, refund: r, donation: d, settlement: s, changes } = data
  const ve = chiaVe(v, s, 100000)
  const uh = chiaUngHo(d, 100000)
  return (
    <div className="space-y-8">
      <p className="font-mono text-sm text-ink-soft">
        {data.updatedAt
          ? <>Biểu phí cập nhật lần cuối {gioTrongNgay(data.updatedAt)} ngày {ngayDayDu(data.updatedAt)}. Các con số dưới đây là mức đang áp dụng cho giao dịch mới.</>
          : <>Biểu phí chưa thay đổi lần nào kể từ khi hệ thống vận hành. Các con số dưới đây là mức đang áp dụng.</>}
      </p>

      <div>
        <h3 className="font-sans font-bold text-lg">Khi bạn mua vé</h3>
        <ul className="mt-2 space-y-2 list-disc pl-5 marker:text-ink-soft">
          <Dong>Bạn trả đúng giá vé hiện trên trang. Phí nền tảng và thuế đã nằm trong giá, không cộng thêm lúc thanh toán.</Dong>
          <Dong>Mỗi lần giữ chỗ tối đa {v.holdMaxQuantity} vé, giữ trong {v.holdMinutes} phút; hết giờ mà chưa thanh toán thì chỗ được trả lại.</Dong>
          <Dong>Tiền vé trả trực tuyến được MusicLounge giữ hộ, chỉ chuyển cho phòng trà sau khi buổi diễn diễn ra.</Dong>
        </ul>
      </div>

      <div>
        <h3 className="font-sans font-bold text-lg">Khi bạn huỷ vé và nhận hoàn tiền</h3>
        <ul className="mt-2 space-y-2 list-disc pl-5 marker:text-ink-soft">
          <Dong>Điều kiện huỷ và mức hoàn của từng buổi diễn hiện trên trang buổi diễn đó, trước khi bạn thanh toán. Phòng trà huỷ buổi diễn thì bạn được hoàn 100%.</Dong>
          <Dong>Yêu cầu hoàn tiền được xử lý trong {gioVaNgay(r.reviewHours)}. Quá {gioVaNgay(r.autoApproveAfterHours)} mà chưa ai xử lý thì hệ thống tự duyệt.</Dong>
          <Dong>Tiền hoàn về đúng phương thức bạn đã trả nếu chưa quá {r.gatewayRefundWindowDays} ngày kể từ lúc thanh toán. Quá hạn đó, tiền được chuyển khoản tới tài khoản bạn khai, và chỉ khi bạn đồng ý.</Dong>
        </ul>
      </div>

      <div>
        <h3 className="font-sans font-bold text-lg">Khi bạn ủng hộ nghệ sĩ</h3>
        <ul className="mt-2 space-y-2 list-disc pl-5 marker:text-ink-soft">
          <Dong><strong>Tiền ủng hộ không hoàn lại</strong> sau khi thanh toán thành công.</Dong>
          <Dong>Với mỗi {dong(uh.tong)}: nghệ sĩ nhận {dong(uh.ngheSi)} ({phanTram(d.performerShareRate)}), phí nền tảng {dong(uh.phi)} ({phanTram(d.platformCommissionRate)}), thuế GTGT {dong(uh.gtgt)} ({phanTram(d.vatRate)}), thuế TNCN {dong(uh.tncn)} ({phanTram(d.personalIncomeTaxRate)}), phòng trà giữ lại {dong(uh.phongTra)} ({phanTram(d.venueShareRate)}). Thuế chỉ khấu trừ khi phòng trà là hộ hoặc cá nhân kinh doanh.</Dong>
          <Dong>Tiền đi hai chặng: nền tảng chuyển cho phòng trà, rồi phòng trà chuyển cho nghệ sĩ trong {d.venuePayoutDays} ngày kể từ khi nhận tiền. Quá {d.venueWarningDays} ngày mà chưa chuyển thì phòng trà bị cảnh cáo.</Dong>
          <Dong>Mỗi lần ủng hộ tối đa {dong(d.maxAmount)}. Mọi khoản đều hiện trên sao kê công khai của nghệ sĩ.</Dong>
        </ul>
      </div>

      <div>
        <h3 className="font-sans font-bold text-lg">Khi bạn gọi đồ uống</h3>
        <ul className="mt-2 space-y-2 list-disc pl-5 marker:text-ink-soft">
          <Dong>Bạn trả đúng giá trên thực đơn, bằng tiền mặt tại quầy hoặc trực tuyến. Nền tảng không thu phí trên đơn đồ uống.</Dong>
          <Dong>Trả trùng một đơn, hoặc tiền về sau khi đơn đã bị huỷ, thì khoản đó được hoàn 100%.</Dong>
        </ul>
      </div>

      <div>
        <h3 className="font-sans font-bold text-lg">Với chủ phòng trà</h3>
        <ul className="mt-2 space-y-2 list-disc pl-5 marker:text-ink-soft">
          <Dong>Trên mỗi vé trực tuyến {dong(ve.tong)}: phí nền tảng {dong(ve.phi)} ({phanTram(v.platformCommissionRate)}), thuế GTGT khấu trừ {dong(ve.gtgt)} ({phanTram(v.vatRate)}), thuế TNCN khấu trừ {dong(ve.tncn)} ({phanTram(v.personalIncomeTaxRate)}); phòng trà nhận {dong(ve.nhan)}.</Dong>
          <Dong>Hai khoản thuế chỉ khấu trừ với hộ hoặc cá nhân kinh doanh. Doanh nghiệp đã được duyệt hồ sơ thuế thì không bị khấu trừ.</Dong>
          <Dong>Tiền chi hai đợt: đợt 1 sau buổi diễn {gioVaNgay(s.firstTrancheHoursAfterShow)}, phần còn lại sau {s.finalTrancheDaysAfterShow} ngày. Đợt 1 là {phanTram(s.newVenueFirstTrancheRate)} với phòng trà mới, {phanTram(s.standardFirstTrancheRate)} khi điểm đánh giá từ {so(s.standardMinScore)}, {phanTram(s.premiumFirstTrancheRate)} khi điểm từ {so(s.premiumMinScore)} và đã tổ chức xong {s.premiumMinShows} buổi.</Dong>
          <Dong>{v.walkInCashGoesThroughPlatform ? 'Vé bán tại quầy cũng đi qua nền tảng và chịu phí như vé trực tuyến.' : 'Vé bán tại quầy bằng tiền mặt do phòng trà thu trực tiếp, không qua nền tảng và không chịu phí.'}</Dong>
          <Dong>Đổi gói dịch vụ có hiệu lực ngay; phần thời gian còn lại của gói cũ được quy đổi sang gói mới, không hoàn tiền mặt.</Dong>
        </ul>
      </div>

      <div>
        <h3 id="nhat-ky-bieu-phi" className="font-sans font-bold text-lg">Nhật ký thay đổi biểu phí</h3>
        {changes.length === 0 ? (
          <p className="mt-2 text-ink-soft">Chưa có thay đổi nào.</p>
        ) : (
          <div className="mt-3 overflow-x-auto border-2 border-ink">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Mỗi dòng là một lần đổi: thời điểm áp dụng, điều khoản, mức cũ và mức mới</caption>
              <thead className="bg-sunken">
                <tr>
                  <th scope="col" className="p-3 font-semibold whitespace-nowrap">Áp dụng từ</th>
                  <th scope="col" className="p-3 font-semibold">Điều khoản</th>
                  <th scope="col" className="p-3 font-semibold whitespace-nowrap">Mức cũ</th>
                  <th scope="col" className="p-3 font-semibold whitespace-nowrap">Mức mới</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/20">
                {changes.map((c, i) => {
                  const g = dienGiaiThayDoi(c)
                  return (
                    <tr key={`${c.key}-${c.effectiveFrom}-${i}`}>
                      <td className="p-3 font-mono whitespace-nowrap">{gioTrongNgay(g.luc)} {ngayDayDu(g.luc)}</td>
                      <td className="p-3">{g.nhan}</td>
                      <td className="p-3 font-mono whitespace-nowrap text-ink-soft">{g.cu}</td>
                      <td className="p-3 font-mono whitespace-nowrap font-semibold">{g.moi}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-sm text-ink-soft">Mức mới áp dụng cho giao dịch phát sinh từ thời điểm ghi ở cột đầu. Giao dịch trước đó giữ mức cũ.</p>
      </div>
    </div>
  )
}
