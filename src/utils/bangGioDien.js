// src/utils/bangGioDien.js
//
// Tách khỏi components/program/BangGioDien.jsx để file component chỉ xuất component (fast refresh).
// Gom buổi diễn theo phòng trà, giữ thứ tự theo giờ của buổi sớm nhất.
export const gomTheoPhongTra = (buoiDien, anhPhongTra = {}) => {
  const nhom = new Map()
  for (const b of buoiDien) {
    const khoa = b.loungeName || `buoi-${b.id}`
    if (!nhom.has(khoa)) nhom.set(khoa, [])
    nhom.get(khoa).push(b)
  }
  return [...nhom.entries()]
    .map(([ten, ds]) => {
      const sx = [...ds].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      const dau = sx[0]
      return {
        khoa: ten,
        tenPhongTra: dau.loungeName || dau.title,
        anh: anhPhongTra[dau.loungeName] || dau.thumbnail || null,
        buoi: dau,
        // Mọi buổi đêm nay ở phòng trà này, theo giờ — hộp đèn liệt kê từng buổi để "+N buổi nữa" không thành ngõ cụt
        // (Sắp lên đèn bỏ qua đêm nay, nên ngoài hộp đèn không nơi nào khác trên trang chủ dẫn tới các buổi đó).
        tatCa: sx,
        soBuoiThem: sx.length - 1,
        dangDien: sx.some((x) => x.status === 'Ongoing'),
      }
    })
    .sort((a, b) => new Date(a.buoi.start_date) - new Date(b.buoi.start_date))
}
