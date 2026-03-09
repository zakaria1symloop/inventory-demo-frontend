import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/stock_transfer_model.dart';
import '../data/models/sale_model.dart';
import '../data/models/product_model.dart';
import '../data/models/product_request_model.dart';
import '../data/services/api_service.dart';

double _toDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

int _toInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) {
    final parsed = double.tryParse(value);
    if (parsed != null) return parsed.toInt();
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

/// Represents a product in the driver's warehouse stock
class StockItemInfo {
  final int productId;
  final String? productName;
  final double availableQuantity;
  final double retailPrice;
  final double wholesalePrice;
  final double costPrice;
  final int piecesPerPackage;
  final ProductModel? product;

  StockItemInfo({
    required this.productId,
    this.productName,
    required this.availableQuantity,
    required this.retailPrice,
    required this.wholesalePrice,
    this.costPrice = 0,
    this.piecesPerPackage = 1,
    this.product,
  });

  double getPriceForCategory(int? categoryId) {
    if (product != null) {
      return product!.getPriceForCategory(categoryId);
    }
    return retailPrice;
  }

  factory StockItemInfo.fromJson(Map<String, dynamic> json) {
    ProductModel? product;
    if (json['product'] != null && json['product'] is Map<String, dynamic>) {
      product = ProductModel.fromJson(json['product']);
    }
    final ppp = _toInt(json['product']?['pieces_per_package'] ?? 1);
    return StockItemInfo(
      productId: _toInt(json['product_id']),
      productName: product?.name ?? json['product']?['name']?.toString(),
      availableQuantity: _toDouble(json['quantity']),
      retailPrice: _toDouble(json['product']?['retail_price']),
      wholesalePrice: _toDouble(json['product']?['wholesale_price']),
      costPrice: _toDouble(json['product']?['cost_price']),
      piecesPerPackage: ppp > 0 ? ppp : 1,
      product: product,
    );
  }
}

// Pending transfers for this driver
final pendingTransfersProvider =
    FutureProvider<List<StockTransferModel>>((ref) async {
  final response = await ApiService.instance.getMyPendingTransfers();
  if (response.statusCode == 200) {
    final List data = response.data is List ? response.data : [];
    return data.map((e) => StockTransferModel.fromJson(e)).toList();
  }
  return [];
});

// My warehouse stock
final myStockProvider = FutureProvider<List<StockItemInfo>>((ref) async {
  final response = await ApiService.instance.getMyStock();
  if (response.statusCode == 200) {
    final List data = response.data is List ? response.data : [];
    return data
        .map((e) => StockItemInfo.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});

// My sales (today by default)
final mySalesProvider =
    FutureProvider.family<List<SaleModel>, Map<String, String>?>(
        (ref, params) async {
  final queryParams = <String, dynamic>{};
  if (params != null) {
    queryParams.addAll(params);
  } else {
    final today = DateTime.now();
    final dateStr =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    queryParams['from_date'] = dateStr;
    queryParams['to_date'] = dateStr;
  }

  final response = await ApiService.instance.getMySales(params: queryParams);
  if (response.statusCode == 200) {
    final data = response.data;
    List list;
    if (data is Map) {
      list = data['data'] as List? ?? [];
    } else if (data is List) {
      list = data;
    } else {
      list = [];
    }
    return list.map((e) => SaleModel.fromJson(e)).toList();
  }
  return [];
});

// My product requests (cashvan)
final myProductRequestsProvider =
    FutureProvider<List<ProductRequestModel>>((ref) async {
  final response = await ApiService.instance.getMyProductRequests();
  if (response.statusCode == 200) {
    final List data = response.data is List ? response.data : [];
    return data
        .map((e) => ProductRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});

// Caisse data
final caisseProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  try {
    final response = await ApiService.instance.getMyCaisse();
    if (response.statusCode == 200) {
      return response.data as Map<String, dynamic>;
    }
  } catch (_) {}
  return null;
});
