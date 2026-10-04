// src/components/owner/ViecCanLamMoBan.jsx
//
// "VIỆC CẦN LÀM ĐỂ MỞ BÁN" — danh sách 5 bước cho chủ phòng trà, đặt ở trang đầu khu chủ (MLACP-606, pre-mortem H4).
// Luật từng bước nằm ở utils/viecMoBan.js (hàm thuần, có kiểm thử); ở đây chỉ tải dữ liệu và vẽ.
//
//  - Đủ cả 5 bước thì KHÔNG vẽ gì: chủ đang vận hành bình thường không phải nhìn danh sách này mỗi ngày.
//  - Bước nên làm ngay được nêu thành một nút lớn; bước đang chờ quản trị viên ghi rõ là chờ, để chủ không ngồi đoán.
//  - Trạng thái dùng NhanTrangThai chung (chữ + biểu tượng, không truyền nghĩa bằng màu).
//  - Dữ liệu: TanStack Query, 5 nguồn có sẵn (không thêm API). Giữ 5 phút để không gọi lại mỗi lần đổi tab — backend giới
//    hạn tần suất theo IP. Nguồn nào lỗi thì bước đó ghi "chưa tải được", các bước khác vẫn hiện.
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import NhanTrangThai from '../shared/NhanTrangThai'
import { getLoungeZones } from '../../services/loungeServices'
import { getMyCitizenCard } from '../../services/userServices'
import { getBankAccounts } from '../../services/bankAccountServices'
import { getMyShows } from '../../services/showServices'
import { buocMoBan, buocKeTiep, daMoBanDuoc, demXong } from '../../utils/viecMoBan'

const NHAN = {
  xong: ['tot', 'Xong'],
  cho: ['cho', 'Đang chờ duyệt'],
  'tu-choi': ['xau', 'Bị trả về'],
  lam: ['trung', 'Chưa làm'],
  'chua-ro': ['tat', 'Chưa tải được'],
}

const boc = async (p) => { const r = await p; if (!r?.success) throw new Error('tai'); return r.data }
const CHUNG = { staleTime: 5 * 60_000, retry: false }

// `lounge`: phòng trà của chủ (null = chưa có). Trang cha đã tải sẵn nên truyền vào, không gọi lại.
const ViecCanLamMoBan = ({ lounge }) => {
  const id = lounge?.id
  const cccd = useQuery({ queryKey: ['mo-ban', 'cccd'], queryFn: () => boc(getMyCitizenCard()), ...CHUNG })
  const taiKhoan = useQuery({ queryKey: ['mo-ban', 'tk', id], queryFn: () => boc(getBankAccounts('Lounge', id)), enabled: !!id, ...CHUNG })
  const khu = useQuery({ queryKey: ['mo-ban', 'khu', id], queryFn: () => boc(getLoungeZones(id)), enabled: !!id, ...CHUNG })
  const buoi = useQuery({
    queryKey: ['mo-ban', 'buoi'], enabled: !!id, ...CHUNG,
    queryFn: async () => {
      const d = await boc(getMyShows({ page: 1, pageSize: 100 }))
      const ds = d.items ?? []
      return {
        tong: d.totalCount ?? ds.length,
        choDuyet: ds.filter((s) => s.status === 'Pending').length,
        daDang: ds.filter((s) => ['Published', 'Ongoing', 'Ended'].includes(s.status)).length,
      }
    },
  })

  // Chưa có phòng trà thì các nguồn theo phòng trà không chạy — coi là "chưa có" (0), không phải "chưa tải được".
  const gt = (q, rong) => (!id ? rong : q.isError ? undefined : q.data)
  const dangTai = cccd.isPending || (!!id && (taiKhoan.isPending || khu.isPending || buoi.isPending))
  if (dangTai) return null

  const ds = buocMoBan({
    lounge: lounge ?? null,
    cccd: cccd.isError ? undefined : cccd.data,
    taiKhoan: gt(taiKhoan, []),
    soKhu: !id ? 0 : khu.isError ? undefined : (khu.data ?? []).length,
    buoi: gt(buoi, { tong: 0, choDuyet: 0, daDang: 0 }),
  })
  if (daMoBanDuoc(ds)) return null
  const ke = buocKeTiep(ds)

  return (
    <section aria-labelledby="viec-mo-ban" className="mb-8 border-2 border-ink bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="viec-mo-ban" className="font-sans text-xl font-bold text-ink">Việc cần làm để mở bán</h2>
          <p className="text-sm text-ink-soft mt-1">Đã xong {demXong(ds)} trên {ds.length} bước. Xong cả {ds.length} thì danh sách này tự ẩn.</p>
        </div>
        {ke && (
          <Link to={ke.to} className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
            Làm tiếp: {ke.ten} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
      <ol className="mt-4 border-t border-ink/20 divide-y divide-ink/20">
        {ds.map((b, i) => {
          const [sac, chu] = NHAN[b.trangThai] ?? NHAN.lam
          return (
            <li key={b.khoa} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span aria-hidden="true" className="font-mono text-ink-soft w-5">{i + 1}</span>
              <div className="min-w-0 flex-1 basis-[16rem]">
                <p className={`font-semibold ${b.trangThai === 'xong' ? 'text-ink-soft' : 'text-ink'}`}>{b.ten}</p>
                <p className="text-sm text-ink-soft leading-relaxed">{b.moTa}</p>
              </div>
              <NhanTrangThai sacThai={sac}>{chu}</NhanTrangThai>
              <Link to={b.to} aria-label={`${b.trangThai === 'xong' ? 'Xem' : 'Mở'} ${b.ten}`}
                className="inline-flex items-center justify-center min-h-[44px] px-3 border-2 border-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
                {b.trangThai === 'xong' ? 'Xem' : 'Mở'}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default ViecCanLamMoBan
