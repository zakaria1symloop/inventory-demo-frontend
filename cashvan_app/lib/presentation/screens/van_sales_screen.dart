import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/sale_model.dart';
import '../../providers/session_provider.dart';
import '../../core/theme/app_theme.dart';

class VanSalesScreen extends ConsumerWidget {
  const VanSalesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final salesAsync = ref.watch(mySalesProvider(null));

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('قائمة المبيعات'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref.invalidate(mySalesProvider(null)),
            ),
          ],
        ),
        body: salesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('خطأ: $error'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(mySalesProvider(null)),
                  child: const Text('إعادة المحاولة'),
                ),
              ],
            ),
          ),
          data: (sales) {
            if (sales.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('لا توجد مبيعات اليوم', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              );
            }

            // Summary at top
            final totalAmount = sales.fold<double>(0, (s, sale) => s + sale.grandTotal);
            final totalPaid = sales.fold<double>(0, (s, sale) => s + sale.paidAmount);

            return Column(
              children: [
                // Sales summary
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppTheme.primaryColor, AppTheme.primaryColor.withValues(alpha: 0.8)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        children: [
                          const Text('المبيعات', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          Text('${sales.length}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                        ],
                      ),
                      Container(width: 1, height: 30, color: Colors.white30),
                      Column(
                        children: [
                          const Text('الإجمالي', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          Text('${totalAmount.toStringAsFixed(0)} د.ج', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                      Container(width: 1, height: 30, color: Colors.white30),
                      Column(
                        children: [
                          const Text('المحصّل', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          Text('${totalPaid.toStringAsFixed(0)} د.ج', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: () async => ref.invalidate(mySalesProvider(null)),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: sales.length,
                      itemBuilder: (context, index) {
                        final sale = sales[index];
                        return _SaleCard(sale: sale);
                      },
                    ),
                  ),
                ),
              ],
            );
          },
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () async {
            final result = await Navigator.pushNamed(context, '/create-sale');
            if (result == true) {
              ref.invalidate(mySalesProvider(null));
            }
          },
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

class _SaleCard extends StatelessWidget {
  final SaleModel sale;

  const _SaleCard({required this.sale});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, '/sale-detail', arguments: sale),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          sale.reference ?? '#${sale.id}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          sale.clientName ?? 'بيع نقدي',
                          style: TextStyle(color: Colors.grey[600], fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${sale.grandTotal.toStringAsFixed(0)} د.ج',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      _PaymentBadge(status: sale.paymentStatus, label: sale.paymentStatusLabel),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.access_time, size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(sale.createdAt ?? sale.date),
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  ),
                  const Spacer(),
                  Text(
                    '${sale.items.length} منتج',
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }
}

class _PaymentBadge extends StatelessWidget {
  final String status;
  final String label;

  const _PaymentBadge({required this.status, required this.label});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'paid':
        color = AppTheme.successColor;
        break;
      case 'partial':
        color = AppTheme.warningColor;
        break;
      default:
        color = AppTheme.dangerColor;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}
