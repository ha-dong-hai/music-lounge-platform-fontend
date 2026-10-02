// src/components/account/OwnerLoungeTab.jsx
//
// MLACP-523 — Hồ sơ phòng trà cho CHỦ phòng trà (tab "Phòng trà của tôi" trong /account, chỉ hiện với vai Owner).
// GHI CHÚ CHO ĐỘI FE:
// - Đặt thành một tab của trang Tài khoản (không thêm route/layout mới) để không đụng AppRouter/MainLayout.
// - Địa chỉ theo đơn vị hành chính 2 cấp từ 01/7/2025 (QĐ 19/2025/QĐ-TTg, backend MLACP-521): chọn tỉnh → phường/xã
//   từ /catalog/provinces, gửi provinceCode/wardCode; backend tự điền tên chuẩn và bỏ trống quận (không còn cấp huyện).
//   Phòng trà cũ chưa có mã phường thì hiện lại chữ cũ làm gợi ý — phường cũ có thể đã bị tách/gộp nên phải chọn lại.
// - PUT /lounges/{id} GHI ĐÈ TOÀN BỘ: các trường không có trên form (vĩ độ/kinh độ) phải gửi lại giá trị đang có, nếu
//   không bấm Lưu là xoá mất (cùng lớp lỗi MLACP-467).
// - Id không gian lấy NGUYÊN KIỂU từ danh mục (không ép Number) — để khi backend đổi id sang GUID (MLACP-515) không vỡ.
// - Tạo xong phải xin token mới: mã phòng trà chỉ được gắn vào token lúc phát hành, token đang cầm vẫn nói "chưa có".
// - Chưa gồm ảnh đại diện, giấy phép kinh doanh, ảnh gallery, xoá phòng trà.

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import Skeleton from '../shared/Skeleton'
import { useAuthStore } from '../../store/useAuthStore'
import { getLounges, getLoungeDetail, createLounge, updateLounge } from '../../services/loungeServices'
import { getAtmospheres, getProvinces, getWardsOfProvince } from '../../services/catalogServices'
import { refreshSession } from '../../services/aServices'

const loungeSchema = z.object({
  name: z.string().trim().min(1, 'Cần nhập tên phòng trà').max(255, 'Tên tối đa 255 ký tự'),
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional(),
  atmosphereId: z.string().optional(),
  provinceCode: z.string().min(1, 'Chọn tỉnh/thành phố'),
  wardCode: z.string().min(1, 'Chọn phường/xã'),
  street: z.string().trim().min(1, 'Cần nhập số nhà, đường').max(255, 'Tối đa 255 ký tự'),
})

// Đúng 6 giá trị LoungeStatus của backend.
const TRANG_THAI = {
  Pending: 'Hồ sơ đang chờ Admin duyệt',
  Approved: 'Đã duyệt, đang hoạt động',
  Warned: 'Đang bị cảnh cáo — vẫn hoạt động bình thường',
  Suspended: 'Bị tạm đình chỉ — không mở bán vé được',
  Locked: 'Bị khoá',
  Rejected: 'Hồ sơ bị từ chối',
}

const labelCls = 'block text-sm font-medium text-ink-soft mb-2'
const inputCls = (err) =>
  `w-full px-4 py-2.5 bg-page border rounded-lg text-ink text-sm focus:outline-none focus:border-brand/50 ${err ? 'border-red-500' : 'border-line'}`

const formRong = { name: '', description: '', atmosphereId: '', provinceCode: '', wardCode: '', street: '' }

const OwnerLoungeTab = () => {
  const [lounge, setLounge] = useState(null) // null = chủ chưa có phòng trà
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [atmospheres, setAtmospheres] = useState([])
  const [provinces, setProvinces] = useState([])
  const [wards, setWards] = useState([])
  const [diaChiCu, setDiaChiCu] = useState({ city: null, ward: null })
  const [lanTai, setLanTai] = useState(0)

  const { register, handleSubmit, formState: { errors }, reset, control, setValue } = useForm({
    resolver: zodResolver(loungeSchema),
    defaultValues: formRong,
  })
  const provinceCode = useWatch({ control, name: 'provinceCode' })
  const wardCode = useWatch({ control, name: 'wardCode' })

  useEffect(() => {
    const tai = async () => {
      try {
        const [dsRes, khongGianRes, tinhRes] = await Promise.allSettled([
          getLounges({ mine: true }), getAtmospheres(), getProvinces(),
        ])
        const dsKhongGian = khongGianRes.status === 'fulfilled' && khongGianRes.value?.success ? khongGianRes.value.data : []
        setAtmospheres(dsKhongGian)
        if (tinhRes.status === 'fulfilled' && tinhRes.value?.success) setProvinces(tinhRes.value.data)
        if (dsRes.status !== 'fulfilled' || !dsRes.value?.success) throw new Error('lounges')

        const ds = dsRes.value.data
        const cuaToi = (Array.isArray(ds) ? ds : ds?.items)?.[0]
        if (!cuaToi) {
          setLounge(null)
          reset(formRong)
          return
        }
        const chiTiet = await getLoungeDetail(cuaToi.id)
        if (!chiTiet.success) throw new Error('detail')
        const d = chiTiet.data
        setLounge(d)
        setDiaChiCu({ city: d.provinceCode ? null : d.city || null, ward: d.wardCode ? null : d.ward || null })
        reset({
          name: d.name ?? '',
          description: d.description ?? '',
          atmosphereId: d.atmosphereId != null ? String(d.atmosphereId) : '',
          provinceCode: d.provinceCode ?? '',
          wardCode: d.wardCode ?? '',
          street: d.street ?? '',
        })
      } catch {
        toast.error('Không tải được hồ sơ phòng trà')
      } finally {
        setIsLoading(false)
      }
    }
    tai()
  }, [reset, lanTai])

  // Chọn tỉnh xong mới tải phường/xã của tỉnh đó.
  useEffect(() => {
    if (!provinceCode) return
    getWardsOfProvince(provinceCode)
      .then((res) => { if (res.success) setWards(res.data) })
      .catch(() => toast.error('Không tải được danh sách phường/xã'))
  }, [provinceCode])

  const onSubmit = async (data) => {
    const tinh = provinces.find((p) => p.code === data.provinceCode)
    const phuong = wards.find((w) => w.code === data.wardCode)
    const khongGian = atmospheres.find((a) => String(a.id) === data.atmosphereId)
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      atmosphereId: khongGian ? khongGian.id : null,
      street: data.street.trim(),
      // Tên gửi kèm chỉ để chỗ khác còn đọc được chữ; backend lấy tên chuẩn theo MÃ.
      ward: phuong?.name ?? null,
      district: null,
      city: tinh?.name ?? null,
      provinceCode: data.provinceCode,
      wardCode: data.wardCode,
      // Không có trên form nhưng PUT ghi đè toàn bộ — gửi lại giá trị đang có.
      latitude: lounge?.latitude ?? null,
      longitude: lounge?.longitude ?? null,
    }

    setIsSaving(true)
    try {
      if (lounge) {
        await updateLounge(lounge.id, payload) // id lấy từ đường dẫn — không gửi kèm trong body
        toast.success('Đã lưu hồ sơ phòng trà.')
      } else {
        await createLounge(payload)
        toast.success('Đã tạo phòng trà. Hồ sơ đang chờ Admin duyệt.')
        const { refreshToken, login } = useAuthStore.getState()
        try {
          const res = await refreshSession(refreshToken)
          if (res?.success) login(res.data)
        } catch {
          toast.error('Đã tạo phòng trà nhưng chưa làm mới được phiên — hãy đăng xuất rồi đăng nhập lại.')
        }
      }
      setLanTai((n) => n + 1)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu không thành công.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-card border border-line rounded-2xl p-6 md:p-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-line rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-brand-text mb-2">{lounge ? 'Hồ sơ phòng trà' : 'Tạo phòng trà'}</h2>
      <p className="text-ink-soft text-sm mb-6">
        {lounge
          ? (TRANG_THAI[lounge.status] ?? lounge.status)
          : 'Mỗi tài khoản chủ quản lý một phòng trà. Hồ sơ mới cần Admin duyệt trước khi mở bán vé.'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Tên phòng trà</label>
            <input type="text" {...register('name')} className={inputCls(errors.name)} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Không gian</label>
            <select {...register('atmosphereId')} className={inputCls(false)}>
              <option value="">— không chọn —</option>
              {atmospheres.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Mô tả</label>
            <textarea rows={4} {...register('description')} className={inputCls(errors.description)} />
            {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
          </div>
        </div>

        <div className="pt-6 border-t border-line">
          <h3 className="text-ink font-bold mb-1">Địa chỉ</h3>
          <p className="text-ink-soft text-sm mb-4">Theo đơn vị hành chính từ 01/7/2025 — không còn cấp quận/huyện.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Tỉnh / thành phố</label>
              <select
                {...register('provinceCode', { onChange: () => setValue('wardCode', '') })}
                className={inputCls(errors.provinceCode)}
              >
                <option value="">— chọn tỉnh/thành phố —</option>
                {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
              {errors.provinceCode && <p className="mt-1 text-xs text-danger">{errors.provinceCode.message}</p>}
              {diaChiCu.city && !provinceCode && (
                <p className="mt-1 text-xs text-ink-mute">Địa chỉ cũ ghi “{diaChiCu.city}” — hãy chọn lại theo danh mục mới.</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Phường / xã</label>
              <select {...register('wardCode')} disabled={!provinceCode} className={`${inputCls(errors.wardCode)} disabled:opacity-50`}>
                <option value="">{provinceCode ? '— chọn phường/xã —' : '— chọn tỉnh trước —'}</option>
                {wards.filter((w) => w.provinceCode === provinceCode)
                  .map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
              </select>
              {errors.wardCode && <p className="mt-1 text-xs text-danger">{errors.wardCode.message}</p>}
              {diaChiCu.ward && !wardCode && (
                <p className="mt-1 text-xs text-ink-mute">Địa chỉ cũ ghi “{diaChiCu.ward}” — phường cũ có thể đã sáp nhập, hãy chọn lại.</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Số nhà, đường</label>
              <input type="text" {...register('street')} className={inputCls(errors.street)} />
              {errors.street && <p className="mt-1 text-xs text-danger">{errors.street.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-line">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-brand text-on-brand px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <><Loader2 size={16} className="animate-spin" /> Đang lưu…</> : <><Save size={16} /> {lounge ? 'Lưu hồ sơ' : 'Tạo phòng trà'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OwnerLoungeTab
