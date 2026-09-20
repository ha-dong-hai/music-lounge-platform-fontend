// src/pages/admin/AdminLedgerPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Sidebar đã có link "Sổ cái (Ledger)" từ trước nhưng KHÔNG có route — bấm vào ra trang trắng.
//   Trang này vá chỗ đó, không phải thêm mục mới.
// - Backend chỉ có MỘT endpoint sổ cái: GET /admin/ledger/integrity-check. Không có API xem danh
//   sách bút toán, không có API xem chi tiết một bút toán. Đừng dựng bảng sổ cái đầy đủ ở đây rồi
//   chờ backend — muốn tra một bút toán cụ thể thì hiện phải vào cơ sở dữ liệu.
// - Mỗi dòng trả về là MỘT BÚT TOÁN LỆCH: tổng Nợ khác tổng Có. Danh sách rỗng là kết quả TỐT.
//   Rỗng và lỗi phải hiện khác nhau — trắng trang thì không ai biết là cân hay là gọi không được.
// - CÓ DÒNG LỆCH LÀ CHUYỆN KẾ TOÁN, KHÔNG PHẢI LỖI GIAO DIỆN. Tuyệt đối không "xử lý" bằng cách
//   ẩn dòng hay làm tròn số cho khớp; việc của trang này là nêu ra đúng như backend trả về.
// - Khối tác vụ định kỳ nằm chung trang vì đây là nơi Admin tới khi số tiền trông sai: phần lớn
//   job trong danh sách là job động vào tiền (quyết toán, hoàn tiền, án phạt quá hạn). Chạy lại một
//   job là hành động THẬT trên dữ liệu thật, nên phải hỏi lại trước khi chạy.
import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Receipt, RefreshCw, CheckCircle2, AlertTriangle, Clock, Play, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getLedgerIntegrityCheck, getRecurringJobs, triggerRecurringJob } from '../../services/adminServices'
import ConfirmModal from '../../components/shared/ConfirmModal'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Tên job của Hangfire là mã kỹ thuật (vd "settle-completed-shows"). Backend không trả tên hiển
// thị, nên đổi dấu gạch thành khoảng trắng cho đọc được — KHÔNG dịch, vì id là thứ duy nhất khớp
// với log và với dashboard Hangfire.
const tenDocDuoc = (jobId) => jobId.replace(/[-_]/g, ' ')

const AdminLedgerPage = () => {
  const [issues, setIssues] = useState(null) // null = chưa có dữ liệu (lỗi), [] = đã kiểm và cân
  const [isChecking, setIsChecking] = useState(true)
  const [kiemLuc, setKiemLuc] = useState(null)

  const [jobs, setJobs] = useState([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [jobXacNhan, setJobXacNhan] = useState(null)
  const [isTriggering, setIsTriggering] = useState(false)

  const kiemTra = useCallback(async () => {
    setIsChecking(true)
    try {
      const res = await getLedgerIntegrityCheck()
      if (res.success) {
        setIssues(res.data ?? [])
        setKiemLuc(new Date())
      } else {
        setIssues(null)
        toast.error(res.message || 'Không kiểm tra được sổ cái.')
      }
    } catch (err) {
      setIssues(null)
      toast.error(err.response?.data?.message || 'Không kiểm tra được sổ cái.')
    } finally {
      setIsChecking(false)
    }
  }, [])

  const taiJobs = useCallback(async () => {
    setIsLoadingJobs(true)
    try {
      const res = await getRecurringJobs()
      if (res.success) setJobs(res.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách tác vụ định kỳ.')
    } finally {
      setIsLoadingJobs(false)
    }
  }, [])

  useEffect(() => {
    const chay = async () => { await Promise.all([kiemTra(), taiJobs()]) }
    chay()
  }, [kiemTra, taiJobs])

  const chayJob = async () => {
    if (!jobXacNhan) return
    setIsTriggering(true)
    try {
      await triggerRecurringJob(jobXacNhan)
      toast.success(`Đã yêu cầu chạy "${jobXacNhan}".`)
      setJobXacNhan(null)
      // Job động vào tiền → kiểm lại sổ cái ngay sau khi chạy. Job chạy nền nên kết quả có thể
      // chưa kịp phản ánh, vì vậy vẫn để nút "Kiểm tra lại" cho Admin bấm thêm.
      await kiemTra()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không chạy được tác vụ.')
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Receipt size={28} className="text-[#C3B665]" />
          <div>
            <h1 className="text-2xl font-bold text-white">Sổ cái</h1>
            <p className="text-gray-400 text-sm">
              Kiểm tra bút toán có cân không, và chạy lại tác vụ định kỳ khi cần.
            </p>
          </div>
        </div>
        <button onClick={kiemTra} disabled={isChecking}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
          {isChecking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Kiểm tra lại
        </button>
      </div>

      {/* KẾT QUẢ KIỂM TRA TOÀN VẸN */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400">Toàn vẹn bút toán</h2>
        <p className="text-xs text-gray-600 mt-0.5 mb-3 leading-relaxed">
          Mỗi bút toán phải có tổng Nợ bằng tổng Có. Dòng nào lệch sẽ hiện ở đây kèm số liệu thật —
          đây là việc của kế toán xử lý, không phải lỗi hiển thị.
        </p>

        {isChecking ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl py-16 flex justify-center">
            <Loader2 size={26} className="animate-spin text-[#C3B665]" />
          </div>
        ) : issues === null ? (
          // Phân biệt rõ với trường hợp cân: không gọi được thì KHÔNG được hiện "sổ cái cân".
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">Chưa kiểm tra được</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Không gọi được endpoint kiểm tra. Đây KHÔNG có nghĩa là sổ cái cân — hãy bấm
                &quot;Kiểm tra lại&quot;.
              </p>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-gray-900 border border-green-500/25 rounded-xl p-6 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">Sổ cái cân</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Không có bút toán nào lệch.
                {kiemLuc && ` Kiểm lúc ${kiemLuc.toLocaleTimeString('vi-VN')}.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-red-500/30 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-white font-medium">
                {issues.length} bút toán lệch — cần kế toán đối chiếu
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-black/40 border-b border-gray-800">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Loại lệch</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã bút toán</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Tổng Nợ</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Tổng Có</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Chênh lệch</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {issues.map((it, i) => (
                    <tr key={`${it.journalId}-${i}`} className="hover:bg-gray-800/30">
                      <td className="p-4 text-sm text-white">{it.issueType}</td>
                      <td className="p-4 text-xs text-gray-400 font-mono">{it.journalId}</td>
                      <td className="p-4 text-sm text-gray-300 text-right tabular-nums">{fmtTien(it.debitTotal)}</td>
                      <td className="p-4 text-sm text-gray-300 text-right tabular-nums">{fmtTien(it.creditTotal)}</td>
                      <td className="p-4 text-sm text-red-400 text-right tabular-nums font-medium">
                        {fmtTien(Number(it.debitTotal || 0) - Number(it.creditTotal || 0))}
                      </td>
                      <td className="p-4 text-xs text-gray-500 max-w-xs whitespace-normal leading-relaxed">
                        {it.detail || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* TÁC VỤ ĐỊNH KỲ */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
          <Clock size={15} /> Tác vụ định kỳ
        </h2>
        <p className="text-xs text-gray-600 mt-0.5 mb-3 leading-relaxed">
          Các job chạy theo lịch. Bấm chạy khi job lỡ nhịp, hoặc khi vừa sửa dữ liệu và muốn thấy kết
          quả ngay. Backend chỉ trả về mã job — không có lần chạy gần nhất hay trạng thái, muốn xem
          thì vào dashboard Hangfire.
        </p>

        {isLoadingJobs ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 flex justify-center">
            <Loader2 size={22} className="animate-spin text-[#C3B665]" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-sm text-gray-500">Không có tác vụ định kỳ nào đang đăng ký.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {jobs.map((jobId) => (
              <div key={jobId} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white capitalize">{tenDocDuoc(jobId)}</p>
                  <p className="text-xs text-gray-600 mt-0.5 font-mono break-all">{jobId}</p>
                </div>
                <button onClick={() => setJobXacNhan(jobId)} disabled={isTriggering}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50 flex-shrink-0">
                  <Play size={13} /> Chạy ngay
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-600 mt-3 flex items-start gap-1.5 leading-relaxed">
          <ExternalLink size={12} className="mt-0.5 flex-shrink-0" />
          Lịch chạy, lần chạy gần nhất và log chi tiết nằm ở dashboard Hangfire của backend, không
          phải ở đây.
        </p>
      </div>

      <ConfirmModal
        isOpen={!!jobXacNhan}
        title="Chạy tác vụ này ngay?"
        message={`"${jobXacNhan}" sẽ chạy ngay trên dữ liệu thật. Nhiều tác vụ định kỳ động vào tiền (quyết toán, hoàn tiền, án phạt quá hạn) và không có bước hoàn tác. Backend ghi log ai đã bấm.`}
        confirmText="Chạy ngay"
        processingText="Đang chạy..."
        danger
        isProcessing={isTriggering}
        onClose={() => setJobXacNhan(null)}
        onConfirm={chayJob}
      />
    </div>
  )
}

export default AdminLedgerPage
