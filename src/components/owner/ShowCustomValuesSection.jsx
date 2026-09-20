// src/components/owner/ShowCustomValuesSection.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Gán giá trị cho các TIÊU CHÍ RIÊNG mà chính chủ phòng trà đã định nghĩa (xem
//   CustomCriteriaSection ở màn Hồ sơ phòng trà). Danh mục chung do Admin quản là chuyện khác.
// - GET /custom-criteria/shows/{showId}/values trả CẢ định nghĩa tiêu chí LẪN giá trị đã gán
//   ({criteriaId, name, key, dataType, options, criteriaIsActive, value}), nên màn này chỉ cần MỘT
//   lời gọi — không phải lấy danh sách tiêu chí rồi tự ghép giá trị.
// - GHI LÀ THAY THẾ TOÀN BỘ danh sách. Vì vậy form nạp sẵn mọi giá trị đang có và gửi lại tất cả:
//   bỏ sót một dòng là xoá mất giá trị của dòng đó.
// - TIÊU CHÍ ĐÃ TẮT (criteriaIsActive = false) VẪN ĐƯỢC TRẢ VỀ và vẫn phải hiện — hiện mờ thôi.
//   Lọc bỏ chúng rồi bấm Lưu là xoá mất giá trị cũ của những tiêu chí đó, vì ghi là thay thế toàn bộ.
// - `value` ĐỌC VỀ LÀ CHUỖI ĐÃ JSON-STRINGIFY: backend trả "\"Acoustic\"", tức chuỗi có cặp nháy
//   kép nằm bên trong. Đổ thẳng vào ô nhập là người dùng thấy cả dấu nháy. Phải gỡ một lớp — xem
//   docGiaTri() bên dưới.
// - CHIỀU GHI thì gửi chuỗi trần (validator backend chỉ đòi NotEmpty, tối đa 1000 ký tự). Nếu sau
//   này backend đổi sang đòi JSON-stringify ở chiều ghi thì phải sửa cả hai chiều cùng lúc, đừng
//   sửa một bên.
// - Ô để trống được bỏ khỏi payload thay vì gửi chuỗi rỗng — gửi rỗng là bị 422 cho cả lượt.
// - `dataType` quyết định ô nhập: Select (chọn trong options), Range (số trong khoảng), Boolean
//   (có/không), Text (chữ). `options` backend lưu là MỘT CHUỖI, nên phải tự đọc: mảng JSON cho
//   Select, object {min,max,step} cho Range. Chuỗi không đọc được thì rơi về ô chữ tự do chứ không
//   làm sập màn.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ListFilter, Save, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { getShowCustomValues, setShowCustomValues } from '../../services/customCriteriaServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

// Gỡ một lớp JSON cho giá trị đọc về. CHỈ gỡ khi chuỗi thật sự là một chuỗi JSON (mở và đóng bằng
// dấu nháy kép) — cố ý hẹp như vậy để không đụng vào giá trị số hay true/false, vốn hiện ra y hệt
// dù có gỡ hay không, và để giá trị trần (chưa từng qua JSON) đi thẳng qua không bị đổi.
const docGiaTri = (v) => {
  if (typeof v !== 'string') return v ?? ''
  if (!(v.startsWith('"') && v.endsWith('"'))) return v
  try {
    const da = JSON.parse(v)
    return typeof da === 'string' ? da : v
  } catch {
    return v
  }
}

// options là chuỗi do chủ phòng trà tự nhập lúc tạo tiêu chí → có thể không phải JSON hợp lệ.
// Không đọc được thì trả null và ô nhập rơi về chữ tự do.
const docOptions = (chuoi) => {
  if (!chuoi) return null
  try {
    return JSON.parse(chuoi)
  } catch {
    return null
  }
}

const ShowCustomValuesSection = ({ showId }) => {
  const [criteria, setCriteria] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [giaTri, setGiaTri] = useState({}) // { [criteriaId]: string }
  const [isBusy, setIsBusy] = useState(false)

  const load = useCallback(async () => {
    if (!showId) return
    setIsLoading(true)
    try {
      const res = await getShowCustomValues(showId)
      if (res.success) {
        const ds = res.data ?? []
        setCriteria(ds)
        // Nạp sẵn giá trị đang có. Phải nạp CẢ dòng của tiêu chí đã tắt, nếu không thì lần lưu sau
        // sẽ xoá mất giá trị của chúng (ghi là thay thế toàn bộ).
        const nhap = {}
        ds.forEach((c) => { nhap[c.criteriaId] = docGiaTri(c.value) })
        setGiaTri(nhap)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được tiêu chí riêng.')
    } finally {
      setIsLoading(false)
    }
  }, [showId])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const dat = (id, v) => setGiaTri((p) => ({ ...p, [id]: v }))

  const luu = async () => {
    // Chỉ gửi ô có điền: backend bắt value NotEmpty, gửi kèm ô rỗng là 422 cho cả lượt.
    const values = Object.entries(giaTri)
      .filter(([, v]) => String(v ?? '').trim() !== '')
      .map(([criteriaId, v]) => ({ criteriaId: Number(criteriaId), value: String(v).trim() }))

    // Ghi là thay thế toàn bộ, nên gửi danh sách rỗng là XOÁ HẾT giá trị — đó có thể là ý thật của
    // người dùng, không phải lỗi nhập liệu. Nhưng phải hỏi lại, vì bấm nhầm là mất sạch.
    if (values.length === 0) {
      const dangCoGiaTri = criteria.some((c) => docGiaTri(c.value) !== '')
      if (!dangCoGiaTri) {
        toast.error('Chưa điền tiêu chí nào.')
        return
      }
      if (!window.confirm('Mọi ô đang trống. Lưu bây giờ sẽ XOÁ HẾT giá trị tiêu chí của buổi diễn này. Tiếp tục?')) {
        return
      }
    }
    setIsBusy(true)
    try {
      await setShowCustomValues(showId, values)
      toast.success(`Đã lưu ${values.length} tiêu chí cho buổi diễn.`)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được tiêu chí.')
    } finally { setIsBusy(false) }
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 flex justify-center">
        <Loader2 size={22} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  // Chưa định nghĩa tiêu chí nào thì không bày một khối trống ra — nói chỗ để tạo.
  if (criteria.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <ListFilter size={16} /> Tiêu chí riêng
        </h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Phòng trà bạn chưa định nghĩa tiêu chí riêng nào. Tạo ở màn Hồ sơ phòng trà trước, rồi quay
          lại đây gán giá trị cho từng buổi diễn.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-base font-semibold text-white flex items-center gap-2">
        <ListFilter size={16} /> Tiêu chí riêng của buổi diễn
      </h3>

      {/* Ghi là thay thế toàn bộ — người dùng cần biết trước khi xoá trắng một ô */}
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
        Giá trị đang có đã được nạp sẵn. Bấm Lưu là ghi lại TOÀN BỘ danh sách dưới đây — xoá trắng
        một ô nghĩa là bỏ giá trị của tiêu chí đó.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {criteria.map((c) => {
          const opts = docOptions(c.options)
          const giaTriHienTai = giaTri[c.criteriaId] ?? ''
          const daTat = c.criteriaIsActive === false

          return (
            // Tiêu chí đã tắt vẫn hiện, chỉ mờ đi: bỏ nó khỏi form là lần lưu sau xoá mất giá trị.
            <div key={c.criteriaId} className={daTat ? 'opacity-60' : ''}>
              <label className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5">
                {c.name}
                <span className="text-gray-700 font-mono">{c.key}</span>
                {daTat && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 text-[10px]">
                    <EyeOff size={9} /> đã tắt
                  </span>
                )}
              </label>

              {c.dataType === 'Select' && Array.isArray(opts) ? (
                <select value={giaTriHienTai} onChange={(e) => dat(c.criteriaId, e.target.value)} className={inputCls}>
                  <option value="">— không đặt —</option>
                  {opts.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
                </select>
              ) : c.dataType === 'Boolean' ? (
                <select value={giaTriHienTai} onChange={(e) => dat(c.criteriaId, e.target.value)} className={inputCls}>
                  <option value="">— không đặt —</option>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              ) : c.dataType === 'Range' && opts && typeof opts === 'object' ? (
                <>
                  <input type="number" value={giaTriHienTai}
                    min={opts.min} max={opts.max} step={opts.step ?? 1}
                    onChange={(e) => dat(c.criteriaId, e.target.value)} className={inputCls} />
                  <p className="text-[11px] text-gray-600 mt-1">
                    Từ {opts.min} đến {opts.max}
                    {opts.step ? `, bước ${opts.step}` : ''}
                  </p>
                </>
              ) : (
                // Text, hoặc Select/Range mà options không đọc được → chữ tự do, tối đa 1000 ký tự
                <input value={giaTriHienTai} maxLength={1000}
                  onChange={(e) => dat(c.criteriaId, e.target.value)} className={inputCls} />
              )}
            </div>
          )
        })}
      </div>

      <button onClick={luu} disabled={isBusy}
        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold hover:bg-[#d4c87f] disabled:opacity-50">
        {isBusy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Lưu tiêu chí
      </button>
    </div>
  )
}

export default ShowCustomValuesSection
