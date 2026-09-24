/// Địa chỉ API đổi được lúc build: flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5289
abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://musiclounge-api.azurewebsites.net',
  );

  /// Dự án Firebase mà backend dùng để xác minh token (Firebase:ProjectId = sign-in-52d07).
  /// Khoá API Firebase là cấu hình công khai phía client, không phải bí mật.
  static const firebaseApiKey = String.fromEnvironment(
    'FIREBASE_API_KEY',
    defaultValue: 'AIzaSyBQBdIyu_w_P43v_3AsthUfs8PSXEGnW30',
  );

  /// OAuth client loại Web của cùng dự án. Web dùng làm clientId; Android dùng làm serverClientId để
  /// Google phát ID token mà Firebase chấp nhận.
  static const googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '613416227665-8v9cu76sqoqmismobcdg9ibfgbu0a01j.apps.googleusercontent.com',
  );

  static Uri api(String path, [Map<String, String>? query]) {
    final base = Uri.parse(apiBaseUrl);
    return base.replace(path: '/api/v1$path', queryParameters: (query == null || query.isEmpty) ? null : query);
  }

  static Uri health() => Uri.parse(apiBaseUrl).replace(path: '/health');
}
