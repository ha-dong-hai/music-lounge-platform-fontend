// src/pages/owner/OwnerBankAccountsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Đây là đích đến của TIỀN THẬT: tiền quyết toán sau mỗi buổi diễn và tiền donate trả cho nghệ sĩ
//   đều chuyển về tài khoản khai ở đây. Không khai thì tiền vẫn được ghi sổ nhưng nằm lại.
// - Một tài khoản thuộc về MỘT trong hai loại chủ sở hữu: phòng trà (ownerType 'Lounge') hoặc một
//   nghệ sĩ do chủ tạo ('Performer'). Cả hai tham số ownerType + ownerId đều bắt buộc khi đọc.
// - accountHolder phải khớp tên định danh hợp pháp của chủ phòng trà (MLACP-399). Không khớp thì
//   Admin từ chối lúc duyệt. Backend trả câu giải thích tiếng Việt — hiển thị nguyên văn, đừng
//   thay bằng thông báo chung.
// - isVerified do ADMIN đặt khi duyệt, chủ phòng trà không tự bật được. Chưa duyệt thì tài khoản
//   vẫn lưu được nhưng chưa dùng để chi trả.
// - accountNumberUnreadable: số tài khoản được mã hoá khi lưu; cờ này bật nghĩa là backend GIẢI MÃ
//   KHÔNG ĐƯỢC (khoá mã hoá đã đổi hoặc dữ liệu hỏng), và accountNumber trả về null. Phải nói rõ là
//   cần nhập lại, đừng hiển thị ô trống như thể chưa khai.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Pencil, Landmark, ShieldCheck, ShieldAlert, AlertTriangle, X, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { getBankAccounts, createBankAccount, updateBankAccount } from '../../services/bankAccountServices'
import { getLounges } from '../../services/loungeServices'
import { useAuthStore } from '../../store/useAuthStore'
import { getMyPerformers } from '../../services/performerServices'
import KhungTai, { TrangLoiTai } from '../../components/bang/KhungTai'
import HopThoai, { TieuDeHop } from '../../components/shared/HopThoai'
import { maNgan } from '../../utils/format'

// NGHỆ SĨ NÀO ĐƯỢC CHỌN (sửa 01/10/2026): GET /performers là danh mục DÙNG CHUNG của mọi phòng trà, sắp theo Id, kẹp
// 50/trang. Bản cũ lấy một trang pageSize 100 (nhận 50) và cho chọn TẤT CẢ: chọn hồ sơ phòng trà khác tạo thì backend trả
// 403 (BankAccountAccess.EnsureCanManageAsync — chỉ người tạo hồ sơ nghệ sĩ quản lý tài khoản của họ); còn nghệ sĩ
// mình tạo nằm sau 50 hồ sơ đầu danh mục thì không bao giờ hiện. Nay lật từng trang 50 và chỉ giữ hồ sơ
// createdByUserId = mình.
// TRẦN: tối đa 10 trang (500 hồ sơ đầu danh mục) — quá trần thì báo rõ trên màn thay vì im lặng thiếu.
// ĐƯỜNG NÂNG CẤP: backend đã có createdByMe (MLACP-501, PR #362, chưa deploy) → bỏ vòng lặp này sau khi deploy.
const TRAN_TRANG_NGHE_SI = 10
const taiNgheSiDoToiTao = async (userId) => {
  const cuaToi = []
  let trang = 1
  let soTrang
  do {
    // createdByMe (MLACP-501, PR #362): backend mới chỉ trả hồ sơ của người gọi → vòng này dừng ngay ở trang 1. Backend cũ
    // bỏ qua tham số → lật danh mục chung như trước và lọc phía trình duyệt. GỠ vòng lặp + lọc sau khi #362 deploy.
    const res = await getMyPerformers({ page: trang, pageSize: 50, createdByMe: true })
    if (!res?.success) throw new Error('performers')
    const d = res.data
    cuaToi.push(...((Array.isArray(d) ? d : d?.items) ?? []).filter((p) => String(p.createdByUserId) === String(userId)))
    soTrang = Array.isArray(d) ? 1 : d?.totalPages ?? 1
    trang += 1
  } while (trang <= soTrang && trang <= TRAN_TRANG_NGHE_SI)
  return { cuaToi, vuotTran: soTrang > TRAN_TRANG_NGHE_SI }
}

const inputCls = 'mt-1 w-full min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2'

const AccountFormModal = ({ initial, chuSoHuu, onClose, onSaved }) => {
  const isEdit = !!initial
  const [form, setForm] = useState({
    bankName: initial?.bankName ?? '',
    accountNumber: initial?.accountNumber ?? '',
    accountHolder: initial?.accountHolder ?? '',
    isDefault: initial?.isDefault ?? false,
  })
  const [isBusy, setIsBusy] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountHolder.trim()) {
      toast.error('Cần điền tên ngân hàng, số tài khoản và tên chủ tài khoản.')
      return
    }
    setIsBusy(true)
    try {
      const payload = {
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        accountHolder: form.accountHolder.trim(),
        isDefault: form.isDefault,
      }
      if (isEdit) {
        await updateBankAccount(initial.id, payload)
        toast.success('Đã lưu tài khoản.')
      } else {
        await createBankAccount({ ownerType: chuSoHuu.type, ownerId: chuSoHuu.id, ...payload })
        toast.success('Đã thêm tài khoản. Tài khoản cần Admin duyệt trước khi dùng để chi trả.')
      }
      onSaved()
      onClose()
    } catch (err) {
      // Lỗi tên chủ tài khoản không khớp định danh là một câu giải thích cụ thể của backend —
      // thay nó bằng "Lưu thất bại" là làm người dùng mất manh mối duy nhất.
      toast.error(err.response?.data?.message || 'Không lưu được tài khoản.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <HopThoai onDong={onClose} className="max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <TieuDeHop><h2 className="text-3xl text-ink">{isEdit ? 'Sửa tài khoản' : 'Thêm tài khoản nhận tiền'}</h2></TieuDeHop>
          <button onClick={onClose} disabled={isBusy} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft disabled:opacity-30" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-ink">Ngân hàng <span className="text-danger">*</span></label>
            <input aria-label="Ngân hàng" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} className={inputCls} placeholder="VD: Vietcombank" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Số tài khoản <span className="text-danger">*</span></label>
            <input aria-label="Số tài khoản" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} className={inputCls} inputMode="numeric" />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Tên chủ tài khoản <span className="text-danger">*</span></label>
            <input aria-label="Tên chủ tài khoản" value={form.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} className={inputCls} />
            <p className="text-xs text-warning/80 mt-1 leading-relaxed">
              Phải trùng tên trên giấy tờ định danh của chủ phòng trà. Lệch tên thì Admin sẽ từ chối khi duyệt.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="accent-ink" />
            Dùng làm tài khoản mặc định
          </label>

          <div className="flex gap-3 pt-2 flex-wrap">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="inline-flex flex-1 disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {isBusy ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </HopThoai>
  )
}

const OwnerBankAccountsPage = () => {
  const [lounge, setLounge] = useState(null)
  const [performers, setPerformers] = useState([])
  const [ngheSiVuotTran, setNgheSiVuotTran] = useState(false)
  // Ba chỗ lỗi tải (01/10/2026) — bản cũ toast rồi vẽ "chưa có": phòng trà lỗi → "chưa có phòng trà"; danh sách tài khoản
  // lỗi → "Chưa có tài khoản nào" (chủ phòng trà có thể khai TRÙNG); nghệ sĩ lỗi → ô chọn lặng lẽ trống.
  const [loiTai, setLoiTai] = useState(false)
  const [loiNgheSi, setLoiNgheSi] = useState(false)
  const [loiTaiKhoan, setLoiTaiKhoan] = useState(false)
  const userId = useAuthStore((st) => st.user?.id)
  const [chuSoHuu, setChuSoHuu] = useState(null)   // { type, id, label }
  const [accounts, setAccounts] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [editing, setEditing] = useState(undefined) // undefined = đóng, null = thêm, object = sửa

  // Bước 1: biết mình sở hữu phòng trà nào và có những nghệ sĩ nào — tài khoản luôn gắn với một trong hai.
  const loadChuSoHuu = useCallback(async () => {
    setIsLoading(true)
    setLoiTai(false)
    try {
      const [loungeRes, performerRes] = await Promise.allSettled([
        getLounges({ mine: true }),
        taiNgheSiDoToiTao(userId),
      ])
      if (loungeRes.status === 'rejected' || !loungeRes.value?.success) throw new Error('lounges')
      setLoiNgheSi(performerRes.status === 'rejected')
      const ds = loungeRes.status === 'fulfilled' && loungeRes.value?.success ? loungeRes.value.data : null
      const cuaToi = (Array.isArray(ds) ? ds : ds?.items)?.[0] ?? null
      setLounge(cuaToi)

      const pds = performerRes.status === 'fulfilled' ? performerRes.value : null
      setPerformers(pds?.cuaToi ?? [])
      setNgheSiVuotTran(Boolean(pds?.vuotTran))

      if (cuaToi) setChuSoHuu({ type: 'Lounge', id: cuaToi.id, label: cuaToi.name })
    } catch {
      setLoiTai(true)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => { const chay = async () => { await loadChuSoHuu() }; chay() }, [loadChuSoHuu])

  // Bước 2: danh sách tài khoản của chủ sở hữu đang chọn.
  const loadAccounts = useCallback(async () => {
    if (!chuSoHuu) return
    setIsLoadingList(true)
    setLoiTaiKhoan(false)
    try {
      const res = await getBankAccounts(chuSoHuu.type, chuSoHuu.id)
      if (!res.success) throw new Error('accounts')
      setAccounts(res.data ?? [])
    } catch {
      setLoiTaiKhoan(true)
      setAccounts([])
    } finally {
      setIsLoadingList(false)
    }
  }, [chuSoHuu])

  useEffect(() => { const chay = async () => { await loadAccounts() }; chay() }, [loadAccounts])

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
  }

  if (loiTai) return <TrangLoiTai tieuDe="Tài khoản nhận tiền" tenVung="thông tin phòng trà" taiLai={loadChuSoHuu} />

  if (!lounge) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl text-ink mb-1">Tài khoản nhận tiền</h1>
        <div className="mt-4 bg-card border border-line p-6">
          <p className="text-sm text-ink-soft">
            Bạn chưa có phòng trà. Hãy tạo hồ sơ phòng trà trước — tài khoản nhận tiền gắn với phòng trà,
            không gắn với tài khoản đăng nhập.
          </p>
        </div>
      </div>
    )
  }

  // Tên trùng (cùng một nghệ sĩ khai hai lần, hoặc hai người cùng nghệ danh) phải phân biệt được trong ô chọn:
  // PerformerDto không có ngày tạo, nên kèm thể loại và mã hồ sơ.
  const demTen = performers.reduce((m, p) => m.set(p.name, (m.get(p.name) ?? 0) + 1), new Map())
  const nhanNgheSi = (p) => demTen.get(p.name) > 1
    ? `${p.name} — ${p.genreNames?.length ? p.genreNames.join(', ') + ' · ' : ''}#${maNgan(p.id)}`
    : p.name

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-4xl text-ink mb-1">Tài khoản nhận tiền</h1>
        <p className="text-ink-soft text-sm leading-relaxed">
          Nơi hệ thống chuyển tiền quyết toán sau mỗi buổi diễn, và tiền ủng hộ trả cho nghệ sĩ.
          Chưa khai tài khoản thì tiền vẫn được ghi sổ nhưng chưa chuyển đi được.
        </p>
      </div>

      {/* Chọn chủ sở hữu: tài khoản của phòng trà và của từng nghệ sĩ là những danh sách tách biệt.
          01/10/2026: bản trước bày mỗi nghệ sĩ một nút — 18 nghệ sĩ là một bức tường nút, càng nhiều nghệ sĩ càng dài, và
          tên trùng không phân biệt được (DESIGN.md "Danh sách lựa chọn dài: thu gọn"). Nay: một nút cho phòng trà + ô chọn
          nghệ sĩ (select gốc: gõ chữ cái để nhảy, trình đọc màn hình đọc được, không thêm thư viện). */}
      <div role="group" aria-label="Chọn chủ tài khoản" className="flex flex-wrap items-end gap-3">
        <button type="button" aria-pressed={chuSoHuu?.type === 'Lounge'}
          onClick={() => setChuSoHuu({ type: 'Lounge', id: lounge.id, label: lounge.name })}
          className={`inline-flex items-center gap-2 min-h-[44px] px-4 border-2 border-ink text-sm font-semibold ${chuSoHuu?.type === 'Lounge' ? 'bg-ink text-lamp' : 'bg-card text-ink hover:bg-sunken'}`}>
          {lounge.name} (phòng trà)
        </button>
        {performers.length > 0 && (
          <label className="block">
            <span className="text-sm font-semibold">Nghệ sĩ do bạn tạo ({performers.length})</span>
            <select value={chuSoHuu?.type === 'Performer' ? String(chuSoHuu.id) : ''}
              onChange={(e) => {
                const p = performers.find((x) => String(x.id) === e.target.value)
                if (p) setChuSoHuu({ type: 'Performer', id: p.id, label: nhanNgheSi(p) })
              }}
              className={`mt-1 block min-h-[44px] w-full sm:w-80 px-3 border-2 text-ink ${chuSoHuu?.type === 'Performer' ? 'border-ink bg-sunken' : 'border-ink/40 bg-card'} focus:outline-none focus:ring-2 focus:ring-ink`}>
              <option value="">— chọn nghệ sĩ —</option>
              {[...performers].sort((a, b) => a.name.localeCompare(b.name, 'vi')).map((p) => (
                <option key={p.id} value={String(p.id)}>{nhanNgheSi(p)}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="text-xs text-ink-mute -mt-3">
        Chỉ hiện nghệ sĩ do bạn tạo — tài khoản nhận tiền của nghệ sĩ chỉ người tạo hồ sơ đó khai được.
        {ngheSiVuotTran && ' Danh mục nghệ sĩ đã quá 500 hồ sơ nên có thể thiếu nghệ sĩ bạn tạo gần đây; báo quản trị viên nếu không thấy.'}
        {loiNgheSi && <span role="alert" className="block text-danger mt-1">Chưa tải được danh sách nghệ sĩ — tải lại trang để thử lại.</span>}
      </p>

      <div className="bg-card border border-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans font-bold text-base text-ink">{chuSoHuu?.label}</h2>
          <button onClick={() => setEditing(null)}
            className="flex items-center gap-1.5 justify-center min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
            <Plus size={14} /> Thêm tài khoản
          </button>
        </div>

        {isLoadingList ? (
          <div className="py-10 flex justify-center"><Loader2 size={24} className="animate-spin text-ink" /></div>
        ) : loiTaiKhoan ? (
          <KhungTai loi tenVung="danh sách tài khoản" taiLai={loadAccounts} />
        ) : accounts.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-mute">Chưa có tài khoản nào cho mục này.</p>
        ) : (
          <ul className="space-y-3">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 bg-sunken border border-line p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Landmark size={16} className="text-ink-mute flex-shrink-0" />
                    <span className="text-ink font-medium">{a.bankName}</span>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink/10 text-ink text-xs font-medium">
                        <Star size={11} /> Mặc định
                      </span>
                    )}
                    {a.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/10 text-success text-xs font-medium">
                        <ShieldCheck size={11} /> Đã duyệt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-warning/10 text-warning text-xs font-medium">
                        <ShieldAlert size={11} /> Chờ Admin duyệt
                      </span>
                    )}
                  </div>

                  {a.accountNumberUnreadable ? (
                    <p className="text-xs text-danger mt-1.5 flex items-start gap-1.5">
                      <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                      Hệ thống không đọc lại được số tài khoản này. Hãy bấm Sửa và nhập lại số tài khoản.
                    </p>
                  ) : (
                    <p className="text-sm text-ink-soft mt-1 tabular-nums">{a.accountNumber}</p>
                  )}
                  <p className="text-xs text-ink-mute mt-0.5">{a.accountHolder}</p>
                </div>

                <button onClick={() => setEditing(a)}
                  className="flex items-center gap-1.5 flex-shrink-0 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
                  <Pencil size={14} /> Sửa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing !== undefined && chuSoHuu && (
        <AccountFormModal
          initial={editing}
          chuSoHuu={chuSoHuu}
          onClose={() => setEditing(undefined)}
          onSaved={loadAccounts}
        />
      )}
    </div>
  )
}

export default OwnerBankAccountsPage
