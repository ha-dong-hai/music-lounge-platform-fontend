// src/components/account/IdentityTab.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Ba việc gom chung một tab vì cùng phục vụ một mục đích: chứng minh bạn là ai trước khi nhận tiền.
//   Xác thực số điện thoại · Định danh CCCD · Hồ sơ thuế.
// - Ảnh CCCD: tải lên /uploads/images trước, rồi gửi URL. Backend chuyển ảnh sang vùng lưu RIÊNG TƯ
//   ngay khi nhận, nên URL đó KHÔNG mở trực tiếp được — muốn xem lại phải gọi GET và nhận blob.
// - Mã xác thực gửi tới SỐ ĐANG KHAI trong hồ sơ. Muốn đổi số thì sửa hồ sơ trước rồi mới gửi mã.
//
// SỬA 30/09/2026 — HỒ SƠ THUẾ CHƯA TỪNG GỬI ĐƯỢC:
// - Hai lựa chọn cũ "HouseholdBusiness" / "Individual" KHÔNG phải giá trị backend nhận. Enum PayeeBusinessType chỉ có
//   `HouseholdOrIndividual` và `Enterprise` (SubmitTaxProfileCommandValidator: Enum.TryParse) → mọi lần lưu đều bị từ
//   chối, và doanh nghiệp không có lựa chọn nào. Cùng lỗi có ở nhánh web đang chạy (mlacp-ui) — đã báo chủ dự án.
// - GET /me/tax-profile LUÔN trả DTO (không 404 khi chưa khai) → bản cũ coi mọi người là "đã khai" và in hai dòng trống.
//   "Đã khai" giờ là `businessType != null`.
// - Tên pháp lý chỉ dùng cho DOANH NGHIỆP (bắt buộc — NĐ 248/2026 Điều 18) và bị bỏ với hộ/cá nhân (handler :54). Bản cũ
//   hỏi nó với mọi người, kèm gợi ý sai "phải khớp tên chủ tài khoản ngân hàng".
// - Mức thuế không in cứng nữa ("GTGT 5% và TNCN 2%" — TNCN đang cấu hình 0 theo nghị định): hiện nguyên văn
//   `explanation` backend soạn từ đúng mức sổ cái đang dùng, cùng trạng thái duyệt và lý do từ chối.
//
// LÀM LẠI GIAO DIỆN: ba khối nối nhau bằng đường kẻ (không còn ba thẻ); trạng thái dùng NhanTrangThai; ô nhập qua
// OTruong (nhãn thấy được, lỗi dưới ô); nút gửi không khoá khi thiếu dữ liệu mà báo đúng ô thiếu.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Upload, CheckCircle2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getMyProfile, uploadImage, submitCitizenCard, getMyCitizenCardImage, getMyCitizenCard,
  getMyTaxProfile, submitTaxProfile, requestPhoneVerificationCode, verifyPhone,
} from '../../services/userServices'
import OTruong from '../shared/OTruong'
import NhanTrangThai from '../shared/NhanTrangThai'
import { loiNgaySinh, ngaySinhToiDa } from '../../utils/rangBuocNgay'

const NUT_VIEN = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-60'
const NUT_DAC = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors disabled:opacity-60'

const LOAI_HINH = {
  HouseholdOrIndividual: 'Hộ kinh doanh hoặc cá nhân kinh doanh',
  Enterprise: 'Doanh nghiệp',
}
const DUYET = {
  Pending: ['cho', 'Đang chờ duyệt'],
  Approved: ['tot', 'Đã duyệt'],
  Rejected: ['xau', 'Bị từ chối'],
}

const Khoi = ({ id, tieuDe, moTa, trangThai, children }) => (
  <section aria-labelledby={id} className="py-7">
    <div className="flex flex-wrap items-center gap-3">
      <h3 id={id} className="text-3xl">{tieuDe}</h3>
      {trangThai}
    </div>
    {moTa && <p className="mt-2 text-ink-soft max-w-[65ch]">{moTa}</p>}
    <div className="mt-5">{children}</div>
  </section>
)

const IdentityTab = () => {
  const [profile, setProfile] = useState(null)
  const [taxProfile, setTaxProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Điện thoại
  const [code, setCode] = useState('')
  const [loiMa, setLoiMa] = useState(null)
  const [busyPhone, setBusyPhone] = useState(null)

  // CCCD
  const [cccd, setCccd] = useState({ citizenCardNumber: '', frontImageUrl: '', backImageUrl: '', dateOfBirth: '' })
  const [loiCccd, setLoiCccd] = useState({})
  const [uploadingSide, setUploadingSide] = useState(null)
  const [busyCccd, setBusyCccd] = useState(false)

  // Trạng thái CCCD — hai nguồn:
  //  1. GET /me/citizen-card (trạng thái duyệt + lý do từ chối + số che), có từ 30/09.
  //  2. Dự phòng cho máy chủ chưa có endpoint đó: lấy được ẢNH mặt trước nghĩa là đã nộp
  //     (GetMyCitizenCardImageQueryHandler ném NotFound khi chưa có). UserProfileDto không có trường CCCD nào —
  //     bản cũ đọc hai tên trường không tồn tại nên luôn hiện form rỗng như chưa từng nộp.
  // null = đang dò · true/false = kết luận.
  const [daNopCccd, setDaNopCccd] = useState(null)
  const [trangThaiCccd, setTrangThaiCccd] = useState(null)
  const [anhCccd, setAnhCccd] = useState({ front: null, back: null })
  const [nopLai, setNopLai] = useState(false)

  // Thuế
  const [tax, setTax] = useState({ businessType: '', taxCode: '', legalName: '' })
  const [loiThue, setLoiThue] = useState({})
  const [busyTax, setBusyTax] = useState(false)
  const [moFormThue, setMoFormThue] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const [pRes, tRes] = await Promise.allSettled([getMyProfile(), getMyTaxProfile()])
    if (pRes.status === 'fulfilled' && pRes.value?.success) setProfile(pRes.value.data)
    if (tRes.status === 'fulfilled' && tRes.value?.success) {
      const t = tRes.value.data
      setTaxProfile(t)
      setTax({ businessType: t?.businessType ?? '', taxCode: t?.taxCode ?? '', legalName: t?.legalName ?? '' })
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // Tải ảnh CCCD đã nộp về để (a) biết là đã nộp hay chưa, (b) hiện ngay tại chỗ cho người dùng
  // đối chiếu xem có chụp nhầm, chụp mờ, chụp ngược mặt không — trước khi quản trị viên duyệt.
  const taiAnhDaNop = useCallback(async () => {
    // MLACP-602: hỏi TRẠNG THÁI trước; máy chủ nói rõ "chưa nộp" thì không gọi hai ảnh nữa (trước đây người chưa nộp gì
    // mở trang là có hai lệnh gọi 404). Không đọc được trạng thái (máy chủ bản cũ chưa có GET /me/citizen-card) thì vẫn
    // thử tải ảnh như trước, để trang không mù hẳn.
    const [tt] = await Promise.allSettled([getMyCitizenCard()])
    const trangThai = tt.status === 'fulfilled' && tt.value?.success ? tt.value.data : null
    setTrangThaiCccd(trangThai)
    const chuaNop = trangThai && !trangThai.submittedAt
    const [truoc, sau] = chuaNop
      ? [{ status: 'rejected' }, { status: 'rejected' }]
      : await Promise.allSettled([getMyCitizenCardImage('front'), getMyCitizenCardImage('back')])
    const thanhUrl = (kq) => {
      if (kq.status !== 'fulfilled' || !kq.value) return null
      // Service đặt responseType 'blob' nên interceptor trả thẳng Blob, không bóc `.data`.
      const blob = kq.value instanceof Blob ? kq.value : kq.value?.data
      return blob instanceof Blob ? URL.createObjectURL(blob) : null
    }
    const urlTruoc = thanhUrl(truoc)
    const urlSau = thanhUrl(sau)
    setDaNopCccd(Boolean(urlTruoc))
    setAnhCccd((cu) => {
      // Thu hồi URL của lần tải trước để không rò bộ nhớ khi người dùng nộp lại nhiều lần.
      if (cu.front) URL.revokeObjectURL(cu.front)
      if (cu.back) URL.revokeObjectURL(cu.back)
      return { front: urlTruoc, back: urlSau }
    })
  }, [])

  useEffect(() => { const chay = async () => { await taiAnhDaNop() }; chay() }, [taiAnhDaNop])

  // Rời tab thì trả lại bộ nhớ của các object URL đang giữ.
  useEffect(() => () => {
    setAnhCccd((cu) => {
      if (cu.front) URL.revokeObjectURL(cu.front)
      if (cu.back) URL.revokeObjectURL(cu.back)
      return { front: null, back: null }
    })
  }, [])

  const guiMa = async () => {
    setBusyPhone('send')
    try {
      await requestPhoneVerificationCode()
      toast.success('Đã gửi mã xác thực tới số điện thoại trong hồ sơ của bạn.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa gửi được mã.')
    } finally { setBusyPhone(null) }
  }

  const xacThuc = async (e) => {
    e.preventDefault()
    if (!code.trim()) { setLoiMa('Nhập mã bạn nhận được qua tin nhắn.'); return }
    setLoiMa(null)
    setBusyPhone('verify')
    try {
      await verifyPhone(code.trim())
      toast.success('Đã xác thực số điện thoại.')
      setCode('')
      await load()
    } catch (err) {
      setLoiMa(err.response?.data?.message || 'Mã không đúng hoặc đã hết hạn.')
    } finally { setBusyPhone(null) }
  }

  const taiAnh = async (file, side) => {
    if (!file) return
    setUploadingSide(side)
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      const url = up.data?.url ?? up.data
      setCccd((p) => ({ ...p, [side === 'front' ? 'frontImageUrl' : 'backImageUrl']: url }))
      setLoiCccd((l) => ({ ...l, [side]: undefined }))
    } catch (err) {
      setLoiCccd((l) => ({ ...l, [side]: err.response?.data?.message || 'Chưa tải được ảnh này. Hãy thử lại.' }))
    } finally { setUploadingSide(null) }
  }

  const guiCccd = async (e) => {
    e.preventDefault()
    // Ngày sinh là BẮT BUỘC ở backend (SubmitCitizenCardCommandValidator: "Vui lòng nhập ngày sinh như
    // trên CCCD/CMND."). Bản trước nữa để ô này như tuỳ chọn và gửi null, nên mọi lần nộp đều bị từ chối.
    const thieu = {}
    if (!cccd.citizenCardNumber.trim()) thieu.so = 'Nhập số CCCD.'
    if (!cccd.dateOfBirth) thieu.ngaySinh = 'Nhập ngày sinh như trên CCCD.'
    // SubmitCitizenCardCommandValidator: ngày sinh < hôm nay. Rà soát 03/10: ô cho chọn ngày tương lai, chỉ biết khi gửi.
    else if (loiNgaySinh(cccd.dateOfBirth)) thieu.ngaySinh = loiNgaySinh(cccd.dateOfBirth)
    if (!cccd.frontImageUrl) thieu.front = 'Tải ảnh mặt trước.'
    if (!cccd.backImageUrl) thieu.back = 'Tải ảnh mặt sau.'
    setLoiCccd(thieu)
    if (Object.keys(thieu).length) return
    setBusyCccd(true)
    try {
      await submitCitizenCard({
        citizenCardNumber: cccd.citizenCardNumber.trim(),
        frontImageUrl: cccd.frontImageUrl,
        backImageUrl: cccd.backImageUrl,
        dateOfBirth: cccd.dateOfBirth,
      })
      toast.success('Đã gửi hồ sơ định danh. Quản trị viên sẽ duyệt.')
      setCccd({ citizenCardNumber: '', frontImageUrl: '', backImageUrl: '', dateOfBirth: '' })
      setNopLai(false)
      // Tải lại ẢNH ĐÃ NỘP, không chỉ `load()`: UserProfileDto không chứa thông tin CCCD nào.
      await Promise.all([load(), taiAnhDaNop()])
    } catch (err) {
      setLoiCccd({ chung: err.response?.data?.message || 'Chưa gửi được hồ sơ định danh. Hãy thử lại.' })
    } finally { setBusyCccd(false) }
  }

  const xemAnhCccd = async (side) => {
    try {
      const blob = await getMyCitizenCardImage(side)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa mở được ảnh.')
    }
  }

  const laDoanhNghiep = tax.businessType === 'Enterprise'

  const luuThue = async (e) => {
    e.preventDefault()
    const thieu = {}
    if (!tax.businessType) thieu.loai = 'Chọn loại hình kinh doanh.'
    if (!tax.taxCode.trim()) thieu.ma = 'Nhập mã số thuế.'
    if (laDoanhNghiep && !tax.legalName.trim()) thieu.ten = 'Doanh nghiệp phải khai tên đúng như trên giấy chứng nhận đăng ký kinh doanh.'
    setLoiThue(thieu)
    if (Object.keys(thieu).length) return
    setBusyTax(true)
    try {
      await submitTaxProfile({
        businessType: tax.businessType,
        taxCode: tax.taxCode.trim(),
        legalName: laDoanhNghiep ? tax.legalName.trim() : null,
      })
      toast.success('Đã lưu hồ sơ thuế.')
      setMoFormThue(false)
      await load()
    } catch (err) {
      setLoiThue({ chung: err.response?.data?.message || 'Chưa lưu được hồ sơ thuế. Hãy thử lại.' })
    } finally { setBusyTax(false) }
  }

  if (isLoading) {
    return <div className="h-72 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải hồ sơ định danh" />
  }

  const daXacThucSdt = profile?.phoneVerified ?? false
  const daKhaiThue = Boolean(taxProfile?.businessType)
  const duyetThue = DUYET[taxProfile?.reviewStatus]
  const duyetCccd = DUYET[trangThaiCccd?.reviewStatus]

  return (
    <div className="divide-y-2 divide-ink/20 border-y-2 border-ink">
      {/* ĐIỆN THOẠI */}
      <Khoi id="dd-sdt" tieuDe="Số điện thoại"
        moTa="Xác thực số điện thoại để chúng tôi liên hệ được khi có vấn đề về vé hoặc hoàn tiền."
        trangThai={daXacThucSdt ? <NhanTrangThai sacThai="tot">Đã xác thực</NhanTrangThai> : <NhanTrangThai sacThai="cho">Chưa xác thực</NhanTrangThai>}>
        <p>Số trong hồ sơ: <span className="font-mono">{profile?.phone || 'chưa khai'}</span></p>
        {!daXacThucSdt && (
          <>
            <p className="mt-1 text-sm text-ink-soft">Mã được gửi tới đúng số này. Muốn đổi số thì sửa ở mục Hồ sơ trước rồi quay lại đây.</p>
            {profile?.phone ? (
              <>
                <button type="button" onClick={guiMa} disabled={busyPhone !== null} className={`${NUT_VIEN} mt-4`}>
                  {busyPhone === 'send' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Gửi mã xác thực
                </button>
                <form onSubmit={xacThuc} noValidate className="mt-4 flex flex-wrap items-end gap-3">
                  <OTruong nhan="Mã xác thực" loi={loiMa} className="w-48">
                    {(p) => <input {...p} value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" />}
                  </OTruong>
                  <button type="submit" disabled={busyPhone !== null} className={`${NUT_DAC} ${loiMa ? 'mb-7' : ''}`}>
                    {busyPhone === 'verify' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Xác thực
                  </button>
                </form>
              </>
            ) : (
              <p className="mt-3 border-l-4 border-warning pl-3">Hãy khai số điện thoại ở mục Hồ sơ trước.</p>
            )}
          </>
        )}
      </Khoi>

      {/* CCCD */}
      <Khoi id="dd-cccd" tieuDe="Định danh cá nhân (CCCD)"
        moTa="Cần thiết khi bạn nhận tiền từ nền tảng. Ảnh được lưu ở vùng riêng tư, chỉ bạn và quản trị viên xem được."
        trangThai={daNopCccd && !nopLai ? (duyetCccd ? <NhanTrangThai sacThai={duyetCccd[0]}>{duyetCccd[1]}</NhanTrangThai> : <NhanTrangThai sacThai="trung">Đã nộp</NhanTrangThai>) : null}>
        {daNopCccd === null ? (
          <div className="h-32 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang kiểm tra hồ sơ đã nộp" />
        ) : daNopCccd && !nopLai ? (
          <div className="space-y-4">
            {trangThaiCccd?.numberMasked && <p>Số CCCD: <span className="font-mono">{trangThaiCccd.numberMasked}</span></p>}
            {trangThaiCccd?.reviewStatus === 'Rejected' && (
              <div className="border-l-4 border-danger pl-3">
                {trangThaiCccd.reviewNote && <p><span className="font-semibold">Lý do từ chối:</span> {trangThaiCccd.reviewNote}</p>}
                <p className="text-ink-soft mt-1">Sửa theo lý do trên rồi bấm "Nộp lại hồ sơ".</p>
              </div>
            )}
            {trangThaiCccd?.explanation && trangThaiCccd.reviewStatus !== 'Rejected' && (
              <p className="text-ink-soft max-w-[65ch]">{trangThaiCccd.explanation}</p>
            )}

            {/* Hiện ảnh NGAY TẠI CHỖ: giấy tờ tuỳ thân đã gửi đi là thứ người ta cần soát lại ngay (mờ, ngược mặt,
                nhầm giấy tờ), không phải mở ra ở chỗ khác. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['front', 'Mặt trước', anhCccd.front], ['back', 'Mặt sau', anhCccd.back]].map(([side, label, url]) => (
                <figure key={side} className="border-2 border-ink">
                  {url ? (
                    <img src={url} alt={`Ảnh CCCD ${label.toLowerCase()} bạn đã nộp`} className="w-full aspect-[8/5] object-cover" />
                  ) : (
                    <div className="w-full aspect-[8/5] flex items-center justify-center text-ink-mute px-3 text-center bg-sunken">
                      Chưa tải được ảnh {label.toLowerCase()}
                    </div>
                  )}
                  <figcaption className="flex items-center justify-between gap-2 px-3 border-t-2 border-ink">
                    <span className="font-semibold">{label}</span>
                    {url && (
                      <button type="button" onClick={() => xemAnhCccd(side)} aria-label={`Xem cỡ lớn ảnh ${label.toLowerCase()}`}
                        className="inline-flex items-center gap-1.5 min-h-[44px] font-semibold hover:text-ink-soft">
                        <ExternalLink size={14} aria-hidden="true" /> Xem cỡ lớn
                      </button>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>

            <p className="text-ink-soft max-w-[65ch]">
              Ảnh mờ, thiếu góc hay nhầm mặt thì hồ sơ sẽ bị từ chối. Bạn nộp lại được bất cứ lúc nào — hồ sơ sẽ quay về
              trạng thái chờ duyệt.
            </p>
            <button type="button" onClick={() => setNopLai(true)} className={NUT_VIEN}>
              <Upload size={16} aria-hidden="true" /> Nộp lại hồ sơ
            </button>
          </div>
        ) : (
          <form onSubmit={guiCccd} noValidate className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OTruong nhan="Số CCCD" batBuoc loi={loiCccd.so}>
                {(p) => <input {...p} value={cccd.citizenCardNumber} inputMode="numeric" autoComplete="off"
                  onChange={(e) => setCccd((c) => ({ ...c, citizenCardNumber: e.target.value }))} />}
              </OTruong>
              <OTruong nhan="Ngày sinh (như trên CCCD)" batBuoc loi={loiCccd.ngaySinh}>
                {(p) => <input {...p} type="date" value={cccd.dateOfBirth} max={ngaySinhToiDa()} autoComplete="bday"
                  onChange={(e) => setCccd((c) => ({ ...c, dateOfBirth: e.target.value }))} />}
              </OTruong>
            </div>

            <fieldset>
              <legend className="font-semibold">Ảnh hai mặt CCCD <span className="text-danger" aria-hidden="true">*</span><span className="sr-only"> (bắt buộc)</span></legend>
              <p className="text-sm text-ink-soft mt-0.5">Chụp thẳng, đủ bốn góc, đọc rõ chữ.</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[['front', 'Mặt trước', cccd.frontImageUrl], ['back', 'Mặt sau', cccd.backImageUrl]].map(([side, label, url]) => (
                  <div key={side}>
                    <label className={`flex items-center justify-center gap-2 min-h-[72px] border-2 border-dashed cursor-pointer hover:bg-card ${loiCccd[side] ? 'border-danger' : 'border-ink'}`}>
                      {uploadingSide === side
                        ? <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                        : url ? <CheckCircle2 size={18} className="text-success" aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
                      <span className="font-semibold">{url ? `${label}: đã tải` : `Chọn ảnh ${label.toLowerCase()}`}</span>
                      <input type="file" accept="image/*" className="sr-only" disabled={uploadingSide !== null}
                        onChange={(e) => taiAnh(e.target.files?.[0], side)} />
                    </label>
                    {loiCccd[side] && <p className="mt-1.5 text-sm font-semibold text-danger">{loiCccd[side]}</p>}
                  </div>
                ))}
              </div>
            </fieldset>

            {loiCccd.chung && <p role="alert" className="border-2 border-danger p-4 font-semibold text-danger">{loiCccd.chung}</p>}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busyCccd || uploadingSide !== null} className={NUT_DAC}>
                {busyCccd && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {nopLai ? 'Gửi lại hồ sơ định danh' : 'Gửi hồ sơ định danh'}
              </button>
              {/* Chỉ hiện khi đang NỘP LẠI: người đã có hồ sơ cần đường lùi để xem lại ảnh cũ. */}
              {nopLai && (
                <button type="button" onClick={() => { setNopLai(false); setLoiCccd({}) }} disabled={busyCccd} className={NUT_VIEN}>
                  Huỷ, xem lại hồ sơ đã nộp
                </button>
              )}
            </div>
          </form>
        )}
      </Khoi>

      {/* THUẾ */}
      <Khoi id="dd-thue" tieuDe="Hồ sơ thuế"
        moTa="Dành cho người nhận tiền từ nền tảng (chủ phòng trà). Khán giả mua vé không cần khai phần này."
        trangThai={daKhaiThue && duyetThue ? <NhanTrangThai sacThai={duyetThue[0]}>{duyetThue[1]}</NhanTrangThai> : daKhaiThue ? null : <NhanTrangThai sacThai="tat">Chưa khai</NhanTrangThai>}>
        {/* Câu backend soạn từ đúng mức khấu trừ sổ cái đang dùng — gồm cả trường hợp đã khai doanh nghiệp nhưng chưa
            duyệt nên vẫn bị khấu trừ. Hiện nguyên văn, không tự tính lại. */}
        {taxProfile?.explanation && <p className="max-w-[65ch] border-l-4 border-ink pl-3">{taxProfile.explanation}</p>}
        {taxProfile?.taxCodeUnreadable && (
          <p className="mt-3 border-l-4 border-danger pl-3">Mã số thuế đã lưu không còn đọc được. Hãy khai lại hồ sơ thuế.</p>
        )}

        {daKhaiThue && !moFormThue ? (
          <>
            <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2">
              <dt className="text-ink-mute">Loại hình</dt><dd>{LOAI_HINH[taxProfile.businessType] ?? taxProfile.businessType}</dd>
              <dt className="text-ink-mute">Mã số thuế</dt><dd className="font-mono">{taxProfile.taxCode || '—'}</dd>
              {taxProfile.legalName && <><dt className="text-ink-mute">Tên doanh nghiệp</dt><dd>{taxProfile.legalName}</dd></>}
            </dl>
            <button type="button" onClick={() => setMoFormThue(true)} className={`${NUT_VIEN} mt-5`}>Sửa hồ sơ thuế</button>
          </>
        ) : (
          <form onSubmit={luuThue} noValidate className="mt-5 space-y-5 max-w-md">
            <fieldset aria-describedby={loiThue.loai ? 'loi-loai-hinh' : undefined}>
              <legend className="font-semibold">Loại hình kinh doanh <span className="text-danger" aria-hidden="true">*</span><span className="sr-only"> (bắt buộc)</span></legend>
              {loiThue.loai && <p id="loi-loai-hinh" className="mt-1 text-sm font-semibold text-danger">{loiThue.loai}</p>}
              <div className="mt-2 space-y-2">
                {Object.entries(LOAI_HINH).map(([gt, nhan]) => (
                  <label key={gt} className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                    <input type="radio" name="loai-hinh" value={gt} checked={tax.businessType === gt}
                      onChange={() => { setTax((t) => ({ ...t, businessType: gt })); setLoiThue((l) => ({ ...l, loai: undefined })) }}
                      className="w-5 h-5 accent-ink" />
                    {nhan}
                  </label>
                ))}
              </div>
            </fieldset>
            <OTruong nhan="Mã số thuế" batBuoc loi={loiThue.ma} goiY="10 chữ số, hoặc 10 chữ số kèm 3 chữ số đơn vị trực thuộc (ví dụ 0123456789-001).">
              {(p) => <input {...p} value={tax.taxCode} inputMode="numeric" autoComplete="off" onChange={(e) => setTax((t) => ({ ...t, taxCode: e.target.value }))} />}
            </OTruong>
            {laDoanhNghiep && (
              <OTruong nhan="Tên doanh nghiệp" batBuoc loi={loiThue.ten} goiY="Đúng như trên giấy chứng nhận đăng ký kinh doanh.">
                {(p) => <input {...p} value={tax.legalName} autoComplete="organization" onChange={(e) => setTax((t) => ({ ...t, legalName: e.target.value }))} />}
              </OTruong>
            )}
            {loiThue.chung && <p role="alert" className="border-2 border-danger p-4 font-semibold text-danger">{loiThue.chung}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busyTax} className={NUT_DAC}>
                {busyTax && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Lưu hồ sơ thuế
              </button>
              {daKhaiThue && (
                <button type="button" onClick={() => { setMoFormThue(false); setLoiThue({}) }} className={NUT_VIEN}>Huỷ</button>
              )}
            </div>
          </form>
        )}
      </Khoi>
    </div>
  )
}

export default IdentityTab
