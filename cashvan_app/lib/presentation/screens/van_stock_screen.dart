import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/session_provider.dart';
import '../../core/theme/app_theme.dart';

/// Format stock quantity (in pieces) as cartons + pieces
String _formatStockQty(num qty, int piecesPerPackage) {
  final totalPieces = qty.toInt();
  if (piecesPerPackage <= 1) {
    return '$totalPieces قطعة';
  }
  final cartons = totalPieces ~/ piecesPerPackage;
  final pieces = totalPieces % piecesPerPackage;
  if (pieces == 0) return '$cartons كرتون ($totalPieces ق)';
  if (cartons == 0) return '$totalPieces قطعة';
  return '$cartons كرتون + $pieces قطعة ($totalPieces ق)';
}

class VanStockScreen extends ConsumerStatefulWidget {
  const VanStockScreen({super.key});

  @override
  ConsumerState<VanStockScreen> createState() => _VanStockScreenState();
}

class _VanStockScreenState extends ConsumerState<VanStockScreen> {
  String _searchQuery = '';
  String _filterMode = 'all'; // all, available, soldOut

  @override
  Widget build(BuildContext context) {
    final stockAsync = ref.watch(myStockProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('مخزون المستودع'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref.invalidate(myStockProvider),
            ),
          ],
        ),
        body: stockAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('خطأ: $error'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(myStockProvider),
                  child: const Text('إعادة المحاولة'),
                ),
              ],
            ),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('لا توجد منتجات في المستودع', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              );
            }

            // Compute summary
            final totalProducts = items.length;
            final availableProducts = items.where((i) => i.availableQuantity > 0).length;
            final outOfStockProducts = items.where((i) => i.availableQuantity <= 0).length;
            final totalValue = items.fold<double>(
                0, (s, i) => s + (i.retailPrice * i.availableQuantity * i.piecesPerPackage));

            // Filter
            var filtered = items.toList();
            if (_filterMode == 'available') {
              filtered = filtered.where((i) => i.availableQuantity > 0).toList();
            } else if (_filterMode == 'soldOut') {
              filtered = filtered.where((i) => i.availableQuantity <= 0).toList();
            }
            if (_searchQuery.isNotEmpty) {
              filtered = filtered.where((i) {
                final name = (i.productName ?? '').toLowerCase();
                return name.contains(_searchQuery.toLowerCase()) ||
                    i.productId.toString().contains(_searchQuery);
              }).toList();
            }

            return Column(
              children: [
                // Summary cards
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      _SummaryCard(
                        label: 'المنتجات',
                        value: '$totalProducts',
                        icon: Icons.inventory_2,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 8),
                      _SummaryCard(
                        label: 'متوفر',
                        value: '$availableProducts',
                        icon: Icons.check_circle,
                        color: AppTheme.successColor,
                      ),
                      const SizedBox(width: 8),
                      _SummaryCard(
                        label: 'نفذ',
                        value: '$outOfStockProducts',
                        icon: Icons.cancel,
                        color: AppTheme.dangerColor,
                      ),
                    ],
                  ),
                ),

                // Total value banner
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.primaryColor,
                          AppTheme.primaryColor.withValues(alpha: 0.8),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.account_balance_wallet, color: Colors.white70, size: 20),
                        const SizedBox(width: 8),
                        const Text('القيمة الإجمالية', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        const SizedBox(width: 12),
                        Text(
                          '${totalValue.toStringAsFixed(0)} د.ج',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Search + filter
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          onChanged: (v) => setState(() => _searchQuery = v),
                          decoration: InputDecoration(
                            hintText: 'بحث...',
                            prefixIcon: const Icon(Icons.search, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SegmentedButton<String>(
                        segments: const [
                          ButtonSegment(value: 'all', label: Text('الكل')),
                          ButtonSegment(value: 'available', label: Text('متوفر')),
                          ButtonSegment(value: 'soldOut', label: Text('نفذ')),
                        ],
                        selected: {_filterMode},
                        onSelectionChanged: (s) => setState(() => _filterMode = s.first),
                        style: const ButtonStyle(
                          visualDensity: VisualDensity.compact,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                // Product list
                Expanded(
                  child: filtered.isEmpty
                      ? const Center(child: Text('لا توجد نتائج', style: TextStyle(color: Colors.grey)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            return _StockCard(item: filtered[index]);
                          },
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _SummaryCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
            Text(label, style: TextStyle(fontSize: 9, color: color.withValues(alpha: 0.8))),
          ],
        ),
      ),
    );
  }
}

class _StockCard extends StatelessWidget {
  final StockItemInfo item;

  const _StockCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final available = item.availableQuantity;
    final isOutOfStock = available <= 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isOutOfStock
            ? BorderSide(color: AppTheme.dangerColor.withValues(alpha: 0.3))
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product name + status badge
            Row(
              children: [
                Expanded(
                  child: Text(
                    item.productName ?? 'منتج #${item.productId}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isOutOfStock
                        ? AppTheme.dangerColor.withValues(alpha: 0.1)
                        : AppTheme.successColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isOutOfStock ? 'نفذ' : 'متوفر',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isOutOfStock ? AppTheme.dangerColor : AppTheme.successColor,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Quantity display: pieces + cartons
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isOutOfStock
                    ? Colors.grey[50]
                    : AppTheme.primaryColor.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.inventory_2_outlined,
                    size: 18,
                    color: isOutOfStock ? Colors.grey : AppTheme.primaryColor,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'الكمية: ',
                    style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                  ),
                  Text(
                    _formatStockQty(available, item.piecesPerPackage),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: isOutOfStock ? AppTheme.dangerColor : AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Price info
            Row(
              children: [
                // Retail price (default)
                Icon(Icons.sell_outlined, size: 14, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(
                  'تجزئة: ${item.retailPrice.toStringAsFixed(2)} د.ج/قطعة',
                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                ),
                if (item.piecesPerPackage > 1) ...[
                  const SizedBox(width: 12),
                  Icon(Icons.widgets_outlined, size: 14, color: Colors.orange[400]),
                  const SizedBox(width: 4),
                  Text(
                    '${item.piecesPerPackage} ق/كرتون',
                    style: TextStyle(fontSize: 12, color: Colors.orange[700]),
                  ),
                ],
              ],
            ),

            // Value of stock
            if (!isOutOfStock) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'القيمة: ${(item.retailPrice * available * item.piecesPerPackage).toStringAsFixed(0)} د.ج',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.successColor.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
