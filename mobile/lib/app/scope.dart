import 'package:flutter/widgets.dart';

import '../core/api_client.dart';
import '../core/session.dart';
import '../core/staff_api.dart';
import '../features/audience/audience_api.dart';

/// Chia sẻ các dịch vụ dùng chung xuống cây widget, không cần thư viện quản lý trạng thái.
class AppScope extends InheritedWidget {
  const AppScope({
    super.key,
    required this.api,
    required this.audience,
    required this.session,
    required this.connection,
    required super.child,
  });

  /// API của vai nhân viên (bán vé tại quầy, soát vé, bảng đơn F&B).
  final StaffApi api;

  /// API của vai khán giả (vé của tôi, đặt đồ ăn). Dùng chung [ApiClient] với [api] nên chung phiên, chung token.
  final AudienceApi audience;
  final SessionController session;
  final ConnectionMonitor connection;

  static AppScope of(BuildContext context) {
    final scope = context.getInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope missing');
    return scope!;
  }

  @override
  bool updateShouldNotify(AppScope oldWidget) => false;
}
