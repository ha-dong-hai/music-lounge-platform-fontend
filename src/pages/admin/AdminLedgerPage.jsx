// src/pages/admin/AdminLedgerPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import { getLedgerIntegrityCheck, getRecurringJobs, triggerRecurringJob } from '../../services/adminServices'
import ConfirmModal from '../../components/shared/ConfirmModal'
import LedgerIntegrityCard from '../../components/admin/ledger/LedgerIntegrityCard'
import RecurringJobsCard from '../../components/admin/ledger/RecurringJobsCard'

const AdminLedgerPage = () => {
  // null = chưa có dữ liệu (lỗi) | [] = đã kiểm và cân — 2 trạng thái này PHẢI hiển thị khác nhau
  const [issues, setIssues] = useState(null)
  const [isChecking, setIsChecking] = useState(true)
  const [lastCheckedAt, setLastCheckedAt] = useState(null)

  const [jobs, setJobs] = useState([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [jobXacNhan, setJobXacNhan] = useState(null)
  const [isTriggering, setIsTriggering] = useState(false)

  // 1. KIỂM TRA TOÀN VẸN
  const kiemTra = useCallback(async () => {
    setIsChecking(true)
    try {
      const res = await getLedgerIntegrityCheck()
      if (res.success) {
        setIssues(res.data ?? [])
        setLastCheckedAt(new Date())
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

  // 2. TẢI DANH SÁCH JOB
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

  // 3. CHẠY JOB — hành động THẬT trên dữ liệu thật (nhiều job động vào tiền), đã có ConfirmModal chặn
  const chayJob = async () => {
    if (!jobXacNhan) return
    setIsTriggering(true)
    try {
      await triggerRecurringJob(jobXacNhan)
      toast.success(`Đã yêu cầu chạy "${jobXacNhan}".`)
      setJobXacNhan(null)
      // Job động vào tiền → kiểm lại sổ cái ngay. Job chạy nền nên kết quả có thể chưa kịp
      // phản ánh — vẫn để nút "Kiểm tra lại" cho Admin bấm thêm.
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
      <div className="flex items-center gap-3">
        <Receipt size={28} className="text-brand-text" />
        <div>
          <h1 className="text-2xl font-bold text-ink">Sổ cái</h1>
          <p className="text-ink-soft text-sm">
            Kiểm tra bút toán có cân không, và chạy lại tác vụ định kỳ khi cần.
          </p>
        </div>
      </div>

      {/* KHỐI 1: TOÀN VẸN */}
      <LedgerIntegrityCard
        issues={issues}
        isChecking={isChecking}
        lastCheckedAt={lastCheckedAt}
        onRefresh={kiemTra}
      />

      {/* KHỐI 2: TÁC VỤ ĐỊNH KỲ */}
      <RecurringJobsCard
        jobs={jobs}
        isLoading={isLoadingJobs}
        isTriggering={isTriggering}
        onTrigger={setJobXacNhan}
      />

      {/* XÁC NHẬN CHẠY JOB */}
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
