// scripts/lib/docTep.mjs
//
// ĐỌC FILE CHO CÁC CỔNG KIỂM — một chỗ duy nhất, chuẩn hoá xuống dòng về LF ngay khi đọc.
//
// VÌ SAO PHẢI CÓ (lỗi đã xảy ra thật, 29/09/2026):
// Máy dự án bật `core.autocrlf`, nên file git checkout ra có xuống dòng CRLF. Các cổng bóc chú thích
// bằng regex kiểu /\/\/.*$/ — mà trong JavaScript dấu `.` KHÔNG khớp ký tự `\r`, và `$` không có cờ m
// thì chỉ khớp cuối chuỗi. Nên với dòng "// sắp hết là dark pattern\r", regex trượt, chú thích KHÔNG
// bị bóc, và cổng đọc chữ trong chú thích như thể là mã.
// Hậu quả đo được: cổng kiem-ap-luc báo 4 "vi phạm" — cả 4 đều nằm trong chú thích giải thích VÌ SAO
// cấm những câu đó. Ở cây mlacp-ui lỗi không lộ vì file ở đó tình cờ là LF (do công cụ ghi ra).
//
// Sửa ở GỐC thay vì vá từng cổng: mọi cổng đọc file qua hàm này. Cổng viết sau cũng tự đúng.
import { readFileSync } from 'node:fs'

export const docTep = (duongDan) => readFileSync(duongDan, 'utf8').replace(/\r\n?/g, '\n')
