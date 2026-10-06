// src/components/shared/KhungGoiYTimKiem.jsx
//
// KHUNG GỢI Ý của ô tìm kiếm đầu trang (03/10/2026). Bản cũ nằm thẳng trong Header. Chủ dự án xem ảnh chụp và nói "khó
// nhìn quá". Lỗi đo được ở bản cũ:
//   - Khung chỉ rộng bằng ô nhập (max-w-md ≈ 448px). Tên buổi dài 48 ký tự ("Sài Gòn Đêm Mưa – Những Tình Khúc Vượt Thời
//     Gian") bị cắt; lý do gợi ý là một câu trọn do AI viết nhưng bị nhét vào MỘT dòng cắt giữa chừng nên không đọc được.
//   - Không có ngày, giờ, phòng trà, trong khi đó là thứ người ta cần để quyết định đi hay không. Dữ liệu đã có sẵn
//     trong API (scheduledStart, loungeName) mà không in ra.
//   - Ảnh bo tròn, trái DESIGN.md (góc vuông).
//   - Danh sách mặc định (chưa gõ) không đi được bằng bàn phím; ô nhập không khai báo combobox.
//
// CĂN CỨ (reports/Khung gợi ý ô tìm kiếm.md ở repo backend):
//   - Baymard: tối đa 10 gợi ý trên máy tính; không cuộn bên trong khung mà để khung giãn ra; mũi tên lên/xuống để
//     chọn, Enter để mở; tô nền dòng đang trỏ.
//   - Algolia (federated autocomplete): mỗi dòng xem trước gồm ảnh, tên và một dòng thông tin phụ. Khi chưa gõ gì thì
//     hiện "lối tắt" có ảnh, tiêu đề và phụ đề. Có lối "xem tất cả".
//   - NN/g: nếu gợi ý chứa chuỗi người dùng gõ ở bất kỳ vị trí nào thì tô ĐẬM chuỗi đó.
//   - WAI-ARIA APG combobox: input role=combobox + aria-expanded/aria-controls/aria-activedescendant; khung là listbox,
//     mỗi dòng là option. Focus DOM luôn ở ô nhập.
//
// QUYẾT ĐỊNH: khung rộng 34rem (gấp ~1,3 ô nhập). Tên được xuống tối đa 2 dòng, không cắt ở 1 dòng. Dòng phụ in theo kiểu bảng giờ diễn, giống cách trang
// chủ in ("Thứ năm 22/10 · 19:26 · Phòng trà Ánh Dương"). Lý do gợi ý in TRỌN câu, không kẹp dòng: lời AI viết riêng mà cắt giữa chừng thì vô nghĩa — chính là lỗi của bản cũ. Nhãn "AI chọn" chỉ
// gắn khi nguồn thật là "Ai", cùng luật nói thật với khối gợi ý ở trang chủ.
import { Link } from 'react-router-dom'
import { khungGio, ngayTrongLich } from '../../utils/ngayVietNam'
import { useTranslation } from 'react-i18next'

// Tô đậm chỗ khớp từ khoá. So khớp không phân biệt hoa thường; tiếng Việt giữ nguyên dấu (gõ "sài" khớp "Sài").
const ToKhop = ({ chu, tuKhoa }) => {
  const i = tuKhoa ? chu.toLocaleLowerCase('vi').indexOf(tuKhoa.toLocaleLowerCase('vi')) : -1
  if (i < 0) return chu
  return <>{chu.slice(0, i)}<b className="font-bold">{chu.slice(i, i + tuKhoa.length)}</b>{chu.slice(i + tuKhoa.length)}</>
}

const Anh = ({ url }) => (url
  ? <img src={url} alt="" className="w-14 h-14 object-cover flex-shrink-0 border border-ink/15" />
  : <span aria-hidden="true" className="w-14 h-14 flex-shrink-0 bg-sunken border border-ink/15" />)

const KhungGoiYTimKiem = ({ idKhung, tuKhoa, dangTai, goiY, macDinh, chiSoChon, setChiSoChon, onChon, onDong }) => {
  const { t } = useTranslation()
  const dangGo = tuKhoa.length >= 2
  const ds = dangGo ? goiY : macDinh.items
  const caNhan = !dangGo && macDinh.kieu === 'ca-nhan'
  const lop = 'absolute top-full left-0 mt-2 w-[min(34rem,calc(100vw-2rem))] bg-card border-2 border-ink shadow-lift z-50'

  if (dangGo && dangTai) return <div className={`${lop} py-6 text-center text-sm text-ink-mute`} role="status">{t('Đang tìm…')}</div>
  if (dangGo && ds.length === 0) {
    return <p className={`${lop} px-4 py-4 text-sm text-ink-mute`} role="status">{t('Không có buổi diễn, phòng trà hay nghệ sĩ nào khớp. Nhấn Enter để tìm buổi diễn rộng hơn.')}</p>
  }
  if (ds.length === 0) return null

  // MLACP-682: khi đang gõ, gợi ý chia NHÓM (buổi diễn / phòng trà / nghệ sĩ — Algolia federated autocomplete), mỗi nhóm
  // một tiêu đề; listbox chứa các role="group" có nhãn (WAI-ARIA APG, "listbox with grouped options"). Chỉ số chọn bằng
  // phím vẫn là chỉ số trong danh sách PHẲNG mà Header giữ, nên mũi tên đi liền qua các nhóm.
  const NHOM = [['show', t('BUỔI DIỄN')], ['lounge', t('PHÒNG TRÀ')], ['performer', t('NGHỆ SĨ')]]
  const cacNhom = dangGo
    ? NHOM.map(([loai, nhan]) => ({ loai, nhan, dong: ds.map((b, i) => ({ b, i })).filter((x) => (x.b.loai ?? 'show') === loai) })).filter((n) => n.dong.length > 0)
    : [{ loai: 'macdinh', nhan: caNhan ? t('GỢI Ý RIÊNG CHO BẠN') : t('NHIỀU NGƯỜI ĐANG GIỮ CHỖ'), dong: ds.map((b, i) => ({ b, i })) }]

  return (
    <div className={lop}>
      <ul id={idKhung} role="listbox" aria-label={t('Gợi ý tìm kiếm')}>
        {cacNhom.map((n) => (
          <li key={n.loai} role="presentation">
            <p id={`${idKhung}-nhom-${n.loai}`} className="px-4 pt-3 pb-2 font-mono text-xs tracking-[0.15em] text-ink-mute border-b border-ink/15">{n.nhan}</p>
            <ul role="group" aria-labelledby={`${idKhung}-nhom-${n.loai}`}>
        {n.dong.map(({ b, i }) => {
          const dangTro = i === chiSoChon
          const laAi = b.recommendationSource === 'Ai'
          // Lý do chỉ in khi là lời riêng, không in nhãn chung "Đang thịnh hành" (tiêu đề khung đã nói điều đó).
          const lyDo = caNhan && b.recommendationReason && b.recommendationReason !== 'Đang thịnh hành' ? b.recommendationReason : null
          return (
            <li key={`${b.loai ?? 'show'}-${b.id}`} id={`${idKhung}-${i}`} role="option" aria-selected={dangTro}
              // mousedown + preventDefault: giữ focus ở ô nhập (APG), và bấm không bị "bấm ra ngoài" đóng khung trước.
              onMouseDown={(e) => { e.preventDefault(); onChon(b) }}
              onMouseEnter={() => setChiSoChon(i)}
              className={`flex gap-3 px-4 py-3 cursor-pointer border-b border-ink/10 last:border-b-0 ${dangTro ? 'bg-sunken' : ''}`}>
              <Anh url={b.coverImageUrl} />
              <span className="min-w-0 flex-1">
                <span className={`${dangGo ? 'font-normal' : 'font-semibold'} text-ink leading-snug line-clamp-2`}><ToKhop chu={b.name} tuKhoa={dangGo ? tuKhoa : ''} /></span>
                {b.scheduledStart && (
                  <span className="block font-mono text-xs text-ink-mute mt-1">
                    {ngayTrongLich(b.scheduledStart)} · {khungGio(b.scheduledStart, b.effectiveEnd)}{b.loungeName ? ` · ${t('tại {{x}}', { x: b.loungeName })}` : ''}
                  </span>
                )}
                {b.phu && <span className="block font-mono text-xs text-ink-mute mt-1">{b.phu}</span>}
                {lyDo && (
                  <span className="block text-sm text-ink-soft leading-snug mt-1.5">
                    {laAi && <span className="font-mono text-xs text-ink mr-1.5">{t('AI chọn ·')}</span>}{lyDo}
                  </span>
                )}
              </span>
            </li>
          )
        })}
            </ul>
          </li>
        ))}
      </ul>
      <Link to={dangGo ? `/shows?q=${encodeURIComponent(tuKhoa)}` : '/shows'} tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()} onClick={onDong}
        className="flex items-center justify-between px-4 min-h-[44px] text-sm font-semibold text-ink border-t-2 border-ink hover:bg-sunken">
        {dangGo ? t('Xem mọi kết quả cho “{{x}}”', { x: tuKhoa }) : t('Xem tất cả buổi diễn')} <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

export default KhungGoiYTimKiem
