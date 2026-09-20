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
import { getMyPerformers } from '../../services/performerServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Sửa tài khoản' : 'Thêm tài khoản nhận tiền'}</h2>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500">Ngân hàng <span className="text-red-400">*</span></label>
            <input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} className={inputCls} placeholder="VD: Vietcombank" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Số tài khoản <span className="text-red-400">*</span></label>
            <input value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} className={inputCls} inputMode="numeric" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Tên chủ tài khoản <span className="text-red-400">*</span></label>
            <input value={form.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} className={inputCls} />
            <p className="text-xs text-yellow-400/80 mt-1 leading-relaxed">
              Phải trùng tên trên giấy tờ định danh của chủ phòng trà. Lệch tên thì Admin sẽ từ chối khi duyệt.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="accent-[#C3B665]" />
            Dùng làm tài khoản mặc định
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f] flex items-center justify-center gap-2 disabled:opacity-50">
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {isBusy ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const OwnerBankAccountsPage = () => {
  const [lounge, setLounge] = useState(null)
  const [performers, setPerformers] = useState([])
  const [chuSoHuu, setChuSoHuu] = useState(null)   // { type, id, label }
  const [accounts, setAccounts] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [editing, setEditing] = useState(undefined) // undefined = đóng, null = thêm, object = sửa

  // Bước 1: biết mình sở hữu phòng trà nào và có những nghệ sĩ nào — tài khoản luôn gắn với một trong hai.
  const loadChuSoHuu = useCallback(async () => {
    setIsLoading(true)
    try {
      const [loungeRes, performerRes] = await Promise.allSettled([
        getLounges({ mine: true }),
        getMyPerformers({ pageSize: 100 }),
      ])
      const ds = loungeRes.status === 'fulfilled' && loungeRes.value?.success ? loungeRes.value.data : null
      const cuaToi = (Array.isArray(ds) ? ds : ds?.items)?.[0] ?? null
      setLounge(cuaToi)

      const pds = performerRes.status === 'fulfilled' && performerRes.value?.success ? performerRes.value.data : null
      setPerformers((Array.isArray(pds) ? pds : pds?.items) ?? [])

      if (cuaToi) setChuSoHuu({ type: 'Lounge', id: cuaToi.id, label: cuaToi.name })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được thông tin phòng trà.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await loadChuSoHuu() }; chay() }, [loadChuSoHuu])

  // Bước 2: danh sách tài khoản của chủ sở hữu đang chọn.
  const loadAccounts = useCallback(async () => {
    if (!chuSoHuu) return
    setIsLoadingList(true)
    try {
      const res = await getBankAccounts(chuSoHuu.type, chuSoHuu.id)
      if (res.success) setAccounts(res.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách tài khoản.')
      setAccounts([])
    } finally {
      setIsLoadingList(false)
    }
  }, [chuSoHuu])

  useEffect(() => { const chay = async () => { await loadAccounts() }; chay() }, [loadAccounts])

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  if (!lounge) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-1">Tài khoản nhận tiền</h1>
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">
            Bạn chưa có phòng trà. Hãy tạo hồ sơ phòng trà trước — tài khoản nhận tiền gắn với phòng trà,
            không gắn với tài khoản đăng nhập.
          </p>
        </div>
      </div>
    )
  }

  const danhSachChuSoHuu = [
    { type: 'Lounge', id: lounge.id, label: `${lounge.name} (phòng trà)` },
    ...performers.map((p) => ({ type: 'Performer', id: p.id, label: `${p.name} (nghệ sĩ)` })),
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Tài khoản nhận tiền</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Nơi hệ thống chuyển tiền quyết toán sau mỗi buổi diễn, và tiền donate trả cho nghệ sĩ.
          Chưa khai tài khoản thì tiền vẫn được ghi sổ nhưng chưa chuyển đi được.
        </p>
      </div>

      {/* Chọn chủ sở hữu: tài khoản của phòng trà và của từng nghệ sĩ là những danh sách tách biệt */}
      <div className="flex flex-wrap gap-2">
        {danhSachChuSoHuu.map((o) => {
          const dangChon = chuSoHuu?.type === o.type && chuSoHuu?.id === o.id
          return (
            <button key={`${o.type}-${o.id}`} onClick={() => setChuSoHuu(o)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${dangChon
                ? 'bg-gray-800 border-[#C3B665]/40 text-[#C3B665]'
                : 'bg-black border-gray-800 text-gray-400 hover:text-white'}`}>
              {o.label}
            </button>
          )
        })}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">{chuSoHuu?.label}</h2>
          <button onClick={() => setEditing(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C3B665] text-black rounded-lg text-xs font-bold hover:bg-[#d4c87f]">
            <Plus size={14} /> Thêm tài khoản
          </button>
        </div>

        {isLoadingList ? (
          <div className="py-10 flex justify-center"><Loader2 size={24} className="animate-spin text-[#C3B665]" /></div>
        ) : accounts.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">Chưa có tài khoản nào cho mục này.</p>
        ) : (
          <ul className="space-y-3">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 bg-black/40 border border-gray-800 rounded-lg p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Landmark size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-white font-medium">{a.bankName}</span>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#C3B665]/10 text-[#C3B665] text-xs font-medium">
                        <Star size={11} /> Mặc định
                      </span>
                    )}
                    {a.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-xs font-medium">
                        <ShieldCheck size={11} /> Đã duyệt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-medium">
                        <ShieldAlert size={11} /> Chờ Admin duyệt
                      </span>
                    )}
                  </div>

                  {a.accountNumberUnreadable ? (
                    <p className="text-xs text-red-400 mt-1.5 flex items-start gap-1.5">
                      <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                      Hệ thống không đọc lại được số tài khoản này. Hãy bấm Sửa và nhập lại số tài khoản.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1 tabular-nums">{a.accountNumber}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{a.accountHolder}</p>
                </div>

                <button onClick={() => setEditing(a)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 flex-shrink-0">
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
