import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_constants.dart';
import '../../main.dart';

class ApiService {
  late final Dio _dio;
  static ApiService? _instance;

  ApiService._() {
    debugPrint('[API] Initializing with baseUrl: ${ApiConstants.baseUrl}');
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: ApiConstants.timeout,
      receiveTimeout: ApiConstants.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        debugPrint('[API] REQUEST: ${options.method} ${options.uri}');
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConstants.tokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        final tenantId = prefs.getString(AppConstants.tenantIdKey);
        if (tenantId != null) {
          options.headers['X-Tenant-Id'] = tenantId;
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        debugPrint('[API] RESPONSE: ${response.statusCode}');
        return handler.next(response);
      },
      onError: (error, handler) async {
        debugPrint('[API] ERROR: ${error.response?.statusCode} ${error.message}');
        if (error.response?.statusCode == 401) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove(AppConstants.tokenKey);
          await prefs.remove(AppConstants.tenantIdKey);
          navigatorKey.currentState
              ?.pushNamedAndRemoveUntil('/login', (_) => false);
        }
        return handler.next(error);
      },
    ));
  }

  static ApiService get instance {
    _instance ??= ApiService._();
    return _instance!;
  }

  // Auth
  Future<Response> login(String email, String password) async {
    return _dio.post(ApiConstants.login, data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> logout() async {
    return _dio.post(ApiConstants.logout);
  }

  Future<Response> getUser() async {
    return _dio.get(ApiConstants.user);
  }

  // Stock Transfers
  Future<Response> getMyPendingTransfers() async {
    return _dio.get(ApiConstants.myPendingTransfers);
  }

  Future<Response> collectTransfer(int transferId) async {
    return _dio.post('${ApiConstants.stockTransfers}/$transferId/collect');
  }

  Future<Response> getTransfer(int transferId) async {
    return _dio.get('${ApiConstants.stockTransfers}/$transferId');
  }

  // My warehouse stock
  Future<Response> getMyStock() async {
    return _dio.get(ApiConstants.myStock);
  }

  // My sales
  Future<Response> getMySales({Map<String, dynamic>? params}) async {
    return _dio.get(ApiConstants.mySales, queryParameters: params);
  }

  // Create sale (regular sale from driver's warehouse)
  Future<Response> createSale(Map<String, dynamic> data) async {
    return _dio.post(ApiConstants.sales, data: data);
  }

  // Get sale detail
  Future<Response> getSale(int saleId) async {
    return _dio.get('${ApiConstants.sales}/$saleId');
  }

  // Clients
  Future<Response> getClients({Map<String, dynamic>? params}) async {
    return _dio.get(ApiConstants.clients, queryParameters: params);
  }

  Future<Response> getClientCategories() async {
    return _dio.get(ApiConstants.clientCategories);
  }

  Future<Response> createClient(Map<String, dynamic> data) async {
    return _dio.post(ApiConstants.clients, data: data);
  }

  Future<Response> recordClientPayment(
      int clientId, double amount, String? notes) async {
    return _dio.post('${ApiConstants.clients}/$clientId/payments', data: {
      'amount': amount,
      'notes': notes,
    });
  }

  // Caisses
  Future<Response> getMyCaisse() async {
    return _dio.get(ApiConstants.myCaisse);
  }

  Future<Response> getCaisseTransactions(int caisseId,
      {int page = 1, String? type}) async {
    final params = <String, dynamic>{'page': page, 'per_page': 20};
    if (type != null) params['type'] = type;
    return _dio.get('/caisses/$caisseId/transactions',
        queryParameters: params);
  }

  // Products (for stock display)
  Future<Response> getProducts({Map<String, dynamic>? params}) async {
    return _dio.get(ApiConstants.products, queryParameters: params);
  }

  // Warehouse stock
  Future<Response> getWarehouseStock(int warehouseId) async {
    return _dio.get('/warehouses/$warehouseId/stock');
  }

  // Dispenses
  Future<Response> getDispenses({Map<String, dynamic>? params}) async {
    return _dio.get(ApiConstants.dispenses, queryParameters: params);
  }

  Future<Response> createDispense(Map<String, dynamic> data) async {
    return _dio.post(ApiConstants.dispenses, data: data);
  }

  // Product Requests
  Future<Response> createProductRequest(Map<String, dynamic> data) async {
    return _dio.post(ApiConstants.productRequests, data: data);
  }

  Future<Response> getMyProductRequests() async {
    return _dio.get(ApiConstants.myProductRequests);
  }

  Future<Response> deleteProductRequest(int id) async {
    return _dio.delete('${ApiConstants.productRequests}/$id');
  }

  // Warehouses
  Future<Response> getWarehouses() async {
    return _dio.get(ApiConstants.warehouses);
  }
}
