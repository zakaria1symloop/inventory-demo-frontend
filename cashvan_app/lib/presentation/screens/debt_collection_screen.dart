import 'package:flutter/material.dart';
import '../../data/models/client_model.dart';
import '../../data/services/api_service.dart';
import '../../core/theme/app_theme.dart';

class DebtCollectionScreen extends StatefulWidget {
  const DebtCollectionScreen({super.key});

  @override
  State<DebtCollectionScreen> createState() => _DebtCollectionScreenState();
}

class _DebtCollectionScreenState extends State<DebtCollectionScreen> {
  List<ClientModel> _clients = [];
  bool _isLoading = true;
  bool _hasLoaded = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    debugPrint('[DEBT] initState - loading clients');
    _loadClients();
  }

  Future<void> _loadClients() async {
    debugPrint('[DEBT] _loadClients called');
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService.instance.getClients(params: {'per_page': 1000});
      debugPrint('[DEBT] API response: ${response.statusCode}');
      if (!mounted) return;

      final data = response.data;
      final List clientsList = data is Map ? (data["data"] ?? []) : (data is List ? data : []);
      debugPrint('[DEBT] Total clients fetched: ${clientsList.length}');

      final clients = <ClientModel>[];
      for (var c in clientsList) {
        try {
          final client = ClientModel.fromJson(c);
          debugPrint('[DEBT] Client ${client.name}: balance=${client.balance}, combinedDebt=${client.combinedDebt}, totalDebt=${client.totalDebt}');
          if (client.totalDebt > 0) {
            clients.add(client);
          }
        } catch (e) {
          debugPrint('[DEBT] Parse error for client: $e');
        }
      }

      clients.sort((a, b) => b.totalDebt.compareTo(a.totalDebt));
      debugPrint('[DEBT] Clients with debt: ${clients.length}');

      if (!mounted) return;
      setState(() {
        _clients = clients;
        _isLoading = false;
        _hasLoaded = true;
      });
    } catch (e) {
      debugPrint('[DEBT] Error: $e');
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _hasLoaded = true;
        _error = e.toString();
      });
    }
  }

  Future<void> _collectPayment(ClientModel client, double amount, String? notes) async {
    try {
      final response = await ApiService.instance.recordClientPayment(
        client.id,
        amount,
        notes,
      );

      if (!mounted) return;

      if (response.statusCode == 201 || response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('تم تحصيل ${amount.toStringAsFixed(0)} د.ج من ${client.name}'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        // Reload fresh data after successful payment
        await _loadClients();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشل تسجيل الدفعة')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطأ: $e')),
      );
    }
  }

  void _showPaymentDialog(ClientModel client) {
    final amountController = TextEditingController();
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('تحصيل دفعة', style: TextStyle(fontSize: 18)),
              Text(client.name, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.dangerColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('الدين الحالي:', style: TextStyle(fontWeight: FontWeight.w600)),
                    Text(
                      '${client.totalDebt.toStringAsFixed(0)} د.ج',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.dangerColor,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'المبلغ المحصل',
                  border: OutlineInputBorder(),
                  suffixText: 'د.ج',
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ActionChip(
                    label: const Text('الكل', style: TextStyle(fontSize: 12)),
                    onPressed: () => amountController.text = client.totalDebt.toStringAsFixed(0),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                  if (client.totalDebt >= 1000)
                    ActionChip(
                      label: Text('${(client.totalDebt / 2).toStringAsFixed(0)}', style: const TextStyle(fontSize: 12)),
                      onPressed: () => amountController.text = (client.totalDebt / 2).toStringAsFixed(0),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
              const SizedBox(height: 12),
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
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('إلغاء'),
            ),
            ElevatedButton.icon(
              onPressed: () {
                final amount = double.tryParse(amountController.text);
                if (amount == null || amount <= 0) {
                  ScaffoldMessenger.of(dialogContext).showSnackBar(
                    const SnackBar(content: Text('يرجى إدخال مبلغ صحيح')),
                  );
                  return;
                }
                if (amount > client.totalDebt) {
                  ScaffoldMessenger.of(dialogContext).showSnackBar(
                    const SnackBar(content: Text('المبلغ أكبر من الدين')),
                  );
                  return;
                }
                Navigator.pop(dialogContext);
                _collectPayment(client, amount, notesController.text.trim().isEmpty ? null : notesController.text.trim());
              },
              icon: const Icon(Icons.payments, size: 18),
              label: const Text('تحصيل'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('تحصيل الديون')),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    // Show loader on first load or when refreshing after payment
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('خطأ: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadClients, child: const Text('إعادة المحاولة')),
          ],
        ),
      );
    }

    if (_hasLoaded && _clients.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 80, color: AppTheme.successColor),
            SizedBox(height: 16),
            Text('لا يوجد ديون مستحقة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('جميع العملاء قاموا بتسديد مستحقاتهم', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    final totalDebt = _clients.fold<double>(0, (sum, c) => sum + c.totalDebt);

    return Column(
      children: [
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.dangerColor, AppTheme.dangerColor.withValues(alpha: 0.8)],
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
                    const Text('إجمالي الديون المستحقة', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(
                      '${totalDebt.toStringAsFixed(0)} د.ج',
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
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
                  '${_clients.length} عميل',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadClients,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _clients.length,
              itemBuilder: (context, index) {
                final client = _clients[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: AppTheme.dangerColor.withValues(alpha: 0.1),
                          child: Text(
                            client.name.isNotEmpty ? client.name.substring(0, 1) : '?',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.dangerColor),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(client.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                              if (client.phone != null)
                                Text(client.phone!, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${client.totalDebt.toStringAsFixed(0)} د.ج',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.dangerColor),
                            ),
                            const SizedBox(height: 6),
                            ElevatedButton.icon(
                              onPressed: () => _showPaymentDialog(client),
                              icon: const Icon(Icons.payments, size: 16),
                              label: const Text('تحصيل', style: TextStyle(fontSize: 13)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.successColor,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
