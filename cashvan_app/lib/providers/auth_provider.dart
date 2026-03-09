import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';
import '../data/models/user_model.dart';
import '../data/services/api_service.dart';

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;

  AuthState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState());

  static const _allowedRoles = ['seller', 'livreur', 'cashvan'];

  Future<void> checkAuth() async {
    debugPrint('[AUTH] checkAuth started');
    state = state.copyWith(isLoading: true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(AppConstants.tokenKey);
      final userData = prefs.getString(AppConstants.userKey);
      debugPrint('[AUTH] token: ${token != null}, userData: ${userData != null}');

      if (token != null && userData != null) {
        final user = UserModel.fromJson(jsonDecode(userData));
        debugPrint('[AUTH] user role: ${user.role}');
        if (_allowedRoles.contains(user.role)) {
          state = state.copyWith(
            user: user,
            isAuthenticated: true,
            isLoading: false,
          );
          // Fetch fresh user data from API to get latest permissions
          refreshUser();
        } else {
          await logout();
        }
      } else {
        state = state.copyWith(isLoading: false, isAuthenticated: false);
      }
    } catch (e) {
      debugPrint('[AUTH] checkAuth error: $e');
      state = state.copyWith(isLoading: false, isAuthenticated: false);
    }
  }

  Future<bool> login(String email, String password) async {
    debugPrint('[AUTH] login started: $email');
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await ApiService.instance.login(email, password);
      final data = response.data;

      final user = UserModel.fromJson(data['user']);
      debugPrint('[AUTH] user: ${user.name}, role: ${user.role}');

      if (!_allowedRoles.contains(user.role)) {
        state = state.copyWith(
          isLoading: false,
          error: 'هذا التطبيق مخصص للسائقين والبائعين فقط',
        );
        return false;
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.tokenKey, data['token']);
      await prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));
      if (data['tenant_id'] != null) {
        await prefs.setString(AppConstants.tenantIdKey, data['tenant_id'].toString());
      }

      state = state.copyWith(
        user: user,
        isAuthenticated: true,
        isLoading: false,
      );

      return true;
    } catch (e) {
      debugPrint('[AUTH] login ERROR: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'خطأ في تسجيل الدخول: $e',
      );
      return false;
    }
  }

  Future<void> refreshUser() async {
    try {
      final response = await ApiService.instance.getUser();
      final user = UserModel.fromJson(response.data);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));
      if (mounted) {
        state = state.copyWith(user: user);
      }
    } catch (e) {
      debugPrint('[AUTH] refreshUser error: $e');
    }
  }

  Future<void> logout() async {
    debugPrint('[AUTH] logout');
    try {
      await ApiService.instance.logout();
    } catch (_) {}

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
    await prefs.remove(AppConstants.tenantIdKey);

    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
