// src/components/lounge/LoungeAbout.jsx
//
// GIỚI THIỆU + KHU VỰC CHỖ NGỒI của trang phòng trà.
//
// BẢN CŨ: khu vực nào chưa có mô tả thì in câu "Khu vực ngồi thoải mái với tầm nhìn tốt tới sân khấu." — một lời
// quảng cáo do giao diện TỰ VIẾT cho mọi khu vực của mọi phòng trà; sức chứa ghi "seats"; phòng trà chưa có giới
// thiệu thì in một câu giữ chỗ. Nay: không có dữ liệu thì không in gì thay cho nó.
//
// Khu vực dùng cùng luật "danh sách dài thì thu gọn" của DESIGN.md (tới 8 mục in hết, nhiều hơn hiện 6 + ghi số ẩn).
import { useId, useState } from 'react'
import DoanVanDai from '../shared/DoanVanDai'
import { SO_HIEN, NGUONG_KHONG_CAT } from '../../utils/nhomGu'
import IconMoRong from '../shared/IconMoRong'

const LoungeAbout = ({ lounge, zones = [] }) => {
  const id = useId()
  const [moHet, setMoHet] = useState(false)
  if (!lounge) return null

  const moTa = (lounge.description || '').trim()
  const catKhuVuc = zones.length > NGUONG_KHONG_CAT
  const khuVucIn = catKhuVuc && !moHet ? zones.slice(0, SO_HIEN) : zones
  const tongCho = zones.reduce((s, z) => s + (Number(z.capacity) || 0), 0)

  if (!moTa && zones.length === 0 && !lounge.areaLayoutImageUrl) return null

  return (
    <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      {moTa && (
        <section aria-labelledby={`${id}-gt`}>
          <h2 id={`${id}-gt`} className="text-4xl mb-5">Giới thiệu</h2>
          <DoanVanDai nhanMo="Đọc tiếp phần giới thiệu" nhanDong="Thu gọn phần giới thiệu" className="text-lg leading-relaxed text-ink-soft max-w-[65ch]">
            {moTa}
          </DoanVanDai>
        </section>
      )}

      {(zones.length > 0 || lounge.areaLayoutImageUrl) && (
        <section aria-labelledby={`${id}-kv`} className={moTa ? '' : 'lg:col-span-2'}>
          <h2 id={`${id}-kv`} className="text-4xl mb-5">Chỗ ngồi</h2>
          {zones.length > 0 && (
            <>
              <p className="font-mono text-sm text-ink-mute mb-2">{zones.length} khu vực · {tongCho} chỗ</p>
              <ul id={`${id}-ds`} className="border-y-2 border-ink">
                {khuVucIn.map((z) => (
                  <li key={z.id} className="py-3 border-t border-ink/20 first:border-t-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg">{z.name}</h3>
                      <span className="font-mono text-sm whitespace-nowrap">{z.capacity} chỗ</span>
                    </div>
                    {z.description && <p className="text-sm text-ink-soft mt-0.5">{z.description}</p>}
                  </li>
                ))}
              </ul>
              {catKhuVuc && (
                <button type="button" onClick={() => setMoHet((v) => !v)} aria-expanded={moHet} aria-controls={`${id}-ds`}
                  className="inline-flex items-center gap-1.5 min-h-[44px] mt-1 text-sm font-semibold text-ink hover:text-board">
                  {moHet ? <><IconMoRong mo /> Thu gọn</> : <><IconMoRong /> Xem thêm {zones.length - SO_HIEN} khu vực</>}
                </button>
              )}
            </>
          )}
          {lounge.areaLayoutImageUrl && (
            <figure className="mt-6">
              <img src={lounge.areaLayoutImageUrl} alt={`Sơ đồ mặt bằng ${lounge.name}`} loading="lazy" className="w-full h-auto border border-ink bg-card" />
              <figcaption className="text-sm text-ink-mute mt-2">Sơ đồ mặt bằng do phòng trà cung cấp.</figcaption>
            </figure>
          )}
        </section>
      )}
    </div>
  )
}

export default LoungeAbout
