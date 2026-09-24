import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/scope.dart';
import '../../app/theme.dart';
import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';
import '../../widgets/ticket_shape.dart';
import 'take_order_screen.dart';

class _Column {
  const _Column(this.status, this.title, this.empty);
  final String status;
  final String title;
  final String empty;
}

/// Đơn đã thanh toán hoặc đã huỷ là đơn đã đóng — không nằm trên bảng.
const _columns = [
  _Column('Pending', 'Chờ làm', 'Không có đơn nào đang chờ.'),
  _Column('Preparing', 'Đang làm', 'Quầy bar đang trống việc.'),
  _Column('Served', 'Chờ thu tiền', 'Không có bàn nào chờ thanh toán.'),
];

/// Thứ tự cố định của backend: Pending → Preparing → Served → Paid. Mỗi đơn đúng một nút bước kế.
({String status, String label})? _nextStep(FnbOrder o) => switch (o.status) {
  'Pending' => (status: 'Preparing', label: 'Bắt đầu làm'),
  'Preparing' => (status: 'Served', label: 'Đã mang ra bàn'),
  'Served' => (status: 'Paid', label: o.isPaid ? 'Đóng đơn · đã trả online' : 'Đã thu tiền mặt'),
  _ => null,
};

class OrderBoardScreen extends StatefulWidget {
  const OrderBoardScreen({super.key, required this.active});

  final bool active;

  @override
  State<OrderBoardScreen> createState() => _OrderBoardScreenState();
}

class _OrderBoardScreenState extends State<OrderBoardScreen> {
  final Map<String, List<FnbOrder>> _orders = {};
  Object? _loadError;
  bool _loading = false;
  DateTime? _updatedAt;
  int _tab = 0;
  final Set<int> _busy = {};
  final Map<int, Object> _orderErrors = {};
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    if (widget.active) WidgetsBinding.instance.addPostFrameCallback((_) => _startPolling());
  }

  @override
  void didUpdateWidget(covariant OrderBoardScreen old) {
    super.didUpdateWidget(old);
    if (widget.active && !old.active) _startPolling();
    if (!widget.active && old.active) _poll?.cancel();
  }

  void _startPolling() {
    _load();
    _poll?.cancel();
    // Không có đẩy thời gian thực cho bảng này: tải lại định kỳ khi tab đang mở.
    _poll = Timer.periodic(const Duration(seconds: 20), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (_loading) return;
    final scope = AppScope.of(context);
    setState(() {
      _loading = true;
      if (!silent) _loadError = null;
    });
    try {
      final results = await Future.wait(_columns.map((c) => scope.api.orders(scope.session.loungeId, c.status)));
      if (!mounted) return;
      setState(() {
        for (var i = 0; i < _columns.length; i++) {
          _orders[_columns[i].status] = results[i];
        }
        _loadError = null;
        _updatedAt = DateTime.now();
      });
    } catch (e) {
      if (e is ApiException && e.status == 403) scope.session.reportVenueAccessDenied();
      if (mounted) setState(() => _loadError = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _advance(FnbOrder o) async {
    final step = _nextStep(o);
    if (step == null || _busy.contains(o.id)) return;
    await _setStatus(o, step.status);
  }

  Future<void> _cancel(FnbOrder o) async {
    final p = context.palette;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: p.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.sheet)),
        title: Text('Huỷ đơn #${o.id}?', style: Txt.title(22).copyWith(color: p.ink)),
        content: Text(
          [
            if (o.tableNote != null && o.tableNote!.isNotEmpty) '${o.tableNote} · ${vnd(o.totalAmount)}.',
            if (o.isPaid) 'Khách đã thanh toán online — hệ thống sẽ tự tạo yêu cầu hoàn tiền cho đơn này.',
            'Đơn đã huỷ không mở lại được.',
          ].join('\n'),
          style: Txt.body(15).copyWith(color: p.ink),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text('Giữ đơn', style: Txt.body(15, weight: 700).copyWith(color: p.ink)),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text('Huỷ đơn', style: Txt.body(15, weight: 750).copyWith(color: p.danger)),
          ),
        ],
      ),
    );
    if (ok == true) await _setStatus(o, 'Cancelled');
  }

  Future<void> _setStatus(FnbOrder o, String status) async {
    final scope = AppScope.of(context);
    setState(() {
      _busy.add(o.id);
      _orderErrors.remove(o.id);
    });
    try {
      await scope.api.setOrderStatus(o.id, status);
      HapticFeedback.lightImpact();
      if (!mounted) return;
      setState(() => _busy.remove(o.id));
      await _load(silent: true);
    } catch (e) {
      HapticFeedback.heavyImpact();
      if (!mounted) return;
      setState(() {
        _busy.remove(o.id);
        _orderErrors[o.id] = e;
      });
      // Đơn có thể đã đổi ở máy khác (khách huỷ, IPN VNPay...): làm mới để thấy đúng trạng thái.
      if (e is ApiException && (e.status == 409 || e.status == 422 || e.status == 404)) _load(silent: true);
    }
  }

  Future<void> _takeOrder() async {
    final result = await Navigator.of(context).push<({int id, String table})>(
      MaterialPageRoute(fullscreenDialog: true, builder: (_) => const TakeOrderScreen()),
    );
    if (result == null || !mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Đã gửi order #${result.id} cho ${result.table}.')));
    setState(() => _tab = 0);
    _load(silent: true);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth >= Breakpoints.twoPane;
        final loadedOnce = _updatedAt != null;
        final toolbar = Padding(
          padding: EdgeInsets.fromLTRB(20, 12, wide ? 20 : 12, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  _loadError != null && loadedOnce
                      ? 'Chưa làm mới được · dữ liệu lúc ${vnTime(_updatedAt!)}'
                      : loadedOnce
                      ? 'Cập nhật lúc ${vnTime(_updatedAt!)} · tự làm mới mỗi 20 giây'
                      : 'Đang tải đơn…',
                  maxLines: 2,
                  style: Txt.body(13).copyWith(color: _loadError != null && loadedOnce ? p.danger : p.inkMuted),
                ),
              ),
              IconButton(
                tooltip: 'Làm mới',
                onPressed: _loading ? null : () => _load(),
                icon: _loading
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2.2))
                    : Icon(Icons.refresh_rounded, color: p.ink),
              ),
              if (wide) ...[
                const SizedBox(width: 8),
                SizedBox(
                  width: 230,
                  child: ActionButton(
                    label: 'Gọi món cho bàn',
                    height: 48,
                    leading: const Icon(Icons.add_rounded),
                    onPressed: _takeOrder,
                  ),
                ),
              ],
            ],
          ),
        );

        if (!loadedOnce && _loadError != null) {
          final d = describeError(_loadError!, action: 'Việc tải đơn');
          return Column(
            children: [
              toolbar,
              Padding(
                padding: const EdgeInsets.all(20),
                child: NoticePanel(
                  tone: d.tone,
                  title: 'Chưa tải được đơn F&B',
                  body: d.body ?? d.title,
                  action: ActionButton(kind: ButtonKind.quiet, height: 44, label: 'Tải lại', onPressed: _load),
                ),
              ),
            ],
          );
        }
        if (!loadedOnce) {
          return Column(
            children: [
              toolbar,
              const Expanded(child: LoadingBlock(label: 'Đang tải đơn…')),
            ],
          );
        }

        if (wide) {
          return Column(
            children: [
              toolbar,
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (final col in _columns)
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: _BoardColumn(
                              column: col,
                              orders: _orders[col.status] ?? const [],
                              itemBuilder: _card,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          );
        }

        final col = _columns[_tab];
        final list = _orders[col.status] ?? const [];
        return Column(
          children: [
            toolbar,
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _Segments(
                index: _tab,
                counts: [for (final c in _columns) (_orders[c.status] ?? const []).length],
                onSelect: (i) => setState(() => _tab = i),
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _load,
                child: list.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(20),
                        children: [_EmptyColumn(text: col.empty)],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                        itemCount: list.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (_, i) => _card(list[i]),
                      ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                color: p.surface,
                border: Border(top: BorderSide(color: p.line)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
              child: ActionButton(
                label: 'Gọi món cho bàn',
                leading: const Icon(Icons.add_rounded),
                onPressed: _takeOrder,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _card(FnbOrder o) => _OrderChit(
    order: o,
    busy: _busy.contains(o.id),
    error: _orderErrors[o.id],
    onAdvance: () => _advance(o),
    onCancel: () => _cancel(o),
  );
}

class _Segments extends StatelessWidget {
  const _Segments({required this.index, required this.counts, required this.onSelect});
  final int index;
  final List<int> counts;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: p.surfaceHigh, borderRadius: BorderRadius.circular(Radii.card)),
      child: Row(
        children: [
          for (var i = 0; i < _columns.length; i++)
            Expanded(
              child: Semantics(
                selected: i == index,
                button: true,
                label: '${_columns[i].title}, ${counts[i]} đơn',
                child: Material(
                  color: i == index ? p.action : Colors.transparent,
                  borderRadius: BorderRadius.circular(Radii.card - 3),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(Radii.card - 3),
                    onTap: () => onSelect(i),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                      child: Column(
                        children: [
                          Text(
                            '${counts[i]}',
                            style: Txt.title(18, weight: 750).copyWith(color: i == index ? p.onAction : p.ink),
                          ),
                          Text(
                            _columns[i].title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Txt.body(12.5, weight: 700).copyWith(color: i == index ? p.onAction : p.inkMuted),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _BoardColumn extends StatelessWidget {
  const _BoardColumn({required this.column, required this.orders, required this.itemBuilder});
  final _Column column;
  final List<FnbOrder> orders;
  final Widget Function(FnbOrder) itemBuilder;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      decoration: BoxDecoration(
        color: p.surface.withValues(alpha: 0.5),
        border: Border.all(color: p.line),
        borderRadius: BorderRadius.circular(Radii.card),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 12),
            child: Row(
              children: [
                Expanded(
                  child: Text(column.title, style: Txt.title(18).copyWith(color: p.ink)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                  decoration: BoxDecoration(
                    border: Border.all(color: p.line),
                    borderRadius: BorderRadius.circular(Radii.control),
                  ),
                  child: Text('${orders.length}', style: Txt.mono(13, weight: 700).copyWith(color: p.ink)),
                ),
              ],
            ),
          ),
          Divider(color: p.line),
          Expanded(
            child: orders.isEmpty
                ? Align(
                    alignment: Alignment.topCenter,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: SizedBox(
                        width: double.infinity,
                        child: _EmptyColumn(text: column.empty),
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: orders.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => itemBuilder(orders[i]),
                  ),
          ),
        ],
      ),
    );
  }
}

class _EmptyColumn extends StatelessWidget {
  const _EmptyColumn({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: p.line),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: Txt.body(14).copyWith(color: p.inkMuted),
      ),
    );
  }
}

/// Phiếu order như phiếu in ở quầy bar: số đơn và dòng món in chữ mono, đường xé nét đứt trước phần tiền.
class _OrderChit extends StatelessWidget {
  const _OrderChit({
    required this.order,
    required this.busy,
    required this.error,
    required this.onAdvance,
    required this.onCancel,
  });

  final FnbOrder order;
  final bool busy;
  final Object? error;
  final VoidCallback onAdvance;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final o = order;
    final step = _nextStep(o);
    final now = DateTime.now();
    final live = o.onlinePaymentLiveUntil;
    final (payTone, payText) = o.isPaid
        ? (Tone.ok, 'Đã trả online')
        : (live != null && live.isAfter(now))
        ? (Tone.warn, 'Khách đang trả online · còn ${live.difference(now).inMinutes + 1} phút')
        : o.paymentMethod == 'Cash'
        ? (Tone.neutral, 'Tiền mặt')
        : (Tone.neutral, 'Chưa thanh toán');
    final err = error == null ? null : describeError(error!, action: 'Việc cập nhật đơn');

    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: p.line),
      ),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('#${o.id}', style: Txt.mono(19, weight: 800).copyWith(color: p.ink)),
                    const SizedBox(height: 2),
                    Text(
                      (o.tableNote == null || o.tableNote!.trim().isEmpty) ? 'Chưa ghi bàn' : o.tableNote!,
                      style: Txt.title(17).copyWith(color: p.accent),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(vnTime(o.createdAt), style: Txt.mono(13, weight: 700).copyWith(color: p.ink)),
                  Text(sinceShort(o.createdAt, now), style: Txt.body(12).copyWith(color: p.inkMuted)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              StatusPill(o.audienceUserId != null ? 'Khách tự gọi' : 'Nhân viên gọi', dense: true),
              StatusPill(payText, tone: payTone, dense: true),
            ],
          ),
          const SizedBox(height: 12),
          for (final line in o.items)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 34,
                    child: Text(
                      '${line.quantity}×',
                      style: Txt.mono(15, weight: 800).copyWith(color: line.cancelled ? p.inkMuted : p.ink),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          line.name,
                          style: Txt.mono(15, weight: 600).copyWith(
                            color: line.cancelled ? p.inkMuted : p.ink,
                            decoration: line.cancelled ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        if (line.note != null && line.note!.trim().isNotEmpty)
                          Text(
                            '– ${line.note}',
                            style: Txt.body(13).copyWith(color: p.inkMuted, fontStyle: FontStyle.italic),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          if (o.note != null && o.note!.trim().isNotEmpty) ...[
            const SizedBox(height: 2),
            Text('Ghi chú: ${o.note}', style: Txt.body(13.5, weight: 600).copyWith(color: p.warn)),
          ],
          const SizedBox(height: 10),
          PerforationRule(color: p.line),
          const SizedBox(height: 10),
          Row(
            children: [
              Text('Tổng', style: Txt.body(14).copyWith(color: p.inkMuted)),
              const Spacer(),
              Text(vnd(o.totalAmount), style: Txt.title(18, weight: 750).copyWith(color: p.ink)),
            ],
          ),
          if (err != null) ...[
            const SizedBox(height: 10),
            NoticePanel(tone: err.tone, title: err.title, body: err.body),
          ],
          const SizedBox(height: 12),
          if (step != null) ActionButton(label: step.label, height: 50, busy: busy, onPressed: onAdvance),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: busy ? null : onCancel,
              child: Text('Huỷ đơn', style: Txt.body(14, weight: 700).copyWith(color: p.danger)),
            ),
          ),
        ],
      ),
    );
  }
}
