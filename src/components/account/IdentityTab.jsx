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
  getMyProfile, uploadImage, submitCitizenCard, getMyCitizenCardImage,
  getMyTaxProfile, submitTaxProfile, requestPhoneVerificationCode, verifyPhone,
} from '../../services/userServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

const Card = ({ title, subtitle, children }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <h3 className="text-base font-semibold text-white">{title}</h3>
    {subtitle && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{subtitle}</p>}
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
    if (!cccd.citizenCardNumber.trim() || !cccd.frontImageUrl || !cccd.backImageUrl) {
      toast.error('Cần nhập số CCCD và tải đủ ảnh hai mặt.')
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
      await load()
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
    return <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-[#C3B665]" /></div>
  }

  const daXacThucSdt = profile?.phoneVerified ?? profile?.isPhoneVerified ?? false
  const daCoCccd = profile?.citizenCardVerified ?? profile?.hasCitizenCard ?? false

  return (
    <div className="space-y-5">
      {/* ĐIỆN THOẠI */}
      <Card
        title="Số điện thoại"
        subtitle="Xác thực số điện thoại để chúng tôi liên hệ được khi có vấn đề về vé hoặc hoàn tiền."
      >
        {daXacThucSdt ? (
          <p className="text-sm text-green-400 flex items-center gap-2">
            <CheckCircle2 size={16} /> Đã xác thực {profile?.phone && `(${profile.phone})`}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Số hiện tại trong hồ sơ: <span className="text-white">{profile?.phone || 'chưa khai'}</span>
            </p>
            <p className="text-xs text-gray-600">
              Mã được gửi tới đúng số này. Muốn đổi số thì sửa ở tab Hồ sơ trước rồi quay lại đây.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={guiMa} disabled={busyPhone !== null || !profile?.phone}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
                {busyPhone === 'send' ? <Loader2 size={15} className="animate-spin" /> : <Phone size={15} />} Gửi mã xác thực
              </button>
            </div>
            <form onSubmit={xacThuc} className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Nhập mã nhận được"
                className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50" />
              <button type="submit" disabled={busyPhone !== null || !code.trim()}
                className="px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold disabled:opacity-50">
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
        {daCoCccd ? (
          <div className="space-y-3">
            <p className="text-sm text-green-400 flex items-center gap-2">
              <ShieldCheck size={16} /> Đã gửi hồ sơ định danh
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => xemAnhCccd('front')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                <ExternalLink size={13} /> Xem mặt trước
              </button>
              <button onClick={() => xemAnhCccd('back')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                <ExternalLink size={13} /> Xem mặt sau
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={guiCccd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Số CCCD <span className="text-red-400">*</span></label>
                <input value={cccd.citizenCardNumber} onChange={(e) => setCccd((p) => ({ ...p, citizenCardNumber: e.target.value }))}
                  className={inputCls} inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ngày sinh</label>
                <input type="date" value={cccd.dateOfBirth} onChange={(e) => setCccd((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[['front', 'Mặt trước', cccd.frontImageUrl], ['back', 'Mặt sau', cccd.backImageUrl]].map(([side, label, url]) => (
                <label key={side}
                  className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border border-dashed border-gray-700 text-gray-400 text-xs hover:bg-gray-800/50 cursor-pointer">
                  {uploadingSide === side
                    ? <Loader2 size={18} className="animate-spin" />
                    : url ? <CheckCircle2 size={18} className="text-green-400" /> : <Upload size={18} />}
                  {url ? `${label} — đã tải` : label}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingSide !== null}
                    onChange={(e) => taiAnh(e.target.files?.[0], side)} />
                </label>
              ))}
            </div>

            <button type="submit" disabled={busyCccd || uploadingSide !== null}
              className="w-full py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {busyCccd && <Loader2 size={16} className="animate-spin" />} Gửi hồ sơ định danh
            </button>
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
            <p className="text-sm text-gray-300">
              Loại hình: <span className="text-white">{taxProfile.businessType}</span>
            </p>
            <p className="text-sm text-gray-300">
              Mã số thuế: <span className="text-white tabular-nums">{taxProfile.taxCode}</span>
            </p>
            {taxProfile.legalName && (
              <p className="text-sm text-gray-300">Tên pháp lý: <span className="text-white">{taxProfile.legalName}</span></p>
            )}
            <button onClick={() => setMoFormThue(true)}
              className="mt-2 text-sm text-[#C3B665] hover:underline">Sửa hồ sơ thuế</button>
          </div>
        ) : (
          <>
            {!taxProfile && (
              <p className="text-xs text-gray-500 mb-4 flex items-start gap-1.5 leading-relaxed">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-yellow-400" />
                Khai phần này nếu bạn kinh doanh và cần xuất hoá đơn. Mức thuế áp dụng: GTGT 5% và TNCN 2%.
              </p>
            )}
            <form onSubmit={luuThue} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Loại hình <span className="text-red-400">*</span></label>
                <select value={tax.businessType} onChange={(e) => setTax((p) => ({ ...p, businessType: e.target.value }))} className={inputCls}>
                  <option value="">— chọn —</option>
                  <option value="HouseholdBusiness">Hộ kinh doanh</option>
                  <option value="Individual">Cá nhân kinh doanh</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Mã số thuế <span className="text-red-400">*</span></label>
                <input value={tax.taxCode} onChange={(e) => setTax((p) => ({ ...p, taxCode: e.target.value }))} className={inputCls} inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Tên pháp lý</label>
                <input value={tax.legalName} onChange={(e) => setTax((p) => ({ ...p, legalName: e.target.value }))} className={inputCls} />
                <p className="text-xs text-gray-600 mt-1">
                  Tên này cần khớp với tên chủ tài khoản ngân hàng nhận tiền.
                </p>
              </div>
              <div className="flex gap-3">
                {taxProfile && (
                  <button type="button" onClick={() => setMoFormThue(false)}
                    className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800">
                    Huỷ
                  </button>
                )}
                <button type="submit" disabled={busyTax}
                  className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
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
