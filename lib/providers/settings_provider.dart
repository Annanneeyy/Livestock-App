import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Available color themes for the app
enum AppColorTheme {
  green(
    name: 'Green',
    primary: Color(0xFF2E7D32),
    primaryLight: Color(0xFF4CAF50),
    primaryDark: Color(0xFF1B5E20),
  ),
  blue(
    name: 'Blue',
    primary: Color(0xFF1565C0),
    primaryLight: Color(0xFF42A5F5),
    primaryDark: Color(0xFF0D47A1),
  ),
  orange(
    name: 'Orange',
    primary: Color(0xFFE65100),
    primaryLight: Color(0xFFFF9800),
    primaryDark: Color(0xFFBF360C),
  ),
  purple(
    name: 'Purple',
    primary: Color(0xFF6A1B9A),
    primaryLight: Color(0xFFAB47BC),
    primaryDark: Color(0xFF4A148C),
  ),
  red(
    name: 'Red',
    primary: Color(0xFFC62828),
    primaryLight: Color(0xFFEF5350),
    primaryDark: Color(0xFFB71C1C),
  ),
  teal(
    name: 'Teal',
    primary: Color(0xFF00695C),
    primaryLight: Color(0xFF26A69A),
    primaryDark: Color(0xFF004D40),
  ),
  pink(
    name: 'Pink',
    primary: Color(0xFFAD1457),
    primaryLight: Color(0xFFEC407A),
    primaryDark: Color(0xFF880E4F),
  ),
  indigo(
    name: 'Indigo',
    primary: Color(0xFF283593),
    primaryLight: Color(0xFF5C6BC0),
    primaryDark: Color(0xFF1A237E),
  );

  final String name;
  final Color primary;
  final Color primaryLight;
  final Color primaryDark;

  const AppColorTheme({
    required this.name,
    required this.primary,
    required this.primaryLight,
    required this.primaryDark,
  });
}

/// SettingsProvider manages app-wide settings including theme, language, and notifications.
/// It persists settings using SharedPreferences and notifies listeners of changes.
class SettingsProvider extends ChangeNotifier {
  static const String _themeKey = 'isDarkMode';
  static const String _colorThemeKey = 'colorTheme';
  static const String _languageKey = 'language';
  static const String _notificationsKey = 'notificationsEnabled';

  bool _isDarkMode = false;
  AppColorTheme _colorTheme = AppColorTheme.green;
  String _language = 'English';
  bool _notificationsEnabled = true;
  bool _isInitialized = false;
  bool _isSigningUp = false;

  // Getters
  bool get isDarkMode => _isDarkMode;
  bool get isSigningUp => _isSigningUp;
  AppColorTheme get colorTheme => _colorTheme;
  String get language => _language;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get isInitialized => _isInitialized;

  // Available languages
  static const List<String> availableLanguages = [
    'English',
    'Filipino',
    'Bisaya'
  ];

  /// Initialize provider by loading saved settings from SharedPreferences
  Future<void> init() async {
    if (_isInitialized) return;

    final prefs = await SharedPreferences.getInstance();

    _isDarkMode = prefs.getBool(_themeKey) ?? false;

    // Load color theme
    final colorThemeName = prefs.getString(_colorThemeKey) ?? 'green';
    _colorTheme = AppColorTheme.values.firstWhere(
      (theme) => theme.name.toLowerCase() == colorThemeName.toLowerCase(),
      orElse: () => AppColorTheme.green,
    );

    _language = prefs.getString(_languageKey) ?? 'English';
    _notificationsEnabled = prefs.getBool(_notificationsKey) ?? true;

    _isInitialized = true;
    notifyListeners();
  }

  /// Toggle dark mode and persist the setting
  Future<void> setDarkMode(bool value) async {
    if (_isDarkMode == value) return;

    _isDarkMode = value;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_themeKey, value);
  }

  /// Set color theme and persist the setting
  Future<void> setColorTheme(AppColorTheme theme) async {
    if (_colorTheme == theme) return;

    _colorTheme = theme;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_colorThemeKey, theme.name.toLowerCase());
  }

  /// Set language and persist the setting
  Future<void> setLanguage(String value) async {
    if (_language == value) return;
    if (!availableLanguages.contains(value)) return;

    _language = value;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languageKey, value);
  }

  /// Toggle notifications and persist the setting
  Future<void> setNotificationsEnabled(bool value) async {
    if (_notificationsEnabled == value) return;

    _notificationsEnabled = value;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notificationsKey, value);
  }

  void setIsSigningUp(bool value) {
    _isSigningUp = value;
    notifyListeners();
  }
}
