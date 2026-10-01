// src/components/admin/ledger/LedgerIntegrityCard.jsx
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

/**
 * Khối kiểm tra toàn vẹn bút toán
 * PHÂN BIỆT 3 TRẠNG THÁI — không bao giờ hiện "cân" khi không gọi được API:
 *   issues === null  → lỗi, chưa kiểm được (vàng)
 *   issues === []    → đã kiểm, sổ cân (xanh)
 *   issues.length > 0→ có bút toán lệch (đỏ) — chuyện của KẾ TOÁN, không phải lỗi giao diện;
 *                      tuyệt đối không "xử lý" bằng cách ẩn dòng hay làm tròn cho khớp.
 */
const LedgerIntegrityCard = ({ issues, isChecking, lastCheckedAt, onRefresh }) => (
  <div>
    <div className="flex items-start justify-between gap-3 mb-1">
      <h2 className="font-sans font-bold text-sm text-ink-soft">Toàn vẹn bút toán</h2>
      <button onClick={onRefresh} disabled={isChecking}
        className="flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
        {isChecking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        Kiểm tra lại
      </button>
    </div>
    <p className="text-xs text-ink-mute mt-0.5 mb-3 leading-relaxed">
      Mỗi bút toán phải có tổng Nợ bằng tổng Có. Dòng nào lệch sẽ hiện ở đây kèm số liệu thật.
    </p>

    {isChecking ? (
      <div className="bg-card border border-line py-16 flex justify-center">
        <Loader2 size={26} className="animate-spin text-ink" />
      </div>
    ) : issues === null ? (
      <div className="bg-card border border-warning/30 p-6 flex items-start gap-3">
        <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-ink font-medium">Chưa kiểm tra được</p>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            Không gọi được endpoint kiểm tra. Đây KHÔNG có nghĩa là sổ cái cân — hãy bấm &quot;Kiểm tra lại&quot;.
          </p>
        </div>
      </div>
    ) : issues.length === 0 ? (
      <div className="bg-card border border-success/25 p-6 flex items-start gap-3">
        <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-ink font-medium">Sổ cái cân</p>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            Không có bút toán nào lệch.
            {lastCheckedAt && ` Kiểm lúc ${lastCheckedAt.toLocaleTimeString('vi-VN')}.`}
          </p>
        </div>
      </div>
    ) : (
      <div className="bg-card border border-danger/30 overflow-hidden">
        <div className="p-4 border-b border-line flex items-center gap-2">
          <AlertTriangle size={18} className="text-danger flex-shrink-0" />
          <p className="text-sm text-ink font-medium">
            {issues.length} bút toán lệch — cần kế toán đối chiếu
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-sunken border-b-2 border-ink">
              <tr>
                <th scope="col" className="p-4 text-sm font-semibold text-ink">Loại lệch</th>
                <th scope="col" className="p-4 text-sm font-semibold text-ink">Mã bút toán</th>
                <th scope="col" className="p-4 text-sm font-semibold text-ink text-right">Tổng Nợ</th>
                <th scope="col" className="p-4 text-sm font-semibold text-ink text-right">Tổng Có</th>
                <th scope="col" className="p-4 text-sm font-semibold text-ink text-right">Chênh lệch</th>
                <th scope="col" className="p-4 text-sm font-semibold text-ink">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {issues.map((it, i) => (
                <tr key={`${it.journalId}-${i}`} className="hover:bg-sunken/30">
                  <td className="p-4 text-sm text-ink">{it.issueType}</td>
                  <td className="p-4 text-xs text-ink-soft font-mono">{it.journalId}</td>
                  <td className="p-4 text-sm text-ink-soft text-right tabular-nums">{fmtTien(it.debitTotal)}</td>
                  <td className="p-4 text-sm text-ink-soft text-right tabular-nums">{fmtTien(it.creditTotal)}</td>
                  <td className="p-4 text-sm text-danger text-right tabular-nums font-medium">
                    {fmtTien(Number(it.debitTotal || 0) - Number(it.creditTotal || 0))}
                  </td>
                  <td className="p-4 text-xs text-ink-mute max-w-xs whitespace-normal leading-relaxed">
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
)

export default LedgerIntegrityCard