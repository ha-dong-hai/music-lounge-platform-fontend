import '../models/models.dart';
import 'api_client.dart';

/// Các API mà app nhân viên gọi. Đường dẫn và hình dạng dữ liệu đọc từ controller/DTO trên origin/master.
class StaffApi {
  StaffApi(this._api);

  final ApiClient _api;

  // ---- Phòng trà & buổi diễn ----

  Future<String> loungeName(int loungeId) async {
    final d = await _api.get('/lounges/$loungeId', auth: false) as Map<String, dynamic>;
    return d['name'] as String;
  }

  /// GET /lounge-shows/by-lounge/{id} — công khai; lấy tối đa 100 buổi (backend kẹp pageSize ≤ 100).
  Future<List<Show>> shows(int loungeId) async {
    final d =
        await _api.get('/lounge-shows/by-lounge/$loungeId', query: {'page': '1', 'pageSize': '100'})
            as Map<String, dynamic>;
    return (d['items'] as List).map((e) => Show.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<TicketTier>> tiers(int showId) async {
    final d = await _api.get('/ticket-tiers', query: {'showId': '$showId'}) as List;
    return d.map((e) => TicketTier.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ---- Bán vé tại quầy ----

  /// POST /tickets/walk-in → 201. [clientRequestId] (MLACP-410): gửi lại đúng mã của lượt bán chưa rõ kết quả thì máy
  /// chủ trả lại lượt bán cũ, không bán thêm. Máy chủ chưa có MLACP-410 bỏ qua trường này — khi đó gửi lại vẫn là bán
  /// thêm, nên app không bao giờ tự động gửi lại.
  Future<WalkInSale> sellWalkIn({required int priceId, required int quantity, required String clientRequestId}) async {
    final d = await _api.post('/tickets/walk-in', {
      'priceId': priceId,
      'quantity': quantity,
      'clientRequestId': clientRequestId,
    });
    return WalkInSale.fromJson(d as Map<String, dynamic>);
  }

  // ---- Soát vé ----

  Future<TicketDetail> ticketByQr(String qr) async {
    final d = await _api.get('/tickets/by-qr/${Uri.encodeComponent(qr)}');
    return TicketDetail.fromJson(d as Map<String, dynamic>);
  }

  Future<TicketDetail> checkIn(String qr) async {
    final d = await _api.post('/tickets/check-in', {'qrCode': qr});
    return TicketDetail.fromJson(d as Map<String, dynamic>);
  }

  // ---- F&B ----

  /// GET /fnb-orders?loungeId&status — backend trả Id giảm dần (Repository.GetPagedAsync: OrderByDescending);
  /// app sắp lại tăng dần để đơn gọi trước nằm trên cùng, đúng thứ tự quầy bar làm.
  Future<List<FnbOrder>> orders(int loungeId, String status) async {
    final all = <FnbOrder>[];
    for (var page = 1; page <= 5; page++) {
      final d =
          await _api.get(
                '/fnb-orders',
                query: {'loungeId': '$loungeId', 'status': status, 'page': '$page', 'pageSize': '100'},
              )
              as Map<String, dynamic>;
      all.addAll((d['items'] as List).map((e) => FnbOrder.fromJson(e as Map<String, dynamic>)));
      if (all.length >= (d['totalCount'] as int)) break;
    }
    return all..sort((a, b) => a.id.compareTo(b.id));
  }

  Future<void> setOrderStatus(int orderId, String status) =>
      _api.put('/fnb-orders/$orderId/status', {'status': status});

  Future<List<FnbMenu>> menus(int loungeId) async {
    final d = await _api.get('/fnb-menus', query: {'loungeId': '$loungeId', 'activeOnly': 'true'}) as List;
    return d.map((e) => FnbMenu.fromJson(e as Map<String, dynamic>)).toList()
      ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
  }

  Future<List<FnbMenuItem>> menuItems(int menuId) async {
    final d = await _api.get('/fnb-menu-items', query: {'menuId': '$menuId', 'availableOnly': 'true'}) as List;
    return d.map((e) => FnbMenuItem.fromJson(e as Map<String, dynamic>)).toList()
      ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
  }

  /// POST /fnb-orders — nhân viên tạo đơn chỉ được chọn tiền mặt (validator: PaymentMethod phải là 'Cash').
  Future<int> createOrder({
    required int loungeId,
    int? showId,
    required String tableNote,
    String? note,
    required List<({int menuItemId, int quantity, String? note})> items,
  }) async {
    final d = await _api.post('/fnb-orders', {
      'loungeId': loungeId,
      'showId': showId,
      'zoneId': null,
      'tableNote': tableNote,
      'paymentMethod': 'Cash',
      'note': (note == null || note.trim().isEmpty) ? null : note.trim(),
      'items': [
        for (final i in items) {'menuItemId': i.menuItemId, 'quantity': i.quantity, 'note': i.note},
      ],
    });
    return d as int;
  }
}
