import 'product_model.dart';

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

class StockTransferModel {
  final int id;
  final String? reference;
  final int fromWarehouseId;
  final int toWarehouseId;
  final String? fromWarehouseName;
  final String? toWarehouseName;
  final String? creatorName;
  final String? approverName;
  final String? collectorName;
  final String status; // pending, loading, collected
  final String? approvedAt;
  final String? collectedAt;
  final String? notes;
  final String? createdAt;
  final List<StockTransferItemModel> items;

  StockTransferModel({
    required this.id,
    this.reference,
    required this.fromWarehouseId,
    required this.toWarehouseId,
    this.fromWarehouseName,
    this.toWarehouseName,
    this.creatorName,
    this.approverName,
    this.collectorName,
    required this.status,
    this.approvedAt,
    this.collectedAt,
    this.notes,
    this.createdAt,
    this.items = const [],
  });

  bool get isPending => status == 'pending';
  bool get isLoading => status == 'loading';
  bool get isCollected => status == 'collected';

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'طلب';
      case 'loading':
        return 'تحميل';
      case 'collected':
        return 'انطلاق';
      default:
        return status;
    }
  }

  factory StockTransferModel.fromJson(Map<String, dynamic> json) {
    return StockTransferModel(
      id: _toInt(json['id']),
      reference: json['reference']?.toString(),
      fromWarehouseId: _toInt(json['from_warehouse_id']),
      toWarehouseId: _toInt(json['to_warehouse_id']),
      fromWarehouseName: json['from_warehouse']?['name']?.toString(),
      toWarehouseName: json['to_warehouse']?['name']?.toString(),
      creatorName: json['creator']?['name']?.toString(),
      approverName: json['approver']?['name']?.toString(),
      collectorName: json['collector']?['name']?.toString(),
      status: json['status']?.toString() ?? 'pending',
      approvedAt: json['approved_at']?.toString(),
      collectedAt: json['collected_at']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['created_at']?.toString(),
      items: (json['items'] as List?)
              ?.map((e) => StockTransferItemModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class StockTransferItemModel {
  final int id;
  final int productId;
  final double quantity;
  final ProductModel? product;

  StockTransferItemModel({
    required this.id,
    required this.productId,
    required this.quantity,
    this.product,
  });

  factory StockTransferItemModel.fromJson(Map<String, dynamic> json) {
    return StockTransferItemModel(
      id: _toInt(json['id']),
      productId: _toInt(json['product_id']),
      quantity: _toDouble(json['quantity']),
      product: json['product'] != null
          ? ProductModel.fromJson(json['product'])
          : null,
    );
  }
}
