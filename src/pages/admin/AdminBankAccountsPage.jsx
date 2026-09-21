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
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, Landmark, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldCheck, X, Ban,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getAdminBankAccounts, reviewPayoutBankAccount } from '../../services/adminServices'
import { mocUtc } from '../../utils/format'

// Một điều kiện duyệt. `dat` = đã thoả. Hiện cả khi đạt lẫn khi chưa, vì "không thấy cảnh báo"
// và "chưa kiểm" trông giống nhau nếu chỉ hiện lúc hỏng.
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={() => !isBusy && onClose()} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">
            {approve ? 'Duyệt tài khoản nhận tiền?' : 'Từ chối tài khoản?'}
          </h2>
          <button onClick={onClose} disabled={isBusy}
            className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-espresso/50 border border-line space-y-1">
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
            <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle size={13} className="mt-px flex-shrink-0" />
              Duyệt xong, doanh thu của phòng trà này sẽ được chuyển vào số tài khoản trên. Hãy đối
              chiếu TÊN chủ tài khoản với tên định danh — số tài khoản cố ý chỉ hiện dạng che.
            </p>
          )}

          <div>
            <label className="text-xs text-ink-mute">
              Ghi chú {approve ? <span className="text-ink-mute">(không bắt buộc)</span> : <span className="text-danger">*</span>}
            </label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={approve ? 'Ghi chú nội bộ nếu cần' : 'VD: tên chủ tài khoản không khớp tên trên CCCD đã duyệt'}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink resize-none focus:outline-none focus:border-brand/50" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                approve ? 'bg-brand text-on-brand hover:bg-brand-hover' : 'bg-red-500 text-white hover:bg-red-600'
              }`}>
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {approve ? 'Duyệt' : 'Từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AdminBankAccountsPage = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [daDuyet, setDaDuyet] = useState(false) // false = hàng đợi chờ duyệt
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [target, setTarget] = useState(null) // { item, approve }

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAdminBankAccounts({ verified: daDuyet, page, pageSize: 20 })
      if (res.success) {
        setItems(res.data?.items ?? [])
        setTotalPages(res.data?.totalPages ?? 1)
        setTotalCount(res.data?.totalCount ?? 0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách tài khoản.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [daDuyet, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const doiTab = (v) => { setDaDuyet(v); setPage(1) }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Landmark size={28} className="text-brand-text" />
          <div>
            <h1 className="text-2xl font-bold text-ink">Tài khoản nhận tiền</h1>
            <p className="text-ink-soft text-sm leading-relaxed">
              Duyệt số tài khoản mà doanh thu của phòng trà sẽ được chuyển vào. Chỉ tài khoản của
              phòng trà — tài khoản của nghệ sĩ không duyệt ở đây.
            </p>
          </div>
        </div>
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken disabled:opacity-50">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => doiTab(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            !daDuyet ? 'bg-sunken border-brand/40 text-brand-text' : 'bg-page border-line text-ink-soft hover:text-ink'
          }`}>
          Chờ duyệt{!daDuyet && totalCount > 0 ? ` (${totalCount})` : ''}
        </button>
        <button onClick={() => doiTab(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            daDuyet ? 'bg-sunken border-brand/40 text-brand-text' : 'bg-page border-line text-ink-soft hover:text-ink'
          }`}>
          Đã duyệt
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={30} className="animate-spin text-brand-text" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-12 text-center">
          <Landmark size={30} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">
            {daDuyet ? 'Chưa có tài khoản nào được duyệt.' : 'Không có tài khoản nào đang chờ duyệt.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            // Đủ điều kiện duyệt = khớp tên + định danh đã duyệt + số tài khoản đọc được.
            // Ba điều kiện này backend cũng kiểm lại, đây chỉ là chặn sớm cho người dùng.
            const duDieuKien = it.holderNameMatches && it.ownerIdentityApproved && !it.accountNumberUnreadable
            return (
              <li key={it.id} className={`bg-card border rounded-xl p-5 ${duDieuKien ? 'border-line' : 'border-yellow-500/30'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/lounge/${it.loungeId}`} target="_blank"
                        className="text-ink font-bold hover:text-brand-text">
                        {it.loungeName}
                      </Link>
                      {it.isDefault && (
                        <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand-text text-xs">Mặc định</span>
                      )}
                      {it.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-success text-xs">
                          <ShieldCheck size={11} /> Đã duyệt
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
                    </p>

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
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setTarget({ item: it, approve: true })}
                        disabled={!duDieuKien}
                        title={duDieuKien ? undefined : 'Chưa đủ điều kiện — xem các dòng cảnh báo bên trái'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/40 text-success text-xs font-bold hover:bg-green-500/10 disabled:opacity-30 disabled:cursor-not-allowed">
                        <CheckCircle2 size={13} /> Duyệt
                      </button>
                      <button onClick={() => setTarget({ item: it, approve: false })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 text-danger text-xs font-bold hover:bg-red-500/10">
                        <Ban size={13} /> Từ chối
                      </button>
                    </div>
                  )}
                </div>

                {/* LIỆT KÊ ĐỦ MỌI LÝ DO, KHÔNG CHỈ MỘT. Dữ liệu thật đang có một hàng hỏng cả ba
                    điều kiện cùng lúc; nêu từng lý do một thì người duyệt đi sửa xong cái thứ nhất
                    lại quay lại gặp cái thứ hai. Mỗi lý do kèm luôn việc phải làm ở đâu. */}
                {!duDieuKien && !it.isVerified && (
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-line text-sm text-ink-soft hover:bg-sunken disabled:opacity-40">
            Trước
          </button>
          <span className="text-sm text-ink-mute">Trang {page}/{totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-line text-sm text-ink-soft hover:bg-sunken disabled:opacity-40">
            Sau
          </button>
        </div>
      )}

      {target && (
        <ReviewModal item={target.item} approve={target.approve}
          onClose={() => setTarget(null)} onSaved={load} />
      )}
    </div>
  )
}

export default AdminBankAccountsPage
