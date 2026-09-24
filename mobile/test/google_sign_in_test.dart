import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:musiclounge_staff/core/api_client.dart';
import 'package:musiclounge_staff/core/google_auth.dart';
import 'package:musiclounge_staff/core/session.dart';

http.Response _json(int status, Object body) =>
    http.Response.bytes(utf8.encode(jsonEncode(body)), status, headers: {'content-type': 'application/json'});

Map<String, dynamic> _auth(String role, {int? loungeId = 2}) => {
  'success': true,
  'data': {
    'token': 'jwt',
    'expiresAt': DateTime.now().add(const Duration(hours: 1)).toUtc().toIso8601String(),
    'refreshToken': 'rt',
    'userId': 7,
    'email': 'nhanvien@gmail.com',
    'fullName': 'Trần Thu Hà',
    'role': role,
    'loungeId': loungeId,
  },
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('đổi ID token Google lấy Firebase ID token', () {
    test('gửi đúng token Google tới Firebase và trả idToken', () async {
      late Map<String, dynamic> sent;
      final google = GoogleAuth(
        MockClient((req) async {
          expect(req.url.host, 'identitytoolkit.googleapis.com');
          expect(req.url.path, '/v1/accounts:signInWithIdp');
          sent = jsonDecode(req.body) as Map<String, dynamic>;
          return _json(200, {'idToken': 'firebase-token', 'email': 'nhanvien@gmail.com'});
        }),
      );

      expect(await google.exchange('google.id+token'), 'firebase-token');
      expect(sent['postBody'], 'id_token=google.id%2Btoken&providerId=google.com');
      expect(sent['returnSecureToken'], true);
    });

    test('dự án chưa bật Google thì báo rõ và gợi ý dùng email', () async {
      final google = GoogleAuth(
        MockClient(
          (_) async => _json(400, {
            'error': {'code': 400, 'message': 'OPERATION_NOT_ALLOWED'},
          }),
        ),
      );

      await expectLater(
        google.exchange('t'),
        throwsA(isA<ApiException>().having((e) => e.message, 'message', contains('chưa được bật'))),
      );
    });

    test('mất mạng trước khi gửi là notSent', () async {
      final google = GoogleAuth(MockClient((_) async => throw http.ClientException('Failed host lookup')));

      await expectLater(
        google.exchange('t'),
        throwsA(isA<NetworkException>().having((e) => e.state, 'state', SendState.notSent)),
      );
    });
  });

  group('POST /auth/google', () {
    SessionController session(MockClientHandler backend) {
      final client = MockClient(backend);
      final api = ApiClient(client: client, monitor: ConnectionMonitor(client));
      return SessionController(api, GoogleAuth(client));
    }

    test('không bao giờ gửi acceptTerms=true và vào ca khi là nhân viên', () async {
      late Map<String, dynamic> sent;
      final s = session((req) async {
        expect(req.url.path, '/api/v1/auth/google');
        sent = jsonDecode(req.body) as Map<String, dynamic>;
        return _json(200, _auth('Staff'));
      });

      await s.signInWithGoogle('firebase-token', googleEmail: 'nhanvien@gmail.com');

      expect(sent, {'idToken': 'firebase-token', 'acceptTerms': false});
      expect(s.phase, SessionPhase.active);
      expect(s.account!.loungeId, 2);
    });

    test('Gmail chưa có tài khoản (422 đòi đồng ý điều khoản) báo đúng email chưa được thêm', () async {
      final s = session(
        (_) async => _json(422, {
          'success': false,
          'message': 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để đăng ký.',
        }),
      );

      // Chưa biết người bấm là khán giả hay nhân viên (app phục vụ cả hai), nên câu báo chỉ đường cho cả hai.
      await expectLater(
        s.signInWithGoogle('t', googleEmail: 'la@gmail.com'),
        throwsA(
          isA<ApiException>().having(
            (e) => e.message,
            'message',
            allOf(
              startsWith('la@gmail.com chưa có tài khoản MusicLounge'),
              contains('Khán giả hãy đăng ký trên trang web'),
              contains('nhân viên nhờ chủ phòng trà thêm'),
            ),
          ),
        ),
      );
      expect(s.account, isNull);
    });

    test('tài khoản chủ phòng trà bị từ chối như đăng nhập email', () async {
      final s = session((_) async => _json(200, _auth('Owner', loungeId: null)));

      await expectLater(
        s.signInWithGoogle('t', googleEmail: 'chu@gmail.com'),
        throwsA(isA<ApiException>().having((e) => e.status, 'status', 403)),
      );
      expect(s.account, isNull);
    });

    // Bẫy của TokenLounge.cs (MLACP-449): lounge_id có cho CẢ chủ phòng trà, không chỉ nhân viên. Ca trên dùng
    // loungeId: null nên không chạm tới bẫy — ca này dùng đúng dạng token chủ phòng trà nhận ngoài đời.
    test('chủ phòng trà CÓ lounge_id vẫn bị từ chối, không lọt vào 3 tab nhân viên', () async {
      final s = session((_) async => _json(200, _auth('Owner', loungeId: 2)));

      await expectLater(
        s.signInWithGoogle('t', googleEmail: 'chu@gmail.com'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.status, 'status', 403)
              .having((e) => e.message, 'message', contains('trang quản lý trên web')),
        ),
      );
      expect(s.account, isNull);
      expect(s.phase, isNot(SessionPhase.active));
    });

    test('khán giả vào màn khán giả, KHÔNG vào màn "chưa được gán phòng trà"', () async {
      // Khán giả không có lounge_id. Định tuyến theo lounge_id sẽ đưa mọi khán giả vào màn của nhân viên chưa có phòng trà.
      final s = session((_) async => _json(200, _auth('Audience', loungeId: null)));

      await s.signInWithGoogle('t', googleEmail: 'khach@gmail.com');

      expect(s.phase, SessionPhase.audience);
      expect(s.account!.role, 'Audience');
    });

    test('vai quyết định màn hình, không phải lounge_id: khán giả có lounge_id vẫn vào màn khán giả', () async {
      // Định tuyến theo lounge_id sẽ đưa ca này vào 3 tab bán vé / soát vé / bảng đơn của nhân viên.
      final s = session((_) async => _json(200, _auth('Audience', loungeId: 2)));

      await s.signInWithGoogle('t', googleEmail: 'khach@gmail.com');

      expect(s.phase, SessionPhase.audience);
    });

    test('nhân viên đã bị gỡ khỏi phòng trà vào màn chưa có phòng trà', () async {
      final s = session((_) async => _json(200, _auth('Staff', loungeId: null)));

      await s.signInWithGoogle('t', googleEmail: 'nhanvien@gmail.com');

      expect(s.phase, SessionPhase.noVenue);
    });
  });
}
