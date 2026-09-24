import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../app/theme.dart';
import '../core/api_client.dart';

enum Tone { neutral, ok, warn, danger }

extension ToneColors on StaffPalette {
  Color strong(Tone t) => switch (t) {
    Tone.ok => ok,
    Tone.warn => warn,
    Tone.danger => danger,
    Tone.neutral => ink,
  };
  Color soft(Tone t) => switch (t) {
    Tone.ok => okSoft,
    Tone.warn => warnSoft,
    Tone.danger => dangerSoft,
    Tone.neutral => surfaceHigh,
  };
}

/// Nhãn mục chữ in hoa giãn chữ — kiểu nhãn "VALID TICKET" / "ACCEPT ORDER" của bản Stitch.
class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.color});
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) =>
      Text(text.toUpperCase(), style: Txt.label().copyWith(color: color ?? context.palette.inkMuted));
}

enum ButtonKind { primary, quiet, danger }

/// Nút vuông vức cao 56 — bấm được bằng ngón cái khi tay kia cầm tiền/điện thoại khách.
class ActionButton extends StatelessWidget {
  const ActionButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.kind = ButtonKind.primary,
    this.busy = false,
    this.leading,
    this.height = 56,
    this.color,
    this.onColor,
  });

  final String label;
  final VoidCallback? onPressed;
  final ButtonKind kind;
  final bool busy;
  final Widget? leading;
  final double height;
  final Color? color;
  final Color? onColor;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final enabled = onPressed != null && !busy;
    final (bg, fg, border) = switch (kind) {
      ButtonKind.primary => (color ?? p.action, onColor ?? p.onAction, Colors.transparent),
      ButtonKind.quiet => (Colors.transparent, p.ink, p.line),
      ButtonKind.danger => (Colors.transparent, p.danger, p.danger.withValues(alpha: 0.55)),
    };
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      child: Opacity(
        opacity: enabled || busy ? 1 : 0.45,
        child: Material(
          color: bg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Radii.control),
            side: BorderSide(color: border, width: 1.2),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(Radii.control),
            onTap: enabled ? onPressed : null,
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: height),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (busy)
                      SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: fg))
                    else if (leading != null)
                      IconTheme.merge(
                        data: IconThemeData(color: fg, size: 20),
                        child: leading!,
                      ),
                    if (busy || leading != null) const SizedBox(width: 10),
                    Flexible(
                      child: Text(
                        label,
                        textAlign: TextAlign.center,
                        style: Txt.body(16, weight: 750, height: 1.2).copyWith(color: fg, letterSpacing: 0.2),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Khối thông báo có màu theo mức độ — dùng cho lỗi máy chủ, cảnh báo mạng, trạng thái rỗng.
class NoticePanel extends StatelessWidget {
  const NoticePanel({super.key, required this.tone, required this.title, this.body, this.action});

  final Tone tone;
  final String title;
  final String? body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: p.soft(tone),
        borderRadius: BorderRadius.circular(Radii.control),
        border: Border(left: BorderSide(color: p.strong(tone), width: 3)),
      ),
      padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Txt.body(15, weight: 750).copyWith(color: tone == Tone.neutral ? p.ink : p.strong(tone))),
          if (body != null) ...[const SizedBox(height: 4), Text(body!, style: Txt.body(14).copyWith(color: p.ink))],
          if (action != null) ...[const SizedBox(height: 10), action!],
        ],
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill(this.text, {super.key, this.tone = Tone.neutral, this.dense = false});
  final String text;
  final Tone tone;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: dense ? 7 : 9, vertical: dense ? 2 : 4),
      decoration: BoxDecoration(
        color: p.soft(tone),
        borderRadius: BorderRadius.circular(99),
        border: tone == Tone.neutral ? Border.all(color: p.line) : null,
      ),
      child: Text(
        text,
        style: Txt.body(
          dense ? 11.5 : 12.5,
          weight: 700,
        ).copyWith(color: tone == Tone.neutral ? p.inkMuted : p.strong(tone)),
      ),
    );
  }
}

/// Bộ tăng giảm số lượng như bản Stitch: nút −, số lớn, nút + đặc.
class QuantityStepper extends StatelessWidget {
  const QuantityStepper({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 1,
    this.max,
    this.compact = false,
  });

  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final int? max;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final canDec = value > min;
    final canInc = max == null || value < max!;
    final box = compact ? 40.0 : 52.0;
    Widget btn(IconData icon, bool enabled, VoidCallback onTap, bool filled, String semantics) => Semantics(
      button: true,
      label: semantics,
      child: Material(
        color: filled ? p.action : p.surfaceHigh,
        borderRadius: BorderRadius.circular(Radii.control),
        child: InkWell(
          borderRadius: BorderRadius.circular(Radii.control),
          onTap: enabled
              ? () {
                  HapticFeedback.selectionClick();
                  onTap();
                }
              : null,
          child: SizedBox.square(
            dimension: box,
            child: Icon(
              icon,
              size: compact ? 20 : 24,
              color: (filled ? p.onAction : p.ink).withValues(alpha: enabled ? 1 : 0.35),
            ),
          ),
        ),
      ),
    );
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        btn(Icons.remove, canDec, () => onChanged(value - 1), false, 'Bớt một'),
        SizedBox(
          width: compact ? 44 : 76,
          child: Text(
            '$value',
            textAlign: TextAlign.center,
            style: (compact ? Txt.title(20) : Txt.display(40)).copyWith(
              color: p.ink,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ),
        btn(Icons.add, canInc, () => onChanged(value + 1), true, 'Thêm một'),
      ],
    );
  }
}

class LoadingBlock extends StatelessWidget {
  const LoadingBlock({super.key, this.label = 'Đang tải…'});
  final String label;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox.square(dimension: 26, child: CircularProgressIndicator(strokeWidth: 2.4)),
          const SizedBox(height: 12),
          Text(label, style: Txt.body(14).copyWith(color: context.palette.inkMuted)),
        ],
      ),
    ),
  );
}

/// Câu lỗi cho người đứng quầy: câu của backend nếu máy chủ đã trả lời; nói rõ "chưa gửi được" nếu mất mạng.
({Tone tone, String title, String? body}) describeError(Object error, {String action = 'Thao tác'}) {
  if (error is ApiException) {
    return (tone: error.status >= 500 ? Tone.danger : Tone.warn, title: error.message, body: null);
  }
  if (error is NetworkException) {
    return error.state == SendState.notSent
        ? (
            tone: Tone.danger,
            title: 'Không có kết nối tới máy chủ',
            body: '$action chưa được gửi đi. Kiểm tra Wi-Fi/4G rồi thử lại.',
          )
        : (
            tone: Tone.danger,
            title: 'Mất kết nối khi đang chờ máy chủ',
            body: 'Không biết $action đã được ghi nhận hay chưa. Tải lại để kiểm tra trước khi làm lại.',
          );
  }
  return (tone: Tone.danger, title: 'Có lỗi không mong muốn', body: '$error');
}

abstract final class Breakpoints {
  static const rail = 720.0;
  static const twoPane = 900.0;
}
