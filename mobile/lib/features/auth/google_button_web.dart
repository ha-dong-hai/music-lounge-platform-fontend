import 'package:flutter/widgets.dart';
import 'package:google_sign_in_web/web_only.dart' as web;

/// Google bắt buộc dùng nút của chính Google trên web (không đổi được chữ hay màu ngoài các biến thể có sẵn).
/// Chọn biến thể gần nhất với giao diện app: nền đen cho giao diện tối, viền cho giao diện sáng.
Widget googleRenderedButton({required bool night, required double width}) => web.renderButton(
  configuration: web.GSIButtonConfiguration(
    theme: night ? web.GSIButtonTheme.filledBlack : web.GSIButtonTheme.outline,
    size: web.GSIButtonSize.large,
    text: web.GSIButtonText.signinWith,
    shape: web.GSIButtonShape.rectangular,
    // Giới hạn của Google: tối đa 400px.
    minimumWidth: width.clamp(200, 400).toDouble(),
    locale: 'vi',
  ),
);
