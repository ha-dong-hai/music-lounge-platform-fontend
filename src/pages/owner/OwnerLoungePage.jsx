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
// - Không hỏi Quận/Huyện: cấp huyện đã bãi bỏ từ 01/07/2025. MLACP-522: tỉnh và phường/xã CHỌN từ danh mục hành chính
//   chính thức (QĐ 19/2025/QĐ-TTg, /catalog/provinces) và gửi MÃ — backend tự điền tên chuẩn và bỏ trống quận. Địa chỉ
//   cũ gõ tay (chưa có mã) thì hiện lại chữ cũ làm gợi ý và bắt chọn lại: phường cũ có thể đã bị tách/gộp.
// - LoungeDetailDto trả atmosphereName chứ không trả atmosphereId, nên khi sửa phải dò ngược tên
//   sang id trong danh mục. Tên không khớp thì để trống và báo người dùng chọn lại, KHÔNG âm thầm
//   gửi null (sẽ xoá mất không gian đang có).
// - XOÁ PHÒNG TRÀ: backend chặn (409) nếu còn BẤT KỲ buổi diễn nào, kể cả đã kết thúc hoặc đã huỷ.
//   Nghĩa là phòng trà đã từng hoạt động thì thực tế không xoá được — và đó là hành vi đúng, vì xoá
//   đi là mất lịch sử show. Nút xoá vì vậy nói trước điều kiện này chứ không để chủ bấm rồi mới
//   nhận lỗi. Xoá xong thì claim lounge_id trong token thành sai, nên phải refresh token như lúc tạo.
import { useState, useEffect, useCallback, useId, cloneElement, isValidElement } from 'react'
import { Loader2, Store, Save, Upload, FileText, ExternalLink, AlertTriangle, CheckCircle2, Clock, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getLounges, getLoungeDetail, createLounge, updateLounge,
  setLoungeImage, setLoungeBusinessLicense, getLoungeBusinessLicense,
  addGalleryImage, removeGalleryImage, reorderGalleryImages, deleteLounge,
} from '../../services/loungeServices'
import { getAtmospheres, getProvinces, getWardsOfProvince } from '../../services/catalogServices'
import { uploadImage } from '../../services/userServices'
import { refreshSession } from '../../services/aServices'
import { useAuthStore } from '../../store/useAuthStore'
import CustomCriteriaSection from '../../components/owner/CustomCriteriaSection'
import ThePhongTra from '../../components/program/ThePhongTra'
import ConfirmModal from '../../components/shared/ConfirmModal'
import { TrangLoiTai } from '../../components/bang/KhungTai'

// Trạng thái hồ sơ phòng trà — đúng 6 giá trị LoungeStatus của backend.
const STATUS_VIEW = {
  Pending: { label: 'Đang chờ Admin duyệt', cls: 'bg-warning/10 border-warning/30 text-warning', icon: Clock },
  Approved: { label: 'Đã duyệt, đang hoạt động', cls: 'bg-success/10 border-success/30 text-success', icon: CheckCircle2 },
  Warned: { label: 'Đang bị cảnh cáo — vẫn hoạt động bình thường', cls: 'bg-warning/10 border-warning/30 text-warning', icon: AlertTriangle },
  Suspended: { label: 'Bị tạm đình chỉ — không mở bán vé được', cls: 'bg-danger/10 border-danger/30 text-danger', icon: AlertTriangle },
  Locked: { label: 'Bị khoá', cls: 'bg-danger/10 border-danger/30 text-danger', icon: AlertTriangle },
  Rejected: { label: 'Hồ sơ bị từ chối', cls: 'bg-danger/10 border-danger/30 text-danger', icon: AlertTriangle },
}

const emptyForm = {
  name: '', description: '', atmosphereId: '',
  street: '', provinceCode: '', wardCode: '', latitude: '', longitude: '',
}

// Nhãn NỐI với ô (htmlFor + id tự sinh, gợi ý qua aria-describedby) — bản cũ in nhãn cạnh ô mà không nối, nên cả 9 ô
// của hồ sơ phòng trà không có tên cho trình đọc màn hình. Gợi ý in TRƯỚC ô.
const Field = ({ label, required, hint, children }) => {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block font-semibold text-ink mb-1">
        {label}{required && <><span className="text-danger" aria-hidden="true"> *</span><span className="sr-only"> (bắt buộc)</span></>}
      </label>
      {hint && <p id={`${id}-goi-y`} className="text-sm text-ink-soft mb-1.5">{hint}</p>}
      {isValidElement(children) ? cloneElement(children, { id, 'aria-describedby': hint ? `${id}-goi-y` : undefined, 'aria-required': required || undefined }) : children}
    </div>
  )
}

const inputCls = 'w-full min-h-[44px] px-3 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2'

const OwnerLoungePage = () => {
  const login = useAuthStore((st) => st.login)

  const [lounge, setLounge] = useState(null)       // null = chưa có phòng trà nào
  const [moXoa, setMoXoa] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [atmospheres, setAtmospheres] = useState([])
  const [form, setForm] = useState(emptyForm)
  // MLACP-522: danh mục tỉnh, phường/xã của tỉnh đang chọn, và chữ địa chỉ cũ (chưa có mã) để gợi ý chọn lại.
  const [provinces, setProvinces] = useState([])
  const [wards, setWards] = useState([])
  const [diaChiCu, setDiaChiCu] = useState({ city: null, ward: null })
  const [atmosphereKhongDoiDuoc, setAtmosphereKhongDoiDuoc] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  // Lỗi tải dữ liệu nền: vẽ TrangLoiTai thay vì nhánh 'chưa có' (01/10/2026 — xem components/bang/KhungTai.jsx).
  const [loiTai, setLoiTai] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(null) // 'image' | 'license' | null
  // Chú thích cho ảnh SẮP thêm vào thư viện. Phải nhập TRƯỚC khi chọn tệp: backend chỉ nhận chú thích lúc thêm ảnh
  // (POST /lounges/{id}/gallery), không có lệnh sửa chú thích. Trước 03/10 trang này không gửi chú thích nên ảnh
  // nào chủ phòng trà thêm cũng không lật được ở xấp Polaroid trang phòng trà (XapPolaroid chỉ lật ảnh có chú thích).
  const [chuThichMoi, setChuThichMoi] = useState('')

  const isEdit = !!lounge
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  // Đổi tỉnh thì phường/xã đã chọn không còn thuộc tỉnh mới — xoá.
  const chonTinh = (code) => setForm((p) => ({ ...p, provinceCode: code, wardCode: '' }))

  useEffect(() => {
    getProvinces()
      .then((r) => { if (r?.success) setProvinces(r.data) })
      .catch(() => toast.error('Không tải được danh sách tỉnh/thành phố.'))
  }, [])

  // MLACP-637: địa chỉ nhập trước khi có danh mục hành chính 2025 chỉ có TÊN phường, chưa có mã. Tên nào vẫn còn nguyên
  // trong danh mục mới (vd "Phường Tân Định") thì tự chọn sẵn ngay khi danh sách phường về — chủ phòng trà không phải đi
  // tìm lại thứ đã đúng. Tên đã biến mất sau sáp nhập (vd "Phường Bến Nghé") thì để trống và dòng gợi ý dưới ô nói rõ phải
  // chọn lại. Lưu sau khi tự chọn KHÔNG phát thông báo "đổi địa chỉ" cho người giữ vé: backend coi gán mã lần đầu cho cùng
  // số nhà/đường là dọn nhãn (MLACP-636).
  useEffect(() => {
    if (!form.provinceCode) return
    const chuan = (s) => String(s ?? '').normalize('NFC').trim().toLocaleLowerCase('vi')
    getWardsOfProvince(form.provinceCode)
      .then((r) => {
        if (!r?.success) return
        setWards(r.data)
        const khop = diaChiCu.ward && r.data.find((w) => w.provinceCode === form.provinceCode && chuan(w.name) === chuan(diaChiCu.ward))
        if (khop) setForm((p) => (p.wardCode ? p : { ...p, wardCode: khop.code }))
      })
      .catch(() => toast.error('Không tải được danh sách phường/xã.'))
  }, [form.provinceCode, diaChiCu.ward])
  const load = useCallback(async () => {
    setIsLoading(true)
    setLoiTai(false)
    try {
      const [dsRes, khongGianRes] = await Promise.allSettled([
        getLounges({ mine: true }),
        getAtmospheres(),
      ])
      const dsKhongGian = khongGianRes.status === 'fulfilled' && khongGianRes.value?.success
        ? khongGianRes.value.data : []
      setAtmospheres(dsKhongGian)

      // Lỗi khi hỏi "phòng trà của tôi" KHÔNG phải "chưa có phòng trà" — bản cũ rơi vào form TẠO MỚI để trống,
      // chủ phòng trà có thể gửi tạo thêm một phòng trà nữa.
      if (dsRes.status === 'rejected' || !dsRes.value?.success) throw new Error('lounges')
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
      if (!chiTiet.success) throw new Error('detail')
      const d = chiTiet.data
      setLounge(d)
      setDiaChiCu({ city: d.provinceCode ? null : d.city || null, ward: d.wardCode ? null : d.ward || null })

      const khop = dsKhongGian.find((a) => a.name === d.atmosphereName)
      setAtmosphereKhongDoiDuoc(!!d.atmosphereName && !khop)
      setForm({
        name: d.name ?? '',
        description: d.description ?? '',
        atmosphereId: khop ? String(khop.id) : '',
        street: d.street ?? '',
        provinceCode: d.provinceCode ?? '',
        wardCode: d.wardCode ?? '',
        latitude: d.latitude ?? '',
        longitude: d.longitude ?? '',
      })
    } catch {
      setLoiTai(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    // MLACP-637: nói đúng ô đang thiếu. Bản cũ gộp một câu chung cho bốn ô — chủ phòng trà có địa chỉ cũ (chưa có mã
    // phường) bấm Lưu mà không đổi gì cũng bị chặn và không biết vì sao (đo 05/10 trên dữ liệu chép từ Azure).
    const thieu = [
      !form.name.trim() && 'tên phòng trà',
      !form.street.trim() && 'số nhà, đường',
      !form.provinceCode && 'tỉnh / thành phố',
      !form.wardCode && 'phường / xã',
    ].filter(Boolean)
    if (thieu.length) {
      toast.error(!form.wardCode && diaChiCu.ward && thieu.length === 1
        ? `Phường cũ "${diaChiCu.ward}" không còn trong danh mục hành chính từ 01/7/2025. Chọn phường mới ở ô Phường / xã rồi lưu lại.`
        : `Còn thiếu: ${thieu.join(', ')}.`)
      return
    }
    const tinh = provinces.find((p) => p.code === form.provinceCode)
    const phuong = wards.find((w) => w.code === form.wardCode)
    const soHoacNull = (v) => (v === '' || v === null ? null : Number(v))
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      atmosphereId: form.atmosphereId === '' ? null : form.atmosphereId, // MLACP-516: GUID, không ép số
      street: form.street.trim(),
      // Tên gửi kèm chỉ để giao diện cũ còn đọc được; backend lấy tên chuẩn theo MÃ.
      ward: phuong?.name ?? null,
      district: null,
      city: tinh?.name ?? null,
      provinceCode: form.provinceCode,
      wardCode: form.wardCode,
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
      await addGalleryImage(lounge.id, { imageUrl: up.data?.url ?? up.data, caption: chuThichMoi.trim() || null })
      toast.success('Đã thêm ảnh vào thư viện.')
      setChuThichMoi('') // chú thích đi với ảnh vừa thêm — không để dính sang ảnh sau
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
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
  }
  if (loiTai) return <TrangLoiTai tieuDe="Hồ sơ phòng trà" tenVung="hồ sơ phòng trà" taiLai={load} />

  const trangThai = lounge ? STATUS_VIEW[lounge.status] : null

  // Thẻ xem trước dựng từ NỘI DUNG ĐANG SỬA, đúng các trường ThePhongTra đọc (ô "Phòng trà trên sàn" ở trang chủ và
  // trang danh sách phòng trà). Địa chỉ theo mã thì backend bỏ trống quận và điền tên tỉnh chuẩn — làm y như vậy.
  const tinhDangChon = provinces.find((p) => p.code === form.provinceCode)
  const theXemTruoc = lounge && {
    id: lounge.id,
    name: form.name.trim() || lounge.name,
    primaryImageUrl: lounge.primaryImageUrl,
    street: form.street,
    district: form.provinceCode ? '' : lounge.district,
    city: tinhDangChon?.name ?? lounge.city,
    upcomingShowCount: lounge.upcomingShowCount ?? 0,
  }

  return (
    // Màn rộng (≥1280px): form bên trái + cột "Khán giả sẽ thấy" bên phải, dính khi cuộn (chủ dự án 02/10/2026: form
    // neo trái để trống nửa màn hình). Form vẫn giữ một cột ~768px — trải ô nhập ra nhiều cột làm người điền bỏ sót ô.
    // Màn hẹp: cột xem trước xuống dưới form.
    <div className="xl:flex xl:justify-center xl:items-start xl:gap-10">
    <div className="space-y-6 max-w-3xl mx-auto xl:mx-0 xl:flex-1 min-w-0">
      <div>
        <h1 className="text-4xl text-ink mb-1">Hồ sơ phòng trà</h1>
        <p className="text-ink-soft text-sm">
          {isEdit
            ? 'Thông tin hiển thị cho khán giả và dùng cho mọi buổi diễn của bạn.'
            : 'Tạo phòng trà trước đã — các mục Buổi diễn, Báo cáo doanh thu và Gói dịch vụ chỉ hoạt động khi bạn có phòng trà.'}
        </p>
      </div>

      {trangThai && (
        <div className={`flex items-start gap-3 border p-4 ${trangThai.cls}`}>
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

      <form onSubmit={handleSubmit} className="bg-card border border-line p-6 space-y-4">
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

        <Field label="Tỉnh / thành phố" required hint={diaChiCu.city && !form.provinceCode
          ? `Địa chỉ cũ ghi "${diaChiCu.city}" — hãy chọn lại theo danh mục hành chính từ 01/7/2025.`
          : undefined}>
          <select value={form.provinceCode} onChange={(e) => chonTinh(e.target.value)} className={inputCls}>
            <option value="">— chọn tỉnh/thành phố —</option>
            {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Số nhà, đường" required>
            <input value={form.street} onChange={(e) => set('street', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Phường / xã" required hint={diaChiCu.ward && !form.wardCode
            ? `Địa chỉ cũ ghi "${diaChiCu.ward}" — phường cũ có thể đã sáp nhập, hãy chọn lại.`
            : undefined}>
            <select value={form.wardCode} onChange={(e) => set('wardCode', e.target.value)} className={inputCls}
              disabled={!form.provinceCode}>
              <option value="">{form.provinceCode ? '— chọn phường/xã —' : '— chọn tỉnh trước —'}</option>
              {wards.filter((w) => w.provinceCode === form.provinceCode).map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vĩ độ" hint="Không bắt buộc. Có toạ độ thì khán giả xem được vị trí trên bản đồ.">
            <input type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Kinh độ">
            <input type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <button type="submit" disabled={isSaving}
          className="flex items-center gap-2 disabled:opacity-50 justify-center min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : isEdit ? <Save size={16} /> : <Store size={16} />}
          {isSaving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo phòng trà'}
        </button>
      </form>

      {/* Tệp đính kèm chỉ gắn được khi phòng trà đã tồn tại — chúng cần id. */}
      {isEdit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-line p-6">
            <h3 className="text-base font-semibold text-ink">Ảnh đại diện</h3>
            <p className="text-xs text-ink-mute mt-0.5">Ảnh khán giả nhìn thấy đầu tiên.</p>
            {lounge.primaryImageUrl && (
              <img src={lounge.primaryImageUrl} alt="" className="mt-3 w-full h-36 object-cover border border-line" />
            )}
            <label className="mt-3 inline-flex items-center gap-2 cursor-pointer justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              {isUploading === 'image' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {lounge.primaryImageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
              <input type="file" accept="image/*" className="hidden" disabled={isUploading !== null}
                onChange={(e) => handleUpload(e.target.files?.[0], 'image')} />
            </label>
          </div>

          <div className="bg-card border border-line p-6">
            <h3 className="text-base font-semibold text-ink">Giấy phép kinh doanh</h3>
            <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">
              Chỉ bạn và Admin xem được. Tệp nằm ở vùng lưu riêng tư, không ai đoán đường dẫn mà tải về được.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
                {isUploading === 'license' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Tải giấy phép lên
                <input type="file" accept="image/*,.pdf" className="hidden" disabled={isUploading !== null}
                  onChange={(e) => handleUpload(e.target.files?.[0], 'license')} />
              </label>
              <button type="button" onClick={handleXemGiayPhep}
                className="inline-flex items-center gap-2 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
                <ExternalLink size={16} /> Xem giấy phép
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THƯ VIỆN ẢNH — thứ tự quyết định ảnh nào khán giả thấy trước. Đổi thứ tự là gửi lại
          TOÀN BỘ danh sách id, backend không nhận lệnh "đổi chỗ hai ảnh". */}
      {isEdit && (
        <div className="bg-card border border-line p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-ink">Thư viện ảnh</h3>
              <p className="text-xs text-ink-mute mt-0.5">Ảnh không gian phòng trà. Thứ tự bên dưới là thứ tự khán giả xem.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <label htmlFor="chu-thich-anh" className="text-sm font-medium text-ink">Chú thích cho ảnh sắp thêm <span className="font-normal text-ink-mute">(không bắt buộc)</span></label>
                <span className="font-mono text-xs text-ink-mute" aria-hidden="true">{chuThichMoi.length}/255</span>
              </div>
              <input id="chu-thich-anh" value={chuThichMoi} onChange={(e) => setChuThichMoi(e.target.value)} maxLength={255}
                aria-describedby="chu-thich-anh-goi-y" placeholder="Ví dụ: Bàn sát sân khấu, nhìn thẳng vào ca sĩ" className={inputCls} />
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer flex-shrink-0 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              {isUploading === 'gallery' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Chọn ảnh để thêm
              <input type="file" accept="image/*" className="hidden" disabled={isUploading !== null}
                onChange={(e) => { handleThemAnhThuVien(e.target.files?.[0]); e.target.value = '' }} />
            </label>
            <p id="chu-thich-anh-goi-y" className="sm:col-span-2 text-xs text-ink-mute">
              Khán giả đọc chú thích ở mép ảnh và khi lật ảnh ra mặt sau. Ảnh không có chú thích thì không lật được.
              Chú thích không sửa được sau khi thêm — muốn đổi thì xoá ảnh rồi thêm lại.
            </p>
          </div>

          {(lounge.galleryImages?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-ink-mute">Chưa có ảnh nào trong thư viện.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...lounge.galleryImages].sort((a, b) => a.orderIndex - b.orderIndex).map((img, i, arr) => (
                <li key={img.id} className="group">
                  <div className="relative">
                    <img src={img.imageUrl} alt={img.caption ?? ''} className="w-full h-28 object-cover border border-line" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between items-center gap-1 p-1.5 bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button onClick={() => handleDoiThuTu(img.id, -1)} disabled={i === 0 || isUploading !== null}
                          className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 text-ink-soft hover:text-ink disabled:opacity-30" title="Lùi lên trước" aria-label="Lùi lên trước">
                          <ArrowLeft size={13} />
                        </button>
                        <button onClick={() => handleDoiThuTu(img.id, 1)} disabled={i === arr.length - 1 || isUploading !== null}
                          className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 text-ink-soft hover:text-ink disabled:opacity-30" title="Đẩy xuống sau" aria-label="Đẩy xuống sau">
                          <ArrowRight size={13} />
                        </button>
                      </div>
                      <button onClick={() => handleXoaAnhThuVien(img.id)} disabled={isUploading !== null}
                        className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 text-danger hover:text-danger disabled:opacity-30" title="Xoá ảnh" aria-label="Xoá ảnh">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className={`mt-1.5 text-xs line-clamp-2 ${img.caption ? 'text-ink-soft' : 'text-ink-mute italic'}`}>
                    {img.caption || 'Chưa có chú thích'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isEdit && <CustomCriteriaSection loungeId={lounge.id} />}

      {/* VÙNG NGUY HIỂM — đặt cuối trang, tách khỏi mọi nút lưu, để không ai bấm nhầm khi đang sửa */}
      {isEdit && (
        <div className="bg-card border border-danger/30 p-6">
          <h3 className="text-base font-semibold text-danger flex items-center gap-2">
            <AlertTriangle size={17} /> Xoá phòng trà
          </h3>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            Chỉ xoá được khi phòng trà <strong className="text-ink-soft">chưa từng có buổi diễn nào</strong> —
            kể cả buổi đã kết thúc hoặc đã huỷ cũng chặn, vì xoá đi là mất lịch sử. Nếu phòng trà đã
            hoạt động, đây không phải cách để dừng: hãy liên hệ Admin.
          </p>
          <button onClick={() => setMoXoa(true)} disabled={isSaving || isDeleting}
            className="mt-4 flex items-center gap-2 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-danger bg-card text-danger text-sm font-semibold hover:bg-danger hover:text-lamp">
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

    {theXemTruoc && (
      <aside aria-labelledby="xem-truoc-td" className="mt-8 xl:mt-0 max-w-3xl mx-auto xl:mx-0 xl:w-80 xl:shrink-0 xl:sticky xl:top-0">
        <h2 id="xem-truoc-td" className="text-sm font-semibold text-ink-soft mb-3">Khán giả sẽ thấy</h2>
        {/* inert: chỉ để nhìn — không bấm nhầm "Theo dõi"/liên kết, không lọt vào thứ tự Tab. */}
        <div inert className="max-w-xs">
          <ThePhongTra l={theXemTruoc} />
        </div>
        <p className="text-xs text-ink-mute mt-3 leading-relaxed">
          Cập nhật theo nội dung bạn đang sửa. Khán giả chỉ thấy thay đổi sau khi bạn bấm <strong>Lưu thay đổi</strong>.
        </p>
      </aside>
    )}
    </div>
  )
}

export default OwnerLoungePage
