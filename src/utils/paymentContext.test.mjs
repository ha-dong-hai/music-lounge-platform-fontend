// Chạy: node src/utils/paymentContext.test.mjs
//
// Bộ kiểm cho lỗi: "gia hạn gói dịch vụ thành công nhưng trang kết quả lại nói về VÉ".
// Ca "Gói dịch vụ" và "Vé" dưới đây ĐỎ trên bản cũ (bản cũ không có khái niệm loại thanh toán).
//
// sessionStorage không có trong node nên dựng một bản giả tối thiểu TRƯỚC khi import module.
globalThis.sessionStorage = (() => {
  let kho = {}
  return {
    getItem: (k) => (k in kho ? kho[k] : null),
    setItem: (k, v) => { kho[k] = String(v) },
    removeItem: (k) => { delete kho[k] },
    _xoaHet: () => { kho = {} },
  }
})()

const { ghiNhoThanhToan, layThanhToan, xoaThanhToan, LOAI_THANH_TOAN } = await import('./paymentContext.js')

// Trang kết quả đọc rồi xoá — gộp lại cho gọn trong bộ kiểm.
const docRoiXoa = () => { const r = layThanhToan(); xoaThanhToan(); return r }

let fail = 0
const check = (ten, duoc, muon) => {
  const ok = JSON.stringify(duoc) === JSON.stringify(muon)
  if (!ok) fail++
  console.log(`${ok ? '  ok  ' : 'THẤT BẠI'} ${ten}`)
  if (!ok) console.log(`         muốn: ${JSON.stringify(muon)}\n         được: ${JSON.stringify(duoc)}`)
}

console.log('— Ghi rồi đọc lại đúng loại —')
ghiNhoThanhToan(LOAI_THANH_TOAN.GOI)
check('Gói dịch vụ', docRoiXoa(), { loai: 'subscription', quayVe: null })

ghiNhoThanhToan(LOAI_THANH_TOAN.VE)
check('Vé', docRoiXoa(), { loai: 'ticket', quayVe: null })

ghiNhoThanhToan(LOAI_THANH_TOAN.UNG_HO)
check('Ủng hộ', docRoiXoa(), { loai: 'donation', quayVe: null })

ghiNhoThanhToan(LOAI_THANH_TOAN.GOI_MON, '/lounge/2/order')
check('Gọi món, giữ đường quay về', docRoiXoa(), { loai: 'fnb', quayVe: '/lounge/2/order' })

console.log('\n— Đọc xong là xoá: lần sau không còn ngữ cảnh cũ —')
ghiNhoThanhToan(LOAI_THANH_TOAN.GOI)
docRoiXoa()
check('Đọc lần hai trả null', docRoiXoa(), null)

console.log('\n— Không có ngữ cảnh thì trả null để rơi về bản chữ chung —')
sessionStorage._xoaHet()
check('Kho rỗng', docRoiXoa(), null)

console.log('\n— Bỏ qua dữ liệu rác —')
ghiNhoThanhToan('khong-phai-loai-hop-le')
check('Loại lạ thì không ghi gì', docRoiXoa(), null)

sessionStorage.setItem('musiclounge-payment-context', 'khong-phai-json')
check('JSON hỏng thì trả null, không ném lỗi', docRoiXoa(), null)

sessionStorage.setItem('musiclounge-payment-context', JSON.stringify({ loai: 'fnb', quayVe: '//evil.com' }))
check('Chặn đường dẫn ra ngoài //evil.com', docRoiXoa(), { loai: 'fnb', quayVe: null })

sessionStorage.setItem('musiclounge-payment-context', JSON.stringify({ loai: 'fnb', quayVe: 'https://evil.com' }))
check('Chặn URL tuyệt đối', docRoiXoa(), { loai: 'fnb', quayVe: null })

console.log(fail === 0 ? '\nTất cả đều qua.' : `\n${fail} ca THẤT BẠI.`)
process.exit(fail === 0 ? 0 : 1)
