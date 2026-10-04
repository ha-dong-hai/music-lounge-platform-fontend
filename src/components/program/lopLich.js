// src/components/program/lopLich.js
//
// Lớp hình thức cho DayPicker (react-day-picker) theo DESIGN.md: góc vuông, mực trên giấy; ngày chọn là khối mực, khoảng
// giữa là nền lõm. Dùng chung cho LichChonNgay (lọc buổi diễn) và ChonKy (kỳ báo cáo Admin, MLACP-595). Không nạp CSS
// mặc định của thư viện (bo tròn, xanh dương).
export const LOP = {
  root: 'text-ink',
  months: 'relative',
  month: 'w-full',
  month_caption: 'flex items-center justify-center h-11 px-12',
  caption_label: 'font-semibold',
  nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
  button_previous: 'inline-flex items-center justify-center w-11 h-11 hover:bg-sunken disabled:opacity-30 disabled:hover:bg-transparent',
  button_next: 'inline-flex items-center justify-center w-11 h-11 hover:bg-sunken disabled:opacity-30 disabled:hover:bg-transparent',
  chevron: 'w-4 h-4 fill-ink',
  month_grid: 'w-full border-collapse mt-1',
  weekday: 'h-9 w-10 font-mono text-xs font-normal text-ink-mute',
  day: 'p-0 text-center',
  day_button: 'relative inline-flex items-center justify-center w-10 h-10 font-mono text-sm hover:bg-sunken',
  today: 'font-bold underline underline-offset-4',
  selected: '[&>button]:bg-ink [&>button]:text-lamp [&>button]:hover:bg-board',
  // Khoảng giữa: nền lõm, chữ mực — để hai đầu khoảng (khối mực) đọc ra ngay là "từ … đến …".
  range_middle: '[&>button]:!bg-sunken [&>button]:!text-ink',
  disabled: '[&>button]:opacity-35 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
  outside: 'invisible',
}
