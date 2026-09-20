// src/pages/owner/OwnerLoungePage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Đây là màn CHẶN ĐẦU LUỒNG của chủ phòng trà: chưa tạo phòng trà thì mọi màn Owner khác
//   (buổi diễn, doanh thu, gói dịch vụ) đều không có dữ liệu để làm việc. Trước màn này backend đã
//   có POST /lounges từ lâu nhưng FE không có đường nào gọi.
// - SAU KHI TẠO phải gọi refresh token. Claim lounge_id chỉ được đóng vào token lúc phát hành, nên
//   token đang cầm vẫn nói "chưa có phòng trà" — các màn khác sẽ tưởng chủ chưa tạo gì.
// - Ảnh đại diện và giấy phép nhận URL chứ không nhận file: tải file lên /uploads/images trước rồi
//   mới gửi URL. Riêng giấy phép kinh doanh được backend chuyển sang vùng lưu riêng tư, nên URL đó
//   KHÔNG mở trực tiếp được — muốn xem phải gọi GET và nhận về blob.
// - Không hỏi Quận/Huyện: cấp huyện đã bãi bỏ từ 01/07/2025. Trường district vẫn được gửi lại
//   nguyên giá trị cũ khi sửa, để không xoá dữ liệu của những bản ghi tạo từ trước.
// - LoungeDetailDto trả atmosphereName chứ không trả atmosphereId, nên khi sửa phải dò ngược tên
//   sang id trong danh mục. Tên không khớp thì để trống và báo người dùng chọn lại, KHÔNG âm thầm
//   gửi null (sẽ xoá mất không gian đang có).
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Store, Save, Upload, FileText, ExternalLink, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getLounges, getLoungeDetail, createLounge, updateLounge,
  setLoungeImage, setLoungeBusinessLicense, getLoungeBusinessLicense,
} from '../../services/loungeServices'
import { getAtmospheres } from '../../services/catalogServices'
import { uploadImage } from '../../services/userServices'
import { refreshSession } from '../../services/aServices'
import { useAuthStore } from '../../store/useAuthStore'

// Trạng thái hồ sơ phòng trà — đúng 6 giá trị LoungeStatus của backend.
const STATUS_VIEW = {
  Pending: { label: 'Đang chờ Admin duyệt', cls: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', icon: Clock },
  Approved: { label: 'Đã duyệt, đang hoạt động', cls: 'bg-green-500/10 border-green-500/30 text-green-400', icon: CheckCircle2 },
  Warned: { label: 'Đang bị cảnh cáo — vẫn hoạt động bình thường', cls: 'bg-orange-500/10 border-orange-500/30 text-orange-400', icon: AlertTriangle },
  Suspended: { label: 'Bị tạm đình chỉ — không mở bán vé được', cls: 'bg-red-500/10 border-red-500/30 text-red-400', icon: AlertTriangle },
  Locked: { label: 'Bị khoá', cls: 'bg-red-500/10 border-red-500/30 text-red-400', icon: AlertTriangle },
  Rejected: { label: 'Hồ sơ bị từ chối', cls: 'bg-red-500/10 border-red-500/30 text-red-400', icon: AlertTriangle },
}

const emptyForm = {
  name: '', description: '', atmosphereId: '',
  street: '', ward: '', city: '', latitude: '', longitude: '',
}

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="text-xs text-gray-500">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
  </div>
)

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

const OwnerLoungePage = () => {
  const login = useAuthStore((st) => st.login)

  const [lounge, setLounge] = useState(null)       // null = chưa có phòng trà nào
  const [atmospheres, setAtmospheres] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [districtGiuLai, setDistrictGiuLai] = useState(null) // không hiển thị, chỉ gửi lại
  const [atmosphereKhongDoiDuoc, setAtmosphereKhongDoiDuoc] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(null) // 'image' | 'license' | null

  const isEdit = !!lounge
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [dsRes, khongGianRes] = await Promise.allSettled([
        getLounges({ mine: true }),
        getAtmospheres(),
      ])
      const dsKhongGian = khongGianRes.status === 'fulfilled' && khongGianRes.value?.success
        ? khongGianRes.value.data : []
      setAtmospheres(dsKhongGian)

      const ds = dsRes.status === 'fulfilled' && dsRes.value?.success ? dsRes.value.data : null
      const items = Array.isArray(ds) ? ds : ds?.items
      const cuaToi = items?.[0]
      if (!cuaToi) {
        setLounge(null)
        setForm(emptyForm)
        return
      }

      // Danh sách không có đủ trường để đổ vào form (thiếu street/ward/description...) — lấy bản chi tiết.
      const chiTiet = await getLoungeDetail(cuaToi.id)
      if (!chiTiet.success) return
      const d = chiTiet.data
      setLounge(d)
      setDistrictGiuLai(d.district || null)

      const khop = dsKhongGian.find((a) => a.name === d.atmosphereName)
      setAtmosphereKhongDoiDuoc(!!d.atmosphereName && !khop)
      setForm({
        name: d.name ?? '',
        description: d.description ?? '',
        atmosphereId: khop ? String(khop.id) : '',
        street: d.street ?? '',
        ward: d.ward ?? '',
        city: d.city ?? '',
        latitude: d.latitude ?? '',
        longitude: d.longitude ?? '',
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được hồ sơ phòng trà.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.street.trim() || !form.ward.trim() || !form.city.trim()) {
      toast.error('Cần điền tên phòng trà, số nhà/đường, phường và tỉnh/thành phố.')
      return
    }
    const soHoacNull = (v) => (v === '' || v === null ? null : Number(v))
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      atmosphereId: form.atmosphereId === '' ? null : Number(form.atmosphereId),
      street: form.street.trim(),
      ward: form.ward.trim(),
      district: districtGiuLai,
      city: form.city.trim(),
      latitude: soHoacNull(form.latitude),
      longitude: soHoacNull(form.longitude),
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await updateLounge(lounge.id, { loungeId: lounge.id, ...payload })
        toast.success('Đã lưu hồ sơ phòng trà.')
      } else {
        await createLounge(payload)
        toast.success('Đã tạo phòng trà. Hồ sơ đang chờ Admin duyệt.')
        // Token hiện tại chưa có claim lounge_id — xin token mới, nếu không các màn Owner khác
        // vẫn tưởng chủ chưa có phòng trà. Hỏng bước này thì báo rõ thay vì để người dùng tự đoán.
        const { refreshToken } = useAuthStore.getState()
        if (refreshToken) {
          try {
            const res = await refreshSession(refreshToken)
            if (res.success) login(res.data)
          } catch {
            toast('Tạo xong rồi, nhưng cần đăng nhập lại để dùng các màn quản lý khác.', { icon: '⚠️' })
          }
        }
      }
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được hồ sơ.')
    } finally {
      setIsSaving(false)
    }
  }

  // Ảnh đại diện và giấy phép đi chung một đường: tải file lên lấy URL, rồi gắn URL vào phòng trà.
  const handleUpload = async (file, loai) => {
    if (!file || !lounge) return
    setIsUploading(loai)
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      const url = up.data?.url ?? up.data
      if (loai === 'image') {
        await setLoungeImage(lounge.id, url)
        toast.success('Đã cập nhật ảnh đại diện.')
      } else {
        await setLoungeBusinessLicense(lounge.id, url)
        toast.success('Đã cập nhật giấy phép kinh doanh.')
      }
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải tệp lên không thành công.')
    } finally {
      setIsUploading(null)
    }
  }

  const handleXemGiayPhep = async () => {
    try {
      const blob = await getLoungeBusinessLicense(lounge.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener')
      // Thu hồi muộn một nhịp: thu hồi ngay thì tab vừa mở chưa kịp đọc xong.
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không mở được giấy phép.')
    }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  const trangThai = lounge ? STATUS_VIEW[lounge.status] : null

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Hồ sơ phòng trà</h1>
        <p className="text-gray-400 text-sm">
          {isEdit
            ? 'Thông tin hiển thị cho khán giả và dùng cho mọi buổi diễn của bạn.'
            : 'Tạo phòng trà trước đã — các mục Buổi diễn, Báo cáo doanh thu và Gói dịch vụ chỉ hoạt động khi bạn có phòng trà.'}
        </p>
      </div>

      {trangThai && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${trangThai.cls}`}>
          <trangThai.icon size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{trangThai.label}</p>
            {lounge.status === 'Pending' && (
              <p className="text-xs opacity-80 mt-0.5">
                Trong lúc chờ duyệt, phòng trà chưa hiện trong danh sách công khai và chưa mở bán vé được.
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <Field label="Tên phòng trà" required>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} maxLength={255} />
        </Field>

        <Field label="Giới thiệu">
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        </Field>

        <Field label="Không gian" hint={atmosphereKhongDoiDuoc
          ? `Không gian hiện tại ("${lounge.atmosphereName}") không còn trong danh mục — hãy chọn lại, để trống thì sẽ bị xoá khi lưu.`
          : undefined}>
          <select value={form.atmosphereId} onChange={(e) => set('atmosphereId', e.target.value)} className={inputCls}>
            <option value="">— không chọn —</option>
            {atmospheres.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Số nhà, đường" required>
            <input value={form.street} onChange={(e) => set('street', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Phường / xã" required>
            <input value={form.ward} onChange={(e) => set('ward', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Tỉnh / thành phố" required>
          <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vĩ độ" hint="Không bắt buộc. Có toạ độ thì khán giả xem được vị trí trên bản đồ.">
            <input type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Kinh độ">
            <input type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <button type="submit" disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f] transition-colors disabled:opacity-50">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : isEdit ? <Save size={16} /> : <Store size={16} />}
          {isSaving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo phòng trà'}
        </button>
      </form>

      {/* Tệp đính kèm chỉ gắn được khi phòng trà đã tồn tại — chúng cần id. */}
      {isEdit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-white">Ảnh đại diện</h3>
            <p className="text-xs text-gray-500 mt-0.5">Ảnh khán giả nhìn thấy đầu tiên.</p>
            {lounge.primaryImageUrl && (
              <img src={lounge.primaryImageUrl} alt="" className="mt-3 w-full h-36 object-cover rounded-lg border border-gray-800" />
            )}
            <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 cursor-pointer">
              {isUploading === 'image' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {lounge.primaryImageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
              <input type="file" accept="image/*" className="hidden" disabled={isUploading !== null}
                onChange={(e) => handleUpload(e.target.files?.[0], 'image')} />
            </label>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-white">Giấy phép kinh doanh</h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Chỉ bạn và Admin xem được. Tệp nằm ở vùng lưu riêng tư, không ai đoán đường dẫn mà tải về được.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 cursor-pointer">
                {isUploading === 'license' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Tải giấy phép lên
                <input type="file" accept="image/*,.pdf" className="hidden" disabled={isUploading !== null}
                  onChange={(e) => handleUpload(e.target.files?.[0], 'license')} />
              </label>
              <button type="button" onClick={handleXemGiayPhep}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800">
                <ExternalLink size={16} /> Xem giấy phép
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OwnerLoungePage
