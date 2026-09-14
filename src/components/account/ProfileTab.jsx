import { useState, useEffect, useRef } from 'react'
import { Camera, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '../../store/useAuthStore'
import Skeleton from '../shared/Skeleton'
import toast from 'react-hot-toast'
import { getMyProfile, updateProfile, uploadImage } from '../../services/userServices'

const accountSchema = z.object({
  name: z.string().min(1, "Full name cannot be left blank"),
  phone: z.string().min(1, "The phone number cannot be left blank").regex(/^[0-9]+$/, "Only numeric characters").min(9, "Invalid phone number").max(11, "Invalid phone number"),
})

const ProfileTab = () => {
  const { user } = useAuthStore()
  const fileInputRef = useRef(null)

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=1f2937`
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
            setAvatarPreview(`https://api.dicebear.com/7.x/initials/svg?seed=${mergedUser.name}&backgroundColor=1f2937`)
            setAvatarUrlToSave(null)
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        toast.error('Error loading account information')
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
        toast.success('Image uploaded successfully.!')
      }
    } catch (err) {
      toast.error('Image upload failed.')
      setAvatarPreview(user?.avatarUrl || defaultAvatar)
      setAvatarUrlToSave(user?.avatarUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data) => {
    if (!avatarUrlToSave) {
      toast.error('Please wait for the image upload to complete')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        fullName: data.name,
        phone: data.phone, 
        avatarUrl: avatarUrlToSave
      }
      
      await updateProfile(payload)
      
      const updatedUser = { ...user, name: data.name, phone: data.phone, avatarUrl: avatarUrlToSave }
      useAuthStore.setState({ user: updatedUser })
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success('Account information saved!')
    } catch (err) {
      toast.error('Update failed.')
    } finally {
      setIsSaving(false)
    }
  }

  // Skeleton riêng của tab Profile
  if (isFetchingProfile) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-[#C3B665] mb-6">Personal information</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
          <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
            <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-[#C3B665]" />
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? <Loader2 size={24} className="text-white animate-spin" /> : <Camera size={24} className="text-white" />}
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 bg-[#C3B665] text-black rounded-full border-2 border-gray-900"><Camera size={14} /></div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" disabled={isUploading} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{user?.name || 'User Name'}</h3>
            <p className="text-gray-400 text-sm">Click the image to change your profile picture.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Fullname</label>
            <input type="text" {...register('name')} className={`w-full px-4 py-2.5 bg-black border rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 ${errors.name ? 'border-red-500' : 'border-gray-800'}`} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Phone number</label>
            <input type="tel" {...register('phone')} className={`w-full px-4 py-2.5 bg-black border rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 ${errors.phone ? 'border-red-500' : 'border-gray-800'}`} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email (Cannot be changed)</label>
            <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-500 text-sm cursor-not-allowed" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-800">
          <button 
            type="submit" 
            disabled={isSaving || isUploading} 
            className="flex items-center gap-2 bg-[#C3B665] text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#d4c87f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving ...</> : <><Save size={16} /> Saved</>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfileTab