// src/utils/demDaQua.js
//
// CHỌN LỜI cho khối "Đêm đã qua" ở trang chủ — hàm thuần, kiểm được (03/10/2026).
//
// VÌ SAO CẦN LUẬT: bản đầu lấy "3 lời mới nhất, bất kể gì". Đo với một đêm có 237 lời bình: cả 3 lời đều của MỘT đêm,
// có lời chê 1 sao nằm giữa khối giới thiệu, một lời 1.000 ký tự cao 557px, một đường dẫn dài làm trang cuộn ngang tới
// 1.814px (reports/Đêm đã qua - băng lướt review.md ở repo backend).
//
// LUẬT:
//  - Chỉ lời có CHỮ (lời đang bị ẩn tạm chờ kiểm duyệt thì backend trả comment null — tự rơi khỏi đây), từ SAO_TOI_THIEU
//    sao: trang chủ là nơi giới thiệu; lời chê vẫn hiện đủ ở trang buổi diễn, không giấu.
//  - Bỏ lời chỉ là một đường dẫn (không có câu nào để đọc).
//  - MỖI ĐÊM tối đa một lời — một đêm đông lời không chiếm hết băng. Trong một đêm: ưu tiên lời CÓ ẢNH, rồi lời mới hơn.
//  - Tối đa SO_LUOT lượt (NN/g: băng lướt quá 5 lượt thì gần như không ai xem tới).
//  - Thứ tự băng: mới nhất trước.
export const SAO_TOI_THIEU = 4
export const SO_LUOT = 5

const chiLaDuongDan = (chu) => /^\s*(https?:\/\/|www\.)\S+\s*$/i.test(chu)

// `dsTheoDem`: [{ buoi, danhGia: [...] }] — mỗi phần tử là một đêm đã diễn kèm các đánh giá tải được của đêm đó.
export const chonLoiDemDaQua = (dsTheoDem = [], { soLuot = SO_LUOT, saoToiThieu = SAO_TOI_THIEU } = {}) => {
  const moi = (x) => new Date(x.createdAt).getTime() || 0
  return dsTheoDem
    .map(({ buoi, danhGia = [] }) => {
      const hopLe = danhGia.filter((x) => x.comment?.trim() && x.score >= saoToiThieu && !chiLaDuongDan(x.comment))
      if (hopLe.length === 0) return null
      const tot = [...hopLe].sort((a, b) => (Boolean(b.imageUrl) - Boolean(a.imageUrl)) || (moi(b) - moi(a)))[0]
      return { ...tot, comment: tot.comment.trim(), buoi }
    })
    .filter(Boolean)
    .sort((a, b) => moi(b) - moi(a))
    .slice(0, soLuot)
}
