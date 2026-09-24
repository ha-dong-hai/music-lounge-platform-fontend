import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Ba biểu tượng tab vẽ riêng cho nghề phòng trà, thay cho bộ icon mặc định:
/// cuống vé có lỗ bấm (Bán vé), khung ngắm có vạch quét (Soát vé), tách trà trên đĩa (Gọi món — phòng *trà*).
enum StaffGlyph { ticket, scan, teacup }

class GlyphIcon extends StatelessWidget {
  const GlyphIcon(this.glyph, {super.key, this.size = 24, this.color, this.strokeWidth = 1.8});

  final StaffGlyph glyph;
  final double size;
  final Color? color;
  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    final c = color ?? IconTheme.of(context).color ?? Colors.black;
    return SizedBox.square(
      dimension: size,
      child: CustomPaint(painter: _GlyphPainter(glyph, c, strokeWidth)),
    );
  }
}

class _GlyphPainter extends CustomPainter {
  _GlyphPainter(this.glyph, this.color, this.strokeWidth);

  final StaffGlyph glyph;
  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24, size.height / 24);
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    switch (glyph) {
      case StaffGlyph.ticket:
        _ticket(canvas, p);
      case StaffGlyph.scan:
        _scan(canvas, p);
      case StaffGlyph.teacup:
        _teacup(canvas, p);
    }
  }

  void _ticket(Canvas canvas, Paint p) {
    const l = 2.5, r = 21.5, t = 5.5, b = 18.5, cr = 2.0, n = 2.4;
    const my = (t + b) / 2;
    final path = Path()
      ..moveTo(l + cr, t)
      ..lineTo(r - cr, t)
      ..arcToPoint(const Offset(r, t + cr), radius: const Radius.circular(cr))
      ..lineTo(r, my - n)
      ..arcToPoint(const Offset(r, my + n), radius: const Radius.circular(n), clockwise: false)
      ..lineTo(r, b - cr)
      ..arcToPoint(const Offset(r - cr, b), radius: const Radius.circular(cr))
      ..lineTo(l + cr, b)
      ..arcToPoint(const Offset(l, b - cr), radius: const Radius.circular(cr))
      ..lineTo(l, my + n)
      ..arcToPoint(const Offset(l, my - n), radius: const Radius.circular(n), clockwise: false)
      ..lineTo(l, t + cr)
      ..arcToPoint(const Offset(l + cr, t), radius: const Radius.circular(cr));
    canvas.drawPath(path, p);
    final dash = Paint()
      ..color = p.color
      ..strokeWidth = p.strokeWidth * 0.8
      ..strokeCap = StrokeCap.round;
    for (var y = t + 2.6; y < b - 2.0; y += 2.7) {
      canvas.drawLine(Offset(15.2, y), Offset(15.2, math.min(y + 1.1, b - 2.0)), dash);
    }
  }

  void _scan(Canvas canvas, Paint p) {
    const a = 3.0, z = 21.0, k = 5.2;
    final corners = Path()
      ..moveTo(a, a + k)
      ..lineTo(a, a)
      ..lineTo(a + k, a)
      ..moveTo(z - k, a)
      ..lineTo(z, a)
      ..lineTo(z, a + k)
      ..moveTo(z, z - k)
      ..lineTo(z, z)
      ..lineTo(z - k, z)
      ..moveTo(a + k, z)
      ..lineTo(a, z)
      ..lineTo(a, z - k);
    canvas.drawPath(corners, p);
    canvas.drawLine(const Offset(6.5, 12), const Offset(17.5, 12), p);
  }

  void _teacup(Canvas canvas, Paint p) {
    final cup = Path()
      ..moveTo(4.5, 9.5)
      ..lineTo(16.5, 9.5)
      ..lineTo(16.0, 13.2)
      ..cubicTo(15.6, 16.0, 13.6, 17.4, 10.5, 17.4)
      ..cubicTo(7.4, 17.4, 5.4, 16.0, 5.0, 13.2)
      ..close();
    canvas.drawPath(cup, p);
    final handle = Path()
      ..moveTo(16.4, 11.0)
      ..cubicTo(19.6, 10.6, 20.4, 14.6, 15.6, 14.8);
    canvas.drawPath(handle, p);
    canvas.drawLine(const Offset(3.0, 20.2), const Offset(18.5, 20.2), p);
    final steam = Path()
      ..moveTo(8.2, 7.0)
      ..cubicTo(7.2, 5.9, 9.2, 5.0, 8.2, 3.6)
      ..moveTo(12.4, 7.0)
      ..cubicTo(11.4, 5.9, 13.4, 5.0, 12.4, 3.6);
    canvas.drawPath(steam, p..strokeWidth = p.strokeWidth * 0.85);
  }

  @override
  bool shouldRepaint(_GlyphPainter old) => old.glyph != glyph || old.color != color || old.strokeWidth != strokeWidth;
}
