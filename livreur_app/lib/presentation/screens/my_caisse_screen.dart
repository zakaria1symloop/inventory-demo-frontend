import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import '../../data/services/api_service.dart';
import '../../core/theme/app_theme.dart';

class MyCaisseScreen extends StatefulWidget {
  const MyCaisseScreen({super.key});

  @override
  State<MyCaisseScreen> createState() => _MyCaisseScreenState();
}

class _MyCaisseScreenState extends State<MyCaisseScreen> {
  Map<String, dynamic>? _caisseData;
  List<Map<String, dynamic>> _transactions = [];
  bool _isLoading = true;
  String? _error;
  String _filter = 'all'; // all, in, out

  @override
  void initState() {
    super.initState();
    _fetchCaisse();
  }

  Future<void> _fetchCaisse() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiService.instance.getMyCaisse();
      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        setState(() {
          _caisseData = data['caisse'] as Map<String, dynamic>?;
          final txList = data['recent_transactions'] as List? ?? [];
          _transactions = txList.cast<Map<String, dynamic>>();
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

  double _parseAmount(dynamic v) {
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0;
    return 0;
  }

  List<Map<String, dynamic>> get _filteredTransactions {
    if (_filter == 'all') return _transactions;
    return _transactions.where((t) => t['type'] == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final balance = _parseAmount(_caisseData?['balance']);
    final totalIn = _transactions.where((t) => t['type'] == 'in').fold<double>(0, (s, t) => s + _parseAmount(t['amount']));
    final totalOut = _transactions.where((t) => t['type'] == 'out').fold<double>(0, (s, t) => s + _parseAmount(t['amount']));

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('الصندوق'),
          actions: [
            IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchCaisse),
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
                        ElevatedButton(onPressed: _fetchCaisse, child: const Text('إعادة المحاولة')),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _fetchCaisse,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Column(
                        children: [
                          // Balance card
                          Container(
                            width: double.infinity,
                            margin: const EdgeInsets.all(16),
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF6A1B9A), Color(0xFFAB47BC)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF6A1B9A).withValues(alpha: 0.3),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                const Text('رصيد الصندوق', style: TextStyle(color: Colors.white70, fontSize: 14)),
                                const SizedBox(height: 8),
                                Text(
                                  '${balance.toStringAsFixed(0)} د.ج',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 32),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    _getCaisseTypeLabel(_caisseData?['type']),
                                    style: const TextStyle(color: Colors.white, fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // In / Out / Net summary
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              children: [
                                _MiniStat(label: 'الوارد', value: totalIn, color: AppTheme.successColor),
                                const SizedBox(width: 8),
                                _MiniStat(label: 'الصادر', value: totalOut, color: AppTheme.dangerColor),
                                const SizedBox(width: 8),
                                _MiniStat(label: 'الصافي', value: totalIn - totalOut, color: AppTheme.primaryColor),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Filter
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              children: [
                                const Text('الحركات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                const Spacer(),
                                _FilterChip(label: 'الكل', selected: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
                                const SizedBox(width: 6),
                                _FilterChip(label: 'وارد', selected: _filter == 'in', onTap: () => setState(() => _filter = 'in')),
                                const SizedBox(width: 6),
                                _FilterChip(label: 'صادر', selected: _filter == 'out', onTap: () => setState(() => _filter = 'out')),
                              ],
                            ),
                          ),

                          const SizedBox(height: 8),

                          // Transactions list
                          if (_filteredTransactions.isEmpty)
                            const Padding(
                              padding: EdgeInsets.all(32),
                              child: Center(child: Text('لا توجد حركات')),
                            )
                          else
                            ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _filteredTransactions.length,
                              itemBuilder: (context, index) {
                                final tx = _filteredTransactions[index];
                                final isIn = tx['type'] == 'in';
                                final amount = _parseAmount(tx['amount']);
                                final description = tx['description'] ?? tx['source_type_label'] ?? '';
                                final creator = tx['creator']?['name'] ?? '';
                                final date = tx['created_at'] != null
                                    ? DateFormat('dd/MM HH:mm').format(DateTime.tryParse(tx['created_at'].toString()) ?? DateTime.now())
                                    : '';

                                return Card(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  child: ListTile(
                                    dense: true,
                                    leading: Container(
                                      width: 36,
                                      height: 36,
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
                                      description.toString(),
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    subtitle: Text(
                                      '$creator  $date',
                                      style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                    ),
                                    trailing: Text(
                                      '${isIn ? '+' : '-'}${amount.toStringAsFixed(0)} د.ج',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        color: isIn ? AppTheme.successColor : AppTheme.dangerColor,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
      ),
    );
  }

  String _getCaisseTypeLabel(String? type) {
    switch (type) {
      case 'principale':
        return 'صندوق رئيسي';
      case 'vendeur':
        return 'صندوق بائع';
      case 'livreur':
        return 'صندوق سائق';
      case 'cashvan':
        return 'صندوق متنقل';
      default:
        return 'صندوق';
    }
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final double value;
  final Color color;

  const _MiniStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Column(
          children: [
            Text(
              '${value.toStringAsFixed(0)}',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color),
            ),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, color: color)),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryColor : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.grey[700],
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
