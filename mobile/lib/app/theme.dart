import 'package:flutter/material.dart';

/// Bảng màu lấy từ bộ màn nhân viên trong Stitch (walk_in_sale / check_in_scanner / kitchen_bar_order_board):
/// nền kem #FCF9F1, nút chính đen, nhấn màu đồng #745A39 / #E4C199.
/// Ca làm ở phòng trà diễn ra trong phòng tối, nên bản tối là mặc định: nền nâu gần đen, nút màu đồng.
@immutable
class StaffPalette extends ThemeExtension<StaffPalette> {
  const StaffPalette({
    required this.ground,
    required this.surface,
    required this.surfaceHigh,
    required this.line,
    required this.ink,
    required this.inkMuted,
    required this.action,
    required this.onAction,
    required this.accent,
    required this.ok,
    required this.okSoft,
    required this.danger,
    required this.dangerSoft,
    required this.warn,
    required this.warnSoft,
  });

  final Color ground;
  final Color surface;
  final Color surfaceHigh;
  final Color line;
  final Color ink;
  final Color inkMuted;

  /// Nút hành động chính (bán, xác nhận vào cửa, bước kế của order).
  final Color action;
  final Color onAction;

  /// Màu đồng — đánh dấu mục đang chọn, số tiền, nhãn nhỏ.
  final Color accent;

  final Color ok;
  final Color okSoft;
  final Color danger;
  final Color dangerSoft;
  final Color warn;
  final Color warnSoft;

  static const night = StaffPalette(
    ground: Color(0xFF13100C),
    surface: Color(0xFF1D1914),
    surfaceHigh: Color(0xFF29231C),
    line: Color(0xFF3B3229),
    ink: Color(0xFFF3EDE2),
    inkMuted: Color(0xFFAB9F8E),
    action: Color(0xFFE4C199),
    onAction: Color(0xFF2A1801),
    accent: Color(0xFFE4C199),
    ok: Color(0xFF5FD39A),
    okSoft: Color(0xFF123324),
    danger: Color(0xFFFF7A6E),
    dangerSoft: Color(0xFF3C1714),
    warn: Color(0xFFF2B950),
    warnSoft: Color(0xFF3A2B10),
  );

  static const day = StaffPalette(
    ground: Color(0xFFFCF9F1),
    surface: Color(0xFFFFFFFF),
    surfaceHigh: Color(0xFFF1EEE6),
    line: Color(0xFFDDD6C8),
    ink: Color(0xFF1C1C17),
    inkMuted: Color(0xFF5F5A50),
    action: Color(0xFF1C1B1B),
    onAction: Color(0xFFFFFFFF),
    accent: Color(0xFF745A39),
    ok: Color(0xFF1B7A4A),
    okSoft: Color(0xFFDDF2E5),
    danger: Color(0xFFBA1A1A),
    dangerSoft: Color(0xFFFFDAD6),
    warn: Color(0xFF8A5800),
    warnSoft: Color(0xFFFFE8BF),
  );

  @override
  StaffPalette copyWith() => this;

  @override
  StaffPalette lerp(StaffPalette? other, double t) {
    if (other == null) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    return StaffPalette(
      ground: c(ground, other.ground),
      surface: c(surface, other.surface),
      surfaceHigh: c(surfaceHigh, other.surfaceHigh),
      line: c(line, other.line),
      ink: c(ink, other.ink),
      inkMuted: c(inkMuted, other.inkMuted),
      action: c(action, other.action),
      onAction: c(onAction, other.onAction),
      accent: c(accent, other.accent),
      ok: c(ok, other.ok),
      okSoft: c(okSoft, other.okSoft),
      danger: c(danger, other.danger),
      dangerSoft: c(dangerSoft, other.dangerSoft),
      warn: c(warn, other.warn),
      warnSoft: c(warnSoft, other.warnSoft),
    );
  }
}

/// Bán kính có chủ đích: nút/ô nhập vuông vức kiểu máy POS, thẻ bo vừa, tấm trượt bo lớn.
abstract final class Radii {
  static const control = 4.0;
  static const card = 10.0;
  static const sheet = 18.0;
}

/// Ba họ chữ: Bricolage (tiêu đề, số lớn), Manrope (chữ thường — giữ từ bản Stitch),
/// JetBrains Mono (mã vé, số order, dòng món như phiếu in nhiệt).
/// Syne của bản Stitch không có dấu tiếng Việt nên được thay bằng Bricolage.
abstract final class Txt {
  static TextStyle _v(
    String family,
    double size,
    double weight, {
    double height = 1.3,
    double spacing = 0,
    List<FontVariation> extra = const [],
  }) {
    return TextStyle(
      fontFamily: family,
      fontSize: size,
      height: height,
      letterSpacing: spacing,
      fontWeight: FontWeight.values[((weight / 100).round() - 1).clamp(0, 8)],
      fontVariations: [FontVariation('wght', weight), ...extra],
    );
  }

  static TextStyle display(double size, {double weight = 700}) => _v(
    'Bricolage',
    size,
    weight,
    height: 1.05,
    spacing: -0.4,
    extra: [FontVariation('opsz', size.clamp(12, 96)), const FontVariation('wdth', 92)],
  );

  static TextStyle title(double size, {double weight = 650}) =>
      _v('Bricolage', size, weight, height: 1.15, extra: [FontVariation('opsz', size.clamp(12, 96))]);

  static TextStyle body(double size, {double weight = 500, double height = 1.4}) =>
      _v('Manrope', size, weight, height: height);

  static TextStyle label({double size = 11.5}) => _v('Manrope', size, 750, height: 1.2, spacing: 1.1);

  static TextStyle mono(double size, {double weight = 500}) => _v('JetBrainsMono', size, weight, height: 1.35);
}

ThemeData buildTheme(StaffPalette p, Brightness brightness) {
  final scheme = ColorScheme(
    brightness: brightness,
    primary: p.action,
    onPrimary: p.onAction,
    secondary: p.accent,
    onSecondary: p.onAction,
    error: p.danger,
    onError: brightness == Brightness.dark ? p.ground : Colors.white,
    surface: p.surface,
    onSurface: p.ink,
    surfaceContainerHighest: p.surfaceHigh,
    outline: p.line,
    outlineVariant: p.line,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, brightness: brightness);
  return base.copyWith(
    scaffoldBackgroundColor: p.ground,
    extensions: [p],
    textTheme: base.textTheme.apply(fontFamily: 'Manrope', bodyColor: p.ink, displayColor: p.ink),
    splashFactory: InkRipple.splashFactory,
    dividerTheme: DividerThemeData(color: p.line, space: 1, thickness: 1),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.surfaceHigh,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      labelStyle: Txt.body(14, weight: 600).copyWith(color: p.inkMuted),
      floatingLabelStyle: Txt.body(13, weight: 700).copyWith(color: p.accent),
      hintStyle: Txt.body(15).copyWith(color: p.inkMuted),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Radii.control),
        borderSide: BorderSide(color: p.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Radii.control),
        borderSide: BorderSide(color: p.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Radii.control),
        borderSide: BorderSide(color: p.accent, width: 1.6),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(Radii.control),
        borderSide: BorderSide(color: p.danger, width: 1.2),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: p.ink,
      contentTextStyle: Txt.body(14, weight: 600).copyWith(color: p.ground),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.control)),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: p.accent),
  );
}

extension PaletteOf on BuildContext {
  StaffPalette get palette => Theme.of(this).extension<StaffPalette>()!;
}
