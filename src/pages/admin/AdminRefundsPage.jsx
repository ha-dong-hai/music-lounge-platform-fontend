// src/pages/admin/AdminRefundsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Bấm duyệt gọi VNPay hoàn tiền THẬT, không phải chỉ đổi trạng thái trong DB. Backend chỉ ghi sổ khi VNPay xác nhận
//   thành công. Trên tài khoản sandbox VNPay khoá sẵn chức năng hoàn tiền, nên rất có thể trả 503 — đó là giới hạn tài
//   khoản, không phải lỗi code. Câu lỗi hiển thị nguyên văn để phân biệt.
// - expectedResolutionBy là hạn phải trả lời người mua (tạo + refund_sla_hours, mặc định 72h). Có job nền tự duyệt
//   yêu cầu quá hạn, nên hàng đợi có thể tự vơi mà không ai bấm.
//
// LÀM LẠI 01/10/2026 — BA ĐƯỜNG XỬ LÝ, bản cũ hiểu ngược cờ và khiến đường chuyển khoản KHÔNG BAO GIỜ xong được:
//   `payoutAccountRequired` = VNPay đã quá hạn nhận lệnh hoàn (RefundGatewayWindow, mặc định 90 ngày) VÀ người mua CHƯA
//   đồng ý nhận bằng chuyển khoản (RefundGatewayWindow.NeedsPayoutAccount). Bản cũ coi cờ này là "đã có tài khoản, hãy
//   chuyển khoản" → in dòng tài khoản rỗng " ·  · " (ba trường null) và vẫn cho bấm duyệt; còn khi người mua đã khai (cờ TẮT, payoutConsentAt có giá trị) thì lại gửi
//   như hoàn qua VNPay → 422 "quá hạn VNPay". Nay:
//     1. VNPAY          — không cờ, không payoutConsentAt: xác nhận rồi gọi VNPay.
//     2. CHỜ TÀI KHOẢN  — payoutAccountRequired: chưa hoàn được theo cách nào (Luật BVQLNTD 2023 Đ.38 k.4 — phải hoàn đúng
//                         phương thức đã trả trừ khi người mua đồng ý); chỉ cho từ chối. Hệ thống đang nhắc người mua khai.
//     3. CHUYỂN KHOẢN   — payoutConsentAt có giá trị (chỉ khai được khi đã quá hạn VNPay — ProvideRefundPayoutAccount):
//                         hiện đủ tài khoản người mua đã khai, BẮT BUỘC nhập mã chuyển khoản → manualTransferReference.
//   Mã chuyển khoản và ghi chú là HAI ô: bản cũ dùng một ô cho cả hai nên sổ ghi "mã X — X".
// - Ghi chú khi TỪ CHỐI được gửi nguyên văn cho người mua (ProcessRefundRequestCommandHandler, NotifyBuyerAsync) — nói rõ.
// - Mọi quyết định đi qua HopXacNhan (WCAG 2.2 SC 3.3.4: thao tác tài chính phải xác nhận được); bản cũ hoàn tiền ngay
//   ở lần bấm đầu.
// PHÂN TRANG (01/10/2026): dùng hooks/useDanhSachMayChu + components/bang/PhanTrang như mọi danh sách khác — bản cũ tự
// giữ {page,totalPages} với hai nút trước/sau, trang không lên URL (tải lại về trang 1) và không có dòng "Hiện x–y".
import { useState } from 'react'
import toast from 'react-hot-toast'
import { getPendingRefundRequests, processRefundRequest } from '../../services/moneyServices'
import HopXacNhan from '../../components/shared/HopXacNhan'
import NhanTrangThai from '../../components/shared/NhanTrangThai'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import { ngayDayDu, gioTrongNgay } from '../../utils/ngayVietNam'

const tien = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`
const duong = (r) => (r.payoutAccountRequired ? 'cho' : r.payoutConsentAt ? 'ck' : 'vnpay')
const O = 'w-full min-h-[44px] px-3 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink'

const AdminRefundsPage = () => {
  const ds = useDanhSachMayChu({ khoa: ['admin-hoan-tien'], goi: getPendingRefundRequests })
  const items = ds.items
  const isLoading = ds.dangTai
  const loiTai = Boolean(ds.loi)
  const [busyId, setBusyId] = useState(null)
  const [ghiChu, setGhiChu] = useState({})
  const [maCk, setMaCk] = useState({})
  const [loiMa, setLoiMa] = useState({})
  const [hoi, setHoi] = useState(null) // { r, decision }

  const moHoi = (r, decision) => {
    if (decision === 'Approved' && duong(r) === 'ck' && !(maCk[r.id] || '').trim()) {
      setLoiMa((l) => ({ ...l, [r.id]: 'Nhập mã giao dịch chuyển khoản trước khi duyệt.' }))
      document.getElementById(`ma-ck-${r.id}`)?.focus()
      return
    }
    setHoi({ r, decision })
  }

  const xuLy = async () => {
    const { r, decision } = hoi
    setBusyId(r.id)
    try {
      await processRefundRequest(r.id, {
        decision,
        resolutionNote: (ghiChu[r.id] || '').trim() || null,
        manualTransferReference: decision === 'Approved' && duong(r) === 'ck' ? maCk[r.id].trim() : null,
      })
      toast.success(decision === 'Approved' ? 'Đã duyệt hoàn tiền.' : 'Đã từ chối yêu cầu.')
      setHoi(null)
      await ds.taiLai()
    } catch (err) {
      setHoi(null)
      toast.error(err.response?.data?.message || 'Xử lý thất bại.', { duration: 10000 })
    } finally {
      setBusyId(null)
    }
  }

  const tieuDeHoi = !hoi ? '' : hoi.decision === 'Rejected' ? `Từ chối yêu cầu #${hoi.r.id}?`
    : duong(hoi.r) === 'ck' ? `Ghi nhận đã chuyển khoản ${tien(hoi.r.amountRequested)}?` : `Hoàn ${tien(hoi.r.amountRequested)} qua VNPay?`

  return (
    <div>
      <h1 className="text-4xl text-ink">Yêu cầu hoàn tiền</h1>
      <p className="mt-2 max-w-[70ch] text-ink-soft">
        Duyệt sẽ gọi VNPay hoàn tiền thật cho người mua; hệ thống chỉ ghi sổ khi VNPay xác nhận thành công. Giao dịch quá
        hạn VNPay thì chỉ hoàn được bằng chuyển khoản, sau khi người mua đồng ý và khai tài khoản.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-48 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải hàng đợi hoàn tiền" />
        ) : loiTai ? (
          <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
            <p>Hàng đợi hoàn tiền chưa tải được.</p>
            <button type="button" onClick={() => ds.taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
          </div>
        ) : items.length === 0 ? (
          <p className="border-2 border-ink p-6">Không có yêu cầu hoàn tiền nào đang chờ.</p>
        ) : (
          <ol className="border-y-2 border-ink divide-y divide-ink/20">
            {items.map((r) => {
              const quaHan = r.expectedResolutionBy && new Date(r.expectedResolutionBy) < new Date()
              const d = duong(r)
              const dangXuLy = busyId === r.id
              return (
                <li key={r.id} className="py-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-2xl">{tien(r.amountRequested)}</p>
                      {r.refundPercentage != null && <span className="text-sm text-ink-soft">hoàn {Number(r.refundPercentage)}%</span>}
                      {d === 'vnpay' && <NhanTrangThai sacThai="trung">Hoàn qua VNPay</NhanTrangThai>}
                      {d === 'cho' && <NhanTrangThai sacThai="cho">Chờ người mua khai tài khoản</NhanTrangThai>}
                      {d === 'ck' && <NhanTrangThai sacThai="cho">Cần chuyển khoản tay</NhanTrangThai>}
                      {quaHan && <NhanTrangThai sacThai="xau">Quá hạn trả lời</NhanTrangThai>}
                    </div>
                    <p className="mt-2 break-words">{r.reason}</p>
                    <p className="mt-1 text-sm text-ink-mute">
                      Yêu cầu #{r.id} · thanh toán #{r.paymentId} · tạo <span className="font-mono">{gioTrongNgay(r.createdAt)} {ngayDayDu(r.createdAt)}</span>
                      {r.expectedResolutionBy && <> · hạn trả lời <span className={`font-mono ${quaHan ? 'text-danger font-semibold' : ''}`}>{gioTrongNgay(r.expectedResolutionBy)} {ngayDayDu(r.expectedResolutionBy)}</span></>}
                    </p>

                    {d === 'cho' && (
                      <p className="mt-3 border-l-4 border-warning pl-3 text-ink-soft">
                        Giao dịch đã quá hạn VNPay nhận lệnh hoàn, và người mua chưa đồng ý nhận bằng chuyển khoản. Hệ thống đang
                        nhắc người mua khai tài khoản; chưa thể hoàn cho tới lúc đó.
                      </p>
                    )}
                    {d === 'ck' && (
                      <dl className="mt-3 border-l-4 border-ink pl-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
                        <dt className="text-ink-mute">Ngân hàng</dt><dd>{r.payoutBankName}</dd>
                        <dt className="text-ink-mute">Số tài khoản</dt><dd className="font-mono break-all">{r.payoutAccountNumber}</dd>
                        <dt className="text-ink-mute">Chủ tài khoản</dt><dd>{r.payoutAccountHolder}</dd>
                        <dt className="text-ink-mute">Đồng ý lúc</dt><dd className="font-mono">{gioTrongNgay(r.payoutConsentAt)} {ngayDayDu(r.payoutConsentAt)}</dd>
                      </dl>
                    )}
                  </div>

                  <div className="space-y-3">
                    {d === 'ck' && (
                      <div>
                        <label htmlFor={`ma-ck-${r.id}`} className="block text-sm font-semibold">Mã giao dịch chuyển khoản <span className="text-danger" aria-hidden="true">*</span></label>
                        <input id={`ma-ck-${r.id}`} value={maCk[r.id] || ''} autoComplete="off"
                          onChange={(e) => { setMaCk((p) => ({ ...p, [r.id]: e.target.value })); setLoiMa((l) => ({ ...l, [r.id]: undefined })) }}
                          aria-invalid={loiMa[r.id] ? 'true' : undefined} aria-describedby={loiMa[r.id] ? `ma-ck-loi-${r.id}` : undefined}
                          className={`${O} font-mono mt-1 ${loiMa[r.id] ? 'border-danger' : ''}`} />
                        {loiMa[r.id] && <p id={`ma-ck-loi-${r.id}`} className="mt-1 text-sm font-semibold text-danger">{loiMa[r.id]}</p>}
                      </div>
                    )}
                    <div>
                      <label htmlFor={`ghi-chu-${r.id}`} className="block text-sm font-semibold">Ghi chú <span className="font-normal text-ink-mute">(không bắt buộc)</span></label>
                      <p id={`ghi-chu-goi-y-${r.id}`} className="text-xs text-ink-soft">Nếu từ chối, ghi chú được gửi nguyên văn cho người mua.</p>
                      <input id={`ghi-chu-${r.id}`} value={ghiChu[r.id] || ''} maxLength={500} aria-describedby={`ghi-chu-goi-y-${r.id}`}
                        onChange={(e) => setGhiChu((p) => ({ ...p, [r.id]: e.target.value }))} className={`${O} mt-1`} />
                    </div>
                    <div className="flex gap-2">
                      {d !== 'cho' && (
                        <button type="button" onClick={() => moHoi(r, 'Approved')} disabled={dangXuLy}
                          className="flex-1 min-h-[44px] px-3 bg-ink text-lamp font-semibold hover:bg-board disabled:opacity-60">
                          {d === 'ck' ? 'Ghi nhận đã chuyển' : 'Duyệt hoàn'}
                        </button>
                      )}
                      <button type="button" onClick={() => moHoi(r, 'Rejected')} disabled={dangXuLy}
                        className="flex-1 min-h-[44px] px-3 border-2 border-danger text-danger font-semibold hover:bg-danger hover:text-lamp disabled:opacity-60">
                        Từ chối
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {!isLoading && !loiTai && <PhanTrang ds={ds} tenDonVi="yêu cầu" className="mt-4" />}

      <HopXacNhan mo={!!hoi} tieuDe={tieuDeHoi} dangXuLy={busyId != null}
        nhanXacNhan={!hoi ? '' : hoi.decision === 'Rejected' ? 'Từ chối yêu cầu' : duong(hoi.r) === 'ck' ? 'Ghi nhận đã chuyển' : 'Hoàn tiền qua VNPay'}
        nhanGiu="Không, quay lại" nguyHiem={hoi?.decision === 'Rejected'}
        onDong={() => setHoi(null)} onXacNhan={xuLy}>
        {hoi && (hoi.decision === 'Rejected' ? (
          <p>Người mua nhận thông báo từ chối{(ghiChu[hoi.r.id] || '').trim() ? ' kèm ghi chú của bạn' : ' (không có ghi chú — họ chỉ được hướng dẫn gửi khiếu nại)'}. Không hoàn tác được.</p>
        ) : duong(hoi.r) === 'ck' ? (
          <p>Chỉ bấm khi tiền ĐÃ tới tài khoản {hoi.r.payoutBankName} của {hoi.r.payoutAccountHolder}, mã <span className="font-mono">{(maCk[hoi.r.id] || '').trim()}</span>. Hệ thống ghi sổ theo mã này.</p>
        ) : (
          <p>VNPay sẽ hoàn {tien(hoi.r.amountRequested)} về đúng phương thức người mua đã trả. Không hoàn tác được.</p>
        ))}
      </HopXacNhan>
    </div>
  )
}

export default AdminRefundsPage
