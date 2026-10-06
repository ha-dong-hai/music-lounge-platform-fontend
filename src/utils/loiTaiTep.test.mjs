// Chạy: node src/utils/loiTaiTep.test.mjs
import { laLoiTaiTep, lanThuKeTiep, CHO_THU_LAI_GIAY, QUEN_SAU } from './loiTaiTep.js'

let hong = 0
const kiem = (ten, duoc, muon) => {
  const dat = JSON.stringify(duoc) === JSON.stringify(muon)
  if (!dat) hong++
  console.log(`${dat ? 'ĐẠT ' : 'HỎNG'} ${ten}${dat ? '' : `\n     muốn: ${JSON.stringify(muon)}  được: ${JSON.stringify(duoc)}`}`)
}

// PHẢI nhận ra — câu lỗi thật của từng trình duyệt (câu Chrome chép từ web thật 06/10/2026).
kiem('Chrome', laLoiTaiTep(new TypeError('Failed to fetch dynamically imported module: https://kind-bay-015c18000.1.azurestaticapps.net/assets/ComplaintPage-CLlCGXcT.js')), true)
kiem('Firefox', laLoiTaiTep(new TypeError('error loading dynamically imported module: https://x/assets/A-1.js')), true)
kiem('Safari', laLoiTaiTep(new TypeError('Importing a module script failed.')), true)
kiem('Vite CSS', laLoiTaiTep(new Error('Unable to preload CSS for /assets/A-1.css')), true)
kiem('Máy chủ trả HTML', laLoiTaiTep(new TypeError('Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html".')), true)
kiem('chuỗi trần', laLoiTaiTep('Failed to fetch dynamically imported module: x'), true)

// KHÔNG được nhận nhầm — lỗi mã thật mà tự tải lại thì chỉ che lỗi đi.
kiem('lỗi mã: undefined', laLoiTaiTep(new TypeError("Cannot read properties of undefined (reading 'map')")), false)
kiem('lỗi mạng API', laLoiTaiTep(new Error('Network Error')), false)
kiem('Failed to fetch (API)', laLoiTaiTep(new TypeError('Failed to fetch')), false)
kiem('không có lỗi', laLoiTaiTep(undefined), false)

// Lịch thử lại
const T = 1_000_000
kiem('lần đầu', lanThuKeTiep(null, T), { lan: 1, choGiay: CHO_THU_LAI_GIAY[0] })
kiem('lần hai', lanThuKeTiep({ lan: 1, luc: T - 5000 }, T), { lan: 2, choGiay: CHO_THU_LAI_GIAY[1] })
kiem('lần ba', lanThuKeTiep({ lan: 2, luc: T - 5000 }, T), { lan: 3, choGiay: CHO_THU_LAI_GIAY[2] })
kiem('hết lượt → dừng, không tải lại vô hạn', lanThuKeTiep({ lan: 3, luc: T - 5000 }, T), null)
kiem('quá lâu thì đếm lại từ đầu', lanThuKeTiep({ lan: 3, luc: T - QUEN_SAU - 1 }, T), { lan: 1, choGiay: CHO_THU_LAI_GIAY[0] })
kiem('dữ liệu lưu hỏng', lanThuKeTiep({ lan: 'x', luc: 'y' }, T), { lan: 1, choGiay: CHO_THU_LAI_GIAY[0] })

console.log(hong ? `\n${hong} ca HỎNG.` : '\nTất cả đều qua.')
process.exit(hong ? 1 : 0)
