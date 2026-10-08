import assert from 'node:assert/strict'
import { buocMoBan, daMoBanDuoc, buocKeTiep, demXong } from './viecMoBan.js'

let dat = 0
const ca = (fn) => { fn(); dat++ }
const tt = (ds) => ds.map((b) => b.trangThai).join(',')

// Chủ MỚI TINH: chưa có gì
const moi = buocMoBan({ lounge: null, cccd: { submittedAt: null, reviewStatus: null, canSell: false }, taiKhoan: [], soKhu: 0, buoi: { tong: 0, choDuyet: 0, daDang: 0 } })
ca(() => assert.equal(moi.length, 5))
ca(() => assert.equal(tt(moi), 'lam,lam,lam,lam,lam'))
ca(() => assert.equal(buocKeTiep(moi).khoa, 'phong-tra'))
ca(() => assert.equal(daMoBanDuoc(moi), false))
ca(() => assert.equal(demXong(moi), 0))

// Đã nộp, đang chờ duyệt cả hai hồ sơ → việc làm ngay là tài khoản nhận tiền (không bắt chủ ngồi chờ)
const cho = buocMoBan({ lounge: { status: 'Pending' }, cccd: { submittedAt: '2026-10-01', reviewStatus: 'Pending' }, taiKhoan: [], soKhu: 0, buoi: { tong: 0, choDuyet: 0, daDang: 0 } })
ca(() => assert.equal(tt(cho), 'cho,cho,lam,lam,lam'))
ca(() => assert.equal(buocKeTiep(cho).khoa, 'nhan-tien'))

// Bị từ chối luôn được đưa lên trước việc chưa làm
const tuChoi = buocMoBan({ lounge: { status: 'Approved' }, cccd: { submittedAt: '2026-10-01', reviewStatus: 'Rejected' }, taiKhoan: [], soKhu: 0, buoi: { tong: 0, choDuyet: 0, daDang: 0 } })
ca(() => assert.equal(tt(tuChoi), 'xong,tu-choi,lam,lam,lam'))
ca(() => assert.equal(buocKeTiep(tuChoi).khoa, 'dinh-danh'))

// Phòng trà bị trả về
ca(() => assert.equal(buocMoBan({ lounge: { status: 'Rejected' } })[0].trangThai, 'tu-choi'))
// Phòng trà đang bị cảnh cáo vẫn là phòng trà đã duyệt (không quay lại bước 1)
ca(() => assert.equal(buocMoBan({ lounge: { status: 'Warned' } })[0].trangThai, 'xong'))

// Tài khoản đã khai nhưng chưa xác minh → chờ; có một cái đã xác minh → xong
ca(() => assert.equal(buocMoBan({ taiKhoan: [{ isVerified: false }] })[2].trangThai, 'cho'))
ca(() => assert.equal(buocMoBan({ taiKhoan: [{ isVerified: false }, { isVerified: true }] })[2].trangThai, 'xong'))

// Buổi diễn: nháp → làm; chờ duyệt → chờ; đã đăng → xong
ca(() => assert.equal(buocMoBan({ buoi: { tong: 2, choDuyet: 0, daDang: 0 } })[4].trangThai, 'lam'))
ca(() => assert.equal(buocMoBan({ buoi: { tong: 2, choDuyet: 1, daDang: 0 } })[4].trangThai, 'cho'))
ca(() => assert.equal(buocMoBan({ buoi: { tong: 9, choDuyet: 0, daDang: 3 } })[4].trangThai, 'xong'))

// Dữ liệu chưa tải được → 'chua-ro', KHÔNG đoán là xong; và không tính là đã mở bán được
const thieu = buocMoBan({ lounge: { status: 'Approved' }, cccd: undefined, taiKhoan: [{ isVerified: true }], soKhu: 3, buoi: { tong: 1, choDuyet: 0, daDang: 1 } })
ca(() => assert.equal(tt(thieu), 'xong,chua-ro,xong,xong,xong'))
ca(() => assert.equal(daMoBanDuoc(thieu), false))

// MLACP-701: phòng trà KHÔNG có trường status (dạng item của GET /lounges?mine=true — danh sách không trả status) → 'chua-ro'.
// Trước đây rơi vào nhánh cuối 'xong · Đã được duyệt': chủ vừa nộp hồ sơ (đang Pending) được báo là đã duyệt.
const itemDanhSach = { id: '01a11dd6', name: 'Phòng trà Đồng Dao', street: '164 Pasteur' }
ca(() => assert.equal(buocMoBan({ lounge: itemDanhSach })[0].trangThai, 'chua-ro'))
ca(() => assert.equal(daMoBanDuoc(buocMoBan({ lounge: itemDanhSach, cccd: { canSell: true }, taiKhoan: [{ isVerified: true }], soKhu: 3, buoi: { tong: 1, choDuyet: 0, daDang: 1 } })), false))

// Đủ cả → ẩn danh sách
const du = buocMoBan({ lounge: { status: 'Approved' }, cccd: { canSell: true, reviewStatus: 'Approved' }, taiKhoan: [{ isVerified: true }], soKhu: 3, buoi: { tong: 1, choDuyet: 0, daDang: 1 } })
ca(() => assert.equal(daMoBanDuoc(du), true))
ca(() => assert.equal(buocKeTiep(du), null))
ca(() => assert.equal(demXong(du), 5))
// Mỗi bước có trang để làm
ca(() => assert.ok(moi.every((b) => b.to.startsWith('/') && b.moTa.length > 10)))
console.log(`viecMoBan: ${dat}/24 đạt`)
