import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import 'app/scope.dart';
import 'app/theme.dart';
import 'core/api_client.dart';
import 'core/google_auth.dart';
import 'core/session.dart';
import 'core/staff_api.dart';
import 'features/audience/audience_api.dart';
import 'features/audience/audience_shell.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/no_venue_screen.dart';
import 'features/shell/staff_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final client = http.Client();
  final connection = ConnectionMonitor(client)..start();
  // MỘT ApiClient cho cả hai vai: chung token, chung tự gia hạn, chung theo dõi mất mạng.
  final apiClient = ApiClient(client: client, monitor: connection);
  final session = SessionController(apiClient, GoogleAuth(client));
  session.restore();
  runApp(
    StaffApp(
      api: StaffApi(apiClient),
      audience: AudienceApi(apiClient),
      session: session,
      connection: connection,
    ),
  );
}

/// Tên lớp giữ từ app nhân viên gốc để phần gộp dễ đọc diff; app phục vụ cả khán giả lẫn nhân viên.
class StaffApp extends StatelessWidget {
  const StaffApp({
    super.key,
    required this.api,
    required this.audience,
    required this.session,
    required this.connection,
  });

  final StaffApi api;
  final AudienceApi audience;
  final SessionController session;
  final ConnectionMonitor connection;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      api: api,
      audience: audience,
      session: session,
      connection: connection,
      child: ListenableBuilder(
        listenable: session,
        builder: (context, _) {
          final night = session.nightTheme;
          final palette = night ? StaffPalette.night : StaffPalette.day;
          return AnnotatedRegion<SystemUiOverlayStyle>(
            value: night ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
            child: MaterialApp(
              title: 'MusicLounge',
              debugShowCheckedModeBanner: false,
              theme: buildTheme(palette, night ? Brightness.dark : Brightness.light),
              locale: const Locale('vi'),
              builder: (context, child) {
                // Cho phép phóng chữ theo cài đặt máy nhưng chặn ở 1.35 để số tiền và nút không vỡ dòng.
                final mq = MediaQuery.of(context);
                return MediaQuery(
                  data: mq.copyWith(textScaler: mq.textScaler.clamp(minScaleFactor: 0.9, maxScaleFactor: 1.35)),
                  child: child!,
                );
              },
              home: switch (session.phase) {
                SessionPhase.restoring => const _Splash(),
                SessionPhase.signedOut => const LoginScreen(),
                SessionPhase.noVenue => const NoVenueScreen(),
                SessionPhase.active => const StaffShell(),
                SessionPhase.audience => const AudienceShell(),
              },
            ),
          );
        },
      ),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: SizedBox.square(
        dimension: 28,
        child: CircularProgressIndicator(strokeWidth: 2.4, color: context.palette.accent),
      ),
    ),
  );
}
