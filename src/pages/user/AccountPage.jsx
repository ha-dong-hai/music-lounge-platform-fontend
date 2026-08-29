// src/pages/user/AccountPage.jsx
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Heart, Camera, Save, Building2 } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import axiosInstance from '../../config/axios'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const accountSchema = z.object({
  name: z.string().min(1, "Họ và tên không được để trống"),
  phone: z.string()
    .min(1, "Số điện thoại không được để trống")
    .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa ký tự số")
    .min(9, "Số điện thoại không hợp lệ")
    .max(11, "Số điện thoại không hợp lệ"),
  email: z.string()
    .min(1, "Email không được để trống")
    .email("Email định dạng chưa đúng"),
  dob: z.string().min(1, "Vui lòng chọn ngày sinh"),
})

const AccountPage = () => {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [avatar, setAvatar] = useState(
    user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || 'User'}&backgroundColor=1f2937`
  )
  const fileInputRef = useRef(null)

  // Fetch profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/me')
        if (res.data?.success && res.data.data) {
          setProfile(res.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: user?.fullName || '',
      phone: '',
      email: user?.email || '',
      dob: '',
    }
  })

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.fullName || user?.fullName || '',
        phone: profile.phoneNumber || '',
        email: profile.email || user?.email || '',
        dob: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      })
      if (profile.avatarUrl) setAvatar(profile.avatarUrl)
    }
  }, [profile, reset])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data) => {
    try {
      await axiosInstance.put('/api/v1/me/profile', {
        fullName: data.name,
        phoneNumber: data.phone,
        dateOfBirth: data.dob,
      })
      setUser({ fullName: data.name })
      toast.success('Đã lưu thông tin tài khoản!')
    } catch (err) {
      toast.error('Không thể cập nhật thông tin.')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">

        <h1 className="text-3xl font-bold text-white mb-8">Tài khoản của tôi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 sticky top-24">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <User size={18} /> Thông tin tài khoản
              </button>
              <button
                onClick={() => setActiveTab('followed')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'followed' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <Heart size={18} /> Phòng trà đang theo dõi
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="lg:col-span-3">

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-[#C3B665] mb-6">Thông tin cá nhân</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                  {/* AVATAR */}
                  <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
                    <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                      <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-[#C3B665]" />
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                      <div className="absolute bottom-0 right-0 p-1.5 bg-[#C3B665] text-black rounded-full border-2 border-gray-900">
                        <Camera size={14} />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{user?.fullName || 'User Name'}</h3>
                      <p className="text-gray-400 text-sm">Click vào ảnh để đổi ảnh đại diện</p>
                    </div>
                  </div>

                  {/* FORM FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Họ và tên</label>
                      <input
                        type="text"
                        {...register('name')}
                        className={`w-full px-4 py-2.5 bg-black border rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 ${errors.name ? 'border-red-500' : 'border-gray-800'}`}
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className={`w-full px-4 py-2.5 bg-black border rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 ${errors.phone ? 'border-red-500' : 'border-gray-800'}`}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        {...register('email')}
                        disabled
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Ngày sinh</label>
                      <input
                        type="date"
                        {...register('dob')}
                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                        className={`w-full px-4 py-2.5 bg-black border rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 ${errors.dob ? 'border-red-500' : 'border-gray-800'}`}
                      />
                      {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-800">
                    <button type="submit" className="flex items-center gap-2 bg-[#C3B665] text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#d4c87f] transition-colors">
                      <Save size={16} /> Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* FOLLOWED LOUNGES TAB */}
            {activeTab === 'followed' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-[#C3B665] mb-6">Phòng trà đang theo dõi</h2>
                <div className="text-center py-12">
                  <Building2 size={40} className="mx-auto text-gray-700 mb-4" />
                  <p className="text-gray-400">Tính năng đang phát triển.</p>
                  <Link to="/" className="mt-4 inline-block text-[#C3B665] font-semibold underline hover:text-[#d4c87f]">
                    Khám phá phòng trà ngay!
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage