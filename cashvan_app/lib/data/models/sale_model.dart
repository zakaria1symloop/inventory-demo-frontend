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

/// Format quantity in pieces as "X + Yق" (cartons + pieces)
String formatQty(dynamic qty, int piecesPerPackage) {
  final totalPieces = (qty is int) ? qty : (qty as num).toInt();
  if (piecesPerPackage <= 1) return totalPieces.toString();
  final cartons = totalPieces ~/ piecesPerPackage;
  final pieces = totalPieces % piecesPerPackage;
  if (pieces == 0) return cartons.toString();
  if (cartons == 0) return '${pieces}ق';
  return '$cartons + ${pieces}ق';
}

class SaleModel {
  final int? id;
  final String? reference;
  final int? clientId;
  final int warehouseId;
  final int userId;
  final String date;
  final double totalAmount;
  final double discount;
  final double tax;
  final double grandTotal;
  final double paidAmount;
  final double dueAmount;
  final String status;
  final String paymentStatus;
  final String? note;
  final String? source;
  final String? createdAt;
  final String? clientName;
  final String? clientPhone;
  final String? warehouseName;
  final List<SaleItemModel> items;

  SaleModel({
    this.id,
    this.reference,
    this.clientId,
    required this.warehouseId,
    required this.userId,
    required this.date,
    required this.totalAmount,
    this.discount = 0,
    this.tax = 0,
    required this.grandTotal,
    this.paidAmount = 0,
    this.dueAmount = 0,
    this.status = 'completed',
    this.paymentStatus = 'unpaid',
    this.note,
    this.source,
    this.createdAt,
    this.clientName,
    this.clientPhone,
    this.warehouseName,
    this.items = const [],
  });

  String get paymentStatusLabel {
    switch (paymentStatus) {
      case 'paid':
        return 'مدفوع';
      case 'partial':
        return 'جزئي';
      case 'unpaid':
        return 'آجل';
      default:
        return paymentStatus;
    }
  }

  factory SaleModel.fromJson(Map<String, dynamic> json) {
    return SaleModel(
      id: json['id'] != null ? _toInt(json['id']) : null,
      reference: json['reference']?.toString(),
      clientId: json['client_id'] != null ? _toInt(json['client_id']) : null,
      warehouseId: _toInt(json['warehouse_id']),
      userId: _toInt(json['user_id']),
      date: json['date']?.toString() ?? '',
      totalAmount: _toDouble(json['total_amount']),
      discount: _toDouble(json['discount']),
      tax: _toDouble(json['tax']),
      grandTotal: _toDouble(json['grand_total']),
      paidAmount: _toDouble(json['paid_amount']),
      dueAmount: _toDouble(json['due_amount']),
      status: json['status']?.toString() ?? 'completed',
      paymentStatus: json['payment_status']?.toString() ?? 'unpaid',
      note: json['note']?.toString(),
      source: json['source']?.toString(),
      createdAt: json['created_at']?.toString(),
      clientName: json['client']?['name']?.toString(),
      clientPhone: json['client']?['phone']?.toString(),
      warehouseName: json['warehouse']?['name']?.toString(),
      items: json['items'] != null
          ? (json['items'] as List)
              .map((e) => SaleItemModel.fromJson(e))
              .toList()
          : [],
    );
  }
}

class SaleItemModel {
  final int? id;
  final int productId;
  final int quantity; // Total pieces (integer)
  final double unitPrice;
  final double discount;
  final double subtotal;
  final String? productName;
  final int piecesPerPackage;

  SaleItemModel({
    this.id,
    required this.productId,
    required this.quantity,
    required this.unitPrice,
    this.discount = 0,
    required this.subtotal,
    this.productName,
    this.piecesPerPackage = 1,
  });

  /// Total pieces — quantity is already in pieces
  int get totalPieces => quantity;

  String get formattedQty => formatQty(quantity, piecesPerPackage);

  factory SaleItemModel.fromJson(Map<String, dynamic> json) {
    return SaleItemModel(
      id: json['id'] != null ? _toInt(json['id']) : null,
      productId: _toInt(json['product_id']),
      quantity: _toInt(json['quantity']),
      unitPrice: _toDouble(json['unit_price']),
      discount: _toDouble(json['discount']),
      subtotal: _toDouble(json['subtotal']),
      productName: json['product']?['name']?.toString(),
      piecesPerPackage: _toInt(json['product']?['pieces_per_package'] ?? 1),
    );
  }
}
