// src/components/program/NhomGu.jsx
//
// MỘT NHÓM NHÃN CỦA KHỐI "TÌM THEO GU" (Dòng nhạc / Tâm trạng / Không gian) — có cơ chế THU GỌN.
//
// VÌ SAO (chủ dự án 30/09): bản trước in hết mọi lựa chọn; danh mục lớn lên thì thành một bức tường nút. Nay chỉ hiện
// các mục đáng thấy nhất, phần còn lại mở ra khi người dùng cần. Ngưỡng và nguồn: src/utils/nhomGu.js.
//
// CÁC QUYẾT ĐỊNH CÓ NGUỒN:
//  - "Xem thêm N" là chữ gạch chân kèm dấu cộng, KHÔNG phải một ô nhãn: Baymard ghi nhận người dùng nhầm nút mở rộng
//    với một lựa chọn khi hai thứ trông giống nhau; và phải ghi SỐ mục đang ẩn để danh sách không bị tưởng là đã hết.
//  - KHÔNG dùng hàng cuộn ngang hay vùng cuộn lồng: Baymard xếp vùng cuộn lồng là kiểu tệ nhất; NN/g: người dùng bỏ
//    cuộc sau 3–4 lần vuốt và không trông đợi cuộn ngang trên máy tính.
//  - Mục ẩn KHÔNG được dựng ra DOM khi đang thu gọn (không nằm trong thứ tự Tab, trình đọc màn hình không đọc).
//  - Nút là <button aria-expanded aria-controls> theo mẫu "disclosure" của WAI-ARIA APG. Nút luôn ở lại đúng chỗ (sau
//    danh sách) nên khi thu gọn focus vẫn đứng trên nút, không rơi về <body>.
//  - Không có chuyển động khi mở: không hệ thiết kế nào quy định, và mở tức thì thì không có gì để tắt cho người chọn
//    giảm chuyển động.
//  - Trên ~20 mục, khi đã mở thì có ô "Tìm trong danh sách" (tìm không cần gõ dấu).
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Search } from 'lucide-react'
import { chiaNhomGu, locTheoTen, NGUONG_TIM } from '../../utils/nhomGu'

const Nhan = ({ x }) => (
  <li>
    <Link to={x.to} state={x.state} className="inline-flex items-center gap-2 min-h-[44px] px-3 border-2 border-ink bg-card text-sm font-medium hover:bg-ink hover:text-lamp transition-colors">
      {x.ten}
      {x.so != null && <span className="font-mono text-xs" aria-label={`${x.so} buổi`}>{x.so}</span>}
    </Link>
  </li>
)

const NhomGu = ({ tieuDe, ds = [] }) => {
  const id = useId()
  const [moRong, setMoRong] = useState(false)
  const [tuKhoa, setTuKhoa] = useState('')
  const { hien, an } = useMemo(() => chiaNhomGu(ds), [ds])

  const coTim = moRong && ds.length > NGUONG_TIM
  // Đang tìm thì lọc trên TOÀN BỘ danh sách (cả phần hiện sẵn), vì người dùng đang dò một cái tên cụ thể.
  const dsDangIn = !moRong ? hien : coTim && tuKhoa ? locTheoTen([...hien, ...an], tuKhoa) : [...hien, ...an]

  const doi = () => {
    setMoRong((v) => !v)
    setTuKhoa('')
  }

  return (
    <div>
      <h3 className="text-lg mb-3" id={`${id}-td`}>{tieuDe}</h3>

      {coTim && (
        <div className="relative mb-3 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden="true" />
          <input
            type="search"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            aria-label={`Tìm trong ${tieuDe.toLowerCase()}`}
            placeholder="Tìm trong danh sách"
            className="w-full pl-9 pr-3 min-h-[44px] bg-card border-2 border-ink text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock"
          />
        </div>
      )}

      <ul id={`${id}-ds`} aria-labelledby={`${id}-td`} className="flex flex-wrap gap-2">
        {dsDangIn.map((x) => <Nhan key={x.key} x={x} />)}
      </ul>
      {coTim && tuKhoa && dsDangIn.length === 0 && (
        <p className="text-sm text-ink-soft mt-2" role="status">Không có mục nào khớp “{tuKhoa}”.</p>
      )}

      {an.length > 0 && (
        <button
          type="button"
          onClick={doi}
          aria-expanded={moRong}
          aria-controls={`${id}-ds`}
          className="inline-flex items-center gap-1.5 min-h-[44px] mt-1 text-sm font-semibold text-ink underline underline-offset-4 decoration-2 hover:text-board"
        >
          {moRong
            ? <><Minus size={16} aria-hidden="true" /> Thu gọn</>
            : <><Plus size={16} aria-hidden="true" /> Xem thêm {an.length} {tieuDe.toLowerCase()}</>}
        </button>
      )}
    </div>
  )
}

export default NhomGu
