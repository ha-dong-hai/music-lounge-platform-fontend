import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:musiclounge_staff/core/api_client.dart';
import 'package:musiclounge_staff/core/staff_api.dart';
import 'package:musiclounge_staff/features/sell/sale_attempt.dart';

void main() {
  group('mã lượt bán tại quầy (MLACP-410)', () {
    final guid = RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

    test('mã là GUID hợp lệ để backend đọc được thành Guid', () {
      expect(SaleAttempt().idFor(priceId: 1, quantity: 1), matches(guid));
    });

    test('mất mạng rồi bấm bán lại cùng loại vé, cùng số lượng thì gửi đúng mã cũ', () {
      final a = SaleAttempt();
      final first = a.idFor(priceId: 7, quantity: 2);

      expect(a.awaitingRetry, isTrue);
      expect(a.idFor(priceId: 7, quantity: 2), first);
    });

    test('máy chủ đã trả lời thì lượt sau là lượt bán mới', () {
      final a = SaleAttempt();
      final first = a.idFor(priceId: 7, quantity: 2);

      a.settled();

      expect(a.awaitingRetry, isFalse);
      expect(a.idFor(priceId: 7, quantity: 2), isNot(first));
    });

    test('đổi loại vé hoặc số lượng là lượt bán khác, không dùng lại mã (backend sẽ trả 409)', () {
      final a = SaleAttempt();
      final first = a.idFor(priceId: 7, quantity: 2);

      expect(a.idFor(priceId: 7, quantity: 3), isNot(first));
      expect(a.idFor(priceId: 8, quantity: 3), isNot(first));
    });
  });

  test('POST /tickets/walk-in gửi kèm clientRequestId', () async {
    late Map<String, dynamic> sent;
    final client = MockClient((req) async {
      expect(req.url.path, '/api/v1/tickets/walk-in');
      sent = jsonDecode(req.body) as Map<String, dynamic>;
      return http.Response.bytes(
        utf8.encode(
          jsonEncode({
            'success': true,
            'data': {
              'paymentId': 40,
              'amount': 350000,
              'ticketIds': ['8f1d2c3b-0000-4000-8000-000000000001'],
              'tickets': [
                {'ticketId': '8f1d2c3b-0000-4000-8000-000000000001', 'qrCode': 'abc'},
              ],
            },
          }),
        ),
        201,
        headers: {'content-type': 'application/json'},
      );
    });
    final api = StaffApi(ApiClient(client: client, monitor: ConnectionMonitor(client)));

    await api.sellWalkIn(priceId: 5, quantity: 1, clientRequestId: '0b7c9a52-3f0e-4d7a-9c1e-2a4b6d8f0e13');

    expect(sent, {'priceId': 5, 'quantity': 1, 'clientRequestId': '0b7c9a52-3f0e-4d7a-9c1e-2a4b6d8f0e13'});
  });
}
