import 'dart:math';

/// Mã của một lượt bán tại quầy (clientRequestId, MLACP-410).
///
/// Máy chủ nhận cùng một mã hai lần thì trả lại đúng lượt bán đầu thay vì thu tiền và tạo vé lần nữa. Vì vậy mã chỉ
/// được giữ lại khi chưa biết lần gửi trước ra sao (mất mạng); còn máy chủ đã trả lời — bán xong hay từ chối — thì lượt
/// kế tiếp là một lượt bán mới. Đổi loại vé hoặc số lượng cũng là lượt bán khác: dùng lại mã cũ sẽ bị trả 409.
class SaleAttempt {
  SaleAttempt({Random? random}) : _random = random ?? Random.secure();

  final Random _random;
  String? _id;
  int? _priceId;
  int? _quantity;

  /// Có một lượt bán chưa rõ kết quả đang chờ gửi lại.
  bool get awaitingRetry => _id != null;

  String idFor({required int priceId, required int quantity}) {
    if (_id == null || _priceId != priceId || _quantity != quantity) {
      _id = _newGuid();
      _priceId = priceId;
      _quantity = quantity;
    }
    return _id!;
  }

  /// Máy chủ đã trả lời (bán xong, hoặc từ chối nên chưa có gì được ghi): lượt sau dùng mã mới.
  void settled() {
    _id = null;
    _priceId = null;
    _quantity = null;
  }

  String _newGuid() {
    final b = List<int>.generate(16, (_) => _random.nextInt(256));
    b[6] = (b[6] & 0x0f) | 0x40; // phiên bản 4
    b[8] = (b[8] & 0x3f) | 0x80; // biến thể RFC 4122
    final h = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
    return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
  }
}
