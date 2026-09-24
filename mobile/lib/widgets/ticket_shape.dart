import 'package:flutter/material.dart';

/// Viền thẻ hình cuống vé: hai lỗ bấm bán nguyệt ở hai mép, cách đỉnh [notchFromTop].
/// Dùng cho vé vừa bán (mã QR) và kết quả soát vé — cùng một hình với tấm vé giấy ở phòng trà.
class TicketBorder extends ShapeBorder {
  const TicketBorder({this.notchFromTop, this.notchRadius = 11, this.radius = 10, this.side = BorderSide.none});

  /// null = không khoét lỗ (thẻ thường).
  final double? notchFromTop;
  final double notchRadius;
  final double radius;
  final BorderSide side;

  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.all(side.width);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => getOuterPath(rect);

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    final r = Radius.circular(radius);
    final nt = notchFromTop;
    if (nt == null || nt <= notchRadius + radius || nt >= rect.height - notchRadius - radius) {
      return Path()..addRRect(RRect.fromRectAndRadius(rect, r));
    }
    final y = rect.top + nt;
    return Path()
      ..moveTo(rect.left + radius, rect.top)
      ..lineTo(rect.right - radius, rect.top)
      ..arcToPoint(Offset(rect.right, rect.top + radius), radius: r)
      ..lineTo(rect.right, y - notchRadius)
      ..arcToPoint(Offset(rect.right, y + notchRadius), radius: Radius.circular(notchRadius), clockwise: false)
      ..lineTo(rect.right, rect.bottom - radius)
      ..arcToPoint(Offset(rect.right - radius, rect.bottom), radius: r)
      ..lineTo(rect.left + radius, rect.bottom)
      ..arcToPoint(Offset(rect.left, rect.bottom - radius), radius: r)
      ..lineTo(rect.left, y + notchRadius)
      ..arcToPoint(Offset(rect.left, y - notchRadius), radius: Radius.circular(notchRadius), clockwise: false)
      ..lineTo(rect.left, rect.top + radius)
      ..arcToPoint(Offset(rect.left + radius, rect.top), radius: r)
      ..close();
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    if (side.style == BorderStyle.none || side.width == 0) return;
    canvas.drawPath(getOuterPath(rect), side.toPaint());
  }

  @override
  ShapeBorder scale(double t) =>
      TicketBorder(notchFromTop: notchFromTop, notchRadius: notchRadius * t, radius: radius * t, side: side.scale(t));
}

/// Đường răng cưa nét đứt giữa hai nửa cuống vé / giữa các dòng trên phiếu order.
class PerforationRule extends StatelessWidget {
  const PerforationRule({super.key, required this.color, this.inset = 0});

  final Color color;
  final double inset;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: inset),
      child: SizedBox(
        height: 1.5,
        width: double.infinity,
        child: CustomPaint(painter: _DashPainter(color)),
      ),
    );
  }
}

class _DashPainter extends CustomPainter {
  _DashPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..strokeWidth = size.height;
    for (double x = 0; x < size.width; x += 9) {
      canvas.drawLine(Offset(x, size.height / 2), Offset((x + 5).clamp(0, size.width), size.height / 2), p);
    }
  }

  @override
  bool shouldRepaint(_DashPainter old) => old.color != color;
}
