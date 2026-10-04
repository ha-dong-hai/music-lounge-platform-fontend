// src/pages/admin/AdminAccountsPage.jsx
//
// TÀI KHOẢN NGƯỜI DÙNG (Admin). Làm lại 01/10/2026 làm trang mẫu cho components/bang/BangDuLieu (TanStack Table) +
// hooks/useDanhSachMayChu + ChipBoLoc. Bản cũ: bộ lọc không lên URL (tải lại/Quay lại mất bộ lọc), đổi bộ lọc gọi API
// HAI lần (một effect đưa về trang 1, một effect tải lại), chỉ có nút trước/sau và chữ "Trang 1 / 9", và khoá một tài
// khoản khi đang lọc "Đã bị khoá" thì dòng đó vẫn nằm lại sai bộ lọc.
//
// Lọc hoàn toàn phía máy chủ: GET /admin/users nhận searchText, role (UserRole: Audience|Staff|Owner|Admin), isActive,
// page, pageSize (AdminController.GetUsers). Tham số trên URL: q, vaiTro, trangThai, trang, co.
import { useState } from 'react'
import { parseAsString, parseAsStringLiteral } from 'nuqs'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { Eye, Ban, Unlock } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getAdminStats, getAdminUsers, getAdminUserDetail, toggleUserBan } from '../../services/adminServices'
import StatsCards from '../../components/admin/accounts/StatsCards'
import AccountsFilterBar from '../../components/admin/accounts/AccountsFilterBar'
import AccountDetailModal from '../../components/admin/accounts/AccountDetailModal'
import { RoleBadge, StatusBadge } from '../../components/admin/accounts/Badges'
import ConfirmModal from '../../components/shared/ConfirmModal'
import BangDuLieu from '../../components/bang/BangDuLieu'
import ChipBoLoc from '../../components/bang/ChipBoLoc'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import { useOTimTre } from '../../hooks/useOTimTre'
import { mocUtc } from '../../utils/format'
import ChonKy from '../../components/bang/ChonKy'
import { khoangHopLe, nhanKhoang, thamSoApi } from '../../utils/kyBaoCao'
import { anhChuCai } from '../../utils/anhChuCai'

// Đúng bốn giá trị enum UserRole của backend.
const VAI_TRO = { Audience: 'Khán giả', Owner: 'Chủ phòng trà', Staff: 'Nhân viên', Admin: 'Quản trị viên' }
const TRANG_THAI = { active: 'Đang hoạt động', banned: 'Đã bị khoá' }
const BO_LOC = {
  q: parseAsString.withDefault(''),
  vaiTro: parseAsStringLiteral(Object.keys(VAI_TRO)),
  trangThai: parseAsStringLiteral(Object.keys(TRANG_THAI)),
  // MLACP-599: lọc theo ngày đăng ký (YYYY-MM-DD giờ VN, cả hai đầu). Trống = mọi thời gian.
  tu: parseAsString,
  den: parseAsString,
}
// URL sai định dạng / khoảng ngược → coi như không lọc ngày (không gửi lên để khỏi nhận 422 vì một URL gõ tay).
const ngayGui = (tu, den) => {
  const k = khoangHopLe(tu, den)
  if (!k) return {}
  const { from, to } = thamSoApi(k.tu, k.den)
  return { createdFrom: from, createdTo: to }
}
const goiTaiKhoan = ({ q, vaiTro, trangThai, tu, den, ...trang }) => getAdminUsers({
  ...trang,
  ...ngayGui(tu, den),
  searchText: q.trim() || undefined,
  role: vaiTro ?? undefined,
  isActive: trangThai ? trangThai === 'active' : undefined,
})

const c = createColumnHelper()

const AdminAccountsPage = () => {
  const qc = useQueryClient()
  const ds = useDanhSachMayChu({ khoa: ['admin-tai-khoan'], goi: goiTaiKhoan, boLoc: BO_LOC })
  const [oTim, setOTim] = useOTimTre(ds, 'q')
  const { vaiTro, trangThai, q } = ds.boLoc
  const kyLoc = khoangHopLe(ds.boLoc.tu, ds.boLoc.den)

  // Số đếm trên thẻ: 5 lời gọi pageSize=1 (adminServices.getAdminStats). Trong cache Query để khoá/mở xong làm mới được.
  const thongKe = useQuery({ queryKey: ['admin-tai-khoan-dem'], queryFn: getAdminStats })
  const stats = thongKe.data ?? { total: 0, users: 0, owners: 0, staff: 0, banned: 0 }

  const [confirmTarget, setConfirmTarget] = useState(null)
  const [selectedAcc, setSelectedAcc] = useState(null)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleViewDetail = async (id) => {
    setSelectedAcc({})
    setIsModalLoading(true)
    try {
      const res = await getAdminUserDetail(id)
      if (res.success) setSelectedAcc(res.data)
    } catch {
      toast.error('Không tải được chi tiết tài khoản.')
      setSelectedAcc(null)
    } finally {
      setIsModalLoading(false)
    }
  }

  const handleToggleBan = (id, currentStatus) => {
    if (isUpdating) return
    const acc = ds.items.find((a) => a.id === id) ?? (selectedAcc?.id === id ? selectedAcc : null)
    if (acc?.role === 'Admin') {
      toast.error('Không thể khoá tài khoản Quản trị viên.')
      return
    }
    setConfirmTarget({ id, currentStatus, name: acc?.fullName })
  }

  const executeToggleBan = async () => {
    if (!confirmTarget) return
    const { id, currentStatus } = confirmTarget
    setIsUpdating(true)
    try {
      await toggleUserBan(id, currentStatus)
      toast.success(currentStatus ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.')
      if (selectedAcc?.id === id) setSelectedAcc((prev) => ({ ...prev, isActive: !currentStatus }))
      setConfirmTarget(null)
      // Tải lại từ máy chủ thay vì sửa tay trong bảng: đang lọc theo trạng thái thì dòng vừa đổi phải rời khỏi danh sách.
      await Promise.all([ds.taiLai(), qc.invalidateQueries({ queryKey: ['admin-tai-khoan-dem'] })])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác không thành công.')
    } finally {
      setIsUpdating(false)
    }
  }

  const cot = c.columns([
    c.accessor('fullName', {
      header: 'Tài khoản',
      meta: { khongNhanHep: true },
      cell: ({ row }) => {
        const a = row.original
        return (
          <div className="flex items-center gap-3 md:min-w-[240px]">
            <img src={a.avatarUrl || anhChuCai(a.fullName)} alt="" className="w-10 h-10 object-cover border border-line flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-ink">{a.fullName}</p>
              <p className="text-xs text-ink-soft mt-0.5">{[a.email, a.phone].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
        )
      },
    }),
    c.accessor('role', { header: 'Vai trò', cell: (o) => <RoleBadge role={o.getValue()} /> }),
    c.accessor('createdAt', { header: 'Ngày tạo', cell: (o) => <span className="font-mono text-ink-soft whitespace-nowrap">{dayjs(mocUtc(o.getValue())).format('DD/MM/YYYY')}</span> }),
    c.accessor('isActive', { header: 'Trạng thái', cell: (o) => <StatusBadge isActive={o.getValue()} /> }),
    c.display({
      id: 'thaoTac',
      header: 'Thao tác',
      meta: { canPhai: true },
      cell: ({ row }) => {
        const a = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => handleViewDetail(a.id)} aria-label={`Xem chi tiết ${a.fullName}`}
              className="inline-flex items-center justify-center w-11 h-11 border-2 border-ink hover:bg-ink hover:text-lamp">
              <Eye size={16} aria-hidden="true" />
            </button>
            {a.role !== 'Admin' && (
              <button type="button" onClick={() => handleToggleBan(a.id, a.isActive)} disabled={isUpdating}
                aria-label={a.isActive ? `Khoá tài khoản ${a.fullName}` : `Mở khoá tài khoản ${a.fullName}`}
                className={`inline-flex items-center justify-center w-11 h-11 border-2 disabled:opacity-50 ${a.isActive ? 'border-danger text-danger hover:bg-danger hover:text-lamp' : 'border-success text-success hover:bg-success hover:text-lamp'}`}>
                {a.isActive ? <Ban size={16} aria-hidden="true" /> : <Unlock size={16} aria-hidden="true" />}
              </button>
            )}
          </div>
        )
      },
    }),
  ])

  const cacChip = [
    q && { khoa: 'q', nhan: `Từ khoá: “${q}”`, xoa: () => { setOTim(''); ds.datBoLoc({ q: null }) } },
    vaiTro && { khoa: 'vaiTro', nhan: `Vai trò: ${VAI_TRO[vaiTro]}`, xoa: () => ds.datBoLoc({ vaiTro: null }) },
    trangThai && { khoa: 'trangThai', nhan: `Trạng thái: ${TRANG_THAI[trangThai]}`, xoa: () => ds.datBoLoc({ trangThai: null }) },
    kyLoc && { khoa: 'ngay', nhan: `Ngày đăng ký: ${nhanKhoang(kyLoc.tu, kyLoc.den)}`, xoa: () => ds.datBoLoc({ tu: null, den: null }) },
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-ink">Tài khoản người dùng</h1>
        <p className="text-ink-soft mt-1">Tra cứu, xem chi tiết, khoá và mở khoá tài khoản.</p>
      </div>

      <StatsCards stats={stats} roleFilter={vaiTro ?? 'all'} statusFilter={trangThai ?? 'all'}
        onSelectFilter={(role, status) => ds.datBoLoc({ vaiTro: role === 'all' ? null : role, trangThai: status === 'all' ? null : status })} />

      <AccountsFilterBar
        searchQuery={oTim} setSearchQuery={setOTim}
        roleFilter={vaiTro ?? 'all'} setRoleFilter={(v) => ds.datBoLoc({ vaiTro: v === 'all' ? null : v })}
        statusFilter={trangThai ?? 'all'} setStatusFilter={(v) => ds.datBoLoc({ trangThai: v === 'all' ? null : v })}
      />

      <ChonKy coTheBoTrong tenLoc="Ngày đăng ký" tu={kyLoc?.tu} den={kyLoc?.den}
        onChon={(k) => ds.datBoLoc({ tu: k?.tu ?? null, den: k?.den ?? null })} />

      <ChipBoLoc cacChip={cacChip} onXoaTatCa={() => { setOTim(''); ds.xoaBoLoc() }} />

      <BangDuLieu ds={ds} cot={cot} tenDonVi="tài khoản" idDanhSach="bang-tai-khoan" chuThich="Danh sách tài khoản người dùng"
        khiRong={cacChip.length ? 'Không có tài khoản nào khớp bộ lọc đang áp. Bỏ bớt bộ lọc để xem thêm.' : 'Chưa có tài khoản nào.'} />

      <AccountDetailModal
        selectedAcc={selectedAcc}
        isModalLoading={isModalLoading}
        isUpdating={isUpdating}
        onClose={() => setSelectedAcc(null)}
        onToggleBan={handleToggleBan}
      />

      <ConfirmModal
        isOpen={!!confirmTarget}
        title={confirmTarget?.currentStatus ? 'Khoá tài khoản?' : 'Mở khoá tài khoản?'}
        message={
          confirmTarget?.currentStatus
            ? <>Tài khoản “<span className="font-bold text-ink">{confirmTarget?.name}</span>” sẽ không đăng nhập được cho tới khi được mở khoá.</>
            : <>Tài khoản “<span className="font-bold text-ink">{confirmTarget?.name}</span>” sẽ đăng nhập lại bình thường.</>
        }
        confirmText={confirmTarget?.currentStatus ? 'Khoá ngay' : 'Mở khoá'}
        danger={confirmTarget?.currentStatus}
        isProcessing={isUpdating}
        onClose={() => setConfirmTarget(null)}
        onConfirm={executeToggleBan}
      />
    </div>
  )
}

export default AdminAccountsPage
