// src/components/bang/lopBangHep.js
//
// LỚP XẾP KHỐI MÀN HẸP cho bảng (dưới md, 768px) — tách từ BangDuLieu (01/10/2026) để bảng KHÔNG phân trang máy chủ
// (danh sách đầy đủ như Danh mục phân loại, Cấu hình hệ thống) dùng cùng một cách hiển thị mà không phải bọc useDanhSachMayChu.
// Mỗi dòng thành một khối, mỗi ô có nhãn cột đứng trước (data-nhan + ::before). Đổi display làm VoiceOver/Safari bỏ ngữ
// nghĩa bảng nên phải gắn role tường minh: table / rowgroup / row / columnheader / cell.
//
// Cách dùng: <table role="table" className={HEP.bang}> <thead role="rowgroup" className={HEP.dau}> …
//   <tbody role="rowgroup" className={HEP.than}> <tr role="row" className={HEP.dong}>
//   <td role="cell" data-nhan="Tên cột" className={HEP.o}> — ô không cần nhãn (cột tên, cột thao tác) dùng HEP.oTron.
export const HEP = {
  bang: 'max-md:block',
  dau: 'max-md:sr-only',
  than: 'max-md:block',
  dong: 'max-md:block max-md:py-2',
  o: 'max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-4 max-md:py-1.5 max-md:before:content-[attr(data-nhan)] max-md:before:text-sm max-md:before:font-semibold max-md:before:text-ink-soft',
  oTron: 'max-md:block max-md:px-4 max-md:py-1.5',
}
