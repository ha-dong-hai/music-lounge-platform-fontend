import 'package:flutter/material.dart';

import '../../app/scope.dart';
import '../../app/theme.dart';
import '../../widgets/common.dart';
import '../../widgets/glyphs.dart';
import '../checkin/checkin_screen.dart';
import '../fnb/order_board_screen.dart';
import '../sell/sell_screen.dart';

class _Tab {
  const _Tab(this.glyph, this.label, this.title);
  final StaffGlyph glyph;
  final String label;
  final String title;
}

const _tabs = [
  _Tab(StaffGlyph.ticket, 'Bán vé', 'Bán vé tại quầy'),
  _Tab(StaffGlyph.scan, 'Soát vé', 'Soát vé ở cửa'),
  _Tab(StaffGlyph.teacup, 'Gọi món', 'Order đồ uống'),
];

/// Khung ca làm: điện thoại dùng thanh tab dưới (như bản Stitch), máy tính bảng/ngang dùng thanh dọc bên trái.
class StaffShell extends StatefulWidget {
  const StaffShell({super.key});

  @override
  State<StaffShell> createState() => _StaffShellState();
}

class _StaffShellState extends State<StaffShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadVenueName());
  }

  Future<void> _loadVenueName() async {
    final scope = AppScope.of(context);
    try {
      scope.session.setVenueName(await scope.api.loungeName(scope.session.loungeId));
    } catch (_) {
      // Tên phòng trà chỉ để hiển thị; thiếu thì vẫn làm việc được.
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final screens = [const SellScreen(), CheckInScreen(active: _index == 1), OrderBoardScreen(active: _index == 2)];
    final body = IndexedStack(index: _index, children: screens);

    return LayoutBuilder(
      builder: (context, c) {
        final rail = c.maxWidth >= Breakpoints.rail;
        final content = Column(
          children: [
            _TopBar(title: _tabs[_index].title, showAccount: !rail),
            const _OfflineBanner(),
            Expanded(child: body),
          ],
        );
        if (!rail) {
          return Scaffold(
            body: SafeArea(bottom: false, child: content),
            bottomNavigationBar: _BottomBar(index: _index, onSelect: (i) => setState(() => _index = i)),
          );
        }
        return Scaffold(
          body: Row(
            children: [
              _SideRail(index: _index, onSelect: (i) => setState(() => _index = i)),
              VerticalDivider(width: 1, color: p.line),
              Expanded(child: SafeArea(left: false, child: content)),
            ],
          ),
        );
      },
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.title, required this.showAccount});
  final String title;
  final bool showAccount;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final session = AppScope.of(context).session;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 12, 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: p.line)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ListenableBuilder(
                  listenable: session,
                  builder: (context, _) => Text(
                    (session.venueName ?? 'Phòng trà #${session.loungeId}').toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Txt.label(size: 11).copyWith(color: p.accent),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Txt.display(24).copyWith(color: p.ink),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const ConnectionPill(),
          if (showAccount) ...[const SizedBox(width: 6), const AccountButton()],
        ],
      ),
    );
  }
}

class ConnectionPill extends StatelessWidget {
  const ConnectionPill({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final monitor = AppScope.of(context).connection;
    // Màn hẹp (≤ 380px): chỉ còn chấm màu để tiêu đề màn không bị cắt.
    final narrow = MediaQuery.sizeOf(context).width <= 380;
    return ListenableBuilder(
      listenable: monitor,
      builder: (context, _) {
        final (color, text) = switch (monitor.online) {
          true => (p.ok, 'Trực tuyến'),
          false => (p.danger, 'Mất kết nối'),
          null => (p.inkMuted, 'Đang kiểm tra'),
        };
        return Semantics(
          liveRegion: true,
          label: 'Kết nối máy chủ: $text',
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(color: p.surfaceHigh, borderRadius: BorderRadius.circular(99)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
                if (!narrow) ...[
                  const SizedBox(width: 7),
                  Text(text, style: Txt.body(12.5, weight: 700).copyWith(color: p.ink)),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final monitor = AppScope.of(context).connection;
    return ListenableBuilder(
      listenable: monitor,
      builder: (context, _) {
        if (monitor.online != false) return const SizedBox.shrink();
        return Material(
          color: p.dangerSoft,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 8, 10),
            child: Row(
              children: [
                Icon(Icons.wifi_off_rounded, color: p.danger, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Không liên lạc được máy chủ. Vé và order sẽ không được ghi cho tới khi có mạng lại.',
                    style: Txt.body(13.5, weight: 600).copyWith(color: p.ink),
                  ),
                ),
                TextButton(
                  onPressed: monitor.ping,
                  child: Text('Thử lại', style: Txt.body(14, weight: 750).copyWith(color: p.danger)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({required this.index, required this.onSelect});
  final int index;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        border: Border(top: BorderSide(color: p.line)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
          child: Row(
            children: [
              for (var i = 0; i < _tabs.length; i++)
                Expanded(
                  child: _NavItem(tab: _tabs[i], selected: i == index, onTap: () => onSelect(i)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.tab, required this.selected, required this.onTap, this.vertical = false});
  final _Tab tab;
  final bool selected;
  final VoidCallback onTap;
  final bool vertical;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final fg = selected ? p.onAction : p.inkMuted;
    return Semantics(
      selected: selected,
      button: true,
      label: tab.label,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Material(
          color: selected ? p.action : Colors.transparent,
          borderRadius: BorderRadius.circular(Radii.card),
          child: InkWell(
            borderRadius: BorderRadius.circular(Radii.card),
            onTap: onTap,
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: vertical ? 12 : 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GlyphIcon(tab.glyph, color: fg, size: 24),
                  const SizedBox(height: 4),
                  Text(
                    tab.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Txt.body(12.5, weight: selected ? 750 : 600).copyWith(color: selected ? fg : p.ink),
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

class _SideRail extends StatelessWidget {
  const _SideRail({required this.index, required this.onSelect});
  final int index;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      width: 104,
      color: p.surface,
      child: SafeArea(
        right: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            children: [
              Text('ML', style: Txt.display(22).copyWith(color: p.accent)),
              const SizedBox(height: 24),
              for (var i = 0; i < _tabs.length; i++) ...[
                SizedBox(
                  width: double.infinity,
                  child: _NavItem(tab: _tabs[i], selected: i == index, onTap: () => onSelect(i), vertical: true),
                ),
                const SizedBox(height: 8),
              ],
              const Spacer(),
              const AccountButton(),
            ],
          ),
        ),
      ),
    );
  }
}

class AccountButton extends StatelessWidget {
  const AccountButton({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final account = AppScope.of(context).session.account;
    return Tooltip(
      message: 'Tài khoản',
      child: Material(
        color: p.surfaceHigh,
        shape: CircleBorder(side: BorderSide(color: p.line)),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: () => _openAccount(context),
          child: SizedBox.square(
            dimension: 44,
            child: Center(
              child: Text(account?.initials ?? '?', style: Txt.body(14, weight: 800).copyWith(color: p.ink)),
            ),
          ),
        ),
      ),
    );
  }

  void _openAccount(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= Breakpoints.rail;
    const sheet = _AccountPanel();
    if (wide) {
      showDialog<void>(
        context: context,
        builder: (_) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.sheet)),
          backgroundColor: context.palette.surface,
          child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 420), child: sheet),
        ),
      );
    } else {
      showModalBottomSheet<void>(
        context: context,
        useSafeArea: true,
        backgroundColor: context.palette.surface,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.sheet))),
        builder: (_) => sheet,
      );
    }
  }
}

class _AccountPanel extends StatelessWidget {
  const _AccountPanel();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final session = AppScope.of(context).session;
    return ListenableBuilder(
      listenable: session,
      builder: (context, _) {
        final a = session.account;
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(22, 22, 22, 22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SectionLabel('Nhân viên · ${session.venueName ?? 'Phòng trà #${a?.loungeId ?? ''}'}', color: p.accent),
              const SizedBox(height: 8),
              Text(a?.fullName ?? '', style: Txt.display(26).copyWith(color: p.ink)),
              const SizedBox(height: 2),
              Text(a?.email ?? '', style: Txt.body(14.5).copyWith(color: p.inkMuted)),
              const SizedBox(height: 20),
              Divider(color: p.line),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                value: session.nightTheme,
                onChanged: session.setNightTheme,
                title: Text('Giao diện tối', style: Txt.body(15.5, weight: 700).copyWith(color: p.ink)),
                subtitle: Text(
                  'Dịu mắt khi làm việc trong phòng diễn tối đèn.',
                  style: Txt.body(13).copyWith(color: p.inkMuted),
                ),
              ),
              Divider(color: p.line),
              const SizedBox(height: 16),
              ActionButton(
                kind: ButtonKind.quiet,
                label: 'Đăng xuất',
                leading: const Icon(Icons.logout_rounded),
                onPressed: () {
                  Navigator.of(context).pop();
                  session.signOut();
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
