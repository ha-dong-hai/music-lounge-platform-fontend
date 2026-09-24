// Ánh xạ đúng các DTO của backend (JSON camelCase, enum dạng chuỗi — JsonStringEnumConverter).
// Chỉ đọc những trường app thật sự dùng.

DateTime _dt(Object? v) => DateTime.parse(v as String);
DateTime? _dtOrNull(Object? v) => v == null ? null : DateTime.parse(v as String);
double _num(Object? v) => (v as num).toDouble();

List<T> _list<T>(Object? v, T Function(Map<String, dynamic>) f) =>
    (v as List? ?? const []).map((e) => f(e as Map<String, dynamic>)).toList();

/// LoungeShowListItemDto
class Show {
  Show.fromJson(Map<String, dynamic> j)
    : id = j['id'] as int,
      name = j['name'] as String,
      scheduledStart = _dt(j['scheduledStart']),
      format = j['format'] as String,
      status = j['status'] as String,
      performerNames = (j['performerNames'] as List? ?? const []).cast<String>();

  final int id;
  final String name;
  final DateTime scheduledStart;
  final String format; // Offline | Online | Hybrid
  final String status; // Draft | Pending | Published | Ongoing | Ended | Cancelled
  final List<String> performerNames;

  bool get isOngoing => status == 'Ongoing';
  bool get hasFloor => format != 'Online';
}

/// TicketTierSummaryDto
class TicketTier {
  TicketTier.fromJson(Map<String, dynamic> j)
    : id = j['id'] as int,
      name = j['name'] as String,
      description = j['description'] as String?,
      accessType = j['accessType'] as String,
      prices = _list(j['prices'], TicketPrice.fromJson);

  final int id;
  final String name;
  final String? description;
  final String accessType; // Physical | Livestream
  final List<TicketPrice> prices;
}

/// TicketPriceSummaryDto
class TicketPrice {
  TicketPrice.fromJson(Map<String, dynamic> j)
    : id = j['id'] as int,
      name = j['name'] as String,
      price = _num(j['price']),
      saleStart = _dt(j['saleStart']),
      saleEnd = _dt(j['saleEnd']),
      purchaseChannel = j['purchaseChannel'] as String,
      availableSlots = j['availableSlots'] as int?;

  final int id;
  final String name;
  final double price;
  final DateTime saleStart;
  final DateTime saleEnd;
  final String purchaseChannel; // Online | Offline | Both
  final int? availableSlots;

  bool get sellableAtCounter => purchaseChannel != 'Online';
}

/// WalkInSaleResultDto (MLACP-402)
class WalkInSale {
  WalkInSale.fromJson(Map<String, dynamic> j)
    : paymentId = j['paymentId'] as int,
      amount = _num(j['amount']),
      tickets = _list(j['tickets'], (t) => SoldTicket(t['ticketId'] as String, t['qrCode'] as String));

  final int paymentId;
  final double amount;
  final List<SoldTicket> tickets;
}

class SoldTicket {
  const SoldTicket(this.ticketId, this.qrCode);
  final String ticketId;
  final String qrCode;
}

/// TicketDetailDto — lưu ý backend không trả tên người giữ vé, nên màn soát vé không hiện tên.
class TicketDetail {
  TicketDetail.fromJson(Map<String, dynamic> j)
    : id = j['id'] as String,
      showName = j['showName'] as String,
      loungeName = j['loungeName'] as String,
      showStart = _dt(j['showScheduledStart']),
      tierName = j['tierName'] as String,
      priceName = j['priceName'] as String,
      pricePaid = _num(j['pricePaid']),
      accessType = j['accessType'] as String,
      status = j['status'] as String,
      seatInfo = (j['physicalDetail'] as Map<String, dynamic>?)?['seatInfo'] as String?,
      checkedInAt = _dtOrNull((j['physicalDetail'] as Map<String, dynamic>?)?['checkedInAt']);

  final String id;
  final String showName;
  final String loungeName;
  final DateTime showStart;
  final String tierName;
  final String priceName;
  final double pricePaid;
  final String accessType;
  final String status; // Pending | Confirmed | Used | Cancelled | Refunded
  final String? seatInfo;
  final DateTime? checkedInAt;
}

/// FnbOrderDto
class FnbOrder {
  FnbOrder.fromJson(Map<String, dynamic> j)
    : id = j['id'] as int,
      showId = j['showId'] as int?,
      audienceUserId = j['audienceUserId'] as int?,
      tableNote = j['tableNote'] as String?,
      status = j['status'] as String,
      paymentMethod = j['paymentMethod'] as String,
      totalAmount = _num(j['totalAmount']),
      note = j['note'] as String?,
      createdAt = _dt(j['createdAt']),
      items = _list(j['items'], FnbOrderLine.fromJson),
      isPaid = j['isPaid'] as bool? ?? false,
      onlinePaymentLiveUntil = _dtOrNull(j['onlinePaymentLiveUntil']);

  final int id;
  final int? showId;
  final int? audienceUserId;
  final String? tableNote;
  final String status; // Pending | Preparing | Served | Paid | Cancelled
  final String paymentMethod; // Cash | Gateway
  final double totalAmount;
  final String? note;
  final DateTime createdAt;
  final List<FnbOrderLine> items;
  final bool isPaid;
  final DateTime? onlinePaymentLiveUntil;
}

class FnbOrderLine {
  FnbOrderLine.fromJson(Map<String, dynamic> j)
    : name = j['menuItemName'] as String,
      quantity = j['quantity'] as int,
      unitPrice = _num(j['unitPrice']),
      cancelled = j['cancelled'] as bool? ?? false,
      note = j['note'] as String?;

  final String name;
  final int quantity;
  final double unitPrice;
  final bool cancelled;
  final String? note;
}

/// FnbMenuDto
class FnbMenu {
  FnbMenu.fromJson(Map<String, dynamic> j)
    : id = j['id'] as int,
      name = j['name'] as String,
      displayOrder = j['displayOrder'] as int? ?? 0;

  final int id;
  final String name;
  final int displayOrder;
}

/// FnbMenuItemDto
class FnbMenuItem {
  FnbMenuItem.fromJson(Map<String, dynamic> j)
    : id = j['id'] as int,
      menuId = j['menuId'] as int,
      category = (j['category'] as String?)?.trim() ?? '',
      name = j['name'] as String,
      description = j['description'] as String?,
      price = _num(j['price']),
      isAvailable = j['isAvailable'] as bool? ?? true,
      displayOrder = j['displayOrder'] as int? ?? 0;

  final int id;
  final int menuId;
  final String category;
  final String name;
  final String? description;
  final double price;
  final bool isAvailable;
  final int displayOrder;
}
