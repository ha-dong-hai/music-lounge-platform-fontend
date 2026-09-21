// src/components/owner/CustomCriteriaSection.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Tiêu chí riêng là thuộc tính do CHÍNH chủ phòng trà định nghĩa cho buổi diễn của mình (ví dụ
//   "có phục vụ rượu", "độ ồn"), nằm ngoài danh mục chung do Admin quản.
// - TẠO RỒI LÀ VĨNH VIỄN. Backend không có endpoint sửa, xoá, hay tắt tiêu chí — tạo là lệnh duy
//   nhất. Gõ sai một chữ trong tên thì tiêu chí đó ở lại mãi trên màn sửa của MỌI buổi diễn.
//   Vì vậy màn này chỉ có Xem và Thêm, và form cảnh báo trước khi thêm. Đây là giới hạn thật của
//   backend, không phải thiếu sót của giao diện — đừng dựng nút Sửa/Xoá rồi chờ API.
//
//   SẮP HẾT ĐÚNG — CẦN SỬA KHI BACKEND LÊN: MLACP-474 thêm PUT /custom-criteria/{id} với
//   { name, isActive }, và GET /custom-criteria?loungeId=..&includeInactive=true. Lúc đó câu cảnh
//   báo ở trên và dòng chữ đỏ trong form đều TRỞ THÀNH SAI (sửa tên được, tắt được — chỉ là vẫn
//   không xoá hẳn được, vì xoá sẽ bỏ lại giá trị mồ côi ở các buổi diễn đã gắn).
//   Đừng sửa trước khi nhánh đó lên: lúc này câu cảnh báo vẫn đúng, và nói với chủ phòng trà rằng
//   họ sửa được trong khi chưa sửa được thì tệ hơn là cảnh báo hơi thừa.
//   Key, DataType và Options vẫn KHÔNG sửa được kể cả sau bản đó — đổi chúng là làm sai kiểu hoặc
//   làm lạc toàn bộ giá trị đã gắn.
// - `key` là mã kỹ thuật dùng để tra cứu, `name` là tên hiển thị. Cả hai đều không sửa lại được.
// - `dataType` quyết định người dùng nhập gì:
//     Select  — options là danh sách lựa chọn, ví dụ ["VI","EN"]
//     Range   — options là khoảng, ví dụ {"min":0,"max":100,"step":5}
//     Boolean — có / không
//     Text    — chữ tự do
//   `options` gửi lên là MỘT CHUỖI (backend lưu nguyên chuỗi), không phải mảng hay object.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, X, ListFilter } from 'lucide-react'
import toast from 'react-hot-toast'
import { getLoungeCustomCriteria, createCustomCriteria } from '../../services/customCriteriaServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

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
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    if (!loungeId) return
    setIsLoading(true)
    try {
      const res = await getLoungeCustomCriteria(loungeId)
      if (res.success) setItems(res.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được tiêu chí riêng.')
    } finally {
      setIsLoading(false)
    }
  }, [loungeId])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ListFilter size={16} /> Tiêu chí riêng
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Thuộc tính riêng của phòng trà bạn, dùng để mô tả buổi diễn ngoài danh mục chung.
            Gán giá trị cho từng buổi diễn ở màn Poster &amp; cài đặt.
          </p>
        </div>
        {!moForm && (
          <button onClick={() => setMoForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 flex-shrink-0">
            <Plus size={14} /> Thêm tiêu chí
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center"><Loader2 size={22} className="animate-spin text-[#C3B665]" /></div>
      ) : items.length === 0 && !moForm ? (
        <p className="mt-4 text-sm text-gray-500">Chưa có tiêu chí riêng nào.</p>
      ) : (
        items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 bg-black/40 border border-gray-800 rounded-lg p-3">
                <div className="min-w-0">
                  <p className="text-sm text-white">{c.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5 font-mono break-all">{c.key}</p>
                  {c.options && <p className="text-xs text-gray-600 mt-0.5 break-all">{c.options}</p>}
                </div>
                <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs whitespace-nowrap flex-shrink-0">
                  {DATA_TYPES.find((d) => d.value === c.dataType)?.label ?? c.dataType}
                </span>
              </li>
            ))}
          </ul>
        )
      )}

      {moForm && (
        <form onSubmit={them} className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Tiêu chí mới</p>
            <button type="button" onClick={() => setMoForm(false)} className="p-1 text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Tên hiển thị <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="VD: Độ ồn" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Mã tiêu chí <span className="text-red-400">*</span></label>
              <input value={form.key} onChange={(e) => set('key', e.target.value)} className={`${inputCls} font-mono`} placeholder="VD: noise_level" />
              <p className="text-xs text-yellow-400/80 mt-1 leading-relaxed">
                Kiểm kỹ trước khi thêm: tiêu chí tạo rồi thì KHÔNG sửa, KHÔNG xoá và KHÔNG tắt được.
                Gõ sai là nó ở lại mãi trên màn sửa của mọi buổi diễn.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Kiểu dữ liệu</label>
            <select value={form.dataType} onChange={(e) => set('dataType', e.target.value)} className={inputCls}>
              {DATA_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {loaiHienTai?.optionsHint && (
            <div>
              <label className="text-xs text-gray-500">Tuỳ chọn</label>
              <input value={form.options} onChange={(e) => set('options', e.target.value)} className={`${inputCls} font-mono`} />
              <p className="text-xs text-gray-600 mt-1">{loaiHienTai.optionsHint}</p>
            </div>
          )}

          <button type="submit" disabled={isBusy}
            className="w-full py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {isBusy && <Loader2 size={16} className="animate-spin" />} Thêm tiêu chí
          </button>
        </form>
      )}
    </div>
  )
}

export default CustomCriteriaSection
