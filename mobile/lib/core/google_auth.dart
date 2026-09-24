import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;

import 'api_client.dart';
import 'config.dart';

/// Đăng nhập Google theo đúng loại token backend chấp nhận.
///
/// Backend chỉ xác minh **Firebase ID token** (issuer securetoken.google.com/sign-in-52d07), không nhận ID token
/// Google thô. Thay vì kéo thêm firebase_core + firebase_auth chỉ để đổi token một lần, app gọi thẳng API REST của
/// Firebase Auth (accounts:signInWithIdp) — cùng phép đổi mà SDK Firebase làm bên trong. App không cần giữ phiên
/// Firebase: token Firebase chỉ dùng một lần để lấy JWT của MusicLounge, sau đó làm mới bằng refresh token như
/// đăng nhập email.
class GoogleAuth {
  GoogleAuth(this._client);

  final http.Client _client;
  final GoogleSignIn _google = GoogleSignIn.instance;
  Future<void>? _ready;

  Future<void> ensureReady() => _ready ??= _google.initialize(
    clientId: kIsWeb ? AppConfig.googleWebClientId : null,
    serverClientId: kIsWeb ? null : AppConfig.googleWebClientId,
  );

  /// Mọi kết quả chọn tài khoản đi qua luồng này — kể cả trên Android, nơi [authenticate] cũng phát sự kiện vào
  /// đây. Nghe một chỗ để không xử lý một lần đăng nhập hai lần.
  Stream<GoogleSignInAuthenticationEvent> get events => _google.authenticationEvents;

  /// Web không mở được hộp chọn tài khoản bằng lệnh: Google bắt buộc người dùng bấm nút do chính Google vẽ.
  bool get usesGoogleRenderedButton => !_google.supportsAuthenticate();

  /// Android/iOS: mở hộp chọn tài khoản. Kết quả về qua [events].
  Future<void> pickAccount() async {
    await ensureReady();
    await _google.authenticate();
  }

  /// Quên tài khoản vừa chọn, để lần sau được chọn tài khoản khác (ví dụ vừa chọn nhầm Gmail cá nhân).
  Future<void> forget() async {
    try {
      await _google.signOut();
    } catch (_) {}
  }

  Future<String> firebaseIdToken(GoogleSignInAccount account) async {
    final googleIdToken = account.authentication.idToken;
    if (googleIdToken == null || googleIdToken.isEmpty) {
      throw ApiException(401, 'Google không trả về thông tin đăng nhập. Thử lại, hoặc đăng nhập bằng email.');
    }
    return exchange(googleIdToken);
  }

  /// Đổi ID token Google lấy Firebase ID token.
  @visibleForTesting
  Future<String> exchange(String googleIdToken) async {
    final uri = Uri.https('identitytoolkit.googleapis.com', '/v1/accounts:signInWithIdp', {
      'key': AppConfig.firebaseApiKey,
    });
    http.Response res;
    try {
      res = await _client
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'postBody': 'id_token=${Uri.encodeQueryComponent(googleIdToken)}&providerId=google.com',
              'requestUri': 'http://localhost',
              'returnSecureToken': true,
              'returnIdpCredential': false,
            }),
          )
          .timeout(const Duration(seconds: 20));
    } on TimeoutException {
      throw NetworkException(SendState.unknown, 'Hết thời gian chờ Google trả lời.');
    } on http.ClientException catch (e) {
      throw NetworkException(SendState.notSent, e.message);
    }

    Map<String, dynamic>? body;
    try {
      body = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    } catch (_) {}

    final idToken = body?['idToken'];
    if (res.statusCode == 200 && idToken is String && idToken.isNotEmpty) return idToken;

    final code = ((body?['error'] as Map?)?['message'] as String?) ?? 'HTTP ${res.statusCode}';
    throw ApiException(res.statusCode >= 500 ? 502 : 401, _describeFirebaseError(code));
  }

  static String _describeFirebaseError(String code) {
    if (code.startsWith('USER_DISABLED')) {
      return 'Tài khoản Google này đã bị khoá đăng nhập. Liên hệ chủ phòng trà.';
    }
    if (code.startsWith('OPERATION_NOT_ALLOWED')) {
      return 'Đăng nhập Google chưa được bật cho hệ thống. Tạm thời dùng email và mật khẩu.';
    }
    if (code.contains('API key not valid') || code.startsWith('API_KEY')) {
      return 'Cấu hình đăng nhập Google của ứng dụng không đúng. Tạm thời dùng email và mật khẩu.';
    }
    return 'Google không xác nhận được lần đăng nhập này. Thử lại, hoặc đăng nhập bằng email.';
  }
}
