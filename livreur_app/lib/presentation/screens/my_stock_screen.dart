import 'package:flutter/material.dart';
import '../../data/services/api_service.dart';
import '../../core/theme/app_theme.dart';

class MyStockScreen extends StatefulWidget {
  const MyStockScreen({super.key});

  @override
  State<MyStockScreen> createState() => _MyStockScreenState();
}

class _MyStockScreenState extends State<MyStockScreen> {
  List<Map<String, dynamic>> _stock = [];
  bool _isLoading = true;
  String? _error;
  String _filter = 'all'; // all, available, empty
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchStock();
  }

  Future<void> _fetchStock() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiService.instance.getMyStock();
      if (response.statusCode == 200) {
        final data = response.data;
        List items;
        if (data is List) {
          items = data;
        } else if (data is Map && data.containsKey('data')) {
          items = data['data'] as List;
        } else {
          items = [];
        }
        setState(() {
          _stock = items.cast<Map<String, dynamic>>();
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

  List<Map<String, dynamic>> get _filteredStock {
    var list = _stock;
    if (_filter == 'available') {
      list = list.where((s) => _getQty(s) > 0).toList();
    } else if (_filter == 'empty') {
      list = list.where((s) => _getQty(s) <= 0).toList();
    }
    if (_searchQuery.isNotEmpty) {
      list = list.where((s) {
        final name = (s['product']?['name'] ?? '').toString().toLowerCase();
        return name.contains(_searchQuery.toLowerCase());
      }).toList();
    }
    return list;
  }

  int _getQty(Map<String, dynamic> item) {
    final q = item['quantity'];
    if (q is int) return q;
    if (q is double) return q.toInt();
    if (q is String) return double.tryParse(q)?.toInt() ?? 0;
    return 0;
  }

  int _getPpp(Map<String, dynamic> item) {
    final p = item['product']?['pieces_per_package'];
    if (p is int) return p > 0 ? p : 1;
    if (p is double) return p > 0 ? p.toInt() : 1;
    return 1;
  }

  double _getRetailPrice(Map<String, dynamic> item) {
    final p = item['product']?['retail_price'];
    if (p is num) return p.toDouble();
    if (p is String) return double.tryParse(p) ?? 0;
    return 0;
  }

  String _formatQty(int totalPieces, int ppp) {
    if (ppp <= 1) return '$totalPieces قطعة';
    final cartons = totalPieces ~/ ppp;
    final pieces = totalPieces % ppp;
    if (cartons == 0) return '$pieces قطعة';
    if (pieces == 0) return '$cartons كرتون';
    return '$cartons كرتون + $pieces قطعة';
  }

  @override
  Widget build(BuildContext context) {
    final availableCount = _stock.where((s) => _getQty(s) > 0).length;
    final emptyCount = _stock.where((s) => _getQty(s) <= 0).length;
    final totalValue = _stock.fold<double>(0, (sum, s) {
      return sum + (_getQty(s) * _getRetailPrice(s));
    });

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('مخزون المستودع'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _fetchStock,
            ),
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
                        ElevatedButton(onPressed: _fetchStock, child: const Text('إعادة المحاولة')),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _fetchStock,
                    child: Column(
                      children: [
                        // Summary cards
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  _SummaryCard(
                                    icon: Icons.inventory_2,
                                    label: 'المنتجات',
                                    value: '${_stock.length}',
                                    color: AppTheme.primaryColor,
                                  ),
                                  const SizedBox(width: 8),
                                  _SummaryCard(
                                    icon: Icons.check_circle,
                                    label: 'متوفر',
                                    value: '$availableCount',
                                    color: AppTheme.successColor,
                                  ),
                                  const SizedBox(width: 8),
                                  _SummaryCard(
                                    icon: Icons.remove_circle,
                                    label: 'نفذ',
                                    value: '$emptyCount',
                                    color: AppTheme.dangerColor,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // Total value
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF1565C0), Color(0xFF42A5F5)],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('القيمة الإجمالية', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                    Text(
                                      '${totalValue.toStringAsFixed(0)} د.ج',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Search + Filter
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            children: [
                              TextField(
                                decoration: InputDecoration(
                                  hintText: 'بحث عن منتج...',
                                  prefixIcon: const Icon(Icons.search),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                  isDense: true,
                                ),
                                onChanged: (v) => setState(() => _searchQuery = v),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  _FilterChip(label: 'الكل', selected: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
                                  const SizedBox(width: 8),
                                  _FilterChip(label: 'متوفر', selected: _filter == 'available', onTap: () => setState(() => _filter = 'available')),
                                  const SizedBox(width: 8),
                                  _FilterChip(label: 'نفذ', selected: _filter == 'empty', onTap: () => setState(() => _filter = 'empty')),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Product list
                        Expanded(
                          child: _filteredStock.isEmpty
                              ? const Center(child: Text('لا توجد منتجات'))
                              : ListView.builder(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  itemCount: _filteredStock.length,
                                  itemBuilder: (context, index) {
                                    final item = _filteredStock[index];
                                    final product = item['product'] as Map<String, dynamic>? ?? {};
                                    final qty = _getQty(item);
                                    final ppp = _getPpp(item);
                                    final retailPrice = _getRetailPrice(item);
                                    final isAvailable = qty > 0;

                                    return Card(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      child: Padding(
                                        padding: const EdgeInsets.all(12),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    product['name'] ?? 'منتج',
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 14,
                                                      color: isAvailable ? null : Colors.grey,
                                                    ),
                                                  ),
                                                ),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                  decoration: BoxDecoration(
                                                    color: isAvailable ? AppTheme.successColor.withValues(alpha: 0.1) : AppTheme.dangerColor.withValues(alpha: 0.1),
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: Text(
                                                    isAvailable ? 'متوفر' : 'نفذ',
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.bold,
                                                      color: isAvailable ? AppTheme.successColor : AppTheme.dangerColor,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                Icon(Icons.inventory_2_outlined, size: 16, color: Colors.blue[700]),
                                                const SizedBox(width: 4),
                                                Text(
                                                  _formatQty(qty, ppp),
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.w600,
                                                    color: Colors.blue[700],
                                                  ),
                                                ),
                                                const Spacer(),
                                                if (ppp > 1) ...[
                                                  Text(
                                                    '$ppp قطعة/كرتون',
                                                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                                  ),
                                                  const SizedBox(width: 12),
                                                ],
                                                Text(
                                                  '${retailPrice.toStringAsFixed(0)} د.ج/قطعة',
                                                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                                ),
                                              ],
                                            ),
                                            if (qty > 0) ...[
                                              const SizedBox(height: 4),
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.end,
                                                children: [
                                                  Text(
                                                    'القيمة: ${(qty * retailPrice).toStringAsFixed(0)} د.ج',
                                                    style: TextStyle(
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w600,
                                                      color: Colors.orange[800],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _SummaryCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color)),
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryColor : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.grey[700],
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
