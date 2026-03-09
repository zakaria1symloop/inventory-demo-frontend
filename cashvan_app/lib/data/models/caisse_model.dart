class CaisseModel {
  final int id;
  final int userId;
  final String type;
  final double balance;
  final bool isActive;
  final String? createdAt;
  final String? updatedAt;

  CaisseModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.balance,
    required this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory CaisseModel.fromJson(Map<String, dynamic> json) {
    return CaisseModel(
      id: json['id'],
      userId: json['user_id'],
      type: json['type'] ?? '',
      balance: (json['balance'] is String)
          ? double.tryParse(json['balance']) ?? 0
          : (json['balance'] ?? 0).toDouble(),
      isActive: json['is_active'] == true || json['is_active'] == 1,
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }
}

class CaisseTransactionModel {
  final int id;
  final int caisseId;
  final String type; // 'in' or 'out'
  final double amount;
  final double balanceAfter;
  final String? sourceType;
  final int? sourceId;
  final String? description;
  final int? createdBy;
  final String? createdAt;
  final Map<String, dynamic>? creator;

  CaisseTransactionModel({
    required this.id,
    required this.caisseId,
    required this.type,
    required this.amount,
    required this.balanceAfter,
    this.sourceType,
    this.sourceId,
    this.description,
    this.createdBy,
    this.createdAt,
    this.creator,
  });

  factory CaisseTransactionModel.fromJson(Map<String, dynamic> json) {
    return CaisseTransactionModel(
      id: json['id'],
      caisseId: json['caisse_id'],
      type: json['type'] ?? '',
      amount: (json['amount'] is String)
          ? double.tryParse(json['amount']) ?? 0
          : (json['amount'] ?? 0).toDouble(),
      balanceAfter: (json['balance_after'] is String)
          ? double.tryParse(json['balance_after']) ?? 0
          : (json['balance_after'] ?? 0).toDouble(),
      sourceType: json['source_type'],
      sourceId: json['source_id'],
      description: json['description'],
      createdBy: json['created_by'],
      createdAt: json['created_at'],
      creator: json['creator'],
    );
  }

  String get sourceTypeLabel {
    switch (sourceType) {
      case 'van_sale':
        return 'بيع متنقل';
      case 'delivery':
        return 'توصيل';
      case 'payment':
        return 'دفعة';
      case 'dispense':
        return 'مصروف';
      case 'settlement':
        return 'تحصيل';
      case 'adjustment':
        return 'تعديل';
      case 'transfer':
        return 'تحويل';
      default:
        return sourceType ?? '-';
    }
  }
}
