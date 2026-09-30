// src/components/account/PreferencesTab.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - PUT /me/preferences GHI ĐÈ toàn bộ: phải gửi lại đủ cả bốn mảng mỗi lần lưu, bỏ trống mảng nào
//   là xoá sạch lựa chọn cũ của mảng đó.
// - `enableAiConsent` là sự ĐỒNG Ý cho hệ thống dùng lịch sử xem/mua để gợi ý. Tắt thì gợi ý chỉ dựa
//   trên sở thích khai tay bên dưới. Đây là lựa chọn về dữ liệu cá nhân, nên nói rõ hệ quả chứ không
//   để một công tắc trống không.
// - Thể loại "không thích" khác với "không chọn": không chọn nghĩa là không ưu tiên, còn không thích
//   là chủ động đẩy ra khỏi gợi ý.
//
// SỬA LỖI MẤT DỮ LIỆU 30/09/2026: GET /me trả `favouriteGenreIds / favouriteMoodIds / favouriteAtmosphereIds`
// (UserProfileDto.cs:14-16), nhưng bản cũ đọc `preferredGenreIds ?? genreIds` — hai tên KHÔNG tồn tại. Kết quả: trang
// luôn hiện sở thích trống, và bấm "Lưu" (PUT ghi đè) xoá sạch thể loại, tâm trạng, không gian người dùng đã chọn.
// Cùng lỗi có ở nhánh web đang chạy (mlacp-ui ui-warm-light) — đã báo chủ dự án, chưa sửa ở đó.
// Thêm một chốt: tải hồ sơ hỏng thì KHÔNG hiện form (chỉ báo lỗi + thử lại) — lưu một form trống do tải hỏng cũng xoá
// sạch như trên.
//
// LÀM LẠI GIAO DIỆN: mỗi nhóm là fieldset + legend; mỗi chip là nút có aria-pressed (trình đọc màn hình biết đang
// chọn hay không — bản cũ chỉ đổi màu). Công tắc đồng ý có nhãn thật. Chọn một thể loại ở "yêu thích" thì tự bỏ nó
// khỏi "không muốn thấy" và ngược lại — backend cũng tự bỏ phần trùng (UpdateAiPreferencesCommandHandler.cs:52-59),
// nhưng lặng lẽ; ở đây người dùng thấy ngay.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyProfile, updatePreferences } from '../../services/userServices'
import { getGenres, getMoods, getAtmospheres } from '../../services/catalogServices'

const NhomChip = ({ nhan, goiY, options, selected, onToggle, loai = false }) => (
  <fieldset>
    <legend className="font-semibold text-ink">{nhan}</legend>
    {goiY && <p className="text-sm text-ink-soft mt-0.5">{goiY}</p>}
    {options.length === 0
      ? <p className="mt-2 text-sm text-ink-mute">Danh mục này chưa tải được.</p>
      : (
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((o) => {
            const chon = selected.includes(o.id)
            const Icon = loai ? X : Check
            return (
              <button key={o.id} type="button" aria-pressed={chon} onClick={() => onToggle(o.id)}
                className={`inline-flex items-center gap-1.5 min-h-[44px] px-3 border-2 text-sm font-semibold transition-colors ${chon
                  ? loai ? 'border-danger bg-card text-danger' : 'border-ink bg-ink text-lamp'
                  : 'border-ink/30 text-ink-soft hover:border-ink hover:text-ink'}`}>
                {chon && <Icon size={15} aria-hidden="true" />}{o.name}
              </button>
            )
          })}
        </div>
      )}
  </fieldset>
)

const PreferencesTab = () => {
  const [catalog, setCatalog] = useState({ genres: [], moods: [], atmospheres: [] })
  const [form, setForm] = useState({
    genreIds: [], moodIds: [], atmosphereIds: [], dislikedGenreIds: [], enableAiConsent: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loiTai, setLoiTai] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Thích và không thích một thể loại loại trừ nhau.
  const toggle = (key, id) => setForm((p) => {
    const bat = !p[key].includes(id)
    const moi = { ...p, [key]: bat ? [...p[key], id] : p[key].filter((x) => x !== id) }
    const doi = key === 'genreIds' ? 'dislikedGenreIds' : key === 'dislikedGenreIds' ? 'genreIds' : null
    if (bat && doi) moi[doi] = p[doi].filter((x) => x !== id)
    return moi
  })

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoiTai(false)
    const [g, m, a, me] = await Promise.allSettled([getGenres(), getMoods(), getAtmospheres(), getMyProfile()])
    const lay = (r) => (r.status === 'fulfilled' && r.value?.success ? r.value.data : [])
    setCatalog({ genres: lay(g), moods: lay(m), atmospheres: lay(a) })
    if (me.status === 'fulfilled' && me.value?.success) {
      const d = me.value.data
      setForm({
        genreIds: d.favouriteGenreIds ?? [],
        moodIds: d.favouriteMoodIds ?? [],
        atmosphereIds: d.favouriteAtmosphereIds ?? [],
        dislikedGenreIds: d.dislikedGenreIds ?? [],
        enableAiConsent: d.aiConsent ?? true,
      })
    } else {
      setLoiTai(true)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const luu = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updatePreferences(form)
      toast.success('Đã lưu sở thích.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa lưu được sở thích. Hãy thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="h-72 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải sở thích" />
  }

  if (loiTai) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
        <p>Sở thích của bạn chưa tải được, nên chưa thể sửa (lưu lúc này sẽ ghi đè lựa chọn cũ).</p>
        <button type="button" onClick={load} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
      </div>
    )
  }

  return (
    <form onSubmit={luu} className="space-y-8">
      <div className="border-2 border-ink p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.enableAiConsent}
            onChange={(e) => setForm((p) => ({ ...p, enableAiConsent: e.target.checked }))}
            className="mt-1 w-5 h-5 accent-ink flex-shrink-0" />
          <span>
            <span className="block font-semibold">Cho phép gợi ý dựa trên lịch sử của tôi</span>
            <span className="block text-ink-soft mt-0.5">
              Bật thì hệ thống dùng những buổi diễn bạn đã xem và đã mua vé để gợi ý chính xác hơn. Tắt thì chỉ gợi ý theo
              sở thích bạn tự chọn bên dưới.
            </span>
          </span>
        </label>
      </div>

      <NhomChip nhan="Thể loại yêu thích" options={catalog.genres}
        selected={form.genreIds} onToggle={(id) => toggle('genreIds', id)} />
      <NhomChip nhan="Tâm trạng" options={catalog.moods}
        selected={form.moodIds} onToggle={(id) => toggle('moodIds', id)} />
      <NhomChip nhan="Không gian" options={catalog.atmospheres}
        selected={form.atmosphereIds} onToggle={(id) => toggle('atmosphereIds', id)} />
      <NhomChip nhan="Thể loại không muốn thấy" loai
        goiY="Khác với việc không chọn: những thể loại này sẽ bị đẩy ra khỏi gợi ý. Một thể loại không thể vừa yêu thích vừa không muốn thấy."
        options={catalog.genres}
        selected={form.dislikedGenreIds} onToggle={(id) => toggle('dislikedGenreIds', id)} />

      <button type="submit" disabled={isSaving}
        className="inline-flex items-center gap-2 min-h-[48px] px-6 bg-ink text-lamp font-semibold hover:bg-board disabled:opacity-60">
        {isSaving && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Lưu sở thích
      </button>
    </form>
  )
}

export default PreferencesTab
