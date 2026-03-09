import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/api_service.dart';
import '../../core/theme/app_theme.dart';

// Dispense categories
const Map<String, String> dispenseCategories = {
  'salary': 'راتب',
  'advance': 'سلفة',
  'transport': 'نقل',
  'maintenance': 'صيانة',
  'supplies': 'مستلزمات',
  'utilities': 'فواتير',
  'rent': 'إيجار',
  'other': 'أخرى',
};

// Category icons
const Map<String, IconData> categoryIcons = {
  'salary': Icons.payments,
  'advance': Icons.money,
  'transport': Icons.local_shipping,
  'maintenance': Icons.build,
  'supplies': Icons.shopping_bag,
  'utilities': Icons.receipt_long,
  'rent': Icons.home,
  'other': Icons.more_horiz,
};

// Category colors
const Map<String, Color> categoryColors = {
  'salary': Colors.blue,
  'advance': Colors.orange,
  'transport': Colors.green,
  'maintenance': Colors.purple,
  'supplies': Colors.teal,
  'utilities': Colors.indigo,
  'rent': Colors.brown,
  'other': Colors.grey,
};

class DispenseModel {
  final int id;
  final String reference;
  final String date;
  final String category;
  final double amount;
  final String? description;
  final String? notes;
  final String? userName;

  DispenseModel({
    required this.id,
    required this.reference,
    required this.date,
    required this.category,
    required this.amount,
    this.description,
    this.notes,
    this.userName,
  });

  factory DispenseModel.fromJson(Map<String, dynamic> json) {
    return DispenseModel(
      id: json['id'] ?? 0,
      reference: json['reference']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      category: json['category']?.toString() ?? 'other',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0,
      description: json['description']?.toString(),
      notes: json['notes']?.toString(),
      userName: json['user']?['name']?.toString(),
    );
  }
}

// Provider for today's dispenses
final dispensesProvider = FutureProvider<List<DispenseModel>>((ref) async {
  final today = DateTime.now();
  final dateStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
  final response = await ApiService.instance.getDispenses(params: {
    'date_from': dateStr,
    'date_to': dateStr,
    'per_page': 100,
  });
  final data = response.data;
  final List list = data is Map ? (data['data'] ?? []) : data;
  return list.map((e) => DispenseModel.fromJson(e)).toList();
});

class DispenseScreen extends ConsumerWidget {
  const DispenseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dispensesAsync = ref.watch(dispensesProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('المصاريف'),
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showAddDispenseDialog(context, ref),
          icon: const Icon(Icons.add),
          label: const Text('مصروف جديد'),
          backgroundColor: AppTheme.primaryColor,
        ),
        body: dispensesAsync.when(
          data: (dispenses) {
            final totalToday = dispenses.fold<double>(0, (sum, d) => sum + d.amount);

            return Column(
              children: [
                // Summary card
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.deepPurple,
                        Colors.deepPurple.withValues(alpha: 0.8),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 28),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'مصاريف اليوم',
                              style: TextStyle(color: Colors.white70, fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${totalToday.toStringAsFixed(0)} د.ج',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${dispenses.length} عملية',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),

                // Category quick buttons
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(
                    height: 90,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: dispenseCategories.entries.map((entry) {
                        final color = categoryColors[entry.key] ?? Colors.grey;
                        final icon = categoryIcons[entry.key] ?? Icons.more_horiz;
                        return Padding(
                          padding: const EdgeInsets.only(left: 12),
                          child: InkWell(
                            onTap: () => _showAddDispenseDialog(context, ref, preselectedCategory: entry.key),
                            borderRadius: BorderRadius.circular(12),
                            child: Column(
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: color.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: color.withValues(alpha: 0.3)),
                                  ),
                                  child: Icon(icon, color: color, size: 26),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  entry.value,
                                  style: TextStyle(fontSize: 11, color: Colors.grey[700], fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

                const SizedBox(height: 12),
                const Divider(height: 1),

                // Dispenses list
                Expanded(
                  child: dispenses.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey),
                              SizedBox(height: 16),
                              Text('لا يوجد مصاريف اليوم', style: TextStyle(color: Colors.grey, fontSize: 16)),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: () async {
                            ref.invalidate(dispensesProvider);
                          },
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: dispenses.length,
                            itemBuilder: (context, index) {
                              final dispense = dispenses[index];
                              return _DispenseCard(dispense: dispense);
                            },
                          ),
                        ),
                ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('خطأ: $error')),
        ),
      ),
    );
  }

  void _showAddDispenseDialog(BuildContext parentContext, WidgetRef ref, {String? preselectedCategory}) {
    final amountController = TextEditingController();
    final descriptionController = TextEditingController();
    final notesController = TextEditingController();
    String selectedCategory = preselectedCategory ?? 'other';
    final scaffoldMessenger = ScaffoldMessenger.of(parentContext);

    showDialog(
      context: parentContext,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: const Text('مصروف جديد', style: TextStyle(fontSize: 18)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category selection
                  const Text('الفئة', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: dispenseCategories.entries.map((entry) {
                      final isSelected = selectedCategory == entry.key;
                      final color = categoryColors[entry.key] ?? Colors.grey;
                      final icon = categoryIcons[entry.key] ?? Icons.more_horiz;
                      return InkWell(
                        onTap: () => setDialogState(() => selectedCategory = entry.key),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? color.withValues(alpha: 0.15) : Colors.grey[100],
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected ? color : Colors.grey[300]!,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(icon, size: 16, color: isSelected ? color : Colors.grey[600]),
                              const SizedBox(width: 6),
                              Text(
                                entry.value,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  color: isSelected ? color : Colors.grey[700],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),

                  // Amount
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    autofocus: preselectedCategory != null,
                    decoration: const InputDecoration(
                      labelText: 'المبلغ',
                      border: OutlineInputBorder(),
                      suffixText: 'د.ج',
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Description
                  TextField(
                    controller: descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'الوصف',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Notes
                  TextField(
                    controller: notesController,
                    decoration: const InputDecoration(
                      labelText: 'ملاحظات (اختياري)',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('إلغاء'),
              ),
              ElevatedButton.icon(
                onPressed: () async {
                  final amount = double.tryParse(amountController.text);
                  if (amount == null || amount <= 0) {
                    scaffoldMessenger.showSnackBar(
                      const SnackBar(content: Text('يرجى إدخال مبلغ صحيح')),
                    );
                    return;
                  }

                  final category = selectedCategory;
                  final description = descriptionController.text.trim().isEmpty
                      ? dispenseCategories[category]
                      : descriptionController.text.trim();
                  final notes = notesController.text.trim().isEmpty ? null : notesController.text.trim();

                  Navigator.pop(dialogContext);

                  try {
                    final today = DateTime.now();
                    final dateStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

                    final response = await ApiService.instance.createDispense({
                      'date': dateStr,
                      'category': category,
                      'amount': amount,
                      'description': description,
                      'notes': notes,
                    });

                    if (response.statusCode == 201 || response.statusCode == 200) {
                      scaffoldMessenger.showSnackBar(
                        SnackBar(
                          content: Text('تم تسجيل مصروف ${amount.toStringAsFixed(0)} د.ج'),
                          backgroundColor: AppTheme.successColor,
                        ),
                      );
                      ref.invalidate(dispensesProvider);
                    } else {
                      scaffoldMessenger.showSnackBar(
                        const SnackBar(content: Text('فشل تسجيل المصروف')),
                      );
                    }
                  } catch (e) {
                    scaffoldMessenger.showSnackBar(
                      SnackBar(content: Text('خطأ: $e')),
                    );
                  }
                },
                icon: const Icon(Icons.save, size: 18),
                label: const Text('حفظ'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DispenseCard extends StatelessWidget {
  final DispenseModel dispense;

  const _DispenseCard({required this.dispense});

  @override
  Widget build(BuildContext context) {
    final catLabel = dispenseCategories[dispense.category] ?? dispense.category;
    final catColor = categoryColors[dispense.category] ?? Colors.grey;
    final catIcon = categoryIcons[dispense.category] ?? Icons.more_horiz;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: catColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(catIcon, color: catColor, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: catColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          catLabel,
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: catColor),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        dispense.reference,
                        style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                  if (dispense.description != null && dispense.description!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      dispense.description!,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (dispense.userName != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      dispense.userName!,
                      style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                    ),
                  ],
                ],
              ),
            ),
            Text(
              '${dispense.amount.toStringAsFixed(0)} د.ج',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.red[700],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
