import 'package:flutter/material.dart';

import '../../app/scope.dart';
import '../../app/theme.dart';
import '../../widgets/common.dart';

/// Tài khoản nhân viên không còn (hoặc chưa) được gán cho phòng trà nào — brief yêu cầu nói rõ,
/// không giả định quyền đã cấp là vĩnh viễn.
class NoVenueScreen extends StatelessWidget {
  const NoVenueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final session = AppScope.of(context).session;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SectionLabel('Không có phòng trà', color: p.danger),
                  const SizedBox(height: 10),
                  Text('Bạn không còn được phân công ở phòng trà nào', style: Txt.display(30).copyWith(color: p.ink)),
                  const SizedBox(height: 12),
                  Text(
                    'Tài khoản ${session.account?.email ?? ''} đang không nằm trong danh sách nhân viên của phòng trà nào. '
                    'Có thể chủ phòng trà đã gỡ bạn khỏi danh sách hoặc chưa thêm lại. Hãy liên hệ chủ phòng trà.',
                    style: Txt.body(15.5).copyWith(color: p.inkMuted),
                  ),
                  const SizedBox(height: 28),
                  ActionButton(label: 'Đăng xuất', onPressed: () => session.signOut()),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
