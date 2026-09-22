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
// - `criteriaIsActive = false` LÀ TRẠNG THÁI THẬT: chủ phòng trà tắt được tiêu chí ở màn Hồ sơ
//   phòng trà. Tắt KHÔNG xoá giá trị đã gắn — nên dòng đó vẫn về đây và vẫn phải hiện (mờ đi).
//   Lọc bỏ nó rồi bấm Lưu là xoá mất giá trị cũ, vì ghi là THAY THẾ TOÀN BỘ. Quy tắc chung: dù vì
//   lý do gì mà một dòng biến mất khỏi form, lần Lưu kế tiếp sẽ xoá giá trị của dòng đó.
// - `validationError` (mỗi dòng) LÀ NGUỒN ĐÚNG về việc giá trị ĐANG LƯU có hợp lệ không: null là
//   hợp lệ, khác null là MẢNH lý do, ghép với `name` cùng dòng thành câu. Nó tính bằng ĐÚNG hàm mà
//   lệnh ghi dùng để từ chối, nên không thể có chuyện màn hình báo hợp lệ mà lưu lại bị 422.
//   VÌ SAO PHẢI DÙNG NÓ THAY VÌ TỰ SUY: luật đó từng có hai bản (máy chủ và màn này) và hai bản ĐÃ
//   TỪNG LỆCH ở hai ca thật, chỉ lộ ra khi so từng bước bằng tay.
//   NHƯNG NÓ CHỈ ĐÚNG VỚI GIÁ TRỊ LÚC NẠP. Người dùng gõ xong thì nó cũ ngay — nên chỉ dùng khi ô
//   chưa bị sửa, còn ô đã sửa thì dùng kiemTraGiaTri() tại chỗ. Xem loiCuaDong().
//
//   ĐỪNG XOÁ NHÁNH HIỆN CẢNH BÁO VÌ "THỬ MÃI KHÔNG THẤY NÓ CHẠY". Sau khi máy chủ có hàng rào kiểu
//   dữ liệu (MLACP-470) và hàng rào hình dạng options (MLACP-472), KHÔNG CÒN ĐƯỜNG API NÀO ghi được
//   một giá trị sai vào cơ sở dữ liệu nữa — bên backend đã thử gửi giá trị sai và bị từ chối 422.
//   Nghĩa là `validationError` từ nay chỉ khác null với DÒNG DỮ LIỆU CŨ ghi trước khi có hàng rào.
//   Trên dữ liệu sống bạn sẽ luôn thấy null, và đó là TIN TỐT chứ không phải nhánh chết.
//   Muốn thử nhánh này thì phải có một dòng cũ, hoặc sửa thẳng dưới cơ sở dữ liệu — không thử được
//   qua giao diện, và cũng không nên tìm cách thử được.
// - `value` đi và về đều là CHUỖI TRẦN. Backend lưu y nguyên chuỗi gửi lên, không bọc JSON.
//   Dữ liệu CŨ thì có dòng còn ở dạng JSON đóng gói ("\"Bolero\""), và máy chủ bóc một lớp nháy
//   trước khi đối chiếu — nên màn này phải bóc y hệt, xem boMotLopNhay() / chuanHoaSoKhop().
// - KIỂM KIỂU DỮ LIỆU CÓ Ở CẢ HAI PHÍA, và hai phía làm hai việc khác nhau — đừng bỏ bên nào:
//     Máy chủ (MLACP-470) TỪ CHỐI 422 khi giá trị không khớp `dataType`. Đây là chỗ bảo đảm thật,
//       vì nó chặn cả người gọi thẳng API.
//     kiemTraGiaTri() ở đây báo lỗi NGAY, trước khi gửi, và báo TẤT CẢ lỗi một lượt. Đây là chỗ cho
//       người dùng biết sai gì mà không phải đợi một vòng mạng rồi đọc một câu 422.
//   Luật hai bên phải khớp nhau. Nếu sau này máy chủ đổi luật thì sửa ở đây cùng lúc, nếu không thì
//   hoặc người dùng bị chặn thứ máy chủ cho qua, hoặc bấm Lưu xong mới nhận 422.
// - ĐỐI CHIẾU VỚI CustomCriteriaValue.cs (đã đọc mã nguồn, không đoán):
//     Range  — máy chủ kiểm "phải là số" TRƯỚC rồi mới đọc khoảng; options hỏng chỉ bỏ phần min/max
//              chứ KHÔNG cho chữ đi qua. Màn này làm y hệt.
//     Select — máy chủ chỉ đối chiếu khi options là MẢNG TOÀN CHUỖI; mảng số hay dạng lạ thì bỏ
//              kiểm HOÀN TOÀN, nghĩa là một tiêu chí ô chọn mà mọi chuỗi đều lọt. Đừng nghĩ đó chỉ
//              là "FE nghiêm hơn, vô hại" — mình đã kết luận nhầm như vậy một lần. Bản chặn hình
//              dạng options ở lệnh TẠO tiêu chí đã lên cùng đợt deploy 21/09, nên tiêu chí TẠO MỚI
//              không dựng được kiểu đó nữa; tiêu chí CŨ thì vẫn còn, nên phần đối chiếu phải giữ.
//     Boolean— máy chủ dùng bool.TryParse nên nhận cả "True"/"TRUE". Màn này chỉ sinh ra chữ thường,
//              nhưng dữ liệu CŨ có thể đang là "True" — xem chuanHoaGiaTri() để biết vì sao phải
//              hạ chữ thường lúc NẠP, chứ không phải lúc gửi.
// - Máy chủ bóc MỘT lớp nháy kép trước khi kiểm, nên gửi chuỗi trần (cách màn này làm) hay chuỗi
//   bọc nháy đều qua được. Cứ gửi trần cho thẳng.
// - Ô để trống được bỏ khỏi payload thay vì gửi chuỗi rỗng — gửi rỗng là bị 422 cho cả lượt.
// - `dataType` quyết định ô nhập: Select (chọn trong options), Range (số trong khoảng), Boolean
//   (có/không), Text (chữ). `options` backend lưu là MỘT CHUỖI, nên phải tự đọc: mảng JSON cho
//   Select, object {min,max,step} cho Range. Chuỗi không đọc được thì rơi về ô chữ tự do chứ không
//   làm sập màn.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ListFilter, Save, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { getShowCustomValues, setShowCustomValues } from '../../services/customCriteriaServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

// BẢN SAO CHÍNH XÁC luật chuẩn hoá của máy chủ (CustomCriteriaValue.GoMotLopNhayKep + Trim).
// Hai bên PHẢI khớp từng bước, nếu không thì màn này gắn nhãn "không có trong danh sách" lên một
// giá trị mà máy chủ coi là hợp lệ, rồi chặn Lưu thứ đáng lẽ lưu được — người dùng kẹt.
//
// Thứ tự đúng, không được đổi:
//   1. Nếu ký tự ĐẦU và CUỐI đều là nháy kép (và chuỗi dài ≥ 2) thì bóc ĐÚNG MỘT lớp. Cắt thô, KHÔNG
//      dùng JSON.parse: máy chủ cắt thô, nên "ab"c" thành ab"c chứ không phải bị coi là không đọc được.
//   2. Rồi mới cắt khoảng trắng hai đầu.
//   3. So khớp CHÍNH XÁC, phân biệt hoa thường.
//   4. Các chuỗi trong options KHÔNG bị cắt khoảng trắng — dùng nguyên văn như trong JSON.
// (Bản cũ ở đây dùng JSON.parse và không trim, nên lệch ở hai ca: giá trị bọc nháy có khoảng trắng
//  bên trong, và chuỗi bọc nháy không phải JSON hợp lệ.)
const boMotLopNhay = (s) => (
  s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"' ? s.slice(1, -1) : s
)

const chuanHoaSoKhop = (v) => (typeof v === 'string' ? boMotLopNhay(v).trim() : '')

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

// Chuẩn hoá giá trị vừa đọc về cho khớp với ô nhập của màn này.
//
// VÌ SAO CẦN: ô Boolean là một danh sách chọn chỉ có 'true' và 'false' (chữ thường). Máy chủ lại
// nhận cả "True"/"TRUE" (bool.TryParse không phân biệt hoa thường), nên dữ liệu cũ có thể đang giữ
// "True". Nạp thẳng vào danh sách chọn thì KHÔNG khớp lựa chọn nào → ô hiện trống như thể chưa đặt
// → và vì ghi là THAY THẾ TOÀN BỘ, lần Lưu kế tiếp sẽ xoá mất giá trị đó mà không ai thấy.
// Hạ chữ thường ở đây cắt đúng đường đó. Chỉ làm lúc NẠP: giá trị người dùng chọn thì vốn đã đúng.
//
// Select cũng cần một bước tương tự nhưng vì lý do khác: giá trị bọc NHIỀU lớp nháy, sau khi bóc
// một lớp vẫn còn nháy nên vẫn không khớp lựa chọn nào và ô lại hiện trống. Cách xử lý: nếu sau khi
// chuẩn hoá mà trùng một lựa chọn trong danh sách thì lấy CHÍNH lựa chọn đó làm giá trị.
//
// NÓI CHO ĐÚNG, ĐỪNG RÚT GỌN THÀNH CÂU SAI: máy chủ bóc ĐÚNG MỘT lớp, không lặp (đã đọc mã nguồn,
// GoMotLopNhayKep chỉ có một chỗ gọi). Chuỗi đang lưu bọc hai lớp thì máy chủ bóc một lớp xong vẫn
// còn nháy, so với lựa chọn là KHÔNG khớp → 422. Nghĩa là máy chủ nhận CÁI MÀN NÀY GỬI (giá trị
// trần, sau bước ghép lựa chọn ở trên), KHÔNG phải nhận cái đang lưu trong cơ sở dữ liệu.
//
// HỆ QUẢ, VÀ ĐÂY LÀ BẪY CHO NGƯỜI SAU: ở ca nhiều lớp nháy, màn này KHOAN DUNG HƠN máy chủ — nó âm
// thầm dọn giá trị lúc nạp nên màn hình trông bình thường, trong khi chuỗi đang lưu là thứ máy chủ
// coi là không hợp lệ. Vô hại chừng nào MỌI đường Lưu đều đi qua chuanHoaGiaTri(). Nếu sau này có
// đường nào gửi lại nguyên văn giá trị vừa đọc về — kiểu "đọc sao gửi vậy" — thì sẽ ăn 422 mà nhìn
// màn hình không đoán ra tại sao. Thêm đường ghi mới thì phải cho nó đi qua đúng bước chuẩn hoá này.
//
// Vì sao máy chủ không bóc nhiều lớp: bóc một lớp là để đọc dữ liệu cũ dạng JSON đóng gói một lần,
// thứ hệ thống từng tự sinh ra. Bóc lặp sẽ cắn vào giá trị Text mà người dùng CỐ Ý đặt trong nháy
// (một câu trích dẫn chẳng hạn) và biến việc dọn dẹp thành làm hỏng dữ liệu. Nhiều lớp nháy là dấu
// hiệu dữ liệu bị mã hoá chồng do lỗi ở đâu đó — bóc thêm là giấu lỗi, không phải sửa lỗi.
const chuanHoaGiaTri = (c, v) => {
  const chuoi = chuanHoaSoKhop(v)
  if (chuoi === '') return ''

  if (c.dataType === 'Boolean') {
    const thap = chuoi.toLowerCase()
    return thap === 'true' || thap === 'false' ? thap : chuoi
  }

  if (c.dataType === 'Select') {
    const opts = docOptions(c.options)
    if (Array.isArray(opts)) {
      const khop = opts.map(String).find((o) => o === chuanHoaSoKhop(chuoi))
      if (khop !== undefined) return khop
    }
  }

  return chuoi
}

// Một con số thập phân bình thường: có thể có dấu, phần thập phân, và số mũ. KHÔNG nhận dạng cơ số
// khác (0x1A, 0b101) — JavaScript đọc được chúng nhưng decimal.TryParse của máy chủ thì không, và
// để lọt thì người dùng qua được cửa này rồi lại nhận 422.
const LA_SO = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

// Giá trị đang lưu mà KHÔNG có trong danh sách chọn — trả về chính nó, hoặc null nếu bình thường.
//
// VÌ SAO CẦN: ô Select và ô Boolean đều là danh sách chọn. Nếu giá trị đang lưu không khớp lựa chọn
// nào thì trình duyệt hiện ô TRỐNG — trông y hệt "chưa đặt". Và vì ghi là THAY THẾ TOÀN BỘ, lần Lưu
// kế tiếp xoá mất giá trị đó mà không ai thấy. Đây đúng là đường mất dữ liệu đã gặp ở Boolean, chỉ
// khác chỗ vào.
// Giá trị lạ vào được cơ sở dữ liệu bằng nhiều đường: ghi trước khi máy chủ có ràng buộc, hoặc tiêu
// chí Select tạo bằng options không đọc được nên phép đối chiếu bị bỏ qua.
// Cách xử lý: vẫn hiện nó như một lựa chọn, có ghi chú là nằm ngoài danh sách. Người dùng thấy và
// tự quyết, thay vì mất âm thầm. kiemTraGiaTri() vẫn chặn lúc Lưu, nên không thể lưu lại giá trị sai.
// So bằng ĐÚNG phép chuẩn hoá của máy chủ; danh sách hợp lệ dùng nguyên văn (máy chủ không cắt
// khoảng trắng trong options). Trả về giá trị đang hiện trên ô, chứ không phải bản đã chuẩn hoá —
// để hiện ra thì phải hiện đúng thứ người dùng sẽ thấy trong danh sách chọn.
const giaTriLac = (danhSachHopLe, v) => {
  const chuoi = String(v ?? '')
  if (chuoi === '') return null
  return danhSachHopLe.includes(chuanHoaSoKhop(chuoi)) ? null : chuoi
}

// Kiểm giá trị có khớp `dataType` không. Trả về câu lỗi, hoặc null nếu hợp lệ.
// Luật ở đây phải KHỚP với luật máy chủ (MLACP-470) — xem ghi chú đầu tệp, gồm cả chỗ cố ý
// nghiêm hơn. Riêng `Select` khi `options` không đọc được thì không có danh sách để đối chiếu, nên
// bỏ qua giống máy chủ: ô nhập lúc đó cũng đã rơi về chữ tự do.
const kiemTraGiaTri = (c, v) => {
  // Chuẩn hoá lại đúng như máy chủ sẽ làm với chuỗi mình gửi lên — nếu không thì có thể chặn thứ
  // máy chủ nhận, hoặc cho qua thứ máy chủ từ chối.
  const chuoi = chuanHoaSoKhop(v)
  if (chuoi === '') return null // ô trống được bỏ khỏi payload, không phải lỗi
  if (chuoi.length > 1000) return `"${c.name}": tối đa 1000 ký tự.`

  const opts = docOptions(c.options)

  if (c.dataType === 'Boolean') {
    if (chuoi !== 'true' && chuoi !== 'false') return `"${c.name}": chỉ nhận có hoặc không.`
    return null
  }

  if (c.dataType === 'Select' && Array.isArray(opts)) {
    if (!opts.some((o) => String(o) === chuoi)) {
      return `"${c.name}": phải chọn một trong ${opts.map((o) => `"${o}"`).join(', ')}.`
    }
    return null
  }

  if (c.dataType === 'Range') {
    // Kiểm "có phải số không" TRƯỚC và không phụ thuộc vào options: kiểu đã là Range thì giá trị
    // phải là số, kể cả khi chủ phòng trà gõ options hỏng nên không biết khoảng cho phép.
    if (!LA_SO.test(chuoi)) return `"${c.name}": phải là một con số.`
    const so = Number(chuoi)
    if (!Number.isFinite(so)) return `"${c.name}": phải là một con số.`
    if (opts && typeof opts === 'object') {
      if (opts.min != null && so < Number(opts.min)) return `"${c.name}": không được nhỏ hơn ${opts.min}.`
      if (opts.max != null && so > Number(opts.max)) return `"${c.name}": không được lớn hơn ${opts.max}.`
    }
    return null
  }

  return null
}

// Lỗi của MỘT dòng, chọn đúng nguồn theo việc ô đã bị sửa hay chưa:
//   chưa sửa → lấy `validationError` của máy chủ (nguồn đúng, tính trên chính giá trị đang lưu)
//   đã sửa   → máy chủ chưa biết giá trị mới, nên kiểm tại chỗ bằng kiemTraGiaTri()
// Không làm ngược: tin lỗi máy chủ cho một ô vừa gõ lại là báo lỗi của giá trị cũ.
const loiCuaDong = (c, giaTriHienTai, giaTriGoc, loiMayChu) => {
  const chuaSua = giaTriHienTai === giaTriGoc
  if (chuaSua && loiMayChu) return `"${c.name}": ${loiMayChu}`
  return kiemTraGiaTri(c, giaTriHienTai)
}

const ShowCustomValuesSection = ({ showId }) => {
  const [criteria, setCriteria] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [giaTri, setGiaTri] = useState({}) // { [criteriaId]: string } — giá trị đang trên form
  // Giá trị lúc NẠP và lỗi máy chủ báo cho chính giá trị đó. Dùng để biết ô nào chưa bị sửa: chỉ
  // những ô đó mới được dùng lỗi của máy chủ, ô đã sửa thì phải kiểm tại chỗ.
  const [giaTriGoc, setGiaTriGoc] = useState({})
  const [loiMayChu, setLoiMayChu] = useState({})
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
        const loi = {}
        ds.forEach((c) => {
          nhap[c.criteriaId] = chuanHoaGiaTri(c, c.value)
          loi[c.criteriaId] = c.validationError ?? null
        })
        setGiaTri(nhap)
        setGiaTriGoc(nhap)
        setLoiMayChu(loi)
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
      const dangCoGiaTri = criteria.some((c) => chuanHoaGiaTri(c, c.value) !== '')
      if (!dangCoGiaTri) {
        toast.error('Chưa điền tiêu chí nào.')
        return
      }
      if (!window.confirm('Mọi ô đang trống. Lưu bây giờ sẽ XOÁ HẾT giá trị tiêu chí của buổi diễn này. Tiếp tục?')) {
        return
      }
    }
    // Chặn trước khi gửi để người dùng biết ngay, và báo TẤT CẢ lỗi một lần thay vì sửa xong lại
    // báo tiếp. Máy chủ vẫn kiểm lại và trả 422 — đây không thay thế cho nó.
    const loi = criteria
      .map((c) => loiCuaDong(c, giaTri[c.criteriaId] ?? '', giaTriGoc[c.criteriaId] ?? '', loiMayChu[c.criteriaId]))
      .filter(Boolean)
    if (loi.length > 0) {
      toast.error(loi.join('\n'), { duration: 7000 })
      return
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
      <div className="bg-card border border-line rounded-xl py-12 flex justify-center">
        <Loader2 size={22} className="animate-spin text-brand-text" />
      </div>
    )
  }

  // Chưa định nghĩa tiêu chí nào thì không bày một khối trống ra — nói chỗ để tạo.
  if (criteria.length === 0) {
    return (
      <div className="bg-card border border-line rounded-xl p-6">
        <h3 className="text-base font-semibold text-ink flex items-center gap-2">
          <ListFilter size={16} /> Tiêu chí riêng
        </h3>
        <p className="text-xs text-ink-mute mt-1 leading-relaxed">
          Phòng trà bạn chưa định nghĩa tiêu chí riêng nào. Tạo ở màn Hồ sơ phòng trà trước, rồi quay
          lại đây gán giá trị cho từng buổi diễn.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-line rounded-xl p-6">
      <h3 className="text-base font-semibold text-ink flex items-center gap-2">
        <ListFilter size={16} /> Tiêu chí riêng của buổi diễn
      </h3>

      {/* Ghi là thay thế toàn bộ — người dùng cần biết trước khi xoá trắng một ô */}
      <p className="text-xs text-ink-mute mt-1 leading-relaxed">
        Giá trị đang có đã được nạp sẵn. Bấm Lưu là ghi lại TOÀN BỘ danh sách dưới đây — xoá trắng
        một ô nghĩa là bỏ giá trị của tiêu chí đó.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {criteria.map((c) => {
          const opts = docOptions(c.options)
          const giaTriHienTai = giaTri[c.criteriaId] ?? ''
          const daTat = c.criteriaIsActive === false
          // Chỉ hai kiểu dùng danh sách chọn mới có khái niệm "giá trị lạc"; Range và Text là ô nhập
          // tự do nên giá trị nào cũng hiện được.
          const loiDong = loiCuaDong(
            c,
            giaTriHienTai,
            giaTriGoc[c.criteriaId] ?? '',
            loiMayChu[c.criteriaId],
          )
          const lac = c.dataType === 'Select' && Array.isArray(opts)
            ? giaTriLac(opts.map(String), giaTriHienTai)
            : c.dataType === 'Boolean'
              ? giaTriLac(['true', 'false'], giaTriHienTai)
              : null

          return (
            // Tiêu chí đã tắt vẫn hiện, chỉ mờ đi: bỏ nó khỏi form là lần lưu sau xoá mất giá trị.
            <div key={c.criteriaId} className={daTat ? 'opacity-60' : ''}>
              <label className="text-xs text-ink-mute flex flex-wrap items-center gap-1.5">
                {c.name}
                <span className="text-ink-mute font-mono">{c.key}</span>
                {daTat && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sunken text-ink-mute text-[10px]">
                    <EyeOff size={9} /> đã tắt
                  </span>
                )}
              </label>

              {c.dataType === 'Select' && Array.isArray(opts) ? (
                <select value={giaTriHienTai} onChange={(e) => dat(c.criteriaId, e.target.value)} className={inputCls}>
                  <option value="">— không đặt —</option>
                  {opts.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
                  {lac !== null && (
                    <option value={lac}>{lac} — không có trong danh sách</option>
                  )}
                </select>
              ) : c.dataType === 'Boolean' ? (
                <select value={giaTriHienTai} onChange={(e) => dat(c.criteriaId, e.target.value)} className={inputCls}>
                  <option value="">— không đặt —</option>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                  {lac !== null && (
                    <option value={lac}>{lac} — không phải có/không</option>
                  )}
                </select>
              ) : c.dataType === 'Range' && opts && typeof opts === 'object' ? (
                <>
                  <input type="number" value={giaTriHienTai}
                    min={opts.min} max={opts.max} step={opts.step ?? 1}
                    onChange={(e) => dat(c.criteriaId, e.target.value)} className={inputCls} />
                  <p className="text-[11px] text-ink-mute mt-1">
                    Từ {opts.min} đến {opts.max}
                    {opts.step ? `, bước ${opts.step}` : ''}
                  </p>
                </>
              ) : (
                // Text, hoặc Select/Range mà options không đọc được → chữ tự do, tối đa 1000 ký tự
                <input value={giaTriHienTai} maxLength={1000}
                  onChange={(e) => dat(c.criteriaId, e.target.value)} className={inputCls} />
              )}

              {/* Câu lỗi lấy theo loiCuaDong(): ô chưa sửa thì dùng lý do của máy chủ (nguồn đúng),
                  ô đã sửa thì kiểm tại chỗ. Nhờ vậy nó phủ cả Range ngoài khoảng và Boolean rác,
                  chứ không riêng ca giá trị nằm ngoài danh sách chọn. */}
              {loiDong && (
                <p className="text-[11px] text-warning/90 mt-1 leading-relaxed">
                  {loiDong} Để nguyên thì không lưu được.
                </p>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={luu} disabled={isBusy}
        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-50">
        {isBusy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Lưu tiêu chí
      </button>
    </div>
  )
}

export default ShowCustomValuesSection
