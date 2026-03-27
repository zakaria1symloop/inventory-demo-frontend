double _toDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

double? _toDoubleNullable(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int _toInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

class ClientModel {
  final int id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final double? gpsLat;
  final double? gpsLng;
  final double? creditLimit;
  final double balance;
  final double salesDebt;
  final double deliveryDebt;
  final double combinedDebt;
  final bool isActive;
  final int? clientCategoryId;
  final String? clientCategoryName;

  double get totalDebt => combinedDebt > 0 ? combinedDebt : (balance > 0 ? balance : 0);

  ClientModel({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
    this.gpsLat,
    this.gpsLng,
    this.creditLimit,
    required this.balance,
    this.salesDebt = 0,
    this.deliveryDebt = 0,
    this.combinedDebt = 0,
    required this.isActive,
    this.clientCategoryId,
    this.clientCategoryName,
  });

  factory ClientModel.fromJson(Map<String, dynamic> json) {
    return ClientModel(
      id: _toInt(json["id"]),
      name: json["name"]?.toString() ?? "",
      phone: json["phone"]?.toString(),
      email: json["email"]?.toString(),
      address: json["address"]?.toString(),
      gpsLat: _toDoubleNullable(json["gps_lat"]),
      gpsLng: _toDoubleNullable(json["gps_lng"]),
      creditLimit: _toDoubleNullable(json["credit_limit"]),
      balance: _toDouble(json["balance"]),
      salesDebt: _toDouble(json["sales_debt"]),
      deliveryDebt: _toDouble(json["delivery_debt"]),
      combinedDebt: _toDouble(json["combined_debt"]),
      isActive: json["is_active"] ?? true,
      clientCategoryId: json["client_category_id"] != null ? _toInt(json["client_category_id"]) : null,
      clientCategoryName: json["client_category"]?["name"]?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "id": id,
      "name": name,
      "phone": phone,
      "email": email,
      "address": address,
      "gps_lat": gpsLat,
      "gps_lng": gpsLng,
      "credit_limit": creditLimit,
      "balance": balance,
      "is_active": isActive,
      "client_category_id": clientCategoryId,
    };
  }
}
