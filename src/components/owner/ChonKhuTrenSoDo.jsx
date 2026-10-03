// src/components/owner/ChonKhuTrenSoDo.jsx
//
// CHỌN KHU CHO HẠNG VÉ BẰNG CÁCH BẤM TRÊN SƠ ĐỒ (MLACP-589, 04/10/2026). Chủ dự án: "1 hạng vé trong buổi diễn sẽ được
// set với 1 khu vực trong sơ đồ" — mỗi hạng vé vào cửa gắn đúng MỘT khu, mỗi khu chỉ thuộc MỘT hạng vé của buổi (backend
// TierZoneRules). Thay ô xổ xuống cũ: chủ phòng trà nhìn đúng sơ đồ mình đã xếp ở màn Khu vực chỗ ngồi và bấm vào khu.
//
// - Khu đã thuộc hạng vé khác của buổi này: tô mờ, ghi tên hạng vé đang giữ, không bấm được (backend cũng từ chối).
// - Là một nhóm radio thật (role=radiogroup): Tab vào, mũi tên/bấm để chọn; khu chưa được xếp vị trí trên sơ đồ vẫn chọn
//   được ở hàng nút bên dưới — không khu nào bị giấu vì thiếu toạ độ.
// - Khung 16:9, toạ độ % — đúng hệ của OwnerZonesPage nên khu nằm đúng chỗ đã xếp.
const MAU = ['#C9A45C', '#8C7A6B', '#B3A899', '#6E5E50']

const ChonKhuTrenSoDo = ({ zones = [], daGan = {}, value, onChange, tenNhom = 'Khu ghế của hạng vé' }) => {
  const hoatDong = zones.filter((z) => z.isActive !== false)
  const coViTri = hoatDong.filter((z) => z.layout2DX != null && z.layout2DY != null)
  const chuaXep = hoatDong.filter((z) => z.layout2DX == null || z.layout2DY == null)
  const mau = (z) => z.layoutColor || MAU[hoatDong.indexOf(z) % MAU.length]
  const nhan = (z) => (daGan[z.id] ? `${z.name} — đã thuộc hạng vé ${daGan[z.id]}` : `${z.name}, ${z.capacity} chỗ`)

  if (hoatDong.length === 0) {
    return <p className="text-sm text-ink-soft">Phòng trà chưa có khu vực nào. Tạo ở mục <b>Khu vực chỗ ngồi</b> trước, rồi quay lại chọn khu cho hạng vé.</p>
  }

  return (
    <div role="radiogroup" aria-label={tenNhom}>
      {coViTri.length > 0 && (
        <div className="relative w-full aspect-video border-2 border-ink bg-board overflow-hidden">
          {coViTri.map((z) => {
            const ban = Boolean(daGan[z.id])
            const dang = value === z.id
            return (
              <button key={z.id} type="button" role="radio" aria-checked={dang} aria-label={nhan(z)} disabled={ban}
                onClick={() => onChange(dang ? '' : z.id)}
                className={`absolute flex flex-col items-center justify-center gap-0.5 px-1 border-2 overflow-hidden text-center transition-colors ${dang ? 'border-lamp z-10' : 'border-transparent hover:border-lamp/60'} ${ban ? 'opacity-45 cursor-not-allowed' : ''}`}
                style={{
                  left: `${z.layout2DX}%`, top: `${z.layout2DY}%`,
                  width: `${z.layout2DWidth ?? 12}%`, height: `${z.layout2DHeight ?? 12}%`,
                  transform: `rotate(${z.layout2DRotationDeg ?? 0}deg)`,
                  backgroundColor: `color-mix(in srgb, ${mau(z)} ${dang ? 75 : 40}%, #2A1F18)`,
                }}>
                <span className="text-xs font-semibold text-stock leading-tight line-clamp-2">{z.name}</span>
                <span className="font-mono text-[11px] text-stock/85 leading-tight line-clamp-1">{ban ? daGan[z.id] : dang ? 'Đang chọn' : `${z.capacity} chỗ`}</span>
              </button>
            )
          })}
        </div>
      )}
      {chuaXep.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-ink-mute mb-1">Khu chưa xếp vị trí trên sơ đồ:</p>
          <div className="flex flex-wrap gap-2">
            {chuaXep.map((z) => {
              const ban = Boolean(daGan[z.id]); const dang = value === z.id
              return (
                <button key={z.id} type="button" role="radio" aria-checked={dang} aria-label={nhan(z)} disabled={ban}
                  onClick={() => onChange(dang ? '' : z.id)}
                  className={`min-h-[44px] px-3 border-2 text-sm font-semibold ${dang ? 'border-ink bg-ink text-lamp' : 'border-ink/40 bg-card text-ink hover:border-ink'} ${ban ? 'opacity-45 cursor-not-allowed' : ''}`}>
                  {z.name}{ban ? ` · ${daGan[z.id]}` : ` · ${z.capacity} chỗ`}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <p className="text-xs text-ink-mute mt-2" aria-live="polite">
        {value ? `Đã chọn: ${hoatDong.find((z) => z.id === value)?.name ?? ''}.` : 'Bấm vào một khu để chọn.'} Mỗi khu chỉ gắn với một hạng vé của buổi diễn.
      </p>
    </div>
  )
}

export default ChonKhuTrenSoDo
