import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../app/scope.dart';
import '../../app/theme.dart';
import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';
import '../../widgets/ticket_shape.dart';

enum _Stage { scanning, looking, preview, committing, admitted, refused }

/// Kết luận hiển thị cho nhân viên cửa. Máy chủ vẫn là nơi quyết định cuối cùng ở bước xác nhận.
class _Verdict {
  const _Verdict(this.tone, this.label, this.title, this.body);
  final Tone tone;
  final String label;
  final String title;
  final String? body;
}

/// Soát vé: quét → xem trước → bấm xác nhận (hai bước tách rời, theo brief), mỗi lý do từ chối một câu riêng,
/// vào cửa thành công thì tự quay lại màn quét sau ~2 giây.
class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key, required this.active});

  /// Chỉ bật camera khi tab Soát vé đang mở.
  final bool active;

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  static const _admittedHold = Duration(milliseconds: 1900);

  _Stage _stage = _Stage.scanning;
  String? _code;
  TicketDetail? _ticket;
  _Verdict? _verdict;
  Timer? _resetTimer;

  // Sau khi cho vào, điện thoại của khách thường vẫn còn trước camera: bỏ qua đúng mã đó một lúc,
  // nếu không màn hình sẽ báo "vé đã sử dụng" ngay sau khi vừa cho khách vào.
  String? _ignoreCode;
  DateTime? _ignoreUntil;

  @override
  void dispose() {
    _resetTimer?.cancel();
    super.dispose();
  }

  bool get _busy => _stage != _Stage.scanning;

  void _onDetect(BarcodeCapture capture) {
    if (_busy) return;
    final raw = capture.barcodes
        .map((b) => b.rawValue)
        .whereType<String>()
        .map((s) => s.trim())
        .firstWhere((s) => s.isNotEmpty, orElse: () => '');
    if (raw.isEmpty) return;
    if (raw == _ignoreCode && _ignoreUntil != null && DateTime.now().isBefore(_ignoreUntil!)) return;
    HapticFeedback.selectionClick();
    _lookUp(raw);
  }

  Future<void> _lookUp(String code) async {
    _resetTimer?.cancel();
    setState(() {
      _stage = _Stage.looking;
      _code = code;
      _ticket = null;
      _verdict = null;
    });
    try {
      final t = await AppScope.of(context).api.ticketByQr(code);
      if (!mounted || _code != code) return;
      final refusal = _refusalFromTicket(t);
      setState(() {
        _ticket = t;
        _verdict = refusal;
        _stage = refusal == null ? _Stage.preview : _Stage.refused;
      });
      refusal == null ? HapticFeedback.lightImpact() : HapticFeedback.heavyImpact();
    } catch (e) {
      if (!mounted || _code != code) return;
      HapticFeedback.heavyImpact();
      setState(() {
        _verdict = _refusalFromError(e, committing: false);
        _stage = _Stage.refused;
      });
    }
  }

  Future<void> _commit() async {
    final code = _code;
    if (code == null || _stage != _Stage.preview) return;
    setState(() => _stage = _Stage.committing);
    try {
      final t = await AppScope.of(context).api.checkIn(code);
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      setState(() {
        _ticket = t;
        _stage = _Stage.admitted;
        _ignoreCode = code;
        _ignoreUntil = DateTime.now().add(const Duration(seconds: 6));
      });
      _resetTimer = Timer(_admittedHold, _reset);
    } catch (e) {
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      var verdict = _refusalFromError(e, committing: true);
      // Câu "Vé không hợp lệ để check-in" che mất lý do thật (thường là vừa được nhân viên khác soát):
      // đọc lại vé để nói đúng lý do.
      if (e is ApiException && (e.status == 409 || e.message.startsWith('Vé không hợp lệ'))) {
        try {
          final fresh = await AppScope.of(context).api.ticketByQr(code);
          verdict = _refusalFromTicket(fresh) ?? verdict;
          if (mounted) _ticket = fresh;
        } catch (_) {}
      }
      if (!mounted) return;
      setState(() {
        _verdict = verdict;
        _stage = _Stage.refused;
      });
    }
  }

  void _reset() {
    _resetTimer?.cancel();
    if (!mounted) return;
    setState(() {
      _stage = _Stage.scanning;
      _code = null;
      _ticket = null;
      _verdict = null;
    });
  }

  _Verdict? _refusalFromTicket(TicketDetail t) {
    if (t.accessType != 'Physical') {
      return const _Verdict(
        Tone.warn,
        'Không cần soát',
        'Vé xem livestream',
        'Vé này để xem trực tuyến trong ứng dụng, không dùng để vào cửa phòng trà.',
      );
    }
    if (t.checkedInAt != null || t.status == 'Used') {
      return _Verdict(
        Tone.danger,
        'Đã sử dụng',
        'Vé đã được soát',
        t.checkedInAt == null ? 'Vé này đã dùng để vào cửa trước đó.' : 'Đã vào cửa lúc ${vnDateTime(t.checkedInAt!)}.',
      );
    }
    return switch (t.status) {
      'Cancelled' => const _Verdict(Tone.danger, 'Không hợp lệ', 'Vé đã bị huỷ', 'Vé này không còn giá trị vào cửa.'),
      'Refunded' => const _Verdict(
        Tone.danger,
        'Không hợp lệ',
        'Vé đã được hoàn tiền',
        'Vé này không còn giá trị vào cửa.',
      ),
      'Pending' => const _Verdict(
        Tone.warn,
        'Chưa thanh toán',
        'Vé chưa thanh toán xong',
        'Khách cần hoàn tất thanh toán trong ứng dụng rồi quét lại.',
      ),
      _ => null,
    };
  }

  _Verdict _refusalFromError(Object e, {required bool committing}) {
    if (e is NetworkException) {
      if (committing && e.state == SendState.unknown) {
        return const _Verdict(
          Tone.danger,
          'Mất kết nối',
          'Không rõ đã soát hay chưa',
          'Mạng mất khi máy chủ đang xử lý. Quét lại mã: nếu báo "đã được soát" thì lần trước đã ghi nhận.',
        );
      }
      return _Verdict(
        Tone.danger,
        'Mất kết nối',
        'Chưa kiểm tra được vé',
        committing
            ? 'Yêu cầu chưa tới máy chủ — khách CHƯA được ghi nhận vào cửa.'
            : 'Không liên lạc được máy chủ. Thử quét lại khi có mạng.',
      );
    }
    if (e is ApiException) {
      final m = e.message;
      if (e.status == 404) {
        return const _Verdict(
          Tone.danger,
          'Không tìm thấy',
          'Mã này không phải vé của hệ thống',
          'Kiểm tra khách có đưa đúng mã vé MusicLounge không (không phải mã thanh toán hay mã đơn hàng).',
        );
      }
      if (e.status == 403) {
        return _Verdict(Tone.danger, 'Sai phòng trà', 'Vé của phòng trà khác', m);
      }
      if (e.status == 409) return _Verdict(Tone.danger, 'Đã sử dụng', 'Vé đã được soát', m);
      if (m.contains('đang diễn ra')) {
        return _Verdict(
          Tone.warn,
          'Chưa mở cửa',
          'Buổi diễn của vé này chưa bắt đầu hoặc đã kết thúc',
          '$m Chủ phòng trà bắt đầu buổi diễn trên trang quản lý thì mới soát vé được.',
        );
      }
      if (m.contains('chuyển nhượng')) {
        return const _Verdict(
          Tone.warn,
          'Đang chuyển nhượng',
          'Vé đang được chuyển cho người khác',
          'Nhờ khách hoàn tất hoặc huỷ việc chuyển vé trong ứng dụng, rồi quét lại.',
        );
      }
      if (m.contains('online')) {
        return _Verdict(Tone.warn, 'Không cần soát', 'Vé xem livestream', m);
      }
      return _Verdict(e.status >= 500 ? Tone.danger : Tone.warn, 'Chưa soát được', m, null);
    }
    return _Verdict(Tone.danger, 'Lỗi', 'Có lỗi không mong muốn', '$e');
  }

  Future<void> _manualEntry() async {
    final p = context.palette;
    final controller = TextEditingController();
    final code = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: p.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.sheet))),
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(22, 22, 22, 22 + MediaQuery.viewInsetsOf(context).bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Nhập mã vé', style: Txt.display(26).copyWith(color: p.ink)),
            const SizedBox(height: 6),
            Text(
              'Dùng khi camera không đọc được mã: gõ dãy ký tự in dưới mã QR.',
              style: Txt.body(14).copyWith(color: p.inkMuted),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              autofocus: true,
              autocorrect: false,
              textInputAction: TextInputAction.search,
              style: Txt.mono(15, weight: 600).copyWith(color: p.ink),
              decoration: const InputDecoration(hintText: '32 ký tự chữ số và a–f'),
              onSubmitted: (v) => Navigator.of(context).pop(v),
            ),
            const SizedBox(height: 14),
            ActionButton(label: 'Kiểm tra vé', onPressed: () => Navigator.of(context).pop(controller.text)),
          ],
        ),
      ),
    );
    controller.dispose();
    final trimmed = code?.trim() ?? '';
    if (trimmed.isNotEmpty && mounted) _lookUp(trimmed);
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth >= Breakpoints.twoPane;
        final camera = _CameraArea(
          active: widget.active,
          paused: _busy,
          onDetect: _onDetect,
          onManualEntry: _manualEntry,
        );
        final panel = _ResultPanel(
          stage: _stage,
          ticket: _ticket,
          verdict: _verdict,
          hold: _admittedHold,
          onConfirm: _commit,
          onReset: _reset,
          onManualEntry: _manualEntry,
          wide: wide,
        );
        if (wide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: camera),
              Container(
                width: 420,
                decoration: BoxDecoration(
                  color: context.palette.ground,
                  border: Border(left: BorderSide(color: context.palette.line)),
                ),
                child: panel,
              ),
            ],
          );
        }
        return Stack(
          children: [
            Positioned.fill(child: camera),
            Positioned(left: 0, right: 0, bottom: 0, child: panel),
          ],
        );
      },
    );
  }
}

class _CameraArea extends StatefulWidget {
  const _CameraArea({required this.active, required this.paused, required this.onDetect, required this.onManualEntry});
  final bool active;
  final bool paused;
  final void Function(BarcodeCapture) onDetect;
  final VoidCallback onManualEntry;

  @override
  State<_CameraArea> createState() => _CameraAreaState();
}

class _CameraAreaState extends State<_CameraArea> {
  MobileScannerController? _controller;

  @override
  void initState() {
    super.initState();
    if (widget.active) _create();
  }

  @override
  void didUpdateWidget(covariant _CameraArea old) {
    super.didUpdateWidget(old);
    if (widget.active && _controller == null) {
      setState(_create);
    } else if (!widget.active && _controller != null) {
      final c = _controller!;
      setState(() => _controller = null);
      c.dispose();
    }
  }

  void _create() {
    _controller = MobileScannerController(
      formats: const [BarcodeFormat.qrCode],
      detectionSpeed: DetectionSpeed.normal,
      detectionTimeoutMs: 400,
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    return ColoredBox(
      color: const Color(0xFF0B0907),
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (controller != null)
            MobileScanner(
              controller: controller,
              onDetect: widget.onDetect,
              errorBuilder: (context, error) => _CameraProblem(error: error, onManualEntry: widget.onManualEntry),
              placeholderBuilder: (context) => const Center(
                child: SizedBox.square(dimension: 26, child: CircularProgressIndicator(strokeWidth: 2.4)),
              ),
            ),
          if (controller != null)
            ValueListenableBuilder<MobileScannerState>(
              valueListenable: controller,
              builder: (context, state, _) {
                // Không có camera thì không vẽ khung ngắm và nút đèn/đổi camera — chỉ còn lời hướng dẫn nhập tay.
                if (state.error != null) return const SizedBox.shrink();
                final multiCamera = (state.availableCameras ?? 2) > 1;
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    IgnorePointer(child: _Viewfinder(dimmed: widget.paused)),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: SafeArea(
                        child: Row(
                          children: [
                            if (state.torchState != TorchState.unavailable)
                              _RoundTool(
                                icon: state.torchState == TorchState.on
                                    ? Icons.flashlight_on_rounded
                                    : Icons.flashlight_off_rounded,
                                tooltip: state.torchState == TorchState.on ? 'Tắt đèn' : 'Bật đèn',
                                onTap: controller.toggleTorch,
                                highlighted: state.torchState == TorchState.on,
                              ),
                            if (multiCamera) ...[
                              const SizedBox(width: 8),
                              _RoundTool(
                                icon: Icons.cameraswitch_rounded,
                                tooltip: 'Đổi camera',
                                onTap: controller.switchCamera,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}

class _CameraProblem extends StatelessWidget {
  const _CameraProblem({required this.error, required this.onManualEntry});
  final MobileScannerException error;
  final VoidCallback onManualEntry;

  @override
  Widget build(BuildContext context) {
    final (title, body) = switch (error.errorCode) {
      MobileScannerErrorCode.permissionDenied => (
        'Chưa được phép dùng camera',
        'Mở Cài đặt của máy → Ứng dụng → ML Nhân viên → Quyền, bật Camera. Trong lúc chờ, nhập mã vé bằng tay.',
      ),
      MobileScannerErrorCode.unsupported => ('Thiết bị này không có camera quét được', 'Nhập mã vé bằng tay.'),
      _ => ('Không mở được camera', 'Thử đóng rồi mở lại tab Soát vé, hoặc nhập mã vé bằng tay.'),
    };
    return Material(
      type: MaterialType.transparency,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(28, 28, 28, 180),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 380),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.no_photography_outlined, color: Color(0xFFE4C199), size: 34),
                const SizedBox(height: 12),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: Txt.title(20).copyWith(color: const Color(0xFFF3EDE2)),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  textAlign: TextAlign.center,
                  style: Txt.body(14).copyWith(color: const Color(0xFFBDB2A2)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Khung ngắm bốn góc như bản Stitch, vạch quét màu đồng.
class _Viewfinder extends StatelessWidget {
  const _Viewfinder({required this.dimmed});
  final bool dimmed;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, c) {
        final side = (c.maxWidth * 0.68).clamp(180.0, 320.0);
        final top = ((c.maxHeight - side) / 2 - (c.maxWidth < Breakpoints.twoPane ? 70 : 0)).clamp(24.0, 400.0);
        return AnimatedOpacity(
          duration: const Duration(milliseconds: 180),
          opacity: dimmed ? 0.25 : 1,
          child: Stack(
            children: [
              Positioned(
                left: (c.maxWidth - side) / 2,
                top: top,
                width: side,
                height: side,
                child: CustomPaint(painter: _CornersPainter()),
              ),
              Positioned(
                left: 24,
                right: 24,
                top: top + side + 16,
                child: Text(
                  'Đưa mã QR trên vé vào trong khung',
                  textAlign: TextAlign.center,
                  style: Txt.body(14.5, weight: 700).copyWith(
                    color: const Color(0xFFF3EDE2),
                    shadows: const [Shadow(blurRadius: 8, color: Colors.black)],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _CornersPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size s) {
    final p = Paint()
      ..color = const Color(0xFFF3EDE2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.square;
    const k = 34.0;
    final path = Path()
      ..moveTo(0, k)
      ..lineTo(0, 0)
      ..lineTo(k, 0)
      ..moveTo(s.width - k, 0)
      ..lineTo(s.width, 0)
      ..lineTo(s.width, k)
      ..moveTo(s.width, s.height - k)
      ..lineTo(s.width, s.height)
      ..lineTo(s.width - k, s.height)
      ..moveTo(k, s.height)
      ..lineTo(0, s.height)
      ..lineTo(0, s.height - k);
    canvas.drawPath(path, p);
    canvas.drawLine(
      Offset(12, s.height / 2),
      Offset(s.width - 12, s.height / 2),
      Paint()
        ..color = const Color(0xCCE4C199)
        ..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(_CornersPainter old) => false;
}

class _RoundTool extends StatelessWidget {
  const _RoundTool({required this.icon, required this.tooltip, required this.onTap, this.highlighted = false});
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final bool highlighted;

  @override
  Widget build(BuildContext context) => Tooltip(
    message: tooltip,
    child: Material(
      color: highlighted ? const Color(0xFFE4C199) : const Color(0x99000000),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox.square(
          dimension: 48,
          child: Icon(icon, color: highlighted ? const Color(0xFF2A1801) : Colors.white, size: 22),
        ),
      ),
    ),
  );
}

class _ResultPanel extends StatelessWidget {
  const _ResultPanel({
    required this.stage,
    required this.ticket,
    required this.verdict,
    required this.hold,
    required this.onConfirm,
    required this.onReset,
    required this.onManualEntry,
    required this.wide,
  });

  final _Stage stage;
  final TicketDetail? ticket;
  final _Verdict? verdict;
  final Duration hold;
  final VoidCallback onConfirm;
  final VoidCallback onReset;
  final VoidCallback onManualEntry;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    final Widget content = switch (stage) {
      _Stage.scanning => _Idle(onManualEntry: onManualEntry, wide: wide),
      _Stage.looking => _Card(
        key: const ValueKey('looking'),
        tone: Tone.neutral,
        label: 'Đang kiểm tra',
        title: 'Đang tìm vé…',
        trailing: const SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2.4)),
      ),
      _Stage.preview || _Stage.committing => _Card(
        key: const ValueKey('preview'),
        tone: Tone.ok,
        label: 'Vé hợp lệ',
        title: ticket!.tierName,
        ticket: ticket,
        warning: isSameVnDay(ticket!.showStart, DateTime.now())
            ? null
            : 'Vé cho buổi ${vnDate(ticket!.showStart)} — kiểm tra đúng buổi hôm nay.',
        actions: [
          ActionButton(
            label: stage == _Stage.committing ? 'Đang ghi nhận…' : 'Xác nhận vào cửa',
            busy: stage == _Stage.committing,
            onPressed: onConfirm,
          ),
          const SizedBox(height: 8),
          ActionButton(
            kind: ButtonKind.quiet,
            height: 46,
            label: 'Bỏ qua, quét vé khác',
            onPressed: stage == _Stage.committing ? null : onReset,
          ),
        ],
      ),
      _Stage.admitted => _Admitted(key: const ValueKey('admitted'), ticket: ticket!, hold: hold, onTap: onReset),
      _Stage.refused => _Card(
        key: ValueKey('refused-${verdict?.title}'),
        tone: verdict!.tone,
        label: verdict!.label,
        title: verdict!.title,
        body: verdict!.body,
        ticket: ticket,
        actions: [ActionButton(label: 'Quét vé khác', onPressed: onReset)],
      ),
    };
    final switcher = AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      switchInCurve: Curves.easeOutCubic,
      transitionBuilder: (child, anim) => FadeTransition(
        opacity: anim,
        child: SlideTransition(
          position: Tween(begin: const Offset(0, 0.06), end: Offset.zero).animate(anim),
          child: child,
        ),
      ),
      child: content,
    );
    if (wide) {
      return SingleChildScrollView(padding: const EdgeInsets.all(24), child: switcher);
    }
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.72),
      child: SingleChildScrollView(padding: const EdgeInsets.fromLTRB(14, 0, 14, 14), child: switcher),
    );
  }
}

class _Idle extends StatelessWidget {
  const _Idle({required this.onManualEntry, required this.wide});
  final VoidCallback onManualEntry;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    if (!wide) {
      return Align(
        key: const ValueKey('idle'),
        alignment: Alignment.bottomCenter,
        child: TextButton.icon(
          style: TextButton.styleFrom(
            backgroundColor: const Color(0xB3000000),
            foregroundColor: const Color(0xFFE4C199),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
          ),
          onPressed: onManualEntry,
          icon: const Icon(Icons.keyboard_alt_outlined, size: 20),
          label: Text('Nhập mã thủ công', style: Txt.body(14.5, weight: 750)),
        ),
      );
    }
    return Column(
      key: const ValueKey('idle'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionLabel('Sẵn sàng quét', color: p.accent),
        const SizedBox(height: 8),
        Text('Mời khách đưa mã QR', style: Txt.display(30).copyWith(color: p.ink)),
        const SizedBox(height: 10),
        Text(
          'Mỗi lần quét sẽ hiện thông tin vé để kiểm tra trước. Chỉ khi bấm "Xác nhận vào cửa" vé mới được ghi là đã dùng.',
          style: Txt.body(15).copyWith(color: p.inkMuted),
        ),
        const SizedBox(height: 22),
        ActionButton(
          kind: ButtonKind.quiet,
          label: 'Nhập mã thủ công',
          leading: const Icon(Icons.keyboard_alt_outlined),
          onPressed: onManualEntry,
        ),
      ],
    );
  }
}

class _Card extends StatefulWidget {
  const _Card({
    super.key,
    required this.tone,
    required this.label,
    required this.title,
    this.body,
    this.ticket,
    this.warning,
    this.trailing,
    this.actions = const [],
  });

  final Tone tone;
  final String label;
  final String title;
  final String? body;
  final TicketDetail? ticket;
  final String? warning;
  final Widget? trailing;
  final List<Widget> actions;

  @override
  State<_Card> createState() => _CardState();
}

class _CardState extends State<_Card> {
  // Chỗ khuyết của cuống vé nằm đúng mép dưới dải màu — dải cao thêm khi tiêu đề xuống dòng, nên đo sau khi dựng.
  double _bandHeight = 92;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final w = widget;
    final strong = w.tone == Tone.neutral ? p.inkMuted : p.strong(w.tone);
    final shape = TicketBorder(notchFromTop: _bandHeight);
    final t = w.ticket;
    return Container(
      decoration: ShapeDecoration(
        color: p.surface,
        shape: shape,
        shadows: const [BoxShadow(color: Color(0x66000000), blurRadius: 24, offset: Offset(0, 8))],
      ),
      foregroundDecoration: ShapeDecoration(
        shape: TicketBorder(
          notchFromTop: _bandHeight,
          side: BorderSide(color: p.line),
        ),
      ),
      child: ClipPath(
        clipper: ShapeBorderClipper(shape: shape),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            _SizeReporter(
              onHeight: (h) {
                if ((h - _bandHeight).abs() > 0.5 && mounted) setState(() => _bandHeight = h);
              },
              child: Container(
                constraints: const BoxConstraints(minHeight: 92),
                color: p.soft(w.tone),
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(w.label.toUpperCase(), style: Txt.label().copyWith(color: strong)),
                          const SizedBox(height: 4),
                          Text(
                            w.title,
                            style: Txt.display(24).copyWith(color: w.tone == Tone.neutral ? p.ink : strong),
                          ),
                        ],
                      ),
                    ),
                    ?w.trailing,
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (w.body != null) ...[
                    Text(w.body!, style: Txt.body(15).copyWith(color: p.ink)),
                    const SizedBox(height: 12),
                  ],
                  if (t != null) ...[
                    _Row('Buổi diễn', t.showName),
                    _Row('Giờ diễn', vnDateTime(t.showStart)),
                    _Row('Hạng vé', [t.tierName, if (t.priceName != 'Giá tiêu chuẩn') t.priceName].join(' · ')),
                    if (t.seatInfo != null && t.seatInfo!.isNotEmpty) _Row('Chỗ ngồi', t.seatInfo!),
                    const SizedBox(height: 6),
                  ],
                  if (w.warning != null) ...[
                    NoticePanel(tone: Tone.warn, title: w.warning!),
                    const SizedBox(height: 12),
                  ],
                  ...w.actions,
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SizeReporter extends SingleChildRenderObjectWidget {
  const _SizeReporter({required this.onHeight, required super.child});
  final ValueChanged<double> onHeight;

  @override
  RenderObject createRenderObject(BuildContext context) => _RenderSizeReporter(onHeight);

  @override
  void updateRenderObject(BuildContext context, _RenderSizeReporter renderObject) => renderObject.onHeight = onHeight;
}

class _RenderSizeReporter extends RenderProxyBox {
  _RenderSizeReporter(this.onHeight);
  ValueChanged<double> onHeight;

  @override
  void performLayout() {
    super.performLayout();
    final h = size.height;
    WidgetsBinding.instance.addPostFrameCallback((_) => onHeight(h));
  }
}

class _Row extends StatelessWidget {
  const _Row(this.k, this.v);
  final String k;
  final String v;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
            child: Text(k, style: Txt.body(13.5).copyWith(color: p.inkMuted)),
          ),
          Expanded(
            child: Text(v, style: Txt.body(14.5, weight: 700).copyWith(color: p.ink)),
          ),
        ],
      ),
    );
  }
}

class _Admitted extends StatelessWidget {
  const _Admitted({super.key, required this.ticket, required this.hold, required this.onTap});
  final TicketDetail ticket;
  final Duration hold;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final onOk = ThemeData.estimateBrightnessForColor(p.ok) == Brightness.dark ? Colors.white : const Color(0xFF06140C);
    return Semantics(
      liveRegion: true,
      label: 'Mời vào. ${ticket.tierName}',
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: ShapeDecoration(color: p.ok, shape: const TicketBorder(notchFromTop: 118)),
          padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: onOk, size: 34),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text('Mời vào', style: Txt.display(36).copyWith(color: onOk)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Đã ghi nhận vào cửa lúc ${vnTime(DateTime.now())}',
                style: Txt.body(14, weight: 700).copyWith(color: onOk.withValues(alpha: 0.85)),
              ),
              const SizedBox(height: 26),
              Text(ticket.tierName, style: Txt.title(22).copyWith(color: onOk)),
              Text(
                ticket.showName,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Txt.body(14.5).copyWith(color: onOk.withValues(alpha: 0.85)),
              ),
              const SizedBox(height: 16),
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 1, end: 0),
                duration: hold,
                builder: (context, v, _) => ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: v,
                    minHeight: 4,
                    color: onOk,
                    backgroundColor: onOk.withValues(alpha: 0.2),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Tự quay lại màn quét · chạm để quét ngay',
                style: Txt.body(12.5, weight: 600).copyWith(color: onOk.withValues(alpha: 0.8)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
