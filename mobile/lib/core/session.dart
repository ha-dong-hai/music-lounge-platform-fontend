import 'dart:async';
import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api_client.dart';
import 'google_auth.dart';

class StaffAccount {
  const StaffAccount({
    required this.token,
    required this.expiresAt,
    required this.refreshToken,
    required this.userId,
    required this.email,
    required this.fullName,
    required this.role,
    required this.loungeId,
  });

  final String token;
  final DateTime expiresAt;
  final String? refreshToken;
  final int userId;
  final String email;
  final String fullName;
  final String role;
  final int? loungeId;

  /// AuthResultDto của backend.
  factory StaffAccount.fromAuth(Map<String, dynamic> j) => StaffAccount(
    token: j['token'] as String,
    expiresAt: DateTime.parse(j['expiresAt'] as String),
    refreshToken: j['refreshToken'] as String?,
    userId: j['userId'] as int,
    email: j['email'] as String,
    fullName: j['fullName'] as String,
    role: j['role'] as String,
    loungeId: j['loungeId'] as int?,
  );

  Map<String, dynamic> toJson() => {
    'token': token,
    'expiresAt': expiresAt.toIso8601String(),
    'refreshToken': refreshToken,
    'userId': userId,
    'email': email,
    'fullName': fullName,
    'role': role,
    'loungeId': loungeId,
  };

  String get initials {
    final parts = fullName.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }
}

/// [active] = nhân viên đã được gán phòng trà (3 tab bán vé / soát vé / bảng đơn);
/// [noVenue] = nhân viên chưa được gán phòng trà; [audience] = khán giả (vé của tôi / đặt đồ ăn).
enum SessionPhase { restoring, signedOut, active, noVenue, audience }

/// Phiên làm việc của MỘT app phục vụ HAI vai: khán giả và nhân viên phòng trà (chủ dự án chốt 24/09:
/// "1 app dùng được cho 2 role và có màn hình chuyên biệt cho từng role").
///
/// Nhân viên gắn với đúng một phòng trà (claim lounge_id); không có bộ chọn phòng trà ở bất kỳ đâu trong app.
/// Chủ phòng trà và quản trị viên KHÔNG dùng app này — họ làm việc trên web.
class SessionController extends ChangeNotifier {
  SessionController(this._api, this.google, {FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage() {
    _api.readToken = () => _account?.token;
    _api.refreshToken = refresh;
    _api.onSessionExpired = () => signOut(notice: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', remote: false);
  }

  // Giữ tên khoá của app nhân viên cũ để máy đã đăng nhập không bị đá ra sau khi cập nhật.
  static const _key = 'ml_staff_account';
  static const _themeKey = 'ml_staff_theme';

  /// Hai vai app này phục vụ. Owner và Admin bị từ chối ngay ở bước đăng nhập, kèm chỉ đường về web.
  static const _servedRoles = {'Staff', 'Audience'};

  final ApiClient _api;
  final GoogleAuth google;
  final FlutterSecureStorage _storage;

  SessionPhase _phase = SessionPhase.restoring;
  StaffAccount? _account;
  String? _notice;
  String? _venueName;
  bool _nightTheme = true;
  Future<bool>? _refreshing;

  SessionPhase get phase => _phase;
  StaffAccount? get account => _account;
  String? get notice => _notice;
  String? get venueName => _venueName;
  bool get nightTheme => _nightTheme;
  int get loungeId => _account!.loungeId!;

  Future<void> restore() async {
    try {
      _nightTheme = (await _storage.read(key: _themeKey)) != 'day';
      final raw = await _storage.read(key: _key);
      if (raw != null) {
        _account = StaffAccount.fromAuth(jsonDecode(raw) as Map<String, dynamic>);
        if (!_servedRoles.contains(_account!.role)) {
          // Phiên lưu từ một bản app khác, hoặc vai đã bị đổi trên máy chủ: không tự vào tiếp.
          await _clear();
        } else if (_account!.expiresAt.isBefore(DateTime.now().add(const Duration(minutes: 1)))) {
          final ok = await refresh();
          if (!ok) {
            await _clear();
            _notice = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          }
        }
      }
    } catch (_) {
      await _clear();
    }
    _applyPhase();
  }

  Future<void> signIn(String email, String password) async {
    final data = await _api.post('/auth/login', {'email': email.trim(), 'password': password}, auth: false);
    await _begin(StaffAccount.fromAuth(data as Map<String, dynamic>));
  }

  /// [firebaseIdToken] lấy từ [GoogleAuth.firebaseIdToken].
  Future<void> signInWithGoogle(String firebaseIdToken, {required String googleEmail}) async {
    dynamic data;
    try {
      // acceptTerms luôn false: backend chỉ tạo tài khoản mới khi người dùng đồng ý điều khoản, mà app này không có
      // màn đồng ý điều khoản. Nên app không bao giờ tạo tài khoản: khán giả đăng ký trên web (nơi có điều khoản),
      // nhân viên do chủ phòng trà thêm. Một Gmail lạ bấm nhầm không vô tình thành tài khoản mới.
      data = await _api.post('/auth/google', {'idToken': firebaseIdToken, 'acceptTerms': false}, auth: false);
    } on ApiException catch (e) {
      await google.forget();
      // 422 ở /auth/google chỉ có một nghĩa: email này chưa có tài khoản nào (backend đòi đồng ý điều khoản để tạo mới).
      // Chưa biết người bấm là khán giả hay nhân viên, nên chỉ đường cho cả hai.
      if (e.status == 422) {
        throw ApiException(
          403,
          '$googleEmail chưa có tài khoản MusicLounge. Khán giả hãy đăng ký trên trang web MusicLounge; '
          'nhân viên nhờ chủ phòng trà thêm đúng email này, rồi đăng nhập lại.',
        );
      }
      rethrow;
    } catch (_) {
      await google.forget();
      rethrow;
    }
    try {
      await _begin(StaffAccount.fromAuth(data as Map<String, dynamic>));
    } catch (_) {
      await google.forget();
      rethrow;
    }
  }

  Future<void> _begin(StaffAccount account) async {
    if (!_servedRoles.contains(account.role)) {
      throw ApiException(403, _notServedMessage(account.role));
    }
    _notice = null;
    await _save(account);
    _applyPhase();
  }

  /// Gọi một lần cho mọi yêu cầu cùng gặp 401 (single-flight) — refresh token bị xoay vòng sau mỗi lần dùng.
  Future<bool> refresh() {
    return _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);
  }

  Future<bool> _doRefresh() async {
    final rt = _account?.refreshToken;
    if (rt == null) return false;
    try {
      final data = await _api.post('/auth/refresh', {'refreshToken': rt}, auth: false);
      final next = StaffAccount.fromAuth(data as Map<String, dynamic>);
      // Token mới có thể đổi màn hình: nhân viên bị gỡ khỏi phòng trà (lounge_id mất), chuyển phòng trà khác,
      // hoặc vai bị đổi trên máy chủ. Khán giả không có lounge_id, nên không so "lounge_id == null" một mình —
      // làm vậy sẽ dựng lại màn hình khán giả sau mỗi lần gia hạn token.
      final changed = next.role != _account?.role || next.loungeId != _account?.loungeId;
      await _save(next);
      if (changed) _applyPhase();
      return true;
    } on ApiException {
      return false;
    }
  }

  /// Chủ phòng trà đã gỡ nhân viên: lần gọi kế tiếp bị 403 dù đang thao tác đúng phòng trà của mình.
  Future<void> reportVenueAccessDenied() async {
    final ok = await refresh();
    if (!ok) {
      await signOut(notice: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', remote: false);
      return;
    }
    if (_account?.loungeId == null) _applyPhase();
  }

  void setVenueName(String name) {
    if (_venueName == name) return;
    _venueName = name;
    notifyListeners();
  }

  Future<void> setNightTheme(bool value) async {
    _nightTheme = value;
    notifyListeners();
    try {
      await _storage.write(key: _themeKey, value: value ? 'night' : 'day');
    } catch (_) {}
  }

  Future<void> signOut({String? notice, bool remote = true}) async {
    if (remote && _account != null) {
      try {
        await _api.post('/auth/logout', null);
      } catch (_) {
        // Đăng xuất trên máy vẫn phải xong kể cả khi mất mạng.
      }
    }
    await _clear();
    await google.forget();
    _notice = notice;
    _venueName = null;
    _phase = SessionPhase.signedOut;
    notifyListeners();
  }

  Future<void> _save(StaffAccount account) async {
    _account = account;
    try {
      await _storage.write(key: _key, value: jsonEncode(account.toJson()));
    } catch (_) {}
  }

  Future<void> _clear() async {
    _account = null;
    try {
      await _storage.delete(key: _key);
    } catch (_) {}
  }

  /// VAI quyết định màn hình, KHÔNG phải lounge_id.
  ///
  /// Claim lounge_id có cho CẢ nhân viên LẪN chủ phòng trà (TokenLounge.cs, MLACP-449 — chú thích ở đó ghi:
  /// "Claim chỉ nói 'phòng trà của người này là phòng trà nào', KHÔNG phải quyền vận hành"). Định tuyến kiểu
  /// "có lounge_id thì mở màn nhân viên" sẽ đưa nhầm chủ phòng trà vào bảng bán vé; còn "không có lounge_id thì
  /// báo chưa được gán phòng trà" sẽ đưa MỌI khán giả vào màn đó. Nên kiểm vai trước, lounge_id chỉ xét cho Staff.
  void _applyPhase() {
    _phase = switch (_account) {
      null => SessionPhase.signedOut,
      StaffAccount(role: 'Audience') => SessionPhase.audience,
      StaffAccount(role: 'Staff', loungeId: null) => SessionPhase.noVenue,
      StaffAccount(role: 'Staff') => SessionPhase.active,
      // Vai khác không qua được _begin; tới đây chỉ khi token gia hạn mang vai mới (bị đổi trên máy chủ).
      _ => SessionPhase.signedOut,
    };
    notifyListeners();
  }

  static String _notServedMessage(String role) => switch (role) {
    // Chủ phòng trà và quản trị viên làm việc trên web: chỉ đường về đúng nơi họ dùng.
    'Owner' =>
      'Ứng dụng này dành cho khán giả và nhân viên phòng trà. Tài khoản chủ phòng trà hãy dùng trang quản lý trên web.',
    'Admin' =>
      'Ứng dụng này dành cho khán giả và nhân viên phòng trà. Tài khoản quản trị hãy dùng trang quản trị trên web.',
    _ => 'Ứng dụng này chỉ dành cho tài khoản khán giả và nhân viên phòng trà.',
  };
}
