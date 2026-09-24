import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../app/scope.dart';
import '../../core/api_client.dart';
import '../../app/theme.dart';
import '../../widgets/common.dart';
import '../../widgets/glyphs.dart';
import 'google_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _form = GlobalKey<FormState>();
  bool _obscure = true;
  bool _busy = false;
  bool _googleBusy = false;
  bool _googleReady = false;
  Object? _error;
  StreamSubscription<GoogleSignInAuthenticationEvent>? _googleEvents;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _prepareGoogle());
  }

  @override
  void dispose() {
    _googleEvents?.cancel();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _prepareGoogle() async {
    if (!mounted) return;
    final google = AppScope.of(context).session.google;
    _googleEvents = google.events.listen(_onGoogleEvent, onError: _onGoogleError);
    try {
      await google.ensureReady();
      if (mounted) setState(() => _googleReady = true);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _onGoogleEvent(GoogleSignInAuthenticationEvent event) async {
    if (event is! GoogleSignInAuthenticationEventSignIn || _busy || !mounted) return;
    final session = AppScope.of(context).session;
    setState(() {
      _googleBusy = true;
      _error = null;
    });
    try {
      final token = await session.google.firebaseIdToken(event.user);
      await session.signInWithGoogle(token, googleEmail: event.user.email);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _googleBusy = false);
    }
  }

  void _onGoogleError(Object error) {
    if (!mounted) return;
    setState(() {
      _googleBusy = false;
      // Tự đóng hộp chọn tài khoản không phải lỗi.
      _error = _googleProblem(error);
    });
  }

  Future<void> _pickGoogleAccount() async {
    if (_busy || _googleBusy) return;
    setState(() => _error = null);
    try {
      await AppScope.of(context).session.google.pickAccount();
    } catch (_) {
      // Lỗi đã đi qua luồng sự kiện (_onGoogleError).
    }
  }

  Future<void> _submit() async {
    if (_busy || _googleBusy || !_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await AppScope.of(context).session.signIn(_email.text, _password.text);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final session = AppScope.of(context).session;
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, c) {
            final wide = c.maxWidth >= Breakpoints.twoPane;
            final form = _buildForm(context, session.notice);
            if (!wide) {
              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                child: Center(
                  child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 440), child: form),
                ),
              );
            }
            return Row(
              children: [
                Expanded(
                  child: Container(
                    color: p.surface,
                    padding: const EdgeInsets.symmetric(horizontal: 56, vertical: 48),
                    child: const _ShiftDuties(),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(40),
                      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 420), child: form),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildGoogle(BuildContext context) {
    final p = context.palette;
    final google = AppScope.of(context).session.google;
    if (_googleBusy) {
      return ActionButton(kind: ButtonKind.quiet, label: 'Đang xác nhận với Google…', busy: true, onPressed: null);
    }
    if (google.usesGoogleRenderedButton) {
      if (!_googleReady) return const SizedBox(height: 44);
      return LayoutBuilder(
        builder: (context, c) => Center(
          child: SizedBox(
            height: 44,
            child: googleRenderedButton(night: AppScope.of(context).session.nightTheme, width: c.maxWidth),
          ),
        ),
      );
    }
    return ActionButton(
      kind: ButtonKind.quiet,
      label: 'Đăng nhập bằng Google',
      leading: Text('G', style: Txt.title(18, weight: 800).copyWith(color: p.ink)),
      onPressed: _busy ? null : _pickGoogleAccount,
    );
  }

  Widget _buildForm(BuildContext context, String? notice) {
    final p = context.palette;
    final err = _error == null ? null : describeError(_error!, action: 'Yêu cầu đăng nhập');
    return Form(
      key: _form,
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _Wordmark(),
            const SizedBox(height: 40),
            // Một app cho hai vai (chủ dự án chốt 24/09): màn đăng nhập không được viết riêng cho nhân viên.
            Text('Đăng nhập', style: Txt.display(34).copyWith(color: p.ink)),
            const SizedBox(height: 8),
            Text(
              'Khán giả dùng tài khoản MusicLounge của mình. '
              'Nhân viên dùng tài khoản đã được chủ phòng trà thêm vào danh sách.',
              style: Txt.body(15).copyWith(color: p.inkMuted),
            ),
            const SizedBox(height: 28),
            if (notice != null) ...[NoticePanel(tone: Tone.warn, title: notice), const SizedBox(height: 16)],
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              textInputAction: TextInputAction.next,
              autocorrect: false,
              style: Txt.body(16, weight: 600).copyWith(color: p.ink),
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (v) => (v == null || !v.contains('@')) ? 'Nhập email đăng nhập.' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _password,
              obscureText: _obscure,
              autofillHints: const [AutofillHints.password],
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _submit(),
              style: Txt.body(16, weight: 600).copyWith(color: p.ink),
              decoration: InputDecoration(
                labelText: 'Mật khẩu',
                suffixIcon: IconButton(
                  tooltip: _obscure ? 'Hiện mật khẩu' : 'Ẩn mật khẩu',
                  onPressed: () => setState(() => _obscure = !_obscure),
                  icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: p.inkMuted),
                ),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Nhập mật khẩu.' : null,
            ),
            if (err != null) ...[
              const SizedBox(height: 16),
              NoticePanel(tone: err.tone, title: err.title, body: err.body),
            ],
            const SizedBox(height: 22),
            ActionButton(label: 'Đăng nhập', busy: _busy, onPressed: _submit),
            const SizedBox(height: 22),
            Row(
              children: [
                Expanded(child: Divider(color: p.line)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text('hoặc', style: Txt.body(13).copyWith(color: p.inkMuted)),
                ),
                Expanded(child: Divider(color: p.line)),
              ],
            ),
            const SizedBox(height: 22),
            _buildGoogle(context),
          ],
        ),
      ),
    );
  }
}

Object? _googleProblem(Object error) {
  if (error is GoogleSignInException) {
    return switch (error.code) {
      GoogleSignInExceptionCode.canceled || GoogleSignInExceptionCode.interrupted => null,
      GoogleSignInExceptionCode.clientConfigurationError || GoogleSignInExceptionCode.providerConfigurationError =>
        ApiException(0, 'Máy này chưa được cấu hình để đăng nhập Google. Tạm thời dùng email và mật khẩu.'),
      _ => ApiException(0, 'Không mở được đăng nhập Google. Thử lại, hoặc dùng email và mật khẩu.'),
    };
  }
  return error;
}

class _Wordmark extends StatelessWidget {
  const _Wordmark();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: p.action, borderRadius: BorderRadius.circular(Radii.control)),
          alignment: Alignment.center,
          child: GlyphIcon(StaffGlyph.ticket, color: p.onAction, size: 24),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('MusicLounge', style: Txt.title(19, weight: 750).copyWith(color: p.ink)),
            // Giữ ngắn: nằm trong Row không Expanded, chữ dài sẽ tràn ngang trên máy hẹp khi phóng chữ 1,35.
            Text('KHÁN GIẢ · NHÂN VIÊN', style: Txt.label(size: 10.5).copyWith(color: p.accent)),
          ],
        ),
      ],
    );
  }
}

class _ShiftDuties extends StatelessWidget {
  const _ShiftDuties();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    Widget row(StaffGlyph g, String title, String body) => Padding(
      padding: const EdgeInsets.only(bottom: 28),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GlyphIcon(g, color: p.accent, size: 30),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Txt.title(20).copyWith(color: p.ink)),
                const SizedBox(height: 4),
                Text(body, style: Txt.body(15).copyWith(color: p.inkMuted)),
              ],
            ),
          ),
        ],
      ),
    );
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionLabel('Trong một ca diễn', color: p.accent),
        const SizedBox(height: 24),
        row(StaffGlyph.ticket, 'Bán vé tại quầy', 'Thu tiền mặt, trao mã QR cho khách ngay tại chỗ.'),
        row(StaffGlyph.scan, 'Soát vé ở cửa', 'Quét mã, xem vé, rồi mới xác nhận cho khách vào.'),
        row(StaffGlyph.teacup, 'Order đồ uống', 'Nhận món cho bàn và đưa đơn đi hết các bước tới lúc thu tiền.'),
      ],
    );
  }
}
