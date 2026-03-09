class ProductRequestModel {
  final int id;
  final String reference;
  final String status;
  final int? warehouseId;
  final String? warehouseName;
  final String? notes;
  final String? adminNotes;
  final List<ProductRequestItemModel> items;
  final String? createdAt;
  final String? processedAt;
  final String? processorName;

  ProductRequestModel({
    required this.id,
    required this.reference,
    required this.status,
    this.warehouseId,
    this.warehouseName,
    this.notes,
    this.adminNotes,
    this.items = const [],
    this.createdAt,
    this.processedAt,
    this.processorName,
  });

  factory ProductRequestModel.fromJson(Map<String, dynamic> json) {
    final itemsList = json['items'] as List<dynamic>? ?? [];
    return ProductRequestModel(
      id: json['id'] as int,
      reference: json['reference'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      warehouseId: json['warehouse_id'] as int?,
      warehouseName: json['warehouse']?['name'] as String?,
      notes: json['notes'] as String?,
      adminNotes: json['admin_notes'] as String?,
      items: itemsList
          .map((e) => ProductRequestItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: json['created_at'] as String?,
      processedAt: json['processed_at'] as String?,
      processorName: json['processor']?['name'] as String?,
    );
  }
}

class ProductRequestItemModel {
  final int id;
  final int productId;
  final String? productName;
  final int quantityRequested;
  final int quantityApproved;
  final String? notes;
  final int piecesPerPackage;

  ProductRequestItemModel({
    required this.id,
    required this.productId,
    this.productName,
    required this.quantityRequested,
    required this.quantityApproved,
    this.notes,
    this.piecesPerPackage = 1,
  });

  factory ProductRequestItemModel.fromJson(Map<String, dynamic> json) {
    final ppp = json['product']?['pieces_per_package'];
    int piecesPerPkg = 1;
    if (ppp is int && ppp > 0) {
      piecesPerPkg = ppp;
    } else if (ppp is String) {
      piecesPerPkg = int.tryParse(ppp) ?? 1;
    }

    return ProductRequestItemModel(
      id: json['id'] as int,
      productId: json['product_id'] as int,
      productName: json['product']?['name'] as String?,
      quantityRequested: _toInt(json['quantity_requested']),
      quantityApproved: _toInt(json['quantity_approved']),
      notes: json['notes'] as String?,
      piecesPerPackage: piecesPerPkg,
    );
  }

  String get formattedRequested => _formatQty(quantityRequested, piecesPerPackage);
  String get formattedApproved => _formatQty(quantityApproved, piecesPerPackage);
}

int _toInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.round();
  if (value is String) return int.tryParse(value) ?? (double.tryParse(value)?.round() ?? 0);
  return 0;
}

String _formatQty(int totalPieces, int piecesPerPackage) {
  if (piecesPerPackage <= 1) return '$totalPieces';
  final cartons = totalPieces ~/ piecesPerPackage;
  final pieces = totalPieces % piecesPerPackage;
  if (pieces == 0) return '$cartons كرتون';
  if (cartons == 0) return '$pieces قطعة';
  return '$cartons كرتون + $pieces قطعة';
}
