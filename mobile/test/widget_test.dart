import 'package:flutter_test/flutter_test.dart';
import 'package:musiclounge_staff/core/format.dart';

void main() {
  test('tiền VND có dấu chấm ngăn nghìn và ký hiệu ₫', () {
    expect(vnd(350000), '350.000 ₫');
    expect(vnd(1250000.0), '1.250.000 ₫');
    expect(vnd(0), '0 ₫');
    expect(vnd(999), '999 ₫');
  });

  test('giờ hiển thị theo giờ Việt Nam (UTC+7) bất kể múi giờ máy', () {
    final t = DateTime.utc(2026, 10, 9, 13, 0);
    expect(vnTime(t), '20:00');
    expect(vnDate(t), 'T6, 09/10');
  });
}
