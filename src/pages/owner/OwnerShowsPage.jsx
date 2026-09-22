// src/pages/owner/OwnerShowsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Buổi diễn mới luôn sinh ra ở trạng thái Draft và chỉ sửa được khi CÒN Draft. Đã gửi duyệt
//   (Pending) hoặc đã đăng (Published) thì backend từ chối PUT — nên nút Sửa tự ẩn theo trạng thái.
// - PUT /lounge-shows/{id} là ghi đè TOÀN PHẦN 9 trường, không phải vá từng trường: trường nào
//   không gửi là bị ghi thành null / mặc định. Nên form SỬA phải nạp đủ giá trị hiện có rồi gửi lại.
//   KHÔNG có DTO đọc nào chứa đủ 9 trường đó, nên phải ghép hai nguồn (xem openEdit):
//     * GET /lounge-shows/{id} (chi tiết): description, scheduledEnd, ticketSaleClosesAt, refundPolicy
//     * item của /lounge-shows/mine (danh sách): offlineQuota, onlineQuota
//     * categoryId: KHÔNG DTO nào trả — form cảnh báo người dùng chọn lại, nếu không sẽ bị xoá.
//   Trước đây form nạp thẳng từ item danh sách và gán cứng ticketSaleClosesAt = null, nên mỗi lần
//   Sửa đều âm thầm xoá giờ kết thúc, danh mục, mốc đóng bán vé và đưa chính sách hoàn tiền về mặc định.
// - Điều kiện gửi duyệt nằm ở backend (>=1 hạng vé, >=1 nghệ sĩ, đã khai văn bản chấp thuận, nộp
//   trước tối thiểu N ngày làm việc). FE KHÔNG đoán trước các điều kiện này — cứ gửi và hiển thị
//   nguyên văn lý do 422 backend trả về, tránh hai nơi cùng định nghĩa luật rồi lệch nhau.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Loader2, Pencil, Send, X, Trash2, Settings2, CalendarDays, Image as ImageIcon } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getMyShows, getShowDetail, createShow, updateShow, submitShow, cancelShow, deleteShow,
} from '../../services/showServices'
import { getLounges } from '../../services/loungeServices'
import { getGenres, getMoods, getAtmospheres, getEventCategories } from '../../services/catalogServices'

const STATUS_STYLES = {
  Draft: 'bg-line-strong/10 text-ink-soft border-line-strong/30',
  Pending: 'bg-yellow-500/10 text-warning border-yellow-500/30',
  Published: 'bg-green-500/10 text-success border-green-500/30',
  Ongoing: 'bg-red-500/10 text-danger border-red-500/30',
  Ended: 'bg-line/20 text-ink-mute border-line/40',
  Cancelled: 'bg-red-900/20 text-danger border-red-900/40',
}
const STATUS_LABELS = {
  Draft: 'Nháp', Pending: 'Chờ duyệt', Published: 'Đã đăng',
  Ongoing: 'Đang diễn ra', Ended: 'Đã kết thúc', Cancelled: 'Đã huỷ',
}

const FORMATS = [
  { value: 'Offline', label: 'Tại chỗ' },
  { value: 'Online', label: 'Trực tuyến' },
  { value: 'Hybrid', label: 'Cả hai' },
]

const emptyForm = {
  name: '', description: '', format: 'Offline',
  scheduledStart: '', scheduledEnd: '',
  categoryId: '', offlineQuota: '', onlineQuota: '',
  genreIds: [], moodIds: [], atmosphereIds: [],
}

// Ô chọn nhiều — dùng chung cho thể loại / tâm trạng / không gian
const MultiPick = ({ label, options, selected, onToggle }) => (
  <div>
    <p className="text-xs text-ink-mute mb-2">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${on
              ? 'bg-brand text-on-brand border-brand'
              : 'border-line text-ink-soft hover:border-line-strong'}`}
          >
            {o.name}
          </button>
        )
      })}
    </div>
  </div>
)

// Gửi lại chính sách hoàn tiền ĐANG CÓ, vì PUT bỏ trống 3 trường này là đưa về mặc định (cho huỷ,
// hoàn 100%, không hạn) — chủ đã đặt "không hoàn vé" bấm Sửa để đổi tên là chính sách thành hoàn 100%.
// BẪY: refundPolicy trong DTO chi tiết là giá trị ĐÃ SUY RA — refundPercentage luôn có số (mặc định 100)
// kể cả khi không cho huỷ. Mà TicketRefundPolicy.Validate TỪ CHỐI "không cho huỷ" đi kèm tỉ lệ hoặc hạn
// huỷ (422). Gửi nguyên giá trị đọc được thì mọi buổi "không hoàn vé" sẽ không lưu được nữa.
const refundPolicyPayload = (rp) => {
  if (!rp) return {}
  if (!rp.cancellationAllowed) {
    return { cancellationAllowed: false, refundPercentage: null, cancellationDeadlineHours: null }
  }
  return {
    cancellationAllowed: true,
    refundPercentage: rp.refundPercentage,
    cancellationDeadlineHours: rp.deadlineHoursBeforeStart ?? null,
  }
}

const ShowFormModal = ({ initial, loungeId, catalog, onClose, onSaved }) => {
  const isEdit = !!initial
  const [form, setForm] = useState(() => initial ? {
    name: initial.name ?? '',
    description: initial.description ?? '',
    format: initial.format ?? 'Offline',
    // input datetime-local không nhận chuỗi có offset — cắt về dạng YYYY-MM-DDTHH:mm
    scheduledStart: initial.scheduledStart ? dayjs(initial.scheduledStart).format('YYYY-MM-DDTHH:mm') : '',
    scheduledEnd: initial.scheduledEnd ? dayjs(initial.scheduledEnd).format('YYYY-MM-DDTHH:mm') : '',
    categoryId: initial.categoryId ?? '',
    offlineQuota: initial.offlineQuota ?? '',
    onlineQuota: initial.onlineQuota ?? '',
    genreIds: (initial.genres ?? []).map((g) => g.id),
    moodIds: (initial.moods ?? []).map((m) => m.id),
    atmosphereIds: (initial.atmospheres ?? []).map((a) => a.id),
    // Không có ô nhập trên form — giữ để gửi lại nguyên vẹn, không để PUT ghi đè thành null/mặc định.
    ticketSaleClosesAt: initial.ticketSaleClosesAt ?? null,
    refundPolicy: initial.refundPolicy ?? null,
  } : emptyForm)
  // DTO chi tiết không trả categoryId, nên khi sửa ta KHÔNG biết danh mục hiện tại. Khi nào backend
  // trả trường này thì cảnh báo tự biến mất.
  const isCategoryUnknown = isEdit && initial.categoryId === undefined
  const [isBusy, setIsBusy] = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const toggle = (k, id) => setForm((p) => ({
    ...p, [k]: p[k].includes(id) ? p[k].filter((x) => x !== id) : [...p[k], id],
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.description.trim() || !form.scheduledStart) {
      toast.error('Cần điền tên, mô tả và thời gian bắt đầu.')
      return
    }
    setIsBusy(true)
    try {
      const num = (v) => (v === '' || v === null ? null : Number(v))
      if (isEdit) {
        await updateShow(initial.id, {
          showId: initial.id,
          name: form.name.trim(),
          description: form.description.trim(),
          scheduledStart: new Date(form.scheduledStart).toISOString(),
          scheduledEnd: form.scheduledEnd ? new Date(form.scheduledEnd).toISOString() : null,
          ticketSaleClosesAt: form.ticketSaleClosesAt,
          categoryId: num(form.categoryId),
          offlineQuota: num(form.offlineQuota),
          onlineQuota: num(form.onlineQuota),
          ...refundPolicyPayload(form.refundPolicy),
        })
        toast.success('Đã lưu buổi diễn.')
      } else {
        await createShow({
          loungeId,
          name: form.name.trim(),
          description: form.description.trim(),
          format: form.format,
          scheduledStart: new Date(form.scheduledStart).toISOString(),
          scheduledEnd: form.scheduledEnd ? new Date(form.scheduledEnd).toISOString() : null,
          categoryId: num(form.categoryId),
          offlineQuota: num(form.offlineQuota),
          onlineQuota: num(form.onlineQuota),
          genreIds: form.genreIds,
          moodIds: form.moodIds,
          atmosphereIds: form.atmosphereIds,
          performances: [],
        })
        toast.success('Đã tạo buổi diễn ở trạng thái Nháp.')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">{isEdit ? 'Sửa buổi diễn' : 'Tạo buổi diễn'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs text-ink-mute">Tên buổi diễn *</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
          </div>

          <div>
            <label className="text-xs text-ink-mute">Mô tả *</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-mute">Bắt đầu *</label>
              <input type="datetime-local" value={form.scheduledStart} onChange={(e) => set('scheduledStart', e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
            </div>
            <div>
              <label className="text-xs text-ink-mute">Kết thúc</label>
              <input type="datetime-local" value={form.scheduledEnd} onChange={(e) => set('scheduledEnd', e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              {/* Hình thức chốt lúc tạo — đổi sau phải qua endpoint riêng PUT /format */}
              <label className="text-xs text-ink-mute">Hình thức {isEdit && '(không đổi ở đây)'}</label>
              <select value={form.format} onChange={(e) => set('format', e.target.value)} disabled={isEdit}
                className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink disabled:opacity-50">
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-mute">Sức chứa tại chỗ</label>
              <input type="number" min="1" value={form.offlineQuota} onChange={(e) => set('offlineQuota', e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
            </div>
            <div>
              <label className="text-xs text-ink-mute">Sức chứa trực tuyến</label>
              <input type="number" min="1" value={form.onlineQuota} onChange={(e) => set('onlineQuota', e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-mute">Danh mục</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink">
              <option value="">— không chọn —</option>
              {catalog.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {isCategoryUnknown && (
              <p className="mt-1 text-xs text-warning">
                Hệ thống chưa đọc lại được danh mục hiện tại của buổi diễn. Hãy chọn lại — để trống thì
                danh mục sẽ bị xoá khi lưu.
              </p>
            )}
          </div>

          {/* Thẻ phân loại chỉ đặt được lúc tạo — backend không nhận chúng trong PUT sửa */}
          {!isEdit && (
            <div className="space-y-4 pt-2 border-t border-line">
              <MultiPick label="Thể loại nhạc" options={catalog.genres} selected={form.genreIds} onToggle={(id) => toggle('genreIds', id)} />
              <MultiPick label="Tâm trạng" options={catalog.moods} selected={form.moodIds} onToggle={(id) => toggle('moodIds', id)} />
              <MultiPick label="Không gian" options={catalog.atmospheres} selected={form.atmosphereIds} onToggle={(id) => toggle('atmosphereIds', id)} />
            </div>
          )}
        </form>

        <div className="p-5 border-t border-line flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken">Huỷ</button>
          <button onClick={handleSubmit} disabled={isBusy}
            className="px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-50">
            {isBusy ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Tạo'}
          </button>
        </div>
      </div>
    </div>
  )
}

const OwnerShowsPage = () => {
  const [shows, setShows] = useState([])
  const [lounge, setLounge] = useState(null)
  const [catalog, setCatalog] = useState({ genres: [], moods: [], atmospheres: [], categories: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [editing, setEditing] = useState(undefined) // undefined = đóng, null = tạo mới, object = sửa

  // KHÔNG nạp form sửa từ item danh sách: nó thiếu description, scheduledEnd, ticketSaleClosesAt và
  // refundPolicy, mà PUT ghi đè toàn phần. Lấy bản chi tiết rồi ghép thêm hai sức chứa — hai trường
  // này ngược lại chỉ có ở danh sách, không có trong chi tiết.
  const openEdit = async (item) => {
    setBusyId(item.id)
    try {
      const res = await getShowDetail(item.id)
      if (res.success) {
        setEditing({ ...res.data, offlineQuota: item.offlineQuota, onlineQuota: item.onlineQuota })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được chi tiết buổi diễn để sửa.')
    } finally {
      setBusyId(null)
    }
  }

  const loadShows = useCallback(async () => {
    try {
      const res = await getMyShows({ pageSize: 100 })
      if (res.success) setShows(res.data.items)
    } catch {
      toast.error('Không tải được danh sách buổi diễn.')
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      try {
        const [lRes, g, m, a, c] = await Promise.all([
          getLounges({ mine: true }), getGenres(), getMoods(), getAtmospheres(), getEventCategories(),
        ])
        const list = lRes.data?.items || lRes.data || []
        if (list.length) setLounge(list[0])
        setCatalog({
          genres: g.data || [], moods: m.data || [],
          atmospheres: a.data || [], categories: c.data || [],
        })
        await loadShows()
      } catch {
        toast.error('Không tải được dữ liệu.')
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [loadShows])

  const act = async (id, fn, okMsg) => {
    setBusyId(id)
    try {
      await fn(id)
      toast.success(okMsg)
      await loadShows()
    } catch (err) {
      // Lý do 422 của backend rất cụ thể (thiếu hạng vé / thiếu nghệ sĩ / chưa khai văn bản /
      // nộp quá sát ngày) — hiển thị nguyên văn, đừng rút gọn.
      toast.error(err.response?.data?.message || 'Thao tác thất bại.', { duration: 6000 })
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  if (!lounge) {
    return (
      <div className="bg-card border border-line rounded-xl p-8 text-center text-ink-mute">
        Tài khoản này chưa sở hữu phòng trà nào nên chưa tạo được buổi diễn.
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Buổi diễn</h1>
          <p className="text-ink-soft text-sm">{lounge.name}</p>
        </div>
        <button onClick={() => setEditing(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover">
          <Plus size={16} /> Tạo buổi diễn
        </button>
      </div>

      {shows.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-10 text-center">
          <CalendarDays size={32} className="mx-auto text-ink-mute mb-3" />
          <p className="text-ink-soft text-sm">Chưa có buổi diễn nào. Bấm "Tạo buổi diễn" để bắt đầu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shows.map((s) => {
            const isDraft = s.status === 'Draft'
            const isBusy = busyId === s.id
            return (
              <div key={s.id} className="bg-card border border-line rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-ink font-bold">{s.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLES[s.status] || STATUS_STYLES.Draft}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs">
                        {FORMATS.find((f) => f.value === s.format)?.label || s.format}
                      </span>
                    </div>
                    <p className="text-ink-mute text-xs mt-1">
                      {dayjs(s.scheduledStart).format('HH:mm DD/MM/YYYY')}
                      {s.minPrice != null && ` · từ ${Number(s.minPrice).toLocaleString('vi-VN')}đ`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/owner/shows/${s.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                      <Settings2 size={14} /> Chuẩn bị & gửi duyệt
                    </Link>

                    {/* Poster, dời lịch, đổi hình thức, chế độ phát — những thứ đổi được SAU khi đã đăng */}
                    <Link to={`/owner/shows/${s.id}/settings`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                      <ImageIcon size={14} /> Poster & cài đặt
                    </Link>

                    {isDraft && (
                      <button onClick={() => openEdit(s)} disabled={isBusy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken disabled:opacity-50">
                        <Pencil size={14} /> Sửa
                      </button>
                    )}

                    {isDraft && (
                      <button onClick={() => act(s.id, submitShow, 'Đã gửi duyệt.')} disabled={isBusy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-hover disabled:opacity-50">
                        <Send size={14} /> Gửi duyệt
                      </button>
                    )}

                    {s.status === 'Published' && (
                      <button onClick={() => act(s.id, cancelShow, 'Đã huỷ buổi diễn, vé đã bán sẽ được hoàn 100%.')} disabled={isBusy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 text-danger text-xs font-bold hover:bg-red-500/10 disabled:opacity-50">
                        <X size={14} /> Huỷ buổi diễn
                      </button>
                    )}

                    {isDraft && (
                      <button onClick={() => act(s.id, deleteShow, 'Đã xoá bản nháp.')} disabled={isBusy}
                        className="p-1.5 rounded-lg border border-line text-ink-mute hover:text-danger hover:border-red-500/40 disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing !== undefined && (
        <ShowFormModal
          initial={editing}
          loungeId={lounge.id}
          catalog={catalog}
          onClose={() => setEditing(undefined)}
          onSaved={loadShows}
        />
      )}
    </div>
  )
}

export default OwnerShowsPage
