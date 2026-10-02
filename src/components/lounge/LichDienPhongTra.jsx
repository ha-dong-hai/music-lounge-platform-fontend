// src/components/lounge/LichDienPhongTra.jsx
//
// LỊCH DIỄN CỦA MỘT PHÒNG TRÀ — nội dung chính của trang phòng trà, in như trang trong của tờ chương trình.
//
// BẢN CŨ đưa 6 buổi vào một băng chuyền thẻ, xếp XA NHẤT TRƯỚC, gắn nhãn dòng nhạc "Acoustic" và tâm trạng "Chill"
// cho mọi buổi không có dữ liệu (tức là bịa), và không có lối nào xem buổi thứ bảy. Cách chia/cắt và nguồn của các
// ngưỡng: src/utils/lichPhongTra.js.
//
// QUYẾT ĐỊNH:
//  - Danh sách dọc, gần nhất trước, không có nút sắp xếp (DICE, Ticketmaster đều vậy ở trang địa điểm).
//  - KHÔNG băng chuyền ngang: NN/g ghi nhận người dùng bỏ sau vài lần vuốt và không trông đợi cuộn ngang trên máy tính.
//  - Mỗi dòng là DongBuoiDien (dùng chung với trang Buổi diễn), tắt tên phòng trà vì đang ở trang của chính nó.
//    ẢNH BẬT LẠI (chủ dự án 02/10/2026: dòng chỉ toàn chữ trông mờ nhạt): ảnh bìa của buổi, chưa có thì ảnh phòng trà.
//  - Chưa có buổi nào: nói thật + mời theo dõi (DICE: "Follow this venue to find out when they have events").
//    Không in buổi giả, không in "sắp ra mắt".
//  - Lỗi tải là trạng thái RIÊNG có nút thử lại — bản cũ nuốt lỗi rồi ẩn cả khối, người xem tưởng phòng trà không diễn.
//  - Đêm đã diễn nằm trong một khối đóng sẵn: là lối vào để đánh giá, không phải thứ người mới cần thấy trước.
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus } from 'lucide-react'
import { ngayDayDu } from '../../utils/ngayVietNam'
import DongBuoiDien from '../program/DongBuoiDien'
import { chiaLichPhongTra, catLich, SO_DA_DIEN_HIEN } from '../../utils/lichPhongTra'

const NUT_MO = 'inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-ink underline underline-offset-4 decoration-2 hover:text-board'

const LichDienPhongTra = ({ ds, tong = 0, loi = false, onThuLai, tenPhongTra = '', theoDoi = null, anhPhongTra = null }) => {
  const id = useId()
  const [moHet, setMoHet] = useState(false)
  const [mucDaDien, setMucDaDien] = useState('dong') // 'dong' | 'it' | 'het'

  if (loi) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
        <p>Lịch diễn chưa tải được.</p>
        <button type="button" onClick={onThuLai} className="min-h-[44px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Thử lại</button>
      </div>
    )
  }
  if (ds === null) {
    return <div className="h-64 border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải lịch diễn" />
  }

  const { sapToi, daDien } = chiaLichPhongTra(ds)
  const { hien, an } = catLich(sapToi)
  const dangIn = moHet ? sapToi : hien
  const daDienIn = mucDaDien === 'het' ? daDien : daDien.slice(0, SO_DA_DIEN_HIEN)

  return (
    <div>
      {sapToi.length === 0 ? (
        <div className="border-2 border-ink p-5 sm:p-6">
          <p className="text-lg">{tenPhongTra || 'Phòng trà'} chưa có đêm diễn nào mở bán.</p>
          <p className="text-ink-soft mt-1">Theo dõi phòng trà để được báo khi có đêm diễn mới.</p>
          {theoDoi && <div className="mt-4">{theoDoi}</div>}
        </div>
      ) : (
        <>
          <ol id={`${id}-sap`} className="border-y-2 border-ink">
            {dangIn.map((b) => <DongBuoiDien key={b.id} b={b} hienPhongTra={false} anhDuPhong={anhPhongTra} />)}
          </ol>
          {an.length > 0 && (
            <button type="button" onClick={() => setMoHet((v) => !v)} aria-expanded={moHet} aria-controls={`${id}-sap`} className={`${NUT_MO} mt-2`}>
              {moHet
                ? <><Minus size={16} aria-hidden="true" /> Thu gọn lịch diễn</>
                : <><Plus size={16} aria-hidden="true" /> Xem thêm {an.length} buổi diễn</>}
            </button>
          )}
        </>
      )}

      {daDien.length > 0 && (
        <div className="mt-8">
          <button type="button" onClick={() => setMucDaDien((m) => (m === 'dong' ? 'it' : 'dong'))}
            aria-expanded={mucDaDien !== 'dong'} aria-controls={`${id}-da`} className={NUT_MO}>
            {mucDaDien === 'dong' ? <Plus size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}
            Các đêm đã diễn ({daDien.length})
          </button>
          <div id={`${id}-da`}>
            {mucDaDien !== 'dong' && (
              <>
                <ul className="border-t border-ink/20 mt-1">
                  {daDienIn.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-0.5 py-3 border-b border-ink/20">
                      <span className="font-mono text-sm text-ink-mute w-24 flex-shrink-0">{ngayDayDu(b.scheduledStart)}</span>
                      <Link to={`/shows/${b.id}`} className="font-semibold hover:underline underline-offset-4 min-h-[24px]">{b.name}</Link>
                      {(b.performerNames ?? []).length > 0 && <span className="text-sm text-ink-soft">{b.performerNames.join(', ')}</span>}
                    </li>
                  ))}
                </ul>
                {mucDaDien === 'it' && daDien.length > SO_DA_DIEN_HIEN && (
                  <button type="button" onClick={() => setMucDaDien('het')} className={`${NUT_MO} mt-1`}>
                    <Plus size={16} aria-hidden="true" /> Xem thêm {daDien.length - SO_DA_DIEN_HIEN} đêm đã diễn
                  </button>
                )}
                {mucDaDien === 'het' && tong > ds.length && (
                  <p className="text-sm text-ink-mute mt-3">Đang hiện {ds.length} buổi gần nhất trên tổng {tong} buổi của phòng trà.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LichDienPhongTra
