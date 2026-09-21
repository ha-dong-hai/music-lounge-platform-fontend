// src/components/account/PreferencesTab.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - PUT /me/preferences GHI ĐÈ toàn bộ: phải gửi lại đủ cả ba mảng mỗi lần lưu, bỏ trống mảng nào
//   là xoá sạch lựa chọn cũ của mảng đó.
// - `enableAiConsent` là sự ĐỒNG Ý cho hệ thống dùng lịch sử xem/mua để gợi ý. Tắt thì gợi ý chỉ dựa
//   trên sở thích khai tay bên dưới. Đây là lựa chọn về dữ liệu cá nhân, nên nói rõ hệ quả chứ không
//   để một công tắc trống không.
// - Thể loại "không thích" khác với "không chọn": không chọn nghĩa là không ưu tiên, còn không thích
//   là chủ động đẩy ra khỏi gợi ý.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyProfile, updatePreferences } from '../../services/userServices'
import { getGenres, getMoods, getAtmospheres } from '../../services/catalogServices'

const ChipGroup = ({ label, hint, options, selected, onToggle, accent = false }) => (
  <div>
    <label className="text-sm font-medium text-ink">{label}</label>
    {hint && <p className="text-xs text-ink-mute mt-0.5">{hint}</p>}
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => {
        const chon = selected.includes(o.id)
        return (
          <button key={o.id} type="button" onClick={() => onToggle(o.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${chon
              ? accent
                ? 'bg-red-500/10 border-red-500/40 text-danger'
                : 'bg-sunken border-brand/40 text-brand-text'
              : 'bg-page border-line text-ink-soft hover:text-ink'}`}>
            {o.name}
          </button>
        )
      })}
    </div>
  </div>
)

const PreferencesTab = () => {
  const [catalog, setCatalog] = useState({ genres: [], moods: [], atmospheres: [] })
  const [form, setForm] = useState({
    genreIds: [], moodIds: [], atmosphereIds: [], dislikedGenreIds: [], enableAiConsent: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const toggle = (key, id) => setForm((p) => ({
    ...p,
    [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id],
  }))

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [g, m, a, me] = await Promise.allSettled([
        getGenres(), getMoods(), getAtmospheres(), getMyProfile(),
      ])
      const lay = (r) => (r.status === 'fulfilled' && r.value?.success ? r.value.data : [])
      setCatalog({ genres: lay(g), moods: lay(m), atmospheres: lay(a) })

      if (me.status === 'fulfilled' && me.value?.success) {
        const d = me.value.data
        setForm({
          genreIds: d.preferredGenreIds ?? d.genreIds ?? [],
          moodIds: d.preferredMoodIds ?? d.moodIds ?? [],
          atmosphereIds: d.preferredAtmosphereIds ?? d.atmosphereIds ?? [],
          dislikedGenreIds: d.dislikedGenreIds ?? [],
          enableAiConsent: d.aiConsent ?? d.enableAiConsent ?? true,
        })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được sở thích.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const luu = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updatePreferences(form)
      toast.success('Đã lưu sở thích.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được sở thích.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-brand-text" /></div>
  }

  return (
    <form onSubmit={luu} className="space-y-5">
      <div className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-brand-text mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">Cho phép gợi ý dựa trên lịch sử của tôi</p>
            <p className="text-xs text-ink-mute mt-1 leading-relaxed">
              Bật thì hệ thống dùng những buổi diễn bạn đã xem và đã mua vé để gợi ý chính xác hơn.
              Tắt thì chỉ gợi ý theo sở thích bạn tự chọn bên dưới.
            </p>
          </div>
          <label className="flex-shrink-0">
            <input type="checkbox" checked={form.enableAiConsent}
              onChange={(e) => setForm((p) => ({ ...p, enableAiConsent: e.target.checked }))}
              className="accent-brand w-4 h-4" />
          </label>
        </div>
      </div>

      <div className="bg-card border border-line rounded-xl p-6 space-y-6">
        <ChipGroup label="Thể loại yêu thích" options={catalog.genres}
          selected={form.genreIds} onToggle={(id) => toggle('genreIds', id)} />
        <ChipGroup label="Tâm trạng" options={catalog.moods}
          selected={form.moodIds} onToggle={(id) => toggle('moodIds', id)} />
        <ChipGroup label="Không gian" options={catalog.atmospheres}
          selected={form.atmosphereIds} onToggle={(id) => toggle('atmosphereIds', id)} />
        <ChipGroup label="Thể loại không muốn thấy" accent
          hint="Khác với việc không chọn: những thể loại này sẽ bị đẩy ra khỏi gợi ý."
          options={catalog.genres}
          selected={form.dislikedGenreIds} onToggle={(id) => toggle('dislikedGenreIds', id)} />
      </div>

      <button type="submit" disabled={isSaving}
        className="flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand rounded-lg font-bold hover:bg-brand-hover disabled:opacity-50">
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu sở thích
      </button>
    </form>
  )
}

export default PreferencesTab
