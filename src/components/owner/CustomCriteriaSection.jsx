// src/components/owner/CustomCriteriaSection.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Tiêu chí riêng là thuộc tính do CHÍNH chủ phòng trà định nghĩa cho buổi diễn của mình (ví dụ
//   "có phục vụ rượu", "độ ồn"), nằm ngoài danh mục chung do Admin quản.
// - SỬA ĐƯỢC GÌ, KHÔNG SỬA ĐƯỢC GÌ (đã kiểm trên Azure sau bản deploy 21/09):
//     name     — sửa được.
//     isActive — bật/tắt được. Tắt thì tiêu chí biến khỏi danh sách chọn khi tạo buổi diễn, nhưng
//                GIÁ TRỊ ĐÃ GẮN cho các buổi diễn cũ VẪN CÒN NGUYÊN, không mất.
//     key / dataType / options — KHÔNG sửa được, và đó là cố ý: đổi chúng là làm sai kiểu hoặc làm
//                lạc toàn bộ giá trị đã gắn từ trước. Đừng dựng ô sửa rồi chờ API.
//   KHÔNG có lệnh xoá hẳn, cũng là cố ý: xoá sẽ bỏ lại giá trị mồ côi ở các buổi diễn đã gắn.
//   Tắt là cách đúng để cho một tiêu chí nghỉ hưu.
//   (Trước bản đó thì tạo xong là vĩnh viễn — không sửa, không tắt, không xoá. Nếu thấy chỗ nào
//    trong mã còn nói vậy thì là ghi chú cũ sót lại.)
// - `key` là mã kỹ thuật dùng để tra cứu, `name` là tên hiển thị. Cả hai đều không sửa lại được.
// - `dataType` quyết định người dùng nhập gì:
//     Select  — options là danh sách lựa chọn, ví dụ ["VI","EN"]
//     Range   — options là khoảng, ví dụ {"min":0,"max":100,"step":5}
//     Boolean — có / không
//     Text    — chữ tự do
//   `options` gửi lên là MỘT CHUỖI (backend lưu nguyên chuỗi), không phải mảng hay object.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, X, ListFilter, Pencil, Eye, EyeOff, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { getLoungeCustomCriteria, createCustomCriteria, updateCustomCriteria } from '../../services/customCriteriaServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

const DATA_TYPES = [
  { value: 'Select', label: 'Chọn một trong danh sách', optionsHint: 'Danh sách lựa chọn, ví dụ: ["Nhẹ","Vừa","Ồn"]' },
  { value: 'Range', label: 'Khoảng số', optionsHint: 'Khoảng giá trị, ví dụ: {"min":0,"max":100,"step":5}' },
  { value: 'Boolean', label: 'Có / không', optionsHint: '' },
  { value: 'Text', label: 'Chữ tự do', optionsHint: '' },
]

const CustomCriteriaSection = ({ loungeId }) => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [moForm, setMoForm] = useState(false)
  const [form, setForm] = useState({ name: '', key: '', dataType: 'Text', options: '' })
  const [isBusy, setIsBusy] = useState(false)
  // Xem cả tiêu chí đã tắt hay không. Mặc định KHÔNG: danh sách thường ngày chỉ nên có cái đang dùng.
  const [xemCaDaTat, setXemCaDaTat] = useState(false)
  const [suaTen, setSuaTen] = useState(null) // { id, name }
  const [busyId, setBusyId] = useState(null)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    if (!loungeId) return
    setIsLoading(true)
    try {
      const res = await getLoungeCustomCriteria(loungeId, xemCaDaTat)
      if (res.success) setItems(res.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được tiêu chí riêng.')
    } finally {
      setIsLoading(false)
    }
  }, [loungeId, xemCaDaTat])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // Sửa tên. PUT chỉ nhận { name, isActive } nên phải gửi lại isActive hiện tại, không thì tiêu chí
  // đang bật có thể bị tắt oan (và ngược lại).
  const luuTen = async (c) => {
    const ten = (suaTen?.name ?? '').trim()
    if (!ten) { toast.error('Tên không được để trống.'); return }
    setBusyId(c.id)
    try {
      await updateCustomCriteria(c.id, { name: ten, isActive: c.isActive !== false })
      toast.success('Đã đổi tên tiêu chí.')
      setSuaTen(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được tên.')
    } finally { setBusyId(null) }
  }

  // Bật/tắt. Tắt KHÔNG xoá giá trị đã gắn cho các buổi diễn cũ — nói rõ để chủ không sợ mất dữ liệu.
  const doiBatTat = async (c, bat) => {
    setBusyId(c.id)
    try {
      await updateCustomCriteria(c.id, { name: c.name, isActive: bat })
      toast.success(bat ? `Đã bật lại "${c.name}".` : `Đã tắt "${c.name}". Giá trị đã gắn vẫn còn.`)
      // Tắt trong lúc đang xem danh sách "chỉ cái đang dùng" thì nó biến mất khỏi màn — bật chế độ
      // xem cả tiêu chí đã tắt để người dùng thấy việc mình vừa làm, thay vì tưởng nó bị xoá.
      if (!bat && !xemCaDaTat) setXemCaDaTat(true)
      else await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được trạng thái.')
    } finally { setBusyId(null) }
  }

  const them = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.key.trim()) {
      toast.error('Cần điền tên hiển thị và mã tiêu chí.')
      return
    }
    setIsBusy(true)
    try {
      await createCustomCriteria({
        loungeId,
        name: form.name.trim(),
        key: form.key.trim(),
        dataType: form.dataType,
        options: form.options.trim() || null,
      })
      toast.success('Đã thêm tiêu chí.')
      setForm({ name: '', key: '', dataType: 'Text', options: '' })
      setMoForm(false)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thêm được tiêu chí.')
    } finally { setIsBusy(false) }
  }

  const loaiHienTai = DATA_TYPES.find((d) => d.value === form.dataType)

  return (
    <div className="bg-card border border-line rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <ListFilter size={16} /> Tiêu chí riêng
          </h3>
          <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">
            Thuộc tính riêng của phòng trà bạn, dùng để mô tả buổi diễn ngoài danh mục chung.
            Gán giá trị cho từng buổi diễn ở màn Poster &amp; cài đặt.
            Đổi được tên và bật/tắt; mã, kiểu dữ liệu và tuỳ chọn thì không. Tắt một tiêu chí KHÔNG
            xoá giá trị đã gắn cho các buổi diễn cũ.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button onClick={() => setXemCaDaTat((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${
              xemCaDaTat ? 'border-brand/40 bg-brand/10 text-brand-text' : 'border-line text-ink-soft hover:bg-sunken'
            }`}>
            {xemCaDaTat ? <Eye size={14} /> : <EyeOff size={14} />}
            {xemCaDaTat ? 'Đang xem cả đã tắt' : 'Xem cả đã tắt'}
          </button>
          {!moForm && (
            <button onClick={() => setMoForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
              <Plus size={14} /> Thêm tiêu chí
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center"><Loader2 size={22} className="animate-spin text-brand-text" /></div>
      ) : items.length === 0 && !moForm ? (
        <p className="mt-4 text-sm text-ink-mute">Chưa có tiêu chí riêng nào.</p>
      ) : (
        items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((c) => {
              const daTat = c.isActive === false
              const dangSua = suaTen?.id === c.id
              return (
                <li key={c.id}
                  className={`bg-sunken/70 border border-line rounded-lg p-3 ${daTat ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {dangSua ? (
                        // Chỉ sửa TÊN. Mã, kiểu dữ liệu và tuỳ chọn không sửa được nên không bày ô.
                        <div className="flex flex-wrap items-center gap-2">
                          <input value={suaTen.name}
                            onChange={(e) => setSuaTen((v) => ({ ...v, name: e.target.value }))}
                            className="flex-1 min-w-[10rem] px-2 py-1.5 bg-page border border-line rounded-md text-sm text-ink focus:outline-none focus:border-brand/50" />
                          <button onClick={() => luuTen(c)} disabled={busyId === c.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold disabled:opacity-50">
                            {busyId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu
                          </button>
                          <button onClick={() => setSuaTen(null)} disabled={busyId === c.id}
                            className="px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm text-ink">{c.name}</p>
                          {daTat && (
                            <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-mute text-xs">Đã tắt</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-ink-mute mt-0.5 font-mono break-all">{c.key}</p>
                      {c.options && <p className="text-xs text-ink-mute mt-0.5 break-all">{c.options}</p>}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs whitespace-nowrap">
                        {DATA_TYPES.find((d) => d.value === c.dataType)?.label ?? c.dataType}
                      </span>
                      {!dangSua && (
                        <>
                          <button onClick={() => setSuaTen({ id: c.id, name: c.name })}
                            disabled={busyId === c.id} title="Đổi tên hiển thị"
                            className="p-1.5 rounded-lg text-ink-mute hover:text-brand-text disabled:opacity-40">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => doiBatTat(c, daTat)} disabled={busyId === c.id}
                            title={daTat ? 'Bật lại' : 'Tắt (ẩn khỏi danh sách chọn khi tạo buổi diễn)'}
                            className={`p-1.5 rounded-lg text-ink-mute disabled:opacity-40 ${daTat ? 'hover:text-success' : 'hover:text-warning'}`}>
                            {daTat ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )
      )}

      {moForm && (
        <form onSubmit={them} className="mt-4 pt-4 border-t border-line space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Tiêu chí mới</p>
            <button type="button" onClick={() => setMoForm(false)} className="p-1 text-ink-mute hover:text-ink">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-mute">Tên hiển thị <span className="text-danger">*</span></label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="VD: Độ ồn" />
            </div>
            <div>
              <label className="text-xs text-ink-mute">Mã tiêu chí <span className="text-danger">*</span></label>
              <input value={form.key} onChange={(e) => set('key', e.target.value)} className={`${inputCls} font-mono`} placeholder="VD: noise_level" />
              <p className="text-xs text-warning/80 mt-1 leading-relaxed">
                Mã tiêu chí KHÔNG sửa lại được sau khi tạo (tên thì sửa được). Đổi mã là mất liên
                kết với giá trị đã gán cho các buổi diễn cũ, nên hãy gõ kỹ.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-mute">Kiểu dữ liệu</label>
            <select value={form.dataType} onChange={(e) => set('dataType', e.target.value)} className={inputCls}>
              {DATA_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {loaiHienTai?.optionsHint && (
            <div>
              <label className="text-xs text-ink-mute">Tuỳ chọn</label>
              <input value={form.options} onChange={(e) => set('options', e.target.value)} className={`${inputCls} font-mono`} />
              <p className="text-xs text-ink-mute mt-1">{loaiHienTai.optionsHint}</p>
            </div>
          )}

          <button type="submit" disabled={isBusy}
            className="w-full py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {isBusy && <Loader2 size={16} className="animate-spin" />} Thêm tiêu chí
          </button>
        </form>
      )}
    </div>
  )
}

export default CustomCriteriaSection
