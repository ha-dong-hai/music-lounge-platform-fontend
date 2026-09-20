// src/components/owner/ShowCustomValuesSection.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Gán giá trị cho các TIÊU CHÍ RIÊNG mà chính chủ phòng trà đã định nghĩa (xem
//   CustomCriteriaSection ở màn Hồ sơ phòng trà). Danh mục chung do Admin quản là chuyện khác.
// - BACKEND KHÔNG CÓ ENDPOINT ĐỌC LẠI GIÁ TRỊ ĐÃ GÁN. Chỉ có POST ghi. Nghĩa là mở màn này lên,
//   các ô LUÔN TRỐNG kể cả khi buổi diễn đã được gán giá trị trước đó — và POST là THAY THẾ toàn
//   bộ danh sách. Vì vậy màn này nói thẳng điều đó, và chỉ gửi những ô có điền.
//   Đừng "sửa" bằng cách nhớ giá trị trong localStorage: máy khác mở lên sẽ thấy khác nhau.
// - `value` phải KHÔNG RỖNG và tối đa 1000 ký tự (validator backend). Ô để trống được bỏ khỏi
//   payload thay vì gửi chuỗi rỗng — gửi rỗng là bị 422 cho cả lượt.
// - `dataType` quyết định ô nhập: Select (chọn trong options), Range (số trong khoảng), Boolean
//   (có/không), Text (chữ). `options` backend lưu là MỘT CHUỖI, nên phải tự đọc: mảng JSON cho
//   Select, object {min,max,step} cho Range. Chuỗi không đọc được thì rơi về ô chữ tự do chứ không
//   làm sập màn.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ListFilter, Save, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getLoungeCustomCriteria, setShowCustomValues } from '../../services/customCriteriaServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

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

const ShowCustomValuesSection = ({ loungeId, showId }) => {
  const [criteria, setCriteria] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [giaTri, setGiaTri] = useState({}) // { [criteriaId]: string }
  const [isBusy, setIsBusy] = useState(false)

  const load = useCallback(async () => {
    if (!loungeId) return
    setIsLoading(true)
    try {
      const res = await getLoungeCustomCriteria(loungeId)
      if (res.success) setCriteria(res.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được tiêu chí riêng.')
    } finally {
      setIsLoading(false)
    }
  }, [loungeId])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const dat = (id, v) => setGiaTri((p) => ({ ...p, [id]: v }))

  const luu = async () => {
    // Chỉ gửi ô có điền: backend bắt value NotEmpty, gửi kèm ô rỗng là 422 cho cả lượt.
    const values = Object.entries(giaTri)
      .filter(([, v]) => String(v ?? '').trim() !== '')
      .map(([criteriaId, v]) => ({ criteriaId: Number(criteriaId), value: String(v).trim() }))

    if (values.length === 0) {
      toast.error('Chưa điền tiêu chí nào.')
      return
    }
    setIsBusy(true)
    try {
      await setShowCustomValues(showId, values)
      toast.success(`Đã lưu ${values.length} tiêu chí cho buổi diễn.`)
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

      {/* Giới hạn thật của backend, không phải lỗi giao diện — nói trước để chủ không tưởng mất dữ liệu */}
      <p className="text-xs text-yellow-400/90 mt-2 flex items-start gap-1.5 leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
        <AlertTriangle size={13} className="mt-px flex-shrink-0" />
        Backend chưa có đường đọc lại giá trị đã gán, nên các ô dưới đây luôn trống khi mở màn — kể cả
        khi buổi diễn này đã được gán trước đó. Bấm Lưu là THAY THẾ toàn bộ: hãy điền lại đủ những
        tiêu chí bạn muốn giữ.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {criteria.map((c) => {
          const opts = docOptions(c.options)
          const giaTriHienTai = giaTri[c.id] ?? ''

          return (
            <div key={c.id}>
              <label className="text-xs text-gray-500">
                {c.name}
                <span className="text-gray-700 font-mono ml-1.5">{c.key}</span>
              </label>

              {c.dataType === 'Select' && Array.isArray(opts) ? (
                <select value={giaTriHienTai} onChange={(e) => dat(c.id, e.target.value)} className={inputCls}>
                  <option value="">— không đặt —</option>
                  {opts.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
                </select>
              ) : c.dataType === 'Boolean' ? (
                <select value={giaTriHienTai} onChange={(e) => dat(c.id, e.target.value)} className={inputCls}>
                  <option value="">— không đặt —</option>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              ) : c.dataType === 'Range' && opts && typeof opts === 'object' ? (
                <>
                  <input type="number" value={giaTriHienTai}
                    min={opts.min} max={opts.max} step={opts.step ?? 1}
                    onChange={(e) => dat(c.id, e.target.value)} className={inputCls} />
                  <p className="text-[11px] text-gray-600 mt-1">
                    Từ {opts.min} đến {opts.max}
                    {opts.step ? `, bước ${opts.step}` : ''}
                  </p>
                </>
              ) : (
                // Text, hoặc Select/Range mà options không đọc được → chữ tự do, tối đa 1000 ký tự
                <input value={giaTriHienTai} maxLength={1000}
                  onChange={(e) => dat(c.id, e.target.value)} className={inputCls} />
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
