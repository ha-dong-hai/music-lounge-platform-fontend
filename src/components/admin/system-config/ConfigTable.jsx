// src/components/admin/system-config/ConfigTable.jsx
import { History } from 'lucide-react'
import dayjs from 'dayjs'

/**
 * Bảng tham số — thuần UI, dùng chung cho nhóm "Tỉ lệ tiền" và "Tham số khác"
 * @param {Array} configs
 * @param {function} onEdit - (config) → page mở EditModal
 * @param {function} onHistory - (configKey) → page mở HistoryModal
 */
const ConfigTable = ({ configs, onEdit, onHistory }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-ink-mute border-b border-line">
          <th className="text-left py-2 pr-3 font-medium">Tham số</th>
          <th className="text-left py-2 pr-3 font-medium">Giá trị</th>
          <th className="text-left py-2 pr-3 font-medium">Đổi lần cuối</th>
          <th className="py-2 font-medium" />
        </tr>
      </thead>
      <tbody>
        {configs.map((c) => (
          <tr key={c.configKey} className="border-b border-line/60">
            <td className="py-3 pr-3 align-top">
              <p className="text-ink font-medium break-all">{c.configKey}</p>
              {c.description && <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">{c.description}</p>}
            </td>
            <td className="py-3 pr-3 align-top text-ink-soft tabular-nums whitespace-nowrap">{c.configValue}</td>
            <td className="py-3 pr-3 align-top text-xs text-ink-mute whitespace-nowrap">
              {dayjs(c.updatedAt).format('DD/MM/YYYY')}
              {c.updatedByName && <span className="block text-ink-mute">{c.updatedByName}</span>}
            </td>
            <td className="py-3 align-top">
              <div className="flex gap-1 justify-end">
                <button onClick={() => onHistory(c.configKey)} title="Lịch sử thay đổi"
                  className="p-2 rounded-lg text-ink-soft hover:bg-sunken">
                  <History size={14} />
                </button>
                <button onClick={() => onEdit(c)} title="Sửa"
                  className="px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                  Sửa
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default ConfigTable