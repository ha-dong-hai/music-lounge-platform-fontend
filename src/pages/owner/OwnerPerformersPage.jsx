// src/pages/owner/OwnerPerformersPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Nghệ sĩ do chủ phòng trà tạo và quản lý. Đây là đối tượng được thêm vào line-up buổi diễn, và
//   cũng là đối tượng NHẬN DONATE — nên mỗi nghệ sĩ có thể có tài khoản nhận tiền riêng
//   (quản lý ở /owner/bank-accounts, chọn đúng nghệ sĩ trong danh sách chủ sở hữu).
// - `contactEmail` không bắt buộc nhưng rất nên có: đó là nơi backend gửi liên kết để NGHỆ SĨ TỰ
//   XÁC NHẬN đã nhận tiền donate. Không có email thì không ai xác nhận được, và tiền donate mắc lại
//   ở bước chờ nghệ sĩ xác nhận.
// - PUT ghi đè toàn phần: form luôn gửi lại đủ name/type/genreIds/avatarUrl/bio/contactEmail.
// - Liên kết mạng xã hội chỉ có THÊM và XOÁ, backend không có endpoint sửa — muốn đổi thì xoá rồi
//   thêm lại. Đừng dựng nút "Sửa liên kết".
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Pencil, X, Music2, Mail, Link2, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getMyPerformers, getPerformerDetail, createPerformer, updatePerformer,
  addPerformerSocialLink, removePerformerSocialLink,
} from '../../services/performerServices'
import { getGenres } from '../../services/catalogServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

// `type` là chuỗi tự do ở phía backend; giới hạn sẵn mấy giá trị hay dùng để dữ liệu không loạn.
const PERFORMER_TYPES = ['Solo', 'Band', 'DJ', 'Group']

const PerformerFormModal = ({ initial, genres, onClose, onSaved }) => {
  const isEdit = !!initial
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? 'Solo',
    bio: initial?.bio ?? '',
    avatarUrl: initial?.avatarUrl ?? '',
    contactEmail: initial?.contactEmail ?? '',
    genreIds: initial?.genreIds ?? [],
  })
  const [isBusy, setIsBusy] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const toggleGenre = (id) => setForm((p) => ({
    ...p,
    genreIds: p.genreIds.includes(id) ? p.genreIds.filter((x) => x !== id) : [...p.genreIds, id],
  }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.type.trim()) {
      toast.error('Cần điền tên nghệ sĩ và loại hình.')
      return
    }
    setIsBusy(true)
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        bio: form.bio.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        genreIds: form.genreIds,
      }
      if (isEdit) {
        await updatePerformer(initial.id, payload)
        toast.success('Đã lưu nghệ sĩ.')
      } else {
        await createPerformer(payload)
        toast.success('Đã thêm nghệ sĩ.')
      }
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được nghệ sĩ.')
    } finally { setIsBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">{isEdit ? 'Sửa nghệ sĩ' : 'Thêm nghệ sĩ'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-mute">Tên nghệ sĩ <span className="text-danger">*</span></label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-ink-mute">Loại hình <span className="text-danger">*</span></label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                {PERFORMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-mute">Email liên lạc</label>
            <input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className={inputCls} />
            <p className="text-xs text-warning/80 mt-1 leading-relaxed">
              Nơi gửi liên kết để nghệ sĩ tự xác nhận đã nhận tiền donate. Không có email thì tiền donate
              sẽ mắc lại ở bước chờ nghệ sĩ xác nhận.
            </p>
          </div>

          <div>
            <label className="text-xs text-ink-mute">Giới thiệu</label>
            <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="text-xs text-ink-mute">Đường dẫn ảnh đại diện</label>
            <input value={form.avatarUrl} onChange={(e) => set('avatarUrl', e.target.value)} className={inputCls} placeholder="https://..." />
          </div>

          <div>
            <label className="text-xs text-ink-mute">Thể loại nhạc</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {genres.map((g) => {
                const chon = form.genreIds.includes(g.id)
                return (
                  <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${chon
                      ? 'bg-sunken border-brand/40 text-brand-text'
                      : 'bg-page border-line text-ink-soft hover:text-ink'}`}>
                    {g.name}
                  </button>
                )
              })}
            </div>
          </div>

          <button type="submit" disabled={isBusy}
            className="w-full py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {isBusy && <Loader2 size={16} className="animate-spin" />} Lưu
          </button>
        </form>
      </div>
    </div>
  )
}

const SocialLinksModal = ({ performer, onClose, onSaved }) => {
  const [links, setLinks] = useState(performer.socialLinks ?? [])
  const [form, setForm] = useState({ platform: '', url: '', displayName: '' })
  const [isBusy, setIsBusy] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const them = async (e) => {
    e.preventDefault()
    if (!form.platform.trim() || !form.url.trim()) {
      toast.error('Cần điền nền tảng và đường dẫn.')
      return
    }
    setIsBusy(true)
    try {
      await addPerformerSocialLink(performer.id, {
        platform: form.platform.trim(),
        url: form.url.trim(),
        displayName: form.displayName.trim() || null,
      })
      const moi = await getPerformerDetail(performer.id)
      if (moi.success) setLinks(moi.data.socialLinks ?? [])
      setForm({ platform: '', url: '', displayName: '' })
      toast.success('Đã thêm liên kết.')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thêm được liên kết.')
    } finally { setIsBusy(false) }
  }

  const xoa = async (linkId) => {
    setIsBusy(true)
    try {
      await removePerformerSocialLink(performer.id, linkId)
      setLinks((p) => p.filter((l) => l.id !== linkId))
      toast.success('Đã xoá liên kết.')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xoá được liên kết.')
    } finally { setIsBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink truncate">Liên kết của {performer.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft flex-shrink-0"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {links.length === 0 ? (
            <p className="text-sm text-ink-mute">Chưa có liên kết nào.</p>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 bg-sunken/70 border border-line rounded-lg p-3">
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium">{l.platform}</p>
                    <a href={l.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-brand-text hover:underline truncate block">{l.displayName || l.url}</a>
                  </div>
                  <button onClick={() => xoa(l.id)} disabled={isBusy}
                    className="p-2 rounded-lg text-danger hover:bg-red-500/10 disabled:opacity-40 flex-shrink-0" title="Xoá">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Backend chỉ có Thêm và Xoá — muốn đổi thì xoá rồi thêm lại. */}
          <form onSubmit={them} className="pt-4 border-t border-line space-y-3">
            <p className="text-xs text-ink-mute">Thêm liên kết mới. Muốn sửa một liên kết thì xoá rồi thêm lại.</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.platform} onChange={(e) => set('platform', e.target.value)}
                placeholder="Nền tảng (VD: Facebook)" className={`${inputCls} mt-0`} />
              <input value={form.displayName} onChange={(e) => set('displayName', e.target.value)}
                placeholder="Tên hiển thị" className={`${inputCls} mt-0`} />
            </div>
            <input value={form.url} onChange={(e) => set('url', e.target.value)}
              placeholder="https://..." className={`${inputCls} mt-0`} />
            <button type="submit" disabled={isBusy}
              className="w-full py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken flex items-center justify-center gap-2 disabled:opacity-50">
              {isBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Thêm liên kết
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const OwnerPerformersPage = () => {
  const [performers, setPerformers] = useState([])
  const [genres, setGenres] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState(undefined)
  const [linksOf, setLinksOf] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pRes, gRes] = await Promise.allSettled([
        getMyPerformers({ pageSize: 100 }),
        getGenres(),
      ])
      if (pRes.status === 'fulfilled' && pRes.value?.success) {
        const ds = pRes.value.data
        setPerformers((Array.isArray(ds) ? ds : ds?.items) ?? [])
      }
      if (gRes.status === 'fulfilled' && gRes.value?.success) {
        setGenres(gRes.value.data ?? [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách nghệ sĩ.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // Danh sách không chắc có socialLinks/contactEmail — lấy bản chi tiết trước khi mở form sửa,
  // vì PUT ghi đè toàn phần, nạp thiếu là xoá mất dữ liệu.
  const moSua = async (p) => {
    try {
      const res = await getPerformerDetail(p.id)
      setEditing(res.success ? res.data : p)
    } catch {
      setEditing(p)
    }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Nghệ sĩ</h1>
          <p className="text-ink-soft text-sm leading-relaxed">
            Nghệ sĩ bạn quản lý, để thêm vào line-up buổi diễn. Đây cũng là đối tượng nhận tiền donate.
          </p>
        </div>
        <button onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-on-brand rounded-lg text-xs font-bold hover:bg-brand-hover">
          <Plus size={14} /> Thêm nghệ sĩ
        </button>
      </div>

      {performers.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-10 text-center">
          <Music2 size={28} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">Chưa có nghệ sĩ nào. Thêm nghệ sĩ để dựng line-up cho buổi diễn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {performers.map((p) => (
            <div key={p.id} className="bg-card border border-line rounded-xl p-5">
              <div className="flex items-start gap-3">
                {p.avatarUrl
                  ? <img src={p.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center flex-shrink-0">
                      <Music2 size={18} className="text-ink-mute" />
                    </div>}
                <div className="min-w-0">
                  <p className="text-ink font-bold truncate">{p.name}</p>
                  <p className="text-xs text-ink-mute">{p.type}</p>
                </div>
              </div>

              {p.bio && <p className="text-xs text-ink-mute mt-3 line-clamp-2">{p.bio}</p>}

              {(p.genreNames?.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.genreNames.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs">{g}</span>
                  ))}
                </div>
              )}

              {!p.contactEmail && (
                <p className="mt-3 text-xs text-warning/80 flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                  Chưa có email liên lạc — nghệ sĩ này không tự xác nhận được tiền donate.
                </p>
              )}
              {p.contactEmail && (
                <p className="mt-3 text-xs text-ink-mute flex items-center gap-1.5 truncate">
                  <Mail size={12} className="flex-shrink-0" /> {p.contactEmail}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button onClick={() => moSua(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                  <Pencil size={13} /> Sửa
                </button>
                <button onClick={() => setLinksOf(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                  <Link2 size={13} /> Liên kết
                  {p.socialLinks?.length > 0 && <span className="text-ink-mute">({p.socialLinks.length})</span>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <PerformerFormModal initial={editing} genres={genres}
          onClose={() => setEditing(undefined)} onSaved={load} />
      )}
      {linksOf && (
        <SocialLinksModal performer={linksOf} onClose={() => setLinksOf(null)} onSaved={load} />
      )}
    </div>
  )
}

export default OwnerPerformersPage
