// src/utils/nhomGu.js
//
// Cắt một danh sách lựa chọn dài thành phần HIỆN SẴN và phần ẨN cho khối "Tìm theo gu".
// Tách khỏi component để các ngưỡng nằm ở một chỗ và hàm thuần dễ kiểm.
//
// NGƯỠNG VÀ NGUỒN (reports/Thu gọn danh sách lựa chọn dài.md ở repo backend, 30/09/2026):
//  - SO_HIEN = 6: Baymard (thử trên 19 trang, đối chuẩn 50 trang) khuyên hiện tối đa ~10 giá trị trước khi cắt; IBM
//    Carbon: "six tags or less" thì giữ một hàng. Ba nhóm đứng cạnh nhau trong ba cột hẹp nên lấy mức thấp: 6 nhãn là
//    khoảng hai hàng mỗi cột.
//  - NGUONG_KHONG_CAT = 8: danh sách từ 8 mục trở xuống thì in hết. Cắt để giấu 1–2 mục là bắt người dùng bấm thêm mà
//    không bớt được gì (Baymard: đừng cắt khi chỉ giấu một giá trị).
//  - NGUONG_TIM = 20: quá ~15–20 giá trị thì cần ô tìm trong danh sách (Baymard; ngưỡng gốc đo trên danh sách lớn).
// Ba con số này là suy từ nghiên cứu về bộ lọc thương mại điện tử — CHƯA có nghiên cứu nào đo riêng cho khối nhãn ở
// trang chủ. Đổi khi có số đo thật của chính trang này.
export const SO_HIEN = 6
export const NGUONG_KHONG_CAT = 8
export const NGUONG_TIM = 20

const soSanhTen = new Intl.Collator('vi', { sensitivity: 'base' }).compare

// Bỏ dấu và viết thường để tìm "tru tinh" ra "Trữ tình" — người gõ nhanh thường không gõ dấu.
export const boDau = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()

/**
 * @param ds danh sách ĐÃ xếp theo độ phổ biến (mục đáng thấy nhất đứng đầu)
 * @returns {{ hien: any[], an: any[] }}
 *   hien: giữ nguyên thứ tự phổ biến (Baymard: phần hiện sẵn xếp theo phổ biến, không theo bảng chữ cái).
 *   an:   xếp theo bảng chữ cái tiếng Việt — khi đã mở cả danh sách thì người dùng DÒ TÌM một cái tên, thứ tự chữ cái
 *         giúp việc đó; các mục hiện sẵn không đổi chỗ nên không có gì nhảy dưới con trỏ.
 */
export const chiaNhomGu = (ds = [], { soHien = SO_HIEN, nguongKhongCat = NGUONG_KHONG_CAT } = {}) => {
  if (ds.length <= nguongKhongCat) return { hien: ds, an: [] }
  return { hien: ds.slice(0, soHien), an: [...ds.slice(soHien)].sort((a, b) => soSanhTen(a.ten, b.ten)) }
}

export const locTheoTen = (ds, tuKhoa) => {
  const q = boDau(tuKhoa)
  return q ? ds.filter((x) => boDau(x.ten).includes(q)) : ds
}
