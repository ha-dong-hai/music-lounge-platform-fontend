// src/components/account/PreferencesTab.jsx

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, Save, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyProfile, updatePreferences } from '../../services/userServices'
import { getGenres, getMoods, getAtmospheres } from '../../services/catalogServices'

const EMPTY_FORM = { genreIds: [], moodIds: [], atmosphereIds: [], dislikedGenreIds: [], enableAiConsent: true }

// So sánh theo String: BE trả GUID dạng string, phòng trường hợp catalog trả id dạng number —
// `selected.includes(o.id)` lệch kiểu sẽ không bao giờ khớp và chip không sáng.
const isSelected = (selected, id) => selected.some((x) => String(x) === String(id))

const ChipGroup = ({ label, hint, options, selected, onToggle, accent = false }) => (
  <div>
    <label className="text-sm font-medium text-ink">
      {label}
      {/* Số mục đang bật — nhìn label là biết có bao nhiêu lựa chọn đã lưu, khỏi phải đếm chip */}
      {selected.length > 0 && (
        <span className="ml-2 text-xs font-bold text-brand-text">{selected.length}</span>
      )}
    </label>
    {hint && <p className="text-xs text-ink-mute mt-0.5">{hint}</p>}
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => {
        const chon = isSelected(selected, o.id)
        return (
          <button key={o.id} type="button" onClick={() => onToggle(o.id)} aria-pressed={chon}
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
  const [form, setForm] = useState(EMPTY_FORM)
  // Bản chốt sau lần lưu gần nhất — để biết còn thay đổi nào chưa được lưu hay không.
  const [savedForm, setSavedForm] = useState(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const toggle = (key, id) => setForm((p) => {
    // ⚠️ CHẮN XUNG ĐỘT: một thể loại không thể vừa "yêu thích" vừa "không muốn thấy" —
    // hai nhóm này dùng chung catalog.genres nên người dùng dễ chọn trùng mà không để ý.
    // (Nếu backend đã tự xử lý trùng thì xoá block này, chỉ giữ phần return bên dưới.)
    if (key === 'genreIds' && !p.genreIds.includes(id) && p.dislikedGenreIds.includes(id)) {
      toast.error('Thể loại này đang nằm trong "không muốn thấy" — bỏ nó khỏi đó trước.')
      return p
    }
    if (key === 'dislikedGenreIds' && !p.dislikedGenreIds.includes(id) && p.genreIds.includes(id)) {
      toast.error('Thể loại này đang nằm trong "yêu thích" — bỏ nó khỏi đó trước.')
      return p
    }
    return {
      ...p,
      [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id],
    }
  })

  // Có thay đổi chưa lưu không? So JSON là đủ vì form chỉ chứa mảng id + boolean.
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  )

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      // Danh mục và hồ sơ là 2 nguồn ĐỘC LẬP (allSettled): danh mục lỗi thì vẫn sửa được
      // phần AI consent, hồ sơ lỗi thì tab không trắng trang mà hiện danh mục rỗng.
      const [g, m, a, me] = await Promise.allSettled([
        getGenres(), getMoods(), getAtmospheres(), getMyProfile(),
      ])
      const lay = (r) => (r.status === 'fulfilled' && r.value?.success ? r.value.data : [])
      setCatalog({ genres: lay(g), moods: lay(m), atmospheres: lay(a) })

      if (me.status === 'fulfilled' && me.value?.success) {
        const d = me.value.data
        // ĐỌC THEO TÊN THẬT CỦA GET /me (favourite*) — fallback tên cũ giữ lại
        // phòng khi BE sau này đồng bộ tên với PUT.
        const formTuBe = {
          genreIds: d.favouriteGenreIds ?? d.preferredGenreIds ?? d.genreIds ?? [],
          moodIds: d.favouriteMoodIds ?? d.preferredMoodIds ?? d.moodIds ?? [],
          atmosphereIds: d.favouriteAtmosphereIds ?? d.preferredAtmosphereIds ?? d.atmosphereIds ?? [],
          dislikedGenreIds: d.dislikedGenreIds ?? [],
          enableAiConsent: d.aiConsent ?? d.enableAiConsent ?? true,
        }
        setForm(formTuBe)
        setSavedForm(formTuBe)
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
    if (!isDirty || isSaving) return
    setIsSaving(true)
    try {
      // PUT /me/preferences nhận genreIds/moodIds/... — đúng contract, service không đổi.
      await updatePreferences(form)
      setSavedForm(form)
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

      {/* Lưu chỉ bật khi có thay đổi — không gửi PUT thừa, và người dùng không tưởng
          mình đã lưu trong khi chẳng có gì được gửi đi. */}
      <button type="submit" disabled={isSaving || !isDirty}
        className="flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand rounded-lg font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu sở thích
      </button>
    </form>
  )
}

export default PreferencesTab