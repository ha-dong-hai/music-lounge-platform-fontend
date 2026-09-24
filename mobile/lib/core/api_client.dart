import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'config.dart';

/// Máy chủ đã trả lời nhưng từ chối. [message] là câu tiếng Việt của backend
/// (phong bì {success, message, errors}).
class ApiException implements Exception {
  ApiException(this.status, this.message, {this.errors = const {}});

  final int status;
  final String message;
  final Map<String, List<String>> errors;

  @override
  String toString() => 'ApiException($status): $message';
}

enum SendState {
  /// Chắc chắn yêu cầu chưa tới máy chủ (không phân giải được tên miền, bị từ chối kết nối).
  notSent,

  /// Mạng đứt khi đang chờ trả lời — máy chủ có thể đã ghi nhận.
  /// Với bán vé tiền mặt đây là trạng thái nguy hiểm nhất: không được coi là "chưa bán".
  unknown,
}

class NetworkException implements Exception {
  NetworkException(this.state, this.detail);

  final SendState state;
  final String detail;

  @override
  String toString() => 'NetworkException(${state.name}): $detail';
}

/// Trạng thái kết nối trung thực: chỉ báo "trực tuyến" khi máy chủ thật sự vừa trả lời.
class ConnectionMonitor extends ChangeNotifier {
  ConnectionMonitor(this._client);

  final http.Client _client;
  bool? _online;
  DateTime? _lastContact;
  Timer? _timer;

  bool? get online => _online;
  DateTime? get lastContact => _lastContact;

  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => ping());
    ping();
  }

  Future<void> ping() async {
    try {
      final r = await _client.get(AppConfig.health()).timeout(const Duration(seconds: 8));
      r.statusCode < 500 ? reportContact() : reportFailure();
    } catch (_) {
      reportFailure();
    }
  }

  void reportContact() {
    _lastContact = DateTime.now();
    if (_online != true) {
      _online = true;
      notifyListeners();
    }
  }

  void reportFailure() {
    if (_online != false) {
      _online = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

class ApiClient {
  ApiClient({required this.client, required this.monitor});

  final http.Client client;
  final ConnectionMonitor monitor;

  String? Function()? readToken;
  Future<bool> Function()? refreshToken;
  VoidCallback? onSessionExpired;

  static const _timeout = Duration(seconds: 20);

  Future<dynamic> get(String path, {Map<String, String>? query, bool auth = true}) =>
      _send('GET', path, query: query, auth: auth);

  Future<dynamic> post(String path, Object? body, {bool auth = true}) => _send('POST', path, body: body, auth: auth);

  Future<dynamic> put(String path, Object? body) => _send('PUT', path, body: body);

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
    bool auth = true,
    bool retried = false,
  }) async {
    final uri = AppConfig.api(path, query);
    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) headers['Content-Type'] = 'application/json; charset=utf-8';
    final token = auth ? readToken?.call() : null;
    if (token != null) headers['Authorization'] = 'Bearer $token';

    http.Response res;
    try {
      final req = http.Request(method, uri)..headers.addAll(headers);
      if (body != null) req.body = jsonEncode(body);
      final streamed = await client.send(req).timeout(_timeout);
      res = await http.Response.fromStream(streamed).timeout(_timeout);
    } on TimeoutException {
      monitor.reportFailure();
      throw NetworkException(SendState.unknown, 'Hết thời gian chờ máy chủ trả lời.');
    } on http.ClientException catch (e) {
      monitor.reportFailure();
      throw NetworkException(_classify(e.message), e.message);
    }

    monitor.reportContact();

    if (res.statusCode == 401 && auth && token != null && !retried && refreshToken != null) {
      if (await refreshToken!()) {
        return _send(method, path, query: query, body: body, auth: auth, retried: true);
      }
      onSessionExpired?.call();
    }

    final text = utf8.decode(res.bodyBytes, allowMalformed: true);
    Map<String, dynamic>? envelope;
    if (text.isNotEmpty) {
      try {
        final decoded = jsonDecode(text);
        if (decoded is Map<String, dynamic>) envelope = decoded;
      } catch (_) {}
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return envelope == null ? null : envelope['data'];
    }

    final errors = <String, List<String>>{};
    final rawErrors = envelope?['errors'];
    if (rawErrors is Map) {
      rawErrors.forEach((k, v) {
        if (v is List && v.isNotEmpty) errors['$k'] = v.map((e) => '$e').toList();
      });
    }
    var message = (envelope?['message'] as String?)?.trim();
    if (errors.isNotEmpty && (message == null || message.isEmpty || res.statusCode == 400)) {
      message = errors.values.first.first;
    }
    throw ApiException(
      res.statusCode,
      (message == null || message.isEmpty) ? _fallback(res.statusCode) : message,
      errors: errors,
    );
  }

  static SendState _classify(String message) {
    final m = message.toLowerCase();
    const beforeSend = ['failed host lookup', 'connection refused', 'network is unreachable', 'no route to host'];
    return beforeSend.any(m.contains) ? SendState.notSent : SendState.unknown;
  }

  static String _fallback(int status) => switch (status) {
    400 => 'Dữ liệu gửi lên chưa hợp lệ.',
    401 => 'Phiên đăng nhập đã hết hạn.',
    403 => 'Tài khoản không có quyền làm việc này.',
    404 => 'Không tìm thấy dữ liệu.',
    409 => 'Dữ liệu vừa bị thay đổi ở nơi khác.',
    429 => 'Thao tác quá nhanh, thử lại sau ít giây.',
    _ => 'Máy chủ gặp lỗi ($status).',
  };
}
