import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/scope.dart';
import '../../app/theme.dart';
import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';
import 'sale_attempt.dart';
import 'sale_confirmation_screen.dart';

/// Một mức giá bán được tại quầy: hạng vé vào cửa (Physical) + đợt giá kênh Offline/Both.
class _Option {
  _Option(this.tier, this.price, DateTime now)
    : disabledReason = price.availableSlots == 0
          ? 'Hết chỗ'
          : now.isBefore(price.saleStart)
          ? 'Mở bán ${vnDateTime(price.saleStart)}'
          : null;

  final TicketTier tier;
  final TicketPrice price;
  final String? disabledReason;

  bool get enabled => disabledReason == null;
  String get subtitle => price.name == 'Giá tiêu chuẩn' ? '' : price.name;
}

class SellScreen extends StatefulWidget {
  const SellScreen({super.key});

  @override
  State<SellScreen> createState() => _SellScreenState();
}

class _SellScreenState extends State<SellScreen> with AutomaticKeepAliveClientMixin {
  List<Show>? _shows;
  Object? _showsError;
  int? _showId;

  List<_Option>? _options;
  Object? _optionsError;
  bool _loadingOptions = false;
  int? _priceId;
  int _qty = 1;

  bool _selling = false;
  Object? _saleError;
  final _attempt = SaleAttempt();

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadShows());
  }

  Future<void> _loadShows() async {
    final scope = AppScope.of(context);
    setState(() {
      _showsError = null;
      _shows = null;
    });
    try {
      final all = await scope.api.shows(scope.session.loungeId);
      final open = all.where((s) => s.hasFloor && (s.status == 'Published' || s.isOngoing)).toList()
        ..sort((a, b) {
          if (a.isOngoing != b.isOngoing) return a.isOngoing ? -1 : 1;
          return a.scheduledStart.compareTo(b.scheduledStart);
        });
      if (!mounted) return;
      setState(() => _shows = open);
      final keep = open.any((s) => s.id == _showId);
      if (open.isNotEmpty) _selectShow(keep ? _showId! : open.first.id);
    } catch (e) {
      if (mounted) setState(() => _showsError = e);
    }
  }

  Future<void> _selectShow(int showId) async {
    setState(() {
      _showId = showId;
      _options = null;
      _optionsError = null;
      _loadingOptions = true;
      _saleError = null;
    });
    try {
      final tiers = await AppScope.of(context).api.tiers(showId);
      final now = DateTime.now();
      final options = [
        for (final t in tiers.where((t) => t.accessType == 'Physical'))
          for (final pr in t.prices.where((pr) => pr.sellableAtCounter)) _Option(t, pr, now),
      ];
      if (!mounted || _showId != showId) return;
      setState(() {
        _options = options;
        final still = options.where((o) => o.price.id == _priceId && o.enabled);
        if (still.isEmpty) {
          final firstOpen = options.where((o) => o.enabled);
          _priceId = firstOpen.isEmpty ? null : firstOpen.first.price.id;
          _qty = 1;
        }
        _clampQty();
      });
    } catch (e) {
      if (mounted && _showId == showId) setState(() => _optionsError = e);
    } finally {
      if (mounted && _showId == showId) setState(() => _loadingOptions = false);
    }
  }

  _Option? get _selected {
    final match = _options?.where((o) => o.price.id == _priceId);
    return (match == null || match.isEmpty) ? null : match.first;
  }

  void _clampQty() {
    final slots = _selected?.price.availableSlots;
    if (slots != null && slots > 0 && _qty > slots) _qty = slots;
    if (_qty < 1) _qty = 1;
  }

  Future<void> _sell() async {
    final option = _selected;
    final show = _shows?.firstWhere((s) => s.id == _showId);
    if (option == null || show == null || _selling) return;
    final scope = AppScope.of(context);
    setState(() {
      _selling = true;
      _saleError = null;
    });
    try {
      final sale = await scope.api.sellWalkIn(
        priceId: option.price.id,
        quantity: _qty,
        clientRequestId: _attempt.idFor(priceId: option.price.id, quantity: _qty),
      );
      _attempt.settled();
      HapticFeedback.mediumImpact();
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          fullscreenDialog: true,
          builder: (_) => SaleConfirmationScreen(
            sale: sale,
            showName: show.name,
            showStart: show.scheduledStart,
            tierName: option.tier.name,
            priceName: option.subtitle,
          ),
        ),
      );
      if (!mounted) return;
      setState(() => _qty = 1);
      _selectShow(show.id);
    } catch (e) {
      HapticFeedback.heavyImpact();
      // Mất mạng: giữ mã để lần bấm sau (cùng loại vé, cùng số lượng) là gửi lại, không phải lượt bán mới.
      if (e is! NetworkException) _attempt.settled();
      if (e is ApiException && e.status == 403) scope.session.reportVenueAccessDenied();
      if (mounted) setState(() => _saleError = e);
    } finally {
      if (mounted) setState(() => _selling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_showsError != null) {
      final d = describeError(_showsError!, action: 'Việc tải buổi diễn');
      return _Padded(
        child: NoticePanel(
          tone: d.tone,
          title: 'Chưa tải được buổi diễn',
          body: d.body ?? d.title,
          action: ActionButton(kind: ButtonKind.quiet, height: 44, label: 'Tải lại', onPressed: _loadShows),
        ),
      );
    }
    if (_shows == null) return const LoadingBlock(label: 'Đang tải buổi diễn…');
    if (_shows!.isEmpty) {
      return _Padded(
        child: NoticePanel(
          tone: Tone.neutral,
          title: 'Chưa có buổi diễn nào bán vé tại quầy',
          body: 'Chỉ bán được vé cho buổi diễn đã công bố hoặc đang diễn ra, có khán giả tại phòng trà.',
          action: ActionButton(kind: ButtonKind.quiet, height: 44, label: 'Tải lại', onPressed: _loadShows),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, c) {
        final twoPane = c.maxWidth >= Breakpoints.twoPane;
        final picker = RefreshIndicator(
          onRefresh: _loadShows,
          child: ListView(
            padding: EdgeInsets.fromLTRB(20, 18, 20, twoPane ? 32 : 20),
            children: [
              const SectionLabel('Buổi diễn'),
              const SizedBox(height: 10),
              _ShowStrip(shows: _shows!, selectedId: _showId, onSelect: _selectShow),
              const SizedBox(height: 26),
              const SectionLabel('Hạng vé vào cửa'),
              const SizedBox(height: 10),
              _buildOptions(c.maxWidth, twoPane),
              if (!twoPane) ...[const SizedBox(height: 22), _buildQuantity()],
            ],
          ),
        );
        if (!twoPane) {
          return Column(
            children: [
              Expanded(child: picker),
              _CheckoutBar(child: _buildCheckout(compact: true)),
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: picker),
            Container(
              width: 380,
              decoration: BoxDecoration(
                color: context.palette.surface,
                border: Border(left: BorderSide(color: context.palette.line)),
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SectionLabel('Đơn bán'),
                    const SizedBox(height: 12),
                    _buildQuantity(),
                    const SizedBox(height: 20),
                    _buildCheckout(compact: false),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildOptions(double width, bool twoPane) {
    final p = context.palette;
    if (_optionsError != null) {
      final d = describeError(_optionsError!, action: 'Việc tải hạng vé');
      return NoticePanel(
        tone: d.tone,
        title: 'Chưa tải được hạng vé',
        body: d.body ?? d.title,
        action: ActionButton(
          kind: ButtonKind.quiet,
          height: 44,
          label: 'Tải lại',
          onPressed: () => _selectShow(_showId!),
        ),
      );
    }
    if (_loadingOptions && _options == null) return const LoadingBlock(label: 'Đang tải hạng vé…');
    if (_options!.isEmpty) {
      return const NoticePanel(
        tone: Tone.neutral,
        title: 'Buổi diễn này không có hạng vé bán tại quầy',
        body: 'Các đợt giá hiện có chỉ bán online hoặc là vé xem livestream.',
      );
    }
    final paneWidth = twoPane ? width - 380 : width;
    final columns = paneWidth >= 760 ? 3 : 2;
    return LayoutBuilder(
      builder: (context, c) {
        const gap = 12.0;
        final cardWidth = (c.maxWidth - gap * (columns - 1)) / columns;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [
            for (final o in _options!)
              SizedBox(
                width: columns == 2 && c.maxWidth < 300 ? c.maxWidth : cardWidth,
                child: _OptionCard(
                  option: o,
                  selected: o.price.id == _priceId,
                  onTap: o.enabled
                      ? () => setState(() {
                          HapticFeedback.selectionClick();
                          _priceId = o.price.id;
                          _saleError = null;
                          _clampQty();
                        })
                      : null,
                  palette: p,
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildQuantity() {
    final p = context.palette;
    final slots = _selected?.price.availableSlots;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
      decoration: BoxDecoration(
        color: p.surfaceHigh,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: p.line),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        runSpacing: 8,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Số lượng', style: Txt.title(18).copyWith(color: p.ink)),
              Text('Tối đa theo số chỗ còn lại', style: Txt.body(13).copyWith(color: p.inkMuted)),
            ],
          ),
          QuantityStepper(
            value: _qty,
            max: (slots != null && slots > 0) ? slots : null,
            onChanged: _selected == null ? (_) {} : (v) => setState(() => _qty = v),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckout({required bool compact}) {
    final p = context.palette;
    final o = _selected;
    final total = o == null ? 0.0 : o.price.price * _qty;
    final err = _saleError;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (err != null) ...[_SaleErrorPanel(error: err, onRetry: _selling ? null : _sell), const SizedBox(height: 12)],
        if (!compact && o != null) ...[
          Text(o.tier.name, style: Txt.title(20).copyWith(color: p.ink)),
          if (o.subtitle.isNotEmpty) Text(o.subtitle, style: Txt.body(14).copyWith(color: p.inkMuted)),
          const SizedBox(height: 10),
          Row(
            children: [Text('$_qty × ${vnd(o.price.price)}', style: Txt.body(15).copyWith(color: p.inkMuted))],
          ),
          const SizedBox(height: 14),
          Divider(color: p.line),
          const SizedBox(height: 10),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    compact && o != null ? '$_qty × ${o.tier.name}' : 'Tổng thu',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Txt.body(13.5).copyWith(color: p.inkMuted),
                  ),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      vnd(total),
                      style: Txt.display(
                        compact ? 28 : 34,
                      ).copyWith(color: p.ink, fontFeatures: const [FontFeature.tabularFigures()]),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ActionButton(
          label: _selling ? 'Đang ghi nhận…' : 'Thu tiền mặt · bán ${_qty > 1 ? '$_qty vé' : 'vé'}',
          busy: _selling,
          onPressed: o == null ? null : _sell,
        ),
      ],
    );
  }
}

class _Padded extends StatelessWidget {
  const _Padded({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.all(20),
    child: Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 560), child: child),
    ),
  );
}

class _CheckoutBar extends StatelessWidget {
  const _CheckoutBar({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        border: Border(top: BorderSide(color: p.line)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
      child: child,
    );
  }
}

class _ShowStrip extends StatelessWidget {
  const _ShowStrip({required this.shows, required this.selectedId, required this.onSelect});
  final List<Show> shows;
  final int? selectedId;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    return SizedBox(
      height: 104 * textScale.clamp(1.0, 1.35),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: shows.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, i) {
          final s = shows[i];
          final selected = s.id == selectedId;
          return SizedBox(
            width: 250,
            child: Material(
              color: p.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Radii.card),
                side: BorderSide(color: selected ? p.accent : p.line, width: selected ? 2 : 1),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(Radii.card),
                onTap: () => onSelect(s.id),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          StatusPill(
                            s.isOngoing ? 'Đang diễn' : 'Sắp diễn',
                            tone: s.isOngoing ? Tone.ok : Tone.neutral,
                            dense: true,
                          ),
                          const Spacer(),
                          Text(vnTime(s.scheduledStart), style: Txt.mono(13, weight: 700).copyWith(color: p.accent)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: Text(
                          s.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Txt.body(15, weight: 700, height: 1.3).copyWith(color: p.ink),
                        ),
                      ),
                      Text(vnDate(s.scheduledStart), style: Txt.body(12.5).copyWith(color: p.inkMuted)),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  const _OptionCard({required this.option, required this.selected, required this.onTap, required this.palette});
  final _Option option;
  final bool selected;
  final VoidCallback? onTap;
  final StaffPalette palette;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    final fg = selected ? p.onAction : p.ink;
    final muted = selected ? p.onAction.withValues(alpha: 0.72) : p.inkMuted;
    return Semantics(
      selected: selected,
      enabled: option.enabled,
      button: true,
      child: Opacity(
        opacity: option.enabled ? 1 : 0.55,
        child: Material(
          color: selected ? p.action : p.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Radii.card),
            side: BorderSide(color: selected ? p.action : p.line),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(Radii.card),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.tier.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Txt.title(17).copyWith(color: fg),
                  ),
                  if (option.subtitle.isNotEmpty)
                    Text(
                      option.subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Txt.body(12.5).copyWith(color: muted),
                    ),
                  const SizedBox(height: 10),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      vnd(option.price.price),
                      style: Txt.title(20, weight: 750).copyWith(color: selected ? p.onAction : p.accent),
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (option.disabledReason != null)
                    StatusPill(option.disabledReason!, tone: Tone.danger, dense: true)
                  else
                    Text(
                      option.price.availableSlots == null
                          ? 'Không giới hạn số lượng'
                          : 'Còn ${option.price.availableSlots} chỗ',
                      style: Txt.body(12.5, weight: 600).copyWith(color: muted),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SaleErrorPanel extends StatelessWidget {
  const _SaleErrorPanel({required this.error, required this.onRetry});
  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final e = error;
    if (e is NetworkException && e.state == SendState.unknown) {
      return NoticePanel(
        tone: Tone.danger,
        title: 'Không rõ vé đã được bán hay chưa',
        body:
            'Mạng mất khi máy chủ đang xử lý. Đừng thu thêm tiền và đừng đổi loại vé hay số lượng. '
            'Khi có mạng, bấm "Gửi lại lượt bán này": nếu lần trước đã ghi nhận, hệ thống trả lại đúng vé và mã QR cũ, '
            'không bán thêm.',
        action: ActionButton(kind: ButtonKind.quiet, height: 44, label: 'Gửi lại lượt bán này', onPressed: onRetry),
      );
    }
    if (e is NetworkException) {
      return const NoticePanel(
        tone: Tone.danger,
        title: 'Chưa bán được — không có kết nối',
        body: 'Yêu cầu chưa tới máy chủ, chưa có vé nào được tạo. Đừng thu tiền cho tới khi bán thành công.',
      );
    }
    final d = describeError(e, action: 'Việc bán vé');
    return NoticePanel(tone: d.tone, title: 'Chưa bán được', body: d.title);
  }
}
