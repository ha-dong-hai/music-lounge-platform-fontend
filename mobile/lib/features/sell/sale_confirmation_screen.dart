import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app/theme.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';
import '../../widgets/ticket_shape.dart';

/// Trao vé cho khách mua tại quầy. Khách không có tài khoản, nên mã QR trên màn hình này là bản vé duy nhất.
class SaleConfirmationScreen extends StatefulWidget {
  const SaleConfirmationScreen({
    super.key,
    required this.sale,
    required this.showName,
    required this.showStart,
    required this.tierName,
    required this.priceName,
  });

  final WalkInSale sale;
  final String showName;
  final DateTime showStart;
  final String tierName;
  final String priceName;

  @override
  State<SaleConfirmationScreen> createState() => _SaleConfirmationScreenState();
}

class _SaleConfirmationScreenState extends State<SaleConfirmationScreen> {
  final _pages = PageController();
  int _page = 0;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final tickets = widget.sale.tickets;
    final n = tickets.length;
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, c) {
            final wide = c.maxWidth >= Breakpoints.twoPane;
            final header = Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: p.ok, size: 22),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'ĐÃ GHI NHẬN · THANH TOÁN #${widget.sale.paymentId}',
                        style: Txt.label().copyWith(color: p.ok),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  n == 1 ? 'Đã bán 1 vé' : 'Đã bán $n vé',
                  style: Txt.display(wide ? 40 : 32).copyWith(color: p.ink),
                ),
                const SizedBox(height: 6),
                Text(
                  '${vnd(widget.sale.amount)} tiền mặt · ${widget.tierName}',
                  style: Txt.body(16, weight: 700).copyWith(color: p.accent),
                ),
                const SizedBox(height: 14),
                Text(
                  'Đưa màn hình cho khách chụp lại mã QR. Khách mua tại quầy không có tài khoản, '
                  'nên ảnh chụp mã này chính là vé để vào cửa.',
                  style: Txt.body(14.5).copyWith(color: p.inkMuted),
                ),
              ],
            );

            final newSale = ActionButton(
              label: 'Bán vé mới',
              leading: const Icon(Icons.add_rounded),
              onPressed: () => Navigator.of(context).pop(),
            );

            if (wide) {
              return Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(40, 32, 40, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ConstrainedBox(constraints: const BoxConstraints(maxWidth: 640), child: header),
                          const SizedBox(height: 28),
                          Wrap(
                            spacing: 20,
                            runSpacing: 20,
                            children: [
                              for (var i = 0; i < n; i++)
                                SizedBox(
                                  width: 320,
                                  child: _TicketStub(index: i, count: n, ticket: tickets[i], widget: widget),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  _BottomAction(child: SizedBox(width: 360, child: newSale)),
                ],
              );
            }

            return Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                    children: [
                      header,
                      const SizedBox(height: 20),
                      if (n == 1)
                        _TicketStub(index: 0, count: 1, ticket: tickets.first, widget: widget)
                      else ...[
                        SizedBox(
                          height: _stubHeight(c.maxWidth - 40, context),
                          child: PageView.builder(
                            controller: _pages,
                            itemCount: n,
                            onPageChanged: (i) {
                              HapticFeedback.selectionClick();
                              setState(() => _page = i);
                            },
                            itemBuilder: (_, i) => Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 2),
                              child: _TicketStub(index: i, count: n, ticket: tickets[i], widget: widget),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _PagerDots(
                          count: n,
                          index: _page,
                          onJump: (i) => _pages.animateToPage(
                            i,
                            duration: const Duration(milliseconds: 260),
                            curve: Curves.easeOutCubic,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                _BottomAction(child: newSale),
              ],
            );
          },
        ),
      ),
    );
  }

  double _stubHeight(double width, BuildContext context) {
    final qr = (width - 56).clamp(160.0, 300.0);
    final scale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.35);
    return qr + 190 * scale;
  }
}

class _TicketStub extends StatelessWidget {
  const _TicketStub({required this.index, required this.count, required this.ticket, required this.widget});

  final int index;
  final int count;
  final SoldTicket ticket;
  final SaleConfirmationScreen widget;

  // Vé là "giấy": nền sáng ở cả hai giao diện để máy quét và camera điện thoại đọc mã dễ nhất.
  static const paper = Color(0xFFFCF9F1);
  static const paperInk = Color(0xFF1C1C17);
  static const paperMuted = Color(0xFF6A6458);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, c) {
        final qrSize = (c.maxWidth - 56).clamp(160.0, 300.0);
        const headerHeight = 76.0;
        return Container(
          decoration: const ShapeDecoration(
            color: paper,
            shape: TicketBorder(notchFromTop: headerHeight),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: headerHeight,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 14, 22, 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              widget.showName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Txt.body(14, weight: 750).copyWith(color: paperInk),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${vnTime(widget.showStart)} · ${vnDate(widget.showStart)}',
                              style: Txt.body(12.5).copyWith(color: paperMuted),
                            ),
                          ],
                        ),
                      ),
                      Text('${index + 1}/$count', style: Txt.mono(15, weight: 700).copyWith(color: paperInk)),
                    ],
                  ),
                ),
              ),
              const PerforationRule(color: Color(0x551C1C17), inset: 16),
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 18, 28, 8),
                child: Semantics(
                  label: 'Mã QR vé ${index + 1} trên $count',
                  image: true,
                  child: QrImageView(
                    data: ticket.qrCode,
                    size: qrSize,
                    padding: EdgeInsets.zero,
                    backgroundColor: paper,
                    errorCorrectionLevel: QrErrorCorrectLevel.M,
                    eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: paperInk),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: paperInk,
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(22, 6, 22, 18),
                child: Column(
                  children: [
                    Text(
                      [widget.tierName, if (widget.priceName.isNotEmpty) widget.priceName].join(' · '),
                      textAlign: TextAlign.center,
                      style: Txt.title(17).copyWith(color: paperInk),
                    ),
                    const SizedBox(height: 4),
                    SelectableText(
                      ticket.qrCode,
                      textAlign: TextAlign.center,
                      style: Txt.mono(11.5).copyWith(color: paperMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PagerDots extends StatelessWidget {
  const _PagerDots({required this.count, required this.index, required this.onJump});
  final int count;
  final int index;
  final ValueChanged<int> onJump;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('Vuốt để xem vé kế', style: Txt.body(13).copyWith(color: p.inkMuted)),
        const SizedBox(width: 12),
        for (var i = 0; i < count && count <= 12; i++)
          GestureDetector(
            onTap: () => onJump(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: i == index ? 18 : 7,
              height: 7,
              decoration: BoxDecoration(color: i == index ? p.accent : p.line, borderRadius: BorderRadius.circular(99)),
            ),
          ),
        if (count > 12) Text('${index + 1}/$count', style: Txt.mono(13, weight: 700).copyWith(color: p.ink)),
      ],
    );
  }
}

class _BottomAction extends StatelessWidget {
  const _BottomAction({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: p.surface,
        border: Border(top: BorderSide(color: p.line)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
      child: Center(child: child),
    );
  }
}
