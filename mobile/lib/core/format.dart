/// Định dạng theo thói quen ở phòng trà Việt Nam: tiền "350.000 ₫", giờ 24h theo giờ Việt Nam
/// (UTC+7, không đổi giờ theo mùa). Không dùng thư viện intl — ngoài bộ 4 thư viện đã duyệt.
String vnd(num amount) {
  final whole = amount.round();
  final digits = whole.abs().toString();
  final out = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) out.write('.');
    out.write(digits[i]);
  }
  return '${whole < 0 ? '−' : ''}$out ₫';
}

DateTime _vn(DateTime t) => t.toUtc().add(const Duration(hours: 7));

String two(int n) => n.toString().padLeft(2, '0');

String vnTime(DateTime t) {
  final v = _vn(t);
  return '${two(v.hour)}:${two(v.minute)}';
}

const _weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

String vnDate(DateTime t) {
  final v = _vn(t);
  return '${_weekdays[v.weekday - 1]}, ${two(v.day)}/${two(v.month)}';
}

String vnDateTime(DateTime t) => '${vnTime(t)} · ${vnDate(t)}';

bool isSameVnDay(DateTime a, DateTime b) {
  final x = _vn(a), y = _vn(b);
  return x.year == y.year && x.month == y.month && x.day == y.day;
}

String sinceShort(DateTime from, DateTime now) {
  final m = now.difference(from).inMinutes;
  if (m < 1) return 'vừa xong';
  if (m < 60) return '$m phút trước';
  final h = m ~/ 60;
  return '$h giờ ${m % 60} phút trước';
}
