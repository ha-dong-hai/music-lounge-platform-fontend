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
// - XOÁ PHÒNG TRÀ: backend chặn (409) nếu còn BẤT KỲ buổi diễn nào, kể cả đã kết thúc hoặc đã huỷ.
//   Nghĩa là phòng trà đã từng hoạt động thì thực tế không xoá được — và đó là hành vi đúng, vì xoá
//   đi là mất lịch sử show. Nút xoá vì vậy nói trước điều kiện này chứ không để chủ bấm rồi mới
//   nhận lỗi. Xoá xong thì claim lounge_id trong token thành sai, nên phải refresh token như lúc tạo.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Store, Save, Upload, FileText, ExternalLink, AlertTriangle, CheckCircle2, Clock, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getLounges, getLoungeDetail, createLounge, updateLounge,
  setLoungeImage, setLoungeBusinessLicense, getLoungeBusinessLicense,
  addGalleryImage, removeGalleryImage, reorderGalleryImages, deleteLounge,
} from '../../services/loungeServices'
import { getAtmospheres } from '../../services/catalogServices'
import { uploadImage } from '../../services/userServices'
import { refreshSession } from '../../services/aServices'
import { useAuthStore } from '../../store/useAuthStore'
import CustomCriteriaSection from '../../components/owner/CustomCriteriaSection'
import ConfirmModal from '../../components/shared/ConfirmModal'

// Trạng thái hồ sơ phòng trà — đúng 6 giá trị LoungeStatus của backend.
const STATUS_VIEW = {
  Pending: { label: 'Đang chờ Admin duyệt', cls: 'bg-yellow-500/10 border-yellow-500/30 text-warning', icon: Clock },
  Approved: { label: 'Đã duyệt, đang hoạt động', cls: 'bg-green-500/10 border-green-500/30 text-success', icon: CheckCircle2 },
  Warned: { label: 'Đang bị cảnh cáo — vẫn hoạt động bình thường', cls: 'bg-orange-500/10 border-orange-500/30 text-orange-700', icon: AlertTriangle },
  Suspended: { label: 'Bị tạm đình chỉ — không mở bán vé được', cls: 'bg-red-500/10 border-red-500/30 text-danger', icon: AlertTriangle },
  Locked: { label: 'Bị khoá', cls: 'bg-red-500/10 border-red-500/30 text-danger', icon: AlertTriangle },
  Rejected: { label: 'Hồ sơ bị từ chối', cls: 'bg-red-500/10 border-red-500/30 text-danger', icon: AlertTriangle },
}

const emptyForm = {
  name: '', description: '', atmosphereId: '',
  street: '', ward: '', city: '', latitude: '', longitude: '',
}

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="text-xs text-ink-mute">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-ink-mute mt-1">{hint}</p>}
  </div>
)

const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

const OwnerLoungePage = () => {
  const login = useAuthStore((st) => st.login)

  const [lounge, setLounge] = useState(null)       // null = chưa có phòng trà nào
  const [moXoa, setMoXoa] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  // XOÁ PHÒNG TRÀ — 409 là trường hợp THƯỜNG GẶP, không phải lỗi hệ thống: còn buổi diễn là không
  // xoá được. Hiện nguyên văn message của backend vì nó nói rõ đang vướng cái gì.
  const handleXoa = async () => {
    setIsDeleting(true)
    try {
      await deleteLounge(lounge.id)
      toast.success('Đã xoá phòng trà.')
      setMoXoa(false)
      // Token vẫn đang mang claim lounge_id của phòng trà vừa xoá — xin token mới, nếu không các
      // màn Owner khác sẽ gọi API với id không còn tồn tại.
      const { refreshToken } = useAuthStore.getState()
      if (refreshToken) {
        try {
          const res = await refreshSession(refreshToken)
          if (res.success) login(res.data)
        } catch {
          toast('Đã xoá, nhưng cần đăng nhập lại để các màn quản lý cập nhật.', { icon: '⚠️' })
        }
      }
      setLounge(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xoá được phòng trà.', { duration: 6000 })
    } finally {
      setIsDeleting(false)
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

  // Thu vien anh: them tung anh, xoa tung anh, va doi thu tu bang cach GUI LAI TOAN BO danh sach id
  // theo thu tu mong muon (backend khong nhan "doi cho hai anh").
  const handleThemAnhThuVien = async (file) => {
    if (!file || !lounge) return
    setIsUploading('gallery')
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      await addGalleryImage(lounge.id, { imageUrl: up.data?.url ?? up.data })
      toast.success('Đã thêm ảnh vào thư viện.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thêm được ảnh.')
    } finally {
      setIsUploading(null)
    }
  }

  const handleXoaAnhThuVien = async (imageId) => {
    setIsUploading('gallery')
    try {
      await removeGalleryImage(lounge.id, imageId)
      toast.success('Đã xoá ảnh.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xoá được ảnh.')
    } finally {
      setIsUploading(null)
    }
  }

  const handleDoiThuTu = async (imageId, huong) => {
    const ds = [...(lounge.galleryImages ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
    const i = ds.findIndex((x) => x.id === imageId)
    const j = i + huong
    if (i < 0 || j < 0 || j >= ds.length) return
    ;[ds[i], ds[j]] = [ds[j], ds[i]]
    setIsUploading('gallery')
    try {
      await reorderGalleryImages(lounge.id, ds.map((x) => x.id))
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được thứ tự.')
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
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  const trangThai = lounge ? STATUS_VIEW[lounge.status] : null

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">Hồ sơ phòng trà</h1>
        <p className="text-ink-soft text-sm">
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

      <form onSubmit={handleSubmit} className="bg-card border border-line rounded-xl p-6 space-y-4">
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
          className="flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand rounded-lg font-bold hover:bg-brand-hover transition-colors disabled:opacity-50">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : isEdit ? <Save size={16} /> : <Store size={16} />}
          {isSaving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo phòng trà'}
        </button>
      </form>

      {/* Tệp đính kèm chỉ gắn được khi phòng trà đã tồn tại — chúng cần id. */}
      {isEdit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-line rounded-xl p-6">
            <h3 className="text-base font-semibold text-ink">Ảnh đại diện</h3>
            <p className="text-xs text-ink-mute mt-0.5">Ảnh khán giả nhìn thấy đầu tiên.</p>
            {lounge.primaryImageUrl && (
              <img src={lounge.primaryImageUrl} alt="" className="mt-3 w-full h-36 object-cover rounded-lg border border-line" />
            )}
            <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-medium hover:bg-sunken cursor-pointer">
              {isUploading === 'image' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {lounge.primaryImageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
              <input type="file" accept="image/*" className="hidden" disabled={isUploading !== null}
                onChange={(e) => handleUpload(e.target.files?.[0], 'image')} />
            </label>
          </div>

          <div className="bg-card border border-line rounded-xl p-6">
            <h3 className="text-base font-semibold text-ink">Giấy phép kinh doanh</h3>
            <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">
              Chỉ bạn và Admin xem được. Tệp nằm ở vùng lưu riêng tư, không ai đoán đường dẫn mà tải về được.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-medium hover:bg-sunken cursor-pointer">
                {isUploading === 'license' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Tải giấy phép lên
                <input type="file" accept="image/*,.pdf" className="hidden" disabled={isUploading !== null}
                  onChange={(e) => handleUpload(e.target.files?.[0], 'license')} />
              </label>
              <button type="button" onClick={handleXemGiayPhep}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-medium hover:bg-sunken">
                <ExternalLink size={16} /> Xem giấy phép
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THƯ VIỆN ẢNH — thứ tự quyết định ảnh nào khán giả thấy trước. Đổi thứ tự là gửi lại
          TOÀN BỘ danh sách id, backend không nhận lệnh "đổi chỗ hai ảnh". */}
      {isEdit && (
        <div className="bg-card border border-line rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-ink">Thư viện ảnh</h3>
              <p className="text-xs text-ink-mute mt-0.5">Ảnh không gian phòng trà. Thứ tự bên dưới là thứ tự khán giả xem.</p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-medium hover:bg-sunken cursor-pointer flex-shrink-0">
              {isUploading === 'gallery' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Thêm ảnh
              <input type="file" accept="image/*" className="hidden" disabled={isUploading !== null}
                onChange={(e) => handleThemAnhThuVien(e.target.files?.[0])} />
            </label>
          </div>

          {(lounge.galleryImages?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-ink-mute">Chưa có ảnh nào trong thư viện.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...lounge.galleryImages].sort((a, b) => a.orderIndex - b.orderIndex).map((img, i, arr) => (
                <li key={img.id} className="relative group">
                  <img src={img.imageUrl} alt={img.caption ?? ''} className="w-full h-28 object-cover rounded-lg border border-line" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-between items-center gap-1 p-1.5 bg-espresso/70 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <button onClick={() => handleDoiThuTu(img.id, -1)} disabled={i === 0 || isUploading !== null}
                        className="p-1 rounded text-ink-soft hover:text-ink disabled:opacity-30" title="Lùi lên trước">
                        <ArrowLeft size={13} />
                      </button>
                      <button onClick={() => handleDoiThuTu(img.id, 1)} disabled={i === arr.length - 1 || isUploading !== null}
                        className="p-1 rounded text-ink-soft hover:text-ink disabled:opacity-30" title="Đẩy xuống sau">
                        <ArrowRight size={13} />
                      </button>
                    </div>
                    <button onClick={() => handleXoaAnhThuVien(img.id)} disabled={isUploading !== null}
                      className="p-1 rounded text-danger hover:text-danger disabled:opacity-30" title="Xoá ảnh">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isEdit && <CustomCriteriaSection loungeId={lounge.id} />}

      {/* VÙNG NGUY HIỂM — đặt cuối trang, tách khỏi mọi nút lưu, để không ai bấm nhầm khi đang sửa */}
      {isEdit && (
        <div className="bg-card border border-red-500/30 rounded-xl p-6">
          <h3 className="text-base font-semibold text-danger flex items-center gap-2">
            <AlertTriangle size={17} /> Xoá phòng trà
          </h3>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            Chỉ xoá được khi phòng trà <strong className="text-ink-soft">chưa từng có buổi diễn nào</strong> —
            kể cả buổi đã kết thúc hoặc đã huỷ cũng chặn, vì xoá đi là mất lịch sử. Nếu phòng trà đã
            hoạt động, đây không phải cách để dừng: hãy liên hệ Admin.
          </p>
          <button onClick={() => setMoXoa(true)} disabled={isSaving || isDeleting}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-danger text-sm font-bold hover:bg-red-500/10 disabled:opacity-50">
            <Trash2 size={15} /> Xoá phòng trà
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={moXoa}
        title="Xoá phòng trà này?"
        message={`"${lounge?.name ?? ''}" cùng thư viện ảnh, khu vực chỗ ngồi và cấu hình sẽ bị xoá. Không hoàn tác được. Nếu phòng trà còn buổi diễn nào, backend sẽ từ chối và không có gì bị xoá.`}
        confirmText="Xoá phòng trà"
        processingText="Đang xoá..."
        danger
        isProcessing={isDeleting}
        onClose={() => setMoXoa(false)}
        onConfirm={handleXoa}
      />
    </div>
  )
}

export default OwnerLoungePage
