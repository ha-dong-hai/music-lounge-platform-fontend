// src/components/account/IdentityTab.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Ba việc gom chung một tab vì cùng phục vụ một mục đích: chứng minh bạn là ai trước khi nhận tiền.
//   Xác thực số điện thoại · Định danh CCCD · Hồ sơ thuế.
// - Ảnh CCCD: tải lên /uploads/images trước, rồi gửi URL. Backend chuyển ảnh sang vùng lưu RIÊNG TƯ
//   ngay khi nhận, nên URL đó KHÔNG mở trực tiếp được — muốn xem lại phải gọi GET và nhận blob.
// - Hồ sơ thuế CHỈ dành cho hộ/cá nhân kinh doanh (GTGT 5% + TNCN 2%). Người dùng thường không cần
//   khai, nên phần này để trong khối riêng có giải thích, không bắt buộc ai cũng điền.
// - Mã xác thực gửi tới SỐ ĐANG KHAI trong hồ sơ. Muốn đổi số thì sửa hồ sơ trước rồi mới gửi mã.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ShieldCheck, Upload, Phone, CheckCircle2, FileText, ExternalLink, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getMyProfile, uploadImage, submitCitizenCard, getMyCitizenCardImage, getMyCitizenCard,
  getMyTaxProfile, submitTaxProfile, requestPhoneVerificationCode, verifyPhone,
} from '../../services/userServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

const Card = ({ title, subtitle, children }) => (
  <div className="bg-card border border-line rounded-xl p-6">
    <h3 className="text-base font-semibold text-ink">{title}</h3>
    {subtitle && <p className="text-xs text-ink-mute mt-1 leading-relaxed">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </div>
)

const IdentityTab = () => {
  const [profile, setProfile] = useState(null)
  const [taxProfile, setTaxProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Điện thoại
  const [code, setCode] = useState('')
  const [busyPhone, setBusyPhone] = useState(null)

  // CCCD
  const [cccd, setCccd] = useState({ citizenCardNumber: '', frontImageUrl: '', backImageUrl: '', dateOfBirth: '' })
  const [uploadingSide, setUploadingSide] = useState(null)
  const [busyCccd, setBusyCccd] = useState(false)

  // LỖI ĐÃ SỬA — "gửi xong không thấy lưu, và không có cách xem lại ảnh đã đăng".
  //
  // Hai triệu chứng chỉ do MỘT nguyên nhân. Bản trước xác định đã nộp hay chưa bằng
  // `profile?.citizenCardVerified ?? profile?.hasCitizenCard` — HAI TÊN TRƯỜNG KHÔNG CÓ THẬT.
  // `UserProfileDto` (Application/Users/DTOs/UserProfileDto.cs) chỉ trả Id, FullName, Email, Phone,
  // PhoneVerified, AvatarUrl, AiConsent và bốn danh sách sở thích — KHÔNG có trường CCCD nào.
  // Nên cờ đó LUÔN false: gửi xong, tải lại hồ sơ, giao diện vẫn vẽ form rỗng như chưa từng gửi
  // (trông y hệt mất dữ liệu — nhưng dữ liệu ĐÃ lưu), và hai nút xem ảnh vốn nằm trong đúng nhánh
  // không bao giờ chạy tới nên chưa từng hiện ra.
  //
  // Backend KHÔNG có đường nào đọc trạng thái CCCD (đã tìm cả Users/Queries: chỉ có
  // GetMyCitizenCardImage và GetCitizenCardImage, không query nào trả tình trạng). Thứ duy nhất
  // đọc được là CHÍNH TẤM ẢNH — nên dùng nó làm bằng chứng: lấy được ảnh mặt trước nghĩa là đã nộp
  // (GetMyCitizenCardImageQueryHandler:36 ném NotFound khi chưa có).
  //
  // CẬP NHẬT 30/09: backend đã có GET /me/citizen-card (trạng thái duyệt + lý do từ chối + số che). Màn
  // này đọc nó để phân biệt "chờ duyệt / đã duyệt / bị từ chối". Máy chủ nào chưa triển khai endpoint
  // đó (404) thì vẫn rơi về cách dò bằng ảnh bên dưới — nên cờ `daNopCccd` vẫn giữ.
  //
  // null = đang dò · true/false = kết luận.
  const [daNopCccd, setDaNopCccd] = useState(null)
  const [trangThaiCccd, setTrangThaiCccd] = useState(null) // CitizenCardStatusDto, null = chưa đọc được
  const [anhCccd, setAnhCccd] = useState({ front: null, back: null })
  const [nopLai, setNopLai] = useState(false)

  // Thuế
  const [tax, setTax] = useState({ businessType: '', taxCode: '', legalName: '' })
  const [busyTax, setBusyTax] = useState(false)
  const [moFormThue, setMoFormThue] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pRes, tRes] = await Promise.allSettled([getMyProfile(), getMyTaxProfile()])
      if (pRes.status === 'fulfilled' && pRes.value?.success) setProfile(pRes.value.data)
      // Chưa khai thuế thì backend trả 404 — đó là trạng thái bình thường, không phải lỗi.
      if (tRes.status === 'fulfilled' && tRes.value?.success) {
        setTaxProfile(tRes.value.data)
        setTax({
          businessType: tRes.value.data?.businessType ?? '',
          taxCode: tRes.value.data?.taxCode ?? '',
          legalName: tRes.value.data?.legalName ?? '',
        })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được hồ sơ.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // Tải ảnh CCCD đã nộp về để (a) biết là đã nộp hay chưa, (b) hiện ngay tại chỗ cho người dùng
  // đối chiếu xem có chụp nhầm, chụp mờ, chụp ngược mặt không — trước khi Admin duyệt.
  const taiAnhDaNop = useCallback(async () => {
    const [truoc, sau, tt] = await Promise.allSettled([
      getMyCitizenCardImage('front'),
      getMyCitizenCardImage('back'),
      getMyCitizenCard(),
    ])
    setTrangThaiCccd(tt.status === 'fulfilled' && tt.value?.success ? tt.value.data : null)
    const thanhUrl = (kq) => {
      if (kq.status !== 'fulfilled' || !kq.value) return null
      // Service đặt responseType 'blob' nên interceptor trả thẳng Blob, không bóc `.data`.
      const blob = kq.value instanceof Blob ? kq.value : kq.value?.data
      return blob instanceof Blob ? URL.createObjectURL(blob) : null
    }
    const urlTruoc = thanhUrl(truoc)
    const urlSau = thanhUrl(sau)
    // Mặt trước là căn cứ: chưa nộp thì backend ném NotFound cho cả hai mặt.
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
      toast.error(err.response?.data?.message || 'Không gửi được mã.')
    } finally { setBusyPhone(null) }
  }

  const xacThuc = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusyPhone('verify')
    try {
      await verifyPhone(code.trim())
      toast.success('Đã xác thực số điện thoại.')
      setCode('')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã không đúng hoặc đã hết hạn.')
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
      toast.success(`Đã tải ảnh mặt ${side === 'front' ? 'trước' : 'sau'}.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được ảnh.')
    } finally { setUploadingSide(null) }
  }

  const guiCccd = async (e) => {
    e.preventDefault()
    // Ngày sinh là BẮT BUỘC ở backend (SubmitCitizenCardCommandValidator: "Vui lòng nhập ngày sinh như
    // trên CCCD/CMND."). Bản trước để ô này như tuỳ chọn và gửi null, nên mọi lần nộp đều bị từ chối
    // với câu chung "Dữ liệu gửi lên không hợp lệ" — chủ phòng trà không nộp được hồ sơ định danh, tức
    // là không bao giờ bán được (đo 30/09).
    if (!cccd.citizenCardNumber.trim() || !cccd.dateOfBirth || !cccd.frontImageUrl || !cccd.backImageUrl) {
      toast.error('Cần nhập số CCCD, ngày sinh và tải đủ ảnh hai mặt.')
      return
    }
    setBusyCccd(true)
    try {
      await submitCitizenCard({
        citizenCardNumber: cccd.citizenCardNumber.trim(),
        frontImageUrl: cccd.frontImageUrl,
        backImageUrl: cccd.backImageUrl,
        dateOfBirth: cccd.dateOfBirth || null,
      })
      toast.success('Đã gửi hồ sơ định danh. Admin sẽ duyệt.')
      setCccd({ citizenCardNumber: '', frontImageUrl: '', backImageUrl: '', dateOfBirth: '' })
      setNopLai(false)
      // Tải lại ẢNH ĐÃ NỘP, không chỉ `load()`. Đây chính là chỗ bản trước hụt: `load()` chỉ lấy
      // UserProfileDto — thứ không chứa thông tin CCCD nào — nên sau khi gửi, màn hình quay về
      // đúng form rỗng ban đầu và người dùng tưởng dữ liệu không được lưu.
      await Promise.all([load(), taiAnhDaNop()])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được hồ sơ định danh.')
    } finally { setBusyCccd(false) }
  }

  const xemAnhCccd = async (side) => {
    try {
      const blob = await getMyCitizenCardImage(side)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không mở được ảnh.')
    }
  }

  const luuThue = async (e) => {
    e.preventDefault()
    if (!tax.businessType.trim() || !tax.taxCode.trim()) {
      toast.error('Cần chọn loại hình và nhập mã số thuế.')
      return
    }
    setBusyTax(true)
    try {
      await submitTaxProfile({
        businessType: tax.businessType.trim(),
        taxCode: tax.taxCode.trim(),
        legalName: tax.legalName.trim() || null,
      })
      toast.success('Đã lưu hồ sơ thuế.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được hồ sơ thuế.')
    } finally { setBusyTax(false) }
  }

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-brand-text" /></div>
  }

  const daXacThucSdt = profile?.phoneVerified ?? profile?.isPhoneVerified ?? false
  // `daCoCccd` cũ đã bỏ: nó đọc hai tên trường không tồn tại trong UserProfileDto nên luôn false.
  // Trạng thái nộp hồ sơ nay lấy từ `daNopCccd` — xem khối giải thích ở phần khai báo state.

  return (
    <div className="space-y-5">
      {/* ĐIỆN THOẠI */}
      <Card
        title="Số điện thoại"
        subtitle="Xác thực số điện thoại để chúng tôi liên hệ được khi có vấn đề về vé hoặc hoàn tiền."
      >
        {daXacThucSdt ? (
          <p className="text-sm text-success flex items-center gap-2">
            <CheckCircle2 size={16} /> Đã xác thực {profile?.phone && `(${profile.phone})`}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">
              Số hiện tại trong hồ sơ: <span className="text-ink">{profile?.phone || 'chưa khai'}</span>
            </p>
            <p className="text-xs text-ink-mute">
              Mã được gửi tới đúng số này. Muốn đổi số thì sửa ở tab Hồ sơ trước rồi quay lại đây.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={guiMa} disabled={busyPhone !== null || !profile?.phone}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken disabled:opacity-50">
                {busyPhone === 'send' ? <Loader2 size={15} className="animate-spin" /> : <Phone size={15} />} Gửi mã xác thực
              </button>
            </div>
            <form onSubmit={xacThuc} className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Nhập mã nhận được"
                className="flex-1 px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50" />
              <button type="submit" disabled={busyPhone !== null || !code.trim()}
                className="px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold disabled:opacity-50">
                {busyPhone === 'verify' ? <Loader2 size={15} className="animate-spin" /> : 'Xác thực'}
              </button>
            </form>
          </div>
        )}
      </Card>

      {/* CCCD */}
      <Card
        title="Định danh cá nhân (CCCD)"
        subtitle="Cần thiết khi bạn nhận tiền từ nền tảng. Ảnh được lưu ở vùng riêng tư, chỉ bạn và Admin xem được."
      >
        {daNopCccd === null ? (
          <div className="py-6 flex items-center justify-center gap-2 text-sm text-ink-mute">
            <Loader2 size={16} className="animate-spin" /> Đang kiểm tra hồ sơ đã nộp…
          </div>
        ) : daNopCccd && !nopLai ? (
          <div className="space-y-4">
            {trangThaiCccd?.reviewStatus === 'Approved' ? (
              <p className="text-sm text-success flex items-center gap-2">
                <ShieldCheck size={16} /> Đã xác minh danh tính{trangThaiCccd.numberMasked && ` · ${trangThaiCccd.numberMasked}`}
              </p>
            ) : trangThaiCccd?.reviewStatus === 'Rejected' ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <p className="text-sm text-danger flex items-center gap-2"><AlertTriangle size={16} /> Hồ sơ bị từ chối</p>
                {trangThaiCccd.reviewNote && <p className="text-xs text-ink-soft mt-1">Lý do: {trangThaiCccd.reviewNote}</p>}
                <p className="text-xs text-ink-mute mt-1">Sửa theo lý do trên rồi bấm "Nộp lại hồ sơ".</p>
              </div>
            ) : trangThaiCccd?.reviewStatus === 'Pending' ? (
              <p className="text-sm text-warning flex items-center gap-2">
                <ShieldCheck size={16} /> Đã gửi — đang chờ Admin xác minh
              </p>
            ) : (
              <p className="text-sm text-success flex items-center gap-2">
                <ShieldCheck size={16} /> Đã gửi hồ sơ định danh
              </p>
            )}
            {trangThaiCccd?.explanation && trangThaiCccd.reviewStatus !== 'Rejected' && (
              <p className="text-xs text-ink-mute">{trangThaiCccd.explanation}</p>
            )}

            {/* Hiện ảnh NGAY TẠI CHỖ. Trước đây chỉ có nút mở tab mới, nghĩa là muốn kiểm tra mình
                chụp có mờ, có ngược mặt, có nhầm giấy tờ không thì phải rời trang. Giấy tờ tuỳ thân
                đã gửi đi là thứ người ta cần soát lại ngay, không phải mở ra ở chỗ khác. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['front', 'Mặt trước', anhCccd.front], ['back', 'Mặt sau', anhCccd.back]].map(([side, label, url]) => (
                <figure key={side} className="rounded-lg border border-line overflow-hidden bg-sunken/40">
                  {url ? (
                    <img src={url} alt={`Ảnh CCCD ${label.toLowerCase()} bạn đã nộp`}
                      className="w-full aspect-[8/5] object-cover" />
                  ) : (
                    <div className="w-full aspect-[8/5] flex items-center justify-center text-xs text-ink-mute px-3 text-center">
                      Không tải được ảnh {label.toLowerCase()}
                    </div>
                  )}
                  <figcaption className="flex items-center justify-between gap-2 px-3 py-2 border-t border-line">
                    <span className="text-xs text-ink-soft">{label}</span>
                    {url && (
                      <button onClick={() => xemAnhCccd(side)}
                        className="inline-flex items-center gap-1 min-h-[44px] -my-2 px-1 text-xs font-medium text-brand-text hover:underline">
                        <ExternalLink size={12} /> Xem cỡ lớn
                      </button>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-line bg-sunken/40 p-3">
              <AlertTriangle size={15} className="text-ink-mute flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink-soft leading-relaxed">
                Ảnh bị mờ, chụp thiếu góc hay nhầm mặt thì Admin sẽ từ chối. Bạn nộp lại được bất cứ
                lúc nào — hồ sơ sẽ quay về trạng thái chờ duyệt.
              </p>
            </div>

            <button onClick={() => setNopLai(true)}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken transition-colors">
              <Upload size={14} /> Nộp lại hồ sơ
            </button>
          </div>
        ) : (
          <form onSubmit={guiCccd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-mute">Số CCCD <span className="text-danger">*</span></label>
                <input value={cccd.citizenCardNumber} onChange={(e) => setCccd((p) => ({ ...p, citizenCardNumber: e.target.value }))}
                  className={inputCls} inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-ink-mute">Ngày sinh (như trên CCCD) <span className="text-danger">*</span></label>
                <input type="date" value={cccd.dateOfBirth} onChange={(e) => setCccd((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[['front', 'Mặt trước', cccd.frontImageUrl], ['back', 'Mặt sau', cccd.backImageUrl]].map(([side, label, url]) => (
                <label key={side}
                  className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border border-dashed border-line text-ink-soft text-xs hover:bg-sunken/50 cursor-pointer">
                  {uploadingSide === side
                    ? <Loader2 size={18} className="animate-spin" />
                    : url ? <CheckCircle2 size={18} className="text-success" /> : <Upload size={18} />}
                  {url ? `${label} — đã tải` : label}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingSide !== null}
                    onChange={(e) => taiAnh(e.target.files?.[0], side)} />
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busyCccd || uploadingSide !== null}
                className="flex-1 min-w-[200px] py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {busyCccd && <Loader2 size={16} className="animate-spin" />}
                {nopLai ? 'Gửi lại hồ sơ định danh' : 'Gửi hồ sơ định danh'}
              </button>
              {/* Chỉ hiện khi đang NỘP LẠI: người đã có hồ sơ cần đường lùi, nếu không thì mở form
                  ra rồi là kẹt, phải tải lại trang mới xem lại được ảnh cũ. */}
              {nopLai && (
                <button type="button" onClick={() => setNopLai(false)} disabled={busyCccd}
                  className="min-h-[44px] px-4 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken disabled:opacity-50 transition-colors">
                  Huỷ, xem lại hồ sơ đã nộp
                </button>
              )}
            </div>
          </form>
        )}
      </Card>

      {/* THUẾ */}
      <Card
        title="Hồ sơ thuế"
        subtitle="Chỉ dành cho hộ kinh doanh và cá nhân kinh doanh. Người dùng thường không cần khai phần này."
      >
        {taxProfile && !moFormThue ? (
          <div className="space-y-2">
            <p className="text-sm text-ink-soft">
              Loại hình: <span className="text-ink">{taxProfile.businessType}</span>
            </p>
            <p className="text-sm text-ink-soft">
              Mã số thuế: <span className="text-ink tabular-nums">{taxProfile.taxCode}</span>
            </p>
            {taxProfile.legalName && (
              <p className="text-sm text-ink-soft">Tên pháp lý: <span className="text-ink">{taxProfile.legalName}</span></p>
            )}
            <button onClick={() => setMoFormThue(true)}
              className="mt-2 text-sm text-brand-text hover:underline">Sửa hồ sơ thuế</button>
          </div>
        ) : (
          <>
            {!taxProfile && (
              <p className="text-xs text-ink-mute mb-4 flex items-start gap-1.5 leading-relaxed">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-warning" />
                Khai phần này nếu bạn kinh doanh và cần xuất hoá đơn. Mức thuế áp dụng: GTGT 5% và TNCN 2%.
              </p>
            )}
            <form onSubmit={luuThue} className="space-y-4">
              <div>
                <label className="text-xs text-ink-mute">Loại hình <span className="text-danger">*</span></label>
                <select value={tax.businessType} onChange={(e) => setTax((p) => ({ ...p, businessType: e.target.value }))} className={inputCls}>
                  <option value="">— chọn —</option>
                  <option value="HouseholdBusiness">Hộ kinh doanh</option>
                  <option value="Individual">Cá nhân kinh doanh</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-mute">Mã số thuế <span className="text-danger">*</span></label>
                <input value={tax.taxCode} onChange={(e) => setTax((p) => ({ ...p, taxCode: e.target.value }))} className={inputCls} inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-ink-mute">Tên pháp lý</label>
                <input value={tax.legalName} onChange={(e) => setTax((p) => ({ ...p, legalName: e.target.value }))} className={inputCls} />
                <p className="text-xs text-ink-mute mt-1">
                  Tên này cần khớp với tên chủ tài khoản ngân hàng nhận tiền.
                </p>
              </div>
              <div className="flex gap-3">
                {taxProfile && (
                  <button type="button" onClick={() => setMoFormThue(false)}
                    className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken">
                    Huỷ
                  </button>
                )}
                <button type="submit" disabled={busyTax}
                  className="flex-1 py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {busyTax ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Lưu hồ sơ thuế
                </button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}

export default IdentityTab
