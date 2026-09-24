import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/scope.dart';
import '../../app/theme.dart';
import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../widgets/common.dart';

/// Nhân viên gọi món hộ khách tại bàn. Đơn tạo từ app nhân viên luôn là tiền mặt
/// (backend: PaymentMethod phải là 'Cash' khi tạo đơn; trả online do khách tự làm trong app của họ).
class TakeOrderScreen extends StatefulWidget {
  const TakeOrderScreen({super.key});

  @override
  State<TakeOrderScreen> createState() => _TakeOrderScreenState();
}

class _TakeOrderScreenState extends State<TakeOrderScreen> {
  final _table = TextEditingController();
  final _note = TextEditingController();
  final _tableFocus = FocusNode();

  List<FnbMenu>? _menus;
  final Map<int, List<FnbMenuItem>> _items = {};
  Object? _loadError;
  int _menuIndex = 0;
  Show? _ongoing;

  final Map<int, int> _cart = {};
  bool _sending = false;
  Object? _sendError;
  bool _tableMissing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _table.dispose();
    _note.dispose();
    _tableFocus.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final scope = AppScope.of(context);
    final loungeId = scope.session.loungeId;
    setState(() {
      _loadError = null;
      _menus = null;
    });
    try {
      final menus = await scope.api.menus(loungeId);
      final lists = await Future.wait(menus.map((m) => scope.api.menuItems(m.id)));
      Show? ongoing;
      try {
        final shows = await scope.api.shows(loungeId);
        final on = shows.where((s) => s.isOngoing && s.hasFloor);
        ongoing = on.isEmpty ? null : on.first;
      } catch (_) {
        // Không gắn được buổi diễn thì đơn vẫn tạo được (ShowId không bắt buộc).
      }
      if (!mounted) return;
      setState(() {
        _menus = menus;
        for (var i = 0; i < menus.length; i++) {
          _items[menus[i].id] = lists[i].where((it) => it.isAvailable).toList();
        }
        _ongoing = ongoing;
      });
    } catch (e) {
      if (mounted) setState(() => _loadError = e);
    }
  }

  List<FnbMenuItem> get _allItems => [for (final l in _items.values) ...l];

  FnbMenuItem? _item(int id) {
    for (final it in _allItems) {
      if (it.id == id) return it;
    }
    return null;
  }

  int get _count => _cart.values.fold(0, (a, b) => a + b);

  double get _total => _cart.entries.fold(0.0, (sum, e) => sum + (_item(e.key)?.price ?? 0) * e.value);

  void _setQty(int itemId, int qty) {
    HapticFeedback.selectionClick();
    setState(() {
      if (qty <= 0) {
        _cart.remove(itemId);
      } else {
        _cart[itemId] = qty;
      }
      _sendError = null;
    });
  }

  /// Trả về đơn vừa tạo; người gọi tự đóng tấm kiểm tra (nếu có) rồi đóng màn gọi món.
  /// [onChange] làm mới tấm kiểm tra đang mở — tấm này nằm trên route riêng, setState của màn không tới được.
  Future<({int id, String table})?> _send({VoidCallback? onChange}) async {
    if (_sending || _cart.isEmpty) return null;
    final table = _table.text.trim();
    if (table.isEmpty) {
      setState(() => _tableMissing = true);
      _tableFocus.requestFocus();
      return null;
    }
    final scope = AppScope.of(context);
    setState(() {
      _sending = true;
      _sendError = null;
    });
    onChange?.call();
    try {
      final id = await scope.api.createOrder(
        loungeId: scope.session.loungeId,
        showId: _ongoing?.id,
        tableNote: table,
        note: _note.text,
        items: [for (final e in _cart.entries) (menuItemId: e.key, quantity: e.value, note: null)],
      );
      HapticFeedback.mediumImpact();
      // Đơn đã ghi: xoá giỏ ngay để không thể bấm gửi lần nữa.
      _cart.clear();
      return (id: id, table: table);
    } catch (e) {
      HapticFeedback.heavyImpact();
      if (e is ApiException && e.status == 403) scope.session.reportVenueAccessDenied();
      if (mounted) setState(() => _sendError = e);
      return null;
    } finally {
      if (mounted) {
        setState(() => _sending = false);
        onChange?.call();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: p.ground,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          tooltip: 'Đóng',
          icon: Icon(Icons.close_rounded, color: p.ink),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        titleSpacing: 0,
        title: Text('Gọi món cho bàn', style: Txt.display(22).copyWith(color: p.ink)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Divider(color: p.line),
        ),
      ),
      body: SafeArea(top: false, child: _body(context)),
    );
  }

  Widget _body(BuildContext context) {
    if (_loadError != null) {
      final d = describeError(_loadError!, action: 'Việc tải thực đơn');
      return Padding(
        padding: const EdgeInsets.all(20),
        child: NoticePanel(
          tone: d.tone,
          title: 'Chưa tải được thực đơn',
          body: d.body ?? d.title,
          action: ActionButton(kind: ButtonKind.quiet, height: 44, label: 'Tải lại', onPressed: _load),
        ),
      );
    }
    if (_menus == null) return const LoadingBlock(label: 'Đang tải thực đơn…');
    if (_menus!.isEmpty || _allItems.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(20),
        child: NoticePanel(
          tone: Tone.neutral,
          title: 'Phòng trà chưa có món nào đang bán',
          body: 'Chủ phòng trà cần bật thực đơn và món trên trang quản lý.',
        ),
      );
    }
    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth >= Breakpoints.twoPane;
        final menu = _MenuList(
          menus: _menus!,
          items: _items,
          index: _menuIndex,
          onMenu: (i) => setState(() => _menuIndex = i),
          cart: _cart,
          onQty: _setQty,
          header: wide ? null : _tableField(),
        );
        if (!wide) {
          return Column(
            children: [
              Expanded(child: menu),
              _CartBar(
                count: _count,
                total: _total,
                sending: _sending,
                onReview: _cart.isEmpty ? null : () => _openReview(context),
              ),
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: menu),
            Container(
              width: 380,
              decoration: BoxDecoration(
                color: context.palette.surface,
                border: Border(left: BorderSide(color: context.palette.line)),
              ),
              child: _review(context, inSheet: false),
            ),
          ],
        );
      },
    );
  }

  Widget _tableField() {
    final p = context.palette;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _table,
          focusNode: _tableFocus,
          textInputAction: TextInputAction.done,
          textCapitalization: TextCapitalization.sentences,
          style: Txt.title(20).copyWith(color: p.ink),
          onChanged: (_) {
            if (_tableMissing) setState(() => _tableMissing = false);
          },
          decoration: InputDecoration(
            labelText: 'Bàn / khu vực',
            hintText: 'vd. Bàn 5, Quầy bar',
            errorText: _tableMissing ? 'Ghi số bàn để quầy bar mang món ra đúng chỗ.' : null,
          ),
        ),
        if (_ongoing != null) ...[
          const SizedBox(height: 8),
          Text('Gắn với buổi diễn đang diễn ra: ${_ongoing!.name}', style: Txt.body(13).copyWith(color: p.inkMuted)),
        ],
      ],
    );
  }

  Future<void> _openReview(BuildContext context) async {
    final p = context.palette;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: p.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.sheet))),
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheet) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(sheetContext).bottom),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(sheetContext).height * 0.9),
              child: _review(sheetContext, inSheet: true, refresh: () => setSheet(() {})),
            ),
          );
        },
      ),
    );
    if (mounted) setState(() {});
  }

  Widget _review(BuildContext context, {required bool inSheet, VoidCallback? refresh}) {
    final p = context.palette;
    final lines = _cart.entries.map((e) => (item: _item(e.key), qty: e.value)).where((l) => l.item != null).toList();
    void qty(int id, int v) {
      _setQty(id, v);
      refresh?.call();
      if (inSheet && _cart.isEmpty) Navigator.of(context).pop();
    }

    return ListenableBuilder(
      listenable: Listenable.merge([_table, _note]),
      builder: (context, _) => SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!inSheet) ...[_tableField(), const SizedBox(height: 20)],
            if (inSheet) ...[
              Text('Kiểm tra order', style: Txt.display(24).copyWith(color: p.ink)),
              const SizedBox(height: 4),
              Text(
                _table.text.trim().isEmpty ? 'Chưa ghi bàn' : _table.text.trim(),
                style: Txt.title(17).copyWith(color: _table.text.trim().isEmpty ? p.danger : p.accent),
              ),
              const SizedBox(height: 16),
            ],
            const SectionLabel('Món đã chọn'),
            const SizedBox(height: 8),
            if (lines.isEmpty)
              Text('Chưa chọn món nào.', style: Txt.body(14).copyWith(color: p.inkMuted))
            else
              for (final l in lines)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(l.item!.name, style: Txt.body(15, weight: 700).copyWith(color: p.ink)),
                            Text(vnd(l.item!.price * l.qty), style: Txt.body(13).copyWith(color: p.inkMuted)),
                          ],
                        ),
                      ),
                      QuantityStepper(compact: true, min: 0, value: l.qty, onChanged: (v) => qty(l.item!.id, v)),
                    ],
                  ),
                ),
            const SizedBox(height: 8),
            TextField(
              controller: _note,
              maxLines: 2,
              minLines: 1,
              textCapitalization: TextCapitalization.sentences,
              style: Txt.body(15).copyWith(color: p.ink),
              decoration: const InputDecoration(
                labelText: 'Ghi chú cho quầy bar',
                hintText: 'vd. ít đá, mang ra sau tiết mục đầu',
              ),
            ),
            const SizedBox(height: 16),
            Divider(color: p.line),
            const SizedBox(height: 10),
            Row(
              children: [
                Text('Tổng · thu tiền mặt', style: Txt.body(14).copyWith(color: p.inkMuted)),
                const Spacer(),
                Text(vnd(_total), style: Txt.display(26).copyWith(color: p.ink)),
              ],
            ),
            if (_sendError != null) ...[const SizedBox(height: 12), _SendError(error: _sendError!)],
            const SizedBox(height: 14),
            ActionButton(
              label: _sending ? 'Đang gửi…' : 'Gửi order',
              busy: _sending,
              onPressed: _cart.isEmpty
                  ? null
                  : () async {
                      if (inSheet && _table.text.trim().isEmpty) {
                        Navigator.of(context).pop();
                        setState(() => _tableMissing = true);
                        _tableFocus.requestFocus();
                        return;
                      }
                      final sheetNavigator = Navigator.of(context);
                      final screenNavigator = Navigator.of(this.context);
                      final created = await _send(onChange: refresh);
                      if (created == null) return;
                      if (inSheet) sheetNavigator.pop();
                      screenNavigator.pop(created);
                    },
            ),
          ],
        ),
      ),
    );
  }
}

class _SendError extends StatelessWidget {
  const _SendError({required this.error});
  final Object error;

  @override
  Widget build(BuildContext context) {
    final e = error;
    if (e is NetworkException && e.state == SendState.unknown) {
      return const NoticePanel(
        tone: Tone.danger,
        title: 'Không rõ order đã gửi được chưa',
        body: 'Mạng mất khi máy chủ đang xử lý. Xem bảng order trước khi gửi lại để tránh làm món hai lần.',
      );
    }
    final d = describeError(e, action: 'Order');
    return NoticePanel(tone: d.tone, title: 'Chưa gửi được order', body: d.body ?? d.title);
  }
}

class _MenuList extends StatelessWidget {
  const _MenuList({
    required this.menus,
    required this.items,
    required this.index,
    required this.onMenu,
    required this.cart,
    required this.onQty,
    this.header,
  });

  final List<FnbMenu> menus;
  final Map<int, List<FnbMenuItem>> items;
  final int index;
  final ValueChanged<int> onMenu;
  final Map<int, int> cart;
  final void Function(int itemId, int qty) onQty;
  final Widget? header;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final menu = menus[index.clamp(0, menus.length - 1)];
    final list = items[menu.id] ?? const [];
    final groups = <String, List<FnbMenuItem>>{};
    for (final it in list) {
      groups.putIfAbsent(it.category.isEmpty ? 'Khác' : it.category, () => []).add(it);
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      children: [
        if (header != null) ...[header!, const SizedBox(height: 18)],
        if (menus.length > 1) ...[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (var i = 0; i < menus.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(menus[i].name),
                      selected: i == index,
                      onSelected: (_) => onMenu(i),
                      showCheckmark: false,
                      labelStyle: Txt.body(14, weight: 700).copyWith(color: i == index ? p.onAction : p.ink),
                      selectedColor: p.action,
                      backgroundColor: p.surfaceHigh,
                      side: BorderSide(color: i == index ? p.action : p.line),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.control)),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        if (list.isEmpty) Text('Thực đơn này chưa có món đang bán.', style: Txt.body(14).copyWith(color: p.inkMuted)),
        for (final g in groups.entries) ...[
          SectionLabel(g.key),
          const SizedBox(height: 6),
          for (final it in g.value) _ItemRow(item: it, qty: cart[it.id] ?? 0, onQty: (v) => onQty(it.id, v)),
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item, required this.qty, required this.onQty});
  final FnbMenuItem item;
  final int qty;
  final ValueChanged<int> onQty;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: p.line)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: Txt.body(16, weight: 700).copyWith(color: p.ink)),
                if (item.description != null && item.description!.trim().isNotEmpty)
                  Text(
                    item.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Txt.body(13).copyWith(color: p.inkMuted),
                  ),
                const SizedBox(height: 4),
                Text(vnd(item.price), style: Txt.mono(14, weight: 700).copyWith(color: p.accent)),
              ],
            ),
          ),
          const SizedBox(width: 10),
          qty == 0
              ? Material(
                  color: p.surfaceHigh,
                  borderRadius: BorderRadius.circular(Radii.control),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(Radii.control),
                    onTap: () => onQty(1),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add_rounded, size: 18, color: p.ink),
                          const SizedBox(width: 4),
                          Text('Thêm', style: Txt.body(14, weight: 750).copyWith(color: p.ink)),
                        ],
                      ),
                    ),
                  ),
                )
              : QuantityStepper(compact: true, min: 0, value: qty, onChanged: onQty),
        ],
      ),
    );
  }
}

class _CartBar extends StatelessWidget {
  const _CartBar({required this.count, required this.total, required this.sending, required this.onReview});
  final int count;
  final double total;
  final bool sending;
  final VoidCallback? onReview;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        border: Border(top: BorderSide(color: p.line)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(count == 0 ? 'Chưa chọn món' : '$count món', style: Txt.body(13.5).copyWith(color: p.inkMuted)),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(vnd(total), style: Txt.display(24).copyWith(color: p.ink)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 170,
            child: ActionButton(label: 'Kiểm tra & gửi', busy: sending, onPressed: onReview),
          ),
        ],
      ),
    );
  }
}
