// src/components/program/ThanhLocNgang.jsx
//
// THANH LỌC NGANG của trang Buổi diễn (màn lớn) — 03/10/2026, chủ dự án chọn phương án A
// (reports/Bộ lọc trang Buổi diễn.md ở repo backend). Thay cột lọc trái: cột cao ~1.400px với 7 nhóm / 52 lựa chọn mở sẵn
// trong khi kết quả chỉ 2 buổi; chủ dự án: "quá bất tiện, quá khó sử dụng".
//
// - MỐC NGÀY bấm thẳng (thứ người ta hỏi nhiều nhất: "tối nay", "cuối tuần này") — không giấu trong nút thả.
// - Bốn NÚT THẢ: Dòng nhạc · Giá · Hình thức · Thêm bộ lọc (tâm trạng, không gian, thành phố). Baymard: thanh ngang hợp
//   khi ≤ 6–8 loại bộ lọc; điểm yếu là lựa chọn bị giấu → nhãn nút in luôn thứ đang chọn ("Dòng nhạc · 2").
// - SỐ BUỔI cạnh mỗi lựa chọn (demLuaChon — đếm đúng luật lọc backend); lựa chọn 0 buổi thì MỜ và không bấm được, trừ khi
//   đang được chọn (để còn bỏ được). Khi đang lọc theo thứ trình duyệt không tự tính được (từ khoá, giá, tâm trạng, không
//   gian) thì ẩn số thay vì in số sai — nhưng dòng nhạc không có buổi nào trên toàn sàn vẫn mờ (số 0 đó luôn đúng).
// - Áp NGAY khi chọn (giữ quyết định cũ — NN/g: hợp khi đang khám phá và kết quả về nhanh); giá tự nhập áp khi bấm "Áp dụng"
//   hoặc Enter.
// - Nút thả là disclosure (button aria-expanded + aria-controls), KHÔNG phải menu ARIA: bên trong là ô chọn thật trong
//   fieldset. Esc đóng và trả focus về nút; bấm ra ngoài đóng.
import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { HINH_THUC, MOC_NGAY, MUC_GIA, loiKhoangGia, loiKhoangNgay } from '../../utils/boLocBuoiDien'

const O_CHON = 'flex items-center gap-2.5 min-h-[40px] cursor-pointer'
const O_TICH = 'w-5 h-5 flex-shrink-0 accent-ink'
const O_NHAP = 'w-full min-h-[44px] px-3 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock'

const So = ({ n }) => (n == null ? null : <span className="ml-auto pl-3 font-mono text-sm text-ink-mute">{n}</span>)

const NutTha = ({ nhan, dang = false, children, rong = 'w-72' }) => {
  const id = useId()
  const [mo, setMo] = useState(false)
  const goc = useRef(null)
  const nut = useRef(null)
  useEffect(() => {
    if (!mo) return undefined
    const ngoai = (e) => { if (!goc.current?.contains(e.target)) setMo(false) }
    const esc = (e) => { if (e.key === 'Escape') { setMo(false); nut.current?.focus() } }
    document.addEventListener('pointerdown', ngoai)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', ngoai); document.removeEventListener('keydown', esc) }
  }, [mo])
  return (
    <div ref={goc} className="relative">
      <button ref={nut} type="button" aria-expanded={mo} aria-controls={`${id}-khung`} onClick={() => setMo((v) => !v)}
        className={`inline-flex items-center gap-2 min-h-[44px] px-4 border-2 border-ink text-sm font-semibold transition-colors ${dang || mo ? 'bg-ink text-lamp' : 'bg-card text-ink hover:bg-sunken'}`}>
        {nhan} <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${mo ? 'rotate-180' : ''}`} />
      </button>
      {mo && (
        <div id={`${id}-khung`} className={`absolute left-0 top-full mt-2 z-30 ${rong} max-h-[70vh] overflow-y-auto bg-card border-2 border-ink p-4 shadow-[0_10px_24px_rgb(35_26_21/0.18)]`}>
          {children}
        </div>
      )}
    </div>
  )
}

const ThanhLocNgang = ({ boLoc, danhMuc, dem, onDoi }) => {
  const id = useId()
  const coSo = dem?.chinhXac
  const so = (nhom, khoa) => (coSo ? dem?.[nhom]?.[khoa] ?? 0 : null)
  const tuChon = !boLoc.ngay && Boolean(boLoc.tu || boLoc.den)
  const [moTuChon, setMoTuChon] = useState(tuChon)
  const loiNgay = loiKhoangNgay(boLoc)

  // Giá tự nhập: giữ chữ đang gõ ở đây, chỉ áp khi bấm "Áp dụng"/Enter. Bộ lọc đổi từ ngoài (nút gỡ, chọn mức) → đồng bộ.
  const [giaTu, setGiaTu] = useState(boLoc.giaTu ?? '')
  const [giaDen, setGiaDen] = useState(boLoc.giaDen ?? '')
  const [gocGia, setGocGia] = useState([boLoc.giaTu, boLoc.giaDen])
  if (gocGia[0] !== boLoc.giaTu || gocGia[1] !== boLoc.giaDen) { setGocGia([boLoc.giaTu, boLoc.giaDen]); setGiaTu(boLoc.giaTu ?? ''); setGiaDen(boLoc.giaDen ?? '') }
  const soTien = (v) => (v === '' || v == null ? null : Math.max(0, Math.trunc(Number(v)) || 0))
  const loiGia = loiKhoangGia({ giaTu: soTien(giaTu), giaDen: soTien(giaDen) })
  const apGia = () => { if (!loiGia) onDoi({ ...boLoc, giaTu: soTien(giaTu), giaDen: soTien(giaDen) }) }
  const mucDang = MUC_GIA.find((m) => m.giaTu === boLoc.giaTu && m.giaDen === boLoc.giaDen)?.khoa ?? ''
  const coGia = boLoc.giaTu != null || boLoc.giaDen != null

  // Dòng nhạc còn buổi lên trước, 0 buổi xuống cuối (Shopify filtering UX: đẩy lựa chọn 0 kết quả xuống cuối) — đang chọn
  // thì giữ chỗ đầu. Không giấu hẳn: khách vẫn thấy sàn có dòng nhạc đó, chỉ là chưa có đêm nào.
  const genres = [...(danhMuc.genres ?? [])].sort((a, b) => {
    const co = (g) => { const i = String(g.id).toLowerCase(); return boLoc.the.includes(i) || dem?.coTrongSan?.has(i) ? 0 : 1 }
    return co(a) - co(b)
  })
  const theChon = boLoc.the
  const soThem = boLoc.tam.length + boLoc.kg.length + (boLoc.tp ? 1 : 0)
  const nhanGia = mucDang ? MUC_GIA.find((m) => m.khoa === mucDang).label : coGia ? 'Giá · tự chọn' : 'Giá'

  const nutMoc = (gt, nhan, dang, n, onBam) => (
    // Mốc 0 buổi thì mờ, không bấm được (trừ khi đang chọn): bấm vào chỉ ra danh sách rỗng — ngõ cụt.
    <button key={gt} type="button" aria-pressed={dang} onClick={onBam} disabled={!dang && n === 0}
      className={`inline-flex items-center gap-2 min-h-[44px] px-4 border-2 text-sm font-semibold whitespace-nowrap transition-colors ${dang ? 'bg-ink text-lamp border-ink' : 'bg-card text-ink border-ink/30 hover:border-ink'} disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-ink/30`}>
      {nhan}{n != null && <span className={`font-mono text-xs ${dang ? 'text-lamp-mute' : 'text-ink-mute'}`}>{n}</span>}
    </button>
  )

  return (
    <div className="space-y-3">
      {/* MỐC NGÀY — bấm thẳng */}
      <div role="group" aria-label="Ngày diễn" className="flex flex-wrap items-center gap-2">
        {nutMoc('', 'Mọi ngày', !boLoc.ngay && !tuChon && !moTuChon, so('ngay', ''), () => { setMoTuChon(false); onDoi({ ...boLoc, ngay: '', tu: '', den: '' }) })}
        {MOC_NGAY.map((m) => nutMoc(m.value, m.label, boLoc.ngay === m.value, so('ngay', m.value), () => { setMoTuChon(false); onDoi({ ...boLoc, ngay: m.value, tu: '', den: '' }) }))}
        {nutMoc('tu-chon', 'Chọn ngày…', tuChon || moTuChon, null, () => { setMoTuChon(true); if (boLoc.ngay) onDoi({ ...boLoc, ngay: '' }) })}
        {(tuChon || moTuChon) && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`${id}-tu`}>Từ ngày</label>
            <input id={`${id}-tu`} type="date" value={boLoc.tu} max={boLoc.den || undefined} onChange={(e) => onDoi({ ...boLoc, ngay: '', tu: e.target.value })}
              aria-invalid={loiNgay ? 'true' : undefined} className="min-h-[44px] px-3 bg-card border-2 border-ink text-sm" />
            <span aria-hidden="true">–</span>
            <label className="sr-only" htmlFor={`${id}-den`}>Đến ngày</label>
            <input id={`${id}-den`} type="date" value={boLoc.den} min={boLoc.tu || undefined} onChange={(e) => onDoi({ ...boLoc, ngay: '', den: e.target.value })}
              aria-invalid={loiNgay ? 'true' : undefined} className="min-h-[44px] px-3 bg-card border-2 border-ink text-sm" />
            {loiNgay && <span role="alert" className="text-sm font-semibold text-danger">{loiNgay}</span>}
          </span>
        )}
      </div>

      {/* BỐN NÚT THẢ */}
      <div className="flex flex-wrap items-center gap-2">
        {genres.length > 0 && (
          <NutTha nhan={theChon.length ? `Dòng nhạc · ${theChon.length}` : 'Dòng nhạc'} dang={theChon.length > 0}>
            <fieldset>
              <legend className="font-semibold mb-1">Dòng nhạc</legend>
              {genres.map((g) => {
                const gid = String(g.id).toLowerCase()
                const dangChon = theChon.includes(gid)
                const n = so('the', gid)
                const tat = !dangChon && (!dem?.coTrongSan?.has(gid) || n === 0)
                return (
                  <label key={g.id} className={`${O_CHON} ${tat ? 'opacity-45 cursor-not-allowed' : ''}`}>
                    <input type="checkbox" className={O_TICH} checked={dangChon} disabled={tat}
                      onChange={() => onDoi({ ...boLoc, the: dangChon ? theChon.filter((i) => i !== gid) : [...theChon, gid] })} />
                    <span>{g.name}</span>
                    <So n={tat ? 0 : n} />
                  </label>
                )
              })}
            </fieldset>
          </NutTha>
        )}

        <NutTha nhan={nhanGia} dang={coGia} rong="w-80">
          <fieldset>
            <legend className="font-semibold mb-1">Giá vé</legend>
            {[{ khoa: '', label: 'Giá nào cũng được', giaTu: null, giaDen: null }, ...MUC_GIA].map((m) => (
              <label key={m.khoa} className={O_CHON}>
                <input type="radio" name={`${id}-gia`} className={O_TICH} checked={coGia ? mucDang === m.khoa && m.khoa !== '' : m.khoa === ''}
                  onChange={() => onDoi({ ...boLoc, giaTu: m.giaTu, giaDen: m.giaDen })} />
                <span>{m.label}</span>
              </label>
            ))}
          </fieldset>
          <form className="mt-3 pt-3 border-t border-ink/20" onSubmit={(e) => { e.preventDefault(); apGia() }}>
            <p className="text-sm font-semibold mb-1.5">Hoặc tự nhập (đồng)</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">Từ<input type="number" inputMode="numeric" min="0" step="1000" value={giaTu} onChange={(e) => setGiaTu(e.target.value)} placeholder="0" aria-invalid={loiGia ? 'true' : undefined} className={`${O_NHAP} no-spin mt-1 font-mono`} /></label>
              <label className="text-sm">Đến<input type="number" inputMode="numeric" min="0" step="1000" value={giaDen} onChange={(e) => setGiaDen(e.target.value)} placeholder="không giới hạn" aria-invalid={loiGia ? 'true' : undefined} className={`${O_NHAP} no-spin mt-1 font-mono`} /></label>
            </div>
            {loiGia && <p role="alert" className="mt-1.5 text-sm font-semibold text-danger">{loiGia}</p>}
            <button type="submit" disabled={Boolean(loiGia)} className="mt-3 w-full min-h-[44px] bg-ink text-lamp font-semibold hover:bg-board disabled:opacity-40">Áp dụng</button>
          </form>
        </NutTha>

        <NutTha nhan={boLoc.ht ? HINH_THUC.find((h) => h.value === boLoc.ht).label : 'Hình thức'} dang={Boolean(boLoc.ht)}>
          <fieldset>
            <legend className="font-semibold mb-1">Hình thức</legend>
            {[{ value: '', label: 'Tất cả' }, ...HINH_THUC].map((h) => {
              const n = so('ht', h.value)
              const tat = h.value !== '' && boLoc.ht !== h.value && n === 0
              return (
                <label key={h.value} className={`${O_CHON} ${tat ? 'opacity-45 cursor-not-allowed' : ''}`}>
                  <input type="radio" name={`${id}-ht`} className={O_TICH} checked={boLoc.ht === h.value} disabled={tat} onChange={() => onDoi({ ...boLoc, ht: h.value })} />
                  <span>{h.label}</span>
                  <So n={n} />
                </label>
              )
            })}
          </fieldset>
        </NutTha>

        {((danhMuc.moods?.length ?? 0) + (danhMuc.atmospheres?.length ?? 0) > 0 || (danhMuc.cities?.length ?? 0) > 1) && (
          <NutTha nhan={soThem ? `Thêm bộ lọc · ${soThem}` : 'Thêm bộ lọc'} dang={soThem > 0} rong="w-[min(36rem,90vw)]">
            <div className="grid gap-6 sm:grid-cols-2">
              {[['Tâm trạng', 'tam', danhMuc.moods], ['Không gian', 'kg', danhMuc.atmospheres]].filter(([, , ds]) => ds?.length).map(([tieuDe, khoa, ds]) => (
                <fieldset key={khoa}>
                  <legend className="font-semibold mb-1">{tieuDe}</legend>
                  {ds.map((x) => {
                    const xid = String(x.id).toLowerCase()
                    const dangChon = boLoc[khoa].includes(xid)
                    return (
                      <label key={x.id} className={O_CHON}>
                        <input type="checkbox" className={O_TICH} checked={dangChon}
                          onChange={() => onDoi({ ...boLoc, [khoa]: dangChon ? boLoc[khoa].filter((i) => i !== xid) : [...boLoc[khoa], xid] })} />
                        <span>{x.name}</span>
                      </label>
                    )
                  })}
                </fieldset>
              ))}
              {(danhMuc.cities?.length ?? 0) > 1 && (
                <label className="block font-semibold sm:col-span-2">Thành phố
                  <select value={boLoc.tp} onChange={(e) => onDoi({ ...boLoc, tp: e.target.value })} className={`${O_NHAP} mt-1 font-normal`}>
                    <option value="">Mọi thành phố</option>
                    {danhMuc.cities.map((c) => <option key={c} value={c}>{c}{coSo && dem?.tp?.[c] != null ? ` (${dem.tp[c]})` : ''}</option>)}
                  </select>
                </label>
              )}
            </div>
            <p className="text-xs text-ink-mute mt-4">Tâm trạng và không gian không ghi số buổi: danh sách buổi diễn không kèm hai mục này.</p>
          </NutTha>
        )}
      </div>
    </div>
  )
}

export default ThanhLocNgang
