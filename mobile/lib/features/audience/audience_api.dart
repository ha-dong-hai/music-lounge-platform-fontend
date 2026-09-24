import '../../core/api_client.dart';
import '../../core/config.dart';

/// Các API mà phần khán giả gọi — cùng khuôn với [StaffApi].
///
/// Đi qua đúng [ApiClient] dùng chung với phần nhân viên, nên khán giả cũng được lưu token mã hoá,
/// tự gia hạn token khi gặp 401 và theo dõi mất mạng. App khán giả cũ (MLACP-20) có client riêng
/// lưu token trong shared_preferences không mã hoá và không tự gia hạn — đó là lý do gộp lấy app
/// nhân viên làm nền.
///
/// Trả về dữ liệu thô (đã bóc vỏ `{success, data}`) chứ không trả model: các màn khán giả chuyển
/// sang nguyên vẹn và tự phân tích bằng model trong `models/`. Trần giới hạn: có hai bộ model cho
/// cùng một DTO (`FnbOrder`, `FnbMenu`, `FnbMenuItem`, `TicketDetail` ở đây và ở `lib/models/models.dart`).
/// Không xung đột vì không file nào import cả hai. Đường nâng cấp: backend trả một DTO cố định cho
/// mọi vai (be đã quét 104 QueryHandler, 0 cái trả kiểu động), nên có thể gộp về một bộ model khi
/// cần sửa một trong hai.
class AudienceApi {
  AudienceApi(this._api);

  final ApiClient _api;

  // ---- Vé của tôi ----

  Future<dynamic> myTickets() => _api.get('/tickets/my', query: {'page': '1', 'pageSize': '50'});

  Future<dynamic> ticket(String ticketId) => _api.get('/tickets/$ticketId');

  // ---- Đặt đồ ăn ----

  Future<dynamic> lounges() => _api.get('/lounges', query: {'page': '1', 'pageSize': '50'});

  Future<dynamic> lounge(int loungeId) => _api.get('/lounges/$loungeId');

  Future<dynamic> menus(int loungeId) =>
      _api.get('/fnb-menus', query: {'loungeId': '$loungeId', 'activeOnly': 'true'});

  Future<dynamic> menuItems(int menuId) =>
      _api.get('/fnb-menu-items', query: {'menuId': '$menuId', 'availableOnly': 'true'});

  /// POST /fnb-orders → id đơn mới.
  Future<dynamic> placeOrder(Map<String, dynamic> body) => _api.post('/fnb-orders', body);

  Future<dynamic> myOrders() => _api.get('/fnb-orders/my', query: {'page': '1', 'pageSize': '50'});

  Future<dynamic> order(int orderId) => _api.get('/fnb-orders/$orderId');

  /// Ảnh từ API: từ 23/09 backend trả URL tuyệt đối của Firebase Storage; dữ liệu cũ vẫn có thể là
  /// đường dẫn tương đối `/uploads/...`, khi đó ghép với gốc máy chủ.
  static String? imageUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '${AppConfig.apiBaseUrl}$path';
  }
}
