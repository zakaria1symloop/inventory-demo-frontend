import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/api_service.dart';
import '../../data/models/caisse_model.dart';
import '../../core/theme/app_theme.dart';

class _CaisseData {
  final CaisseModel? caisse;
  final List<CaisseTransactionModel> transactions;
  final String? error;

  _CaisseData({this.caisse, this.transactions = const [], this.error});
}

final myCaisseDataProvider = FutureProvider<_CaisseData>((ref) async {
  try {
    final response = await ApiService.instance.getMyCaisse();
    final data = response.data;

    if (data == null) return _CaisseData(error: 'لا توجد بيانات');

    // Parse caisse
    CaisseModel? caisse;
    if (data is Map<String, dynamic>) {
      final caisseData = data['caisse'] ?? (data.containsKey('id') ? data : null);
      if (caisseData != null) {
        caisse = CaisseModel.fromJson(caisseData);
      }
    }

    // Parse transactions
    List<CaisseTransactionModel> transactions = [];
    if (data is Map<String, dynamic>) {
      final txList = data['recent_transactions'] ?? data['transactions'] ?? [];
      if (txList is List) {
        transactions = txList.map((tx) => CaisseTransactionModel.fromJson(tx)).toList();
      }
    }

    return _CaisseData(caisse: caisse, transactions: transactions);
  } catch (e) {
    return _CaisseData(error: e.toString());
  }
});

class CaisseScreen extends ConsumerStatefulWidget {
  const CaisseScreen({super.key});

  @override
  ConsumerState<CaisseScreen> createState() => _CaisseScreenState();
}

class _CaisseScreenState extends ConsumerState<CaisseScreen> {
  String? _filterType; // null=all, 'in', 'out'
  String? _filterCreator; // filter by creator name

  @override
  Widget build(BuildContext context) {
    final caisseDataAsync = ref.watch(myCaisseDataProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('صندوقي'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref.invalidate(myCaisseDataProvider),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(myCaisseDataProvider);
          },
          child: caisseDataAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('خطأ: $e')),
            data: (caisseData) {
              if (caisseData.error != null && caisseData.caisse == null) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.account_balance_wallet_outlined, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text(
                        caisseData.error!.contains('404')
                            ? 'لا يوجد صندوق لهذا الحساب'
                            : 'خطأ: ${caisseData.error}',
                        style: const TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(myCaisseDataProvider),
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                );
              }

              final caisse = caisseData.caisse;
              if (caisse == null) {
                return const Center(
                  child: Text(
                    'لا يوجد صندوق لهذا الحساب',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                );
              }

              final transactions = caisseData.transactions;

              // Apply type filter
              var filtered = _filterType == null
                  ? transactions
                  : transactions.where((tx) => tx.type == _filterType).toList();

              // Apply creator filter
              if (_filterCreator != null && _filterCreator!.isNotEmpty) {
                filtered = filtered.where((tx) {
                  final creatorName = tx.creator?['name']?.toString() ?? '';
                  return creatorName.contains(_filterCreator!);
                }).toList();
              }

              // Calculate filtered total
              final filteredTotalIn = filtered
                  .where((tx) => tx.type == 'in')
                  .fold<double>(0, (s, tx) => s + tx.amount);
              final filteredTotalOut = filtered
                  .where((tx) => tx.type == 'out')
                  .fold<double>(0, (s, tx) => s + tx.amount);

              // Get unique creators for filter
              final creators = <String>{};
              for (final tx in transactions) {
                final name = tx.creator?['name']?.toString();
                if (name != null && name.isNotEmpty) {
                  creators.add(name);
                }
              }

              return SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Balance Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.primaryColor,
                            AppTheme.primaryColor.withValues(alpha: 0.8),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'الرصيد الحالي',
                            style: TextStyle(color: Colors.white70, fontSize: 14),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${caisse.balance.toStringAsFixed(2)} د.ج',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _getTypeLabel(caisse.type),
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Filtered totals summary
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.arrow_downward, size: 16, color: AppTheme.successColor),
                                    const SizedBox(width: 4),
                                    const Text('الوارد', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${filteredTotalIn.toStringAsFixed(0)} د.ج',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: AppTheme.successColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(width: 1, height: 40, color: Colors.grey[300]),
                          Expanded(
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.arrow_upward, size: 16, color: AppTheme.dangerColor),
                                    const SizedBox(width: 4),
                                    const Text('الصادر', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${filteredTotalOut.toStringAsFixed(0)} د.ج',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: AppTheme.dangerColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(width: 1, height: 40, color: Colors.grey[300]),
                          Expanded(
                            child: Column(
                              children: [
                                const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.functions, size: 16, color: AppTheme.primaryColor),
                                    SizedBox(width: 4),
                                    Text('الصافي', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${(filteredTotalIn - filteredTotalOut).toStringAsFixed(0)} د.ج',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Filters row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'الحركات',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        SegmentedButton<String?>(
                          segments: const [
                            ButtonSegment(value: null, label: Text('الكل')),
                            ButtonSegment(value: 'in', label: Text('وارد')),
                            ButtonSegment(value: 'out', label: Text('صادر')),
                          ],
                          selected: {_filterType},
                          onSelectionChanged: (selected) {
                            setState(() => _filterType = selected.first);
                          },
                          style: ButtonStyle(
                            visualDensity: VisualDensity.compact,
                            textStyle: WidgetStatePropertyAll(
                              Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Creator filter (only show if multiple creators exist)
                    if (creators.length > 1) ...[
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 34,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: [
                            _FilterChip(
                              label: 'الكل',
                              isSelected: _filterCreator == null,
                              onTap: () => setState(() => _filterCreator = null),
                            ),
                            ...creators.map((name) => Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: _FilterChip(
                                    label: name,
                                    isSelected: _filterCreator == name,
                                    onTap: () => setState(() =>
                                        _filterCreator = _filterCreator == name ? null : name),
                                  ),
                                )),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 12),

                    // Transactions List
                    if (filtered.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: Text('لا توجد حركات', style: TextStyle(color: Colors.grey)),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          return _TransactionTile(transaction: filtered[index]);
                        },
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  String _getTypeLabel(String type) {
    switch (type) {
      case 'principale':
        return 'صندوق رئيسي';
      case 'vendeur':
        return 'صندوق بائع';
      case 'livreur':
        return 'صندوق سائق';
      default:
        return type;
    }
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.grey[100],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.white : Colors.grey[700],
          ),
        ),
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final CaisseTransactionModel transaction;

  const _TransactionTile({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isIn = transaction.type == 'in';
    final creatorName = transaction.creator?['name']?.toString();

    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (isIn ? AppTheme.successColor : AppTheme.dangerColor).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          isIn ? Icons.arrow_downward : Icons.arrow_upward,
          color: isIn ? AppTheme.successColor : AppTheme.dangerColor,
          size: 20,
        ),
      ),
      title: Text(
        transaction.description ?? transaction.sourceTypeLabel,
        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _formatDate(transaction.createdAt),
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
          if (creatorName != null && creatorName.isNotEmpty)
            Text(
              'بواسطة: $creatorName',
              style: TextStyle(fontSize: 11, color: Colors.blue[600]),
            ),
        ],
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '${isIn ? '+' : '-'}${transaction.amount.toStringAsFixed(2)}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isIn ? AppTheme.successColor : AppTheme.dangerColor,
            ),
          ),
          Text(
            '${transaction.balanceAfter.toStringAsFixed(2)} د.ج',
            style: TextStyle(fontSize: 11, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }
}
