// src/pages/admin/AdminBankAccountsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — MÀN NÀY QUYẾT ĐỊNH TIỀN CHẢY VỀ ĐÂU:
// - Duyệt một tài khoản nhận tiền nghĩa là từ đó doanh thu của phòng trà được chuyển vào số tài
//   khoản đó. Duyệt nhầm là chuyển tiền cho người khác, và không có nút hoàn tác.
// - BA CỜ ĐI KÈM MỖI DÒNG là đúng ba điều kiện mà lệnh duyệt sẽ kiểm ở backend:
//     holderNameMatches       tên chủ tài khoản khớp tên định danh hợp pháp của chủ phòng trà
//     ownerIdentityApproved   hồ sơ định danh của chủ đã được duyệt
//     accountNumberUnreadable số tài khoản lưu bị hỏng, không giải mã đọc được
//   Hiện chúng NGAY TRÊN DANH SÁCH và chặn nút Duyệt khi chưa đạt — không có phần này thì người
//   duyệt bấm xong mới nhận lỗi, và tệ hơn là quen tay bấm bừa.
// - `accountNumberMasked` là chuỗi ĐÃ CHE SẴN từ backend (dùng ký tự •). Hiện nguyên văn, đừng cắt
//   chuỗi thêm lần nữa. Không có endpoint nào trả số đầy đủ, và đó là cố ý: người duyệt đối chiếu
//   bằng TÊN chủ tài khoản, không phải bằng số.
// - Danh sách này CHỈ có tài khoản của phòng trà. Tài khoản nhận tiền của nghệ sĩ không duyệt ở đây.
// - Từ chối thì `note` là thứ duy nhất cho chủ phòng trà biết phải sửa gì — bắt buộc nhập.
// - `createdAt` của bảng này TỪNG về KHÔNG kèm múi giờ ("2026-08-17T13:12:19.838") dù giá trị là
//   giờ UTC — gốc là DTO khai `DateTime` thay vì `DateTimeOffset`. Lệch đúng 7 tiếng ở Việt Nam,
//   đủ để nhảy sang ngày hôm sau mà vẫn trông hợp lý. Toàn hệ thống có 3 trường bị vậy (trường
//   này, `createdAt` của danh sách người dùng Admin, và một trường trong bản xuất dữ liệu cá nhân).
//   Backend đã sửa cả ba và deploy 21/09; chuỗi nay về kèm "+00:00".
//   mocUtc() chỉ thêm 'Z' KHI chuỗi chưa có múi giờ, nên với dữ liệu hiện tại nó KHÔNG LÀM GÌ CẢ.
//   Giữ lại làm lưới chắn, không phải vá tạm quên gỡ. Các mốc của án phạt vốn đã có offset.
// - `expectedAccountHolder: null` kèm `holderNameMatches: false` là trạng thái CÓ THẬT khi chủ
//   phòng trà chưa được chốt họ tên trên CCCD — đó đúng là lúc nút Duyệt phải chặn.
// PHÂN TRANG (01/10/2026): dùng hooks/useDanhSachMayChu + components/bang/PhanTrang như mọi danh sách khác — bản cũ tự
// giữ {page,totalPages} với hai nút trước/sau, trang và tab không lên URL (tải lại về trang 1) và không có dòng "Hiện x–y".
import { useState } from 'react'
import { parseAsStringLiteral } from 'nuqs'
import { Link } from 'react-router-dom'
import {
  Loader2, Landmark, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldCheck, X, Ban,
} from 'lucide-react'
import dayjs from 'dayjs'
import DaCho from '../../components/bang/DaCho'
import toast from 'react-hot-toast'
import { getAdminBankAccounts, reviewPayoutBankAccount } from '../../services/adminServices'
import { mocUtc } from '../../utils/format'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import NhomTab from '../../components/bang/NhomTab'
import HopThoai, { TieuDeHop } from '../../components/shared/HopThoai'

// Một điều kiện duyệt. `dat` = đã thoả. Hiện cả khi đạt lẫn khi chưa, vì "không thấy cảnh báo"
// và "chưa kiểm" trông giống nhau nếu chỉ hiện lúc hỏng.
// Tab trên URL (?tab=daDuyet / ?tab=tuChoi) — Quay lại/tải lại giữ đúng tab.
// MLACP-668: thêm tab "Đã từ chối". Trước đó backend không lưu việc từ chối (chỉ ghi isVerified=false, đúng giá trị
// đang có), nên tài khoản vừa bị từ chối nằm lại ở "Chờ duyệt" và Admin không xoá được nó khỏi hàng chờ. Nay tài khoản
// bị từ chối rời hàng chờ cho tới khi chủ phòng trà sửa lại; tab này để xem lại chúng cùng lý do đã ghi.
const TAB = ['cho', 'daDuyet', 'tuChoi']
const BO_LOC = { tab: parseAsStringLiteral(TAB).withDefault('cho') }

const CoDieuKien = ({ dat, chuDat, chuChuaDat }) => (
  <span className={`inline-flex items-center gap-1 text-xs ${dat ? 'text-success' : 'text-danger'}`}>
    {dat ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
    {dat ? chuDat : chuChuaDat}
  </span>
)

// Mọi lý do khiến một tài khoản chưa duyệt được, theo thứ tự phải xử lý: số tài khoản hỏng thì
// không còn gì để đối chiếu, nên nó đứng trước; định danh chưa duyệt thì chưa có tên chuẩn để so,
// nên đứng trước việc so tên.
const lyDoChuaDuyet = (it) => {
  const ds = []
  if (it.accountNumberUnreadable) {
    ds.push('Số tài khoản lưu trong hệ thống không giải mã đọc được — yêu cầu chủ phòng trà khai báo lại. Không có số thì không có gì để chuyển tiền tới.')
  }
  if (!it.ownerIdentityApproved) {
    ds.push('Hồ sơ định danh của chủ phòng trà chưa được duyệt — duyệt ở màn Duyệt định danh trước. Chưa có định danh thì chưa có tên chuẩn để đối chiếu.')
  }
  if (!it.holderNameMatches) {
    ds.push(it.expectedAccountHolder
      ? `Tên chủ tài khoản không khớp tên định danh hợp pháp ("${it.expectedAccountHolder}"). Tiền chuyển vào đây là chuyển cho người khác.`
      : 'Chưa có tên định danh hợp pháp của chủ phòng trà để đối chiếu, nên không xác nhận được tên chủ tài khoản là đúng người.')
  }
  return ds
}

const ReviewModal = ({ item, approve, onClose, onSaved }) => {
  const [note, setNote] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    // Từ chối mà không nói lý do thì chủ phòng trà không biết sửa gì — chặn ở đây.
    if (!approve && !note.trim()) {
      toast.error('Từ chối thì phải ghi lý do — chủ phòng trà đọc đúng câu này để sửa.')
      return
    }
    setIsBusy(true)
    try {
      await reviewPayoutBankAccount(item.id, { approve, note: note.trim() || null })
      toast.success(approve ? 'Đã duyệt tài khoản nhận tiền.' : 'Đã từ chối tài khoản.')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được.', { duration: 6000 })
    } finally { setIsBusy(false) }
  }

  return (
    <HopThoai onDong={onClose} dongKhiBamNgoai={false} className="max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <TieuDeHop><h2 className="text-3xl text-ink">
            {approve ? 'Duyệt tài khoản nhận tiền?' : 'Từ chối tài khoản?'}
          </h2></TieuDeHop>
          <button onClick={onClose} disabled={isBusy}
            className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft disabled:opacity-30" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="p-3 bg-sunken border border-line space-y-1">
            <p className="text-sm text-ink">{item.loungeName}</p>
            <p className="text-xs text-ink-soft">{item.bankName} · {item.accountNumberMasked}</p>
            <p className="text-xs text-ink-soft">
              Chủ tài khoản: <span className="text-ink">{item.accountHolder}</span>
            </p>
            <p className="text-xs text-ink-mute">
              Tên định danh của chủ phòng trà: {item.expectedAccountHolder || '—'}
            </p>
          </div>

          {approve && (
            <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed bg-warning/5 border border-warning/30 p-3">
              <AlertTriangle size={13} className="mt-px flex-shrink-0" />
              Duyệt xong, doanh thu của phòng trà này sẽ được chuyển vào số tài khoản trên. Hãy đối
              chiếu TÊN chủ tài khoản với tên định danh — số tài khoản cố ý chỉ hiện dạng che.
            </p>
          )}

          <div>
            <label className="text-sm font-semibold text-ink">
              Ghi chú {approve ? <span className="text-ink-mute">(không bắt buộc)</span> : <span className="text-danger">*</span>}
            </label>
            <textarea aria-label={approve ? "Ghi chú (không bắt buộc)" : "Ghi chú (bắt buộc)"} rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={approve ? 'Ghi chú nội bộ nếu cần' : 'VD: tên chủ tài khoản không khớp tên trên CCCD đã duyệt'}
              className="mt-1 w-full resize-none min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="inline-flex flex-1 disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                approve ? 'bg-ink text-lamp hover:bg-board' : 'bg-danger text-lamp hover:bg-danger'
              }`}>
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {approve ? 'Duyệt' : 'Từ chối'}
            </button>
          </div>
        </form>
      </HopThoai>
  )
}

const AdminBankAccountsPage = () => {
  const ds = useDanhSachMayChu({
    khoa: ['admin-tk-ngan-hang'],
    goi: ({ tab, ...q }) => getAdminBankAccounts({ ...q, verified: tab === 'daDuyet', rejected: tab === 'tuChoi' }),
    boLoc: BO_LOC,
  })
  const tab = ds.boLoc.tab
  const daDuyet = tab === 'daDuyet'
  const tuChoi = tab === 'tuChoi'
  const items = ds.items
  const isLoading = ds.dangTai
  const totalCount = ds.tong
  const load = () => ds.taiLai()
  const [target, setTarget] = useState(null) // { item, approve }

  const doiTab = (v) => ds.datBoLoc({ tab: v === 'cho' ? null : v })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl text-ink">Tài khoản nhận tiền</h1>
            <p className="text-ink-soft text-sm leading-relaxed">
              Duyệt số tài khoản mà doanh thu của phòng trà sẽ được chuyển vào. Chỉ tài khoản của
              phòng trà — tài khoản của nghệ sĩ không duyệt ở đây.
            </p>
          </div>
        </div>
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-2 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <NhomTab nhan="Lọc tài khoản theo trạng thái duyệt" dangChon={tab} onChon={doiTab}
        cacTab={[
          { khoa: 'cho', nhan: 'Chờ duyệt', dem: tab === 'cho' && totalCount > 0 ? totalCount : undefined },
          { khoa: 'daDuyet', nhan: 'Đã duyệt' },
          { khoa: 'tuChoi', nhan: 'Đã từ chối' },
        ]} />

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={30} className="animate-spin text-ink" /></div>
      ) : ds.loi ? (
        <div role="alert" className="bg-card border border-line p-6 flex flex-wrap items-center gap-4">
          <p className="text-sm">Chưa tải được danh sách tài khoản nhận tiền.</p>
          <button type="button" onClick={() => ds.taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line p-12 text-center">
          <Landmark size={30} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">
            {daDuyet ? 'Chưa có tài khoản nào được duyệt.'
              : tuChoi ? 'Không có tài khoản nào đang bị từ chối.'
              : 'Không có tài khoản nào đang chờ duyệt.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            // Đủ điều kiện duyệt = khớp tên + định danh đã duyệt + số tài khoản đọc được.
            // Ba điều kiện này backend cũng kiểm lại, đây chỉ là chặn sớm cho người dùng.
            const duDieuKien = it.holderNameMatches && it.ownerIdentityApproved && !it.accountNumberUnreadable
            return (
              <li key={it.id} className={`bg-card border p-5 ${duDieuKien ? 'border-line' : 'border-warning/30'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/lounge/${it.loungeId}`} target="_blank"
                        className="text-ink font-bold hover:text-ink">
                        {it.loungeName}
                      </Link>
                      {it.isDefault && (
                        <span className="px-2 py-0.5 rounded-md bg-ink/10 text-ink text-xs">Mặc định</span>
                      )}
                      {it.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/10 text-success text-xs">
                          <ShieldCheck size={11} /> Đã duyệt
                        </span>
                      )}
                      {it.rejectedAt && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-danger/10 text-danger text-xs">
                          <Ban size={11} /> Đã từ chối {dayjs(mocUtc(it.rejectedAt)).format('DD/MM/YYYY')}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-ink-soft mt-1.5">
                      {it.bankName} ·{' '}
                      {/* Khi số tài khoản hỏng, backend trả một CÂU CHỮ chứ không phải số đã che —
                          để nguyên font mã thì trông như một mã hợp lệ. Hiện khác đi cho đúng. */}
                      {it.accountNumberUnreadable
                        ? <span className="text-danger italic">{it.accountNumberMasked}</span>
                        : <span className="font-mono">{it.accountNumberMasked}</span>}
                    </p>
                    <p className="text-sm text-ink-soft mt-0.5">
                      Chủ tài khoản: <span className="text-ink">{it.accountHolder}</span>
                    </p>
                    <p className="text-xs text-ink-mute mt-0.5">
                      Chủ phòng trà: {it.ownerName} · tên định danh: {it.expectedAccountHolder || 'chưa có'}
                    </p>
                    <p className="text-xs text-ink-mute mt-0.5">
                      Khai báo {dayjs(mocUtc(it.createdAt)).format('DD/MM/YYYY')}
                      {tab === 'cho' && <DaCho luc={mocUtc(it.createdAt)} className="ml-2" />}
                    </p>
                    {it.rejectionNote && (
                      <p className="text-sm text-danger mt-1.5">Lý do từ chối: {it.rejectionNote}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      <CoDieuKien dat={it.holderNameMatches}
                        chuDat="Tên khớp định danh" chuChuaDat="Tên KHÔNG khớp định danh" />
                      <CoDieuKien dat={it.ownerIdentityApproved}
                        chuDat="Định danh đã duyệt" chuChuaDat="Định danh chưa duyệt" />
                      <CoDieuKien dat={!it.accountNumberUnreadable}
                        chuDat="Số tài khoản đọc được" chuChuaDat="Số tài khoản lưu bị hỏng" />
                    </div>
                  </div>

                  {!it.isVerified && (
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <button onClick={() => setTarget({ item: it, approve: true })}
                        disabled={!duDieuKien}
                        title={duDieuKien ? undefined : 'Chưa đủ điều kiện — xem các dòng cảnh báo bên trái'} aria-label={duDieuKien ? undefined : 'Chưa đủ điều kiện — xem các dòng cảnh báo bên trái'}
                        className="flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed justify-center min-h-[44px] px-4 border-2 border-success bg-card text-success text-sm font-semibold hover:bg-success hover:text-lamp">
                        <CheckCircle2 size={13} /> Duyệt
                      </button>
                      {/* Đã từ chối rồi thì từ chối lần nữa không đổi gì; vẫn cho Duyệt nếu Admin đổi ý. */}
                      {!it.rejectedAt && <button onClick={() => setTarget({ item: it, approve: false })}
                        className="flex items-center gap-1.5 justify-center min-h-[44px] px-4 border-2 border-danger bg-card text-danger text-sm font-semibold hover:bg-danger hover:text-lamp">
                        <Ban size={13} /> Từ chối
                      </button>}
                    </div>
                  )}
                </div>

                {/* LIỆT KÊ ĐỦ MỌI LÝ DO, KHÔNG CHỈ MỘT. Dữ liệu thật đang có một hàng hỏng cả ba
                    điều kiện cùng lúc; nêu từng lý do một thì người duyệt đi sửa xong cái thứ nhất
                    lại quay lại gặp cái thứ hai. Mỗi lý do kèm luôn việc phải làm ở đâu. */}
                {!duDieuKien && !it.isVerified && !it.rejectedAt && (
                  <ul className="mt-3 pt-3 border-t border-line space-y-1.5">
                    {lyDoChuaDuyet(it).map((ly) => (
                      <li key={ly} className="text-xs text-warning/90 leading-relaxed flex items-start gap-1.5">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        {ly}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {!isLoading && !ds.loi && <PhanTrang ds={ds} tenDonVi="tài khoản" />}

      {target && (
        <ReviewModal item={target.item} approve={target.approve}
          onClose={() => setTarget(null)} onSaved={load} />
      )}
    </div>
  )
}

export default AdminBankAccountsPage
