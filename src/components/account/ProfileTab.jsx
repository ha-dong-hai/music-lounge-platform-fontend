import { useState, useEffect, useRef } from 'react'
import { Camera, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '../../store/useAuthStore'
import Skeleton from '../shared/Skeleton'
import toast from 'react-hot-toast'
import { getMyProfile, updateProfile, uploadImage } from '../../services/userServices'
import { anhChuCai } from '../../utils/anhChuCai'

const accountSchema = z.object({
  name: z.string().min(1, "Họ tên không được để trống"),
  // Số điện thoại KHÔNG bắt buộc (05/10/2026): backend để trống được cả lúc đăng ký lẫn sửa hồ sơ
  // (UpdateMyProfileCommandValidator chỉ kiểm khi có giá trị), và không chức năng nào đòi số — chỉ cần khi người dùng tự
  // xin xác minh qua SMS. Bản cũ bắt buộc ở đây nên ai chưa có số (đăng nhập Google) không lưu được tên/ảnh đại diện.
  // Có nhập thì vẫn phải là 9–11 chữ số.
  phone: z.string().trim().refine((v) => v === '' || /^[0-9]{9,11}$/.test(v), "Số điện thoại gồm 9–11 chữ số, hoặc để trống"),
})

const ProfileTab = () => {
  const { user } = useAuthStore()
  const fileInputRef = useRef(null)

  const defaultAvatar = anhChuCai(user?.name || 'User')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || defaultAvatar)
  const [avatarUrlToSave, setAvatarUrlToSave] = useState(user?.avatarUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    }
  })

  // GỌI API LẤY PROFILE (chuyên trách của tab này)
  useEffect(() => {
    const fetchMyProfile = async () => {
      setIsFetchingProfile(true)
      try {
        const res = await getMyProfile()
        if (res.success) {
          const beData = res.data
          const mergedUser = { 
            ...user, 
            id: beData.id,
            name: beData.fullName,
            email: beData.email,
            avatarUrl: beData.avatarUrl,
            phone: beData.phone || '' 
          }
          
          useAuthStore.setState({ user: mergedUser })
          localStorage.setItem('user', JSON.stringify(mergedUser))

          reset({ name: mergedUser.name, phone: mergedUser.phone })

          if (mergedUser.avatarUrl) {
            setAvatarPreview(mergedUser.avatarUrl)
            setAvatarUrlToSave(mergedUser.avatarUrl)
          } else {
            setAvatarPreview(anhChuCai(mergedUser.name))
            setAvatarUrlToSave(null)
          }
        }
      } catch {
        toast.error('Không tải được thông tin tài khoản')
      } finally {
        setIsFetchingProfile(false)
      }
    }
    fetchMyProfile()
  }, [])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      const res = await uploadImage(file)
      if (res.success) {
        const uploadedUrl = res.data.url
        setAvatarUrlToSave(uploadedUrl)
        toast.success('Đã tải ảnh lên.')
      }
    } catch {
      toast.error('Tải ảnh lên không thành công.')
      setAvatarPreview(user?.avatarUrl || defaultAvatar)
      setAvatarUrlToSave(user?.avatarUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data) => {
    // Chỉ chặn khi ảnh ĐANG tải lên. Bản cũ chặn khi avatarUrlToSave rỗng — tài khoản chưa từng đặt ảnh đại diện thì
    // không bao giờ lưu được hồ sơ, luôn báo "đợi ảnh tải lên" (lộ 05/10/2026). Backend nhận avatarUrl null.
    if (isUploading) {
      toast.error('Vui lòng đợi ảnh tải lên xong')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        fullName: data.name,
        // Trống gửi null (không gửi chuỗi rỗng): backend coi null là "không có số" và xoá số cũ nếu người dùng vừa xoá.
        phone: data.phone || null,
        avatarUrl: avatarUrlToSave
      }
      
      await updateProfile(payload)
      
      const updatedUser = { ...user, name: data.name, phone: data.phone, avatarUrl: avatarUrlToSave }
      useAuthStore.setState({ user: updatedUser })
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success('Đã lưu thông tin tài khoản.')
    } catch {
      toast.error('Cập nhật không thành công.')
    } finally {
      setIsSaving(false)
    }
  }

  // Skeleton riêng của tab Profile
  if (isFetchingProfile) {
    return (
      <div className="bg-card border border-line p-6 md:p-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="flex items-center gap-6 pb-6 border-b border-line">
          <Skeleton className="w-24 h-24" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-11" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-line p-6 md:p-8">
      <h2 className="text-xl text-ink mb-6">Thông tin cá nhân</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="flex items-center gap-6 pb-6 border-b border-line">
          {/* Nút thật (bản cũ là <div onClick>, bàn phím không tới được). Lớp phủ khi rê chuột dùng chữ sáng trên nền mực. */}
          <button type="button" onClick={handleAvatarClick} disabled={isUploading} aria-label="Đổi ảnh đại diện" className="relative group flex-shrink-0">
            <img src={avatarPreview} alt="" className="w-24 h-24 object-cover border-2 border-ink" />
            <span className={`absolute inset-0 bg-board/60 flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>
              {isUploading ? <Loader2 size={24} className="text-lamp animate-spin" aria-hidden="true" /> : <Camera size={24} className="text-lamp" aria-hidden="true" />}
            </span>
            <span className="absolute bottom-0 right-0 p-1.5 bg-ink text-lamp"><Camera size={14} aria-hidden="true" /></span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" disabled={isUploading} />
          <div>
            <h3 className="text-ink font-bold text-lg">{user?.name || 'Tên người dùng'}</h3>
            <p className="text-ink-soft text-sm">Bấm vào ảnh để đổi ảnh đại diện (tệp hình).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="ho-so-ten" className="block font-semibold text-ink mb-1">Họ và tên</label>
            <input type="text" {...register('name')} id="ho-so-ten" aria-invalid={errors.name ? 'true' : undefined} aria-describedby={errors.name ? 'ho-so-ten-loi' : undefined} className={`w-full px-4 py-2.5 bg-card border-2 text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 ${errors.name ? 'border-danger' : 'border-ink'}`} />
            {errors.name && <p id="ho-so-ten-loi" className="mt-1.5 text-sm font-semibold text-danger">{errors.name.message}</p>}
          </div>
          
          <div>
            <label htmlFor="ho-so-sdt" className="block font-semibold text-ink mb-1">Số điện thoại <span className="font-normal text-ink-soft">(không bắt buộc)</span></label>
            <input type="tel" {...register('phone')} id="ho-so-sdt" aria-invalid={errors.phone ? 'true' : undefined} aria-describedby={errors.phone ? 'ho-so-sdt-loi' : undefined} className={`w-full px-4 py-2.5 bg-card border-2 text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 ${errors.phone ? 'border-danger' : 'border-ink'}`} />
            {errors.phone && <p id="ho-so-sdt-loi" className="mt-1.5 text-sm font-semibold text-danger">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="ho-so-email" className="block font-semibold text-ink mb-1">Email <span className="font-normal text-ink-mute">(không đổi được)</span></label>
            <input id="ho-so-email" type="email" value={user?.email || ''} disabled className="w-full min-h-[44px] px-4 py-2 bg-sunken border-2 border-ink/30 text-ink-soft text-sm cursor-not-allowed" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-line">
          <button 
            type="submit" 
            disabled={isSaving || isUploading} 
            className="inline-flex items-center gap-2 min-h-[44px] bg-ink text-lamp px-6 text-sm font-semibold hover:bg-board transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Đang lưu…</> : <><Save size={16} aria-hidden="true" /> Lưu thay đổi</>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfileTab