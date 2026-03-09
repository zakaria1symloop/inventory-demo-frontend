import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import '../../data/services/api_service.dart';
import '../../core/theme/app_theme.dart';

class DeliveryStatsScreen extends StatefulWidget {
  const DeliveryStatsScreen({super.key});

  @override
  State<DeliveryStatsScreen> createState() => _DeliveryStatsScreenState();
}

class _DeliveryStatsScreenState extends State<DeliveryStatsScreen> {
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;
  String? _error;
  String _period = 'today'; // today, week, month

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final now = DateTime.now();
      String fromDate;
      String toDate = DateFormat('yyyy-MM-dd').format(now);

      switch (_period) {
        case 'week':
          fromDate = DateFormat('yyyy-MM-dd').format(now.subtract(const Duration(days: 7)));
          break;
        case 'month':
          fromDate = DateFormat('yyyy-MM-dd').format(DateTime(now.year, now.month, 1));
          break;
        default: // today
          fromDate = toDate;
      }

      final response = await ApiService.instance.getLivreurStats(fromDate: fromDate, toDate: toDate);
      if (response.statusCode == 200) {
        setState(() {
          _stats = response.data as Map<String, dynamic>? ?? {};
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  int _parseInt(dynamic v) {
    if (v is int) return v;
    if (v is double) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  double _parseDouble(dynamic v) {
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0;
    return 0;
  }

  void _changePeriod(String period) {
    setState(() => _period = period);
    _fetchStats();
  }

  @override
  Widget build(BuildContext context) {
    final totalDeliveries = _parseInt(_stats['total_deliveries']);
    final completed = _parseInt(_stats['completed']);
    final totalOrders = _parseInt(_stats['total_orders']);
    final delivered = _parseInt(_stats['delivered']);
    final failed = _parseInt(_stats['failed']);
    final deliveryRate = _parseDouble(_stats['delivery_rate']);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('إحصائيات التوصيل'),
          actions: [
            IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchStats),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppTheme.dangerColor),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _fetchStats, child: const Text('إعادة المحاولة')),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _fetchStats,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Period selector
                          Row(
                            children: [
                              _PeriodChip(label: 'اليوم', selected: _period == 'today', onTap: () => _changePeriod('today')),
                              const SizedBox(width: 8),
                              _PeriodChip(label: 'الأسبوع', selected: _period == 'week', onTap: () => _changePeriod('week')),
                              const SizedBox(width: 8),
                              _PeriodChip(label: 'الشهر', selected: _period == 'month', onTap: () => _changePeriod('month')),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // Delivery rate circle
                          Center(
                            child: Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 10,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                children: [
                                  SizedBox(
                                    width: 120,
                                    height: 120,
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        SizedBox(
                                          width: 120,
                                          height: 120,
                                          child: CircularProgressIndicator(
                                            value: totalOrders > 0 ? deliveryRate / 100 : 0,
                                            strokeWidth: 10,
                                            backgroundColor: Colors.grey.shade200,
                                            valueColor: AlwaysStoppedAnimation(
                                              deliveryRate >= 80
                                                  ? AppTheme.successColor
                                                  : deliveryRate >= 50
                                                      ? Colors.orange
                                                      : AppTheme.dangerColor,
                                            ),
                                          ),
                                        ),
                                        Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              '${deliveryRate.toStringAsFixed(0)}%',
                                              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                                            ),
                                            const Text('نسبة النجاح', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Stats grid
                          Row(
                            children: [
                              _StatCard(
                                icon: Icons.local_shipping,
                                label: 'الرحلات',
                                value: '$totalDeliveries',
                                color: AppTheme.primaryColor,
                              ),
                              const SizedBox(width: 10),
                              _StatCard(
                                icon: Icons.check_circle,
                                label: 'مكتملة',
                                value: '$completed',
                                color: AppTheme.successColor,
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              _StatCard(
                                icon: Icons.shopping_bag,
                                label: 'إجمالي الطلبات',
                                value: '$totalOrders',
                                color: Colors.blue,
                              ),
                              const SizedBox(width: 10),
                              _StatCard(
                                icon: Icons.done_all,
                                label: 'تم التوصيل',
                                value: '$delivered',
                                color: AppTheme.successColor,
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              _StatCard(
                                icon: Icons.cancel,
                                label: 'فشل',
                                value: '$failed',
                                color: AppTheme.dangerColor,
                              ),
                              const SizedBox(width: 10),
                              _StatCard(
                                icon: Icons.pending,
                                label: 'معلقة',
                                value: '${totalOrders - delivered - failed}',
                                color: Colors.orange,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
      ),
    );
  }
}

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _PeriodChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryColor : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          boxShadow: selected
              ? [BoxShadow(color: AppTheme.primaryColor.withValues(alpha: 0.3), blurRadius: 6, offset: const Offset(0, 2))]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.grey[700],
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
                Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
