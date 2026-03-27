import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/client_model.dart';
import '../../data/services/api_service.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

final clientsListProvider = FutureProvider.autoDispose.family<List<ClientModel>, String?>((ref, search) async {
  debugPrint('[CLIENTS] Fetching...');
  final response = await ApiService.instance.getClients(
    params: search != null && search.isNotEmpty ? {"search": search} : null,
  );
  final data = response.data;

  final List clientsList = data is Map ? (data["data"] ?? []) : data;

  final result = <ClientModel>[];
  for (var c in clientsList) {
    try {
      result.add(ClientModel.fromJson(c));
    } catch (e) {
      debugPrint('[CLIENTS] ERROR: $e');
    }
  }
  return result;
});

class ClientsScreen extends ConsumerStatefulWidget {
  const ClientsScreen({super.key});

  @override
  ConsumerState<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends ConsumerState<ClientsScreen> {
  String _searchQuery = "";
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final clientsAsync = ref.watch(clientsListProvider(_searchQuery.isEmpty ? null : _searchQuery));

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('العملاء'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref.invalidate(clientsListProvider(_searchQuery.isEmpty ? null : _searchQuery)),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () async {
            final result = await Navigator.pushNamed(context, '/add-client');
            if (result == true) {
              ref.invalidate(clientsListProvider(_searchQuery.isEmpty ? null : _searchQuery));
            }
          },
          child: const Icon(Icons.person_add),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: "بحث عن عميل...",
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = "");
                          },
                        )
                      : null,
                ),
                onChanged: (value) {
                  setState(() => _searchQuery = value);
                },
              ),
            ),
            Expanded(
              child: clientsAsync.when(
                data: (clients) {
                  if (clients.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.store_outlined, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text("لا يوجد عملاء", style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(clientsListProvider(_searchQuery.isEmpty ? null : _searchQuery));
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: clients.length,
                      itemBuilder: (context, index) {
                        final client = clients[index];
                        return _ClientCard(client: client);
                      },
                    ),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => Center(child: Text("Error: $error")),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ClientCard extends ConsumerWidget {
  final ClientModel client;

  const _ClientCard({required this.client});

  void _showPaymentDialog(BuildContext parentContext, WidgetRef ref) {
    final TextEditingController amountController = TextEditingController();
    final TextEditingController notesController = TextEditingController();

    showDialog(
      context: parentContext,
      builder: (dialogContext) => AlertDialog(
        title: const Text('تحصيل دفعة', style: TextStyle(fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('الدين الحالي: ${client.totalDebt.toStringAsFixed(2)} د.ج',
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.dangerColor)),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'المبلغ المحصل',
                border: OutlineInputBorder(),
                suffixText: 'د.ج',
              ),
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
          ElevatedButton(
            onPressed: () async {
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

              try {
                final response = await ApiService.instance.recordClientPayment(
                  client.id,
                  amount,
                  notesController.text.trim().isEmpty ? null : notesController.text.trim(),
                );

                if (!parentContext.mounted) return;

                if (response.statusCode == 201 || response.statusCode == 200) {
                  ScaffoldMessenger.of(parentContext).showSnackBar(
                    SnackBar(content: Text('تم تحصيل ${amount.toStringAsFixed(2)} د.ج')),
                  );
                  ref.invalidate(clientsListProvider);
                } else {
                  ScaffoldMessenger.of(parentContext).showSnackBar(
                    const SnackBar(content: Text('فشل تسجيل الدفعة')),
                  );
                }
              } catch (e) {
                if (!parentContext.mounted) return;
                ScaffoldMessenger.of(parentContext).showSnackBar(
                  SnackBar(content: Text('خطأ: $e')),
                );
              }
            },
            child: const Text('تحصيل'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canCollectDebt = ref.watch(authProvider).user?.canCollectDebt == true;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
              child: Text(
                client.name.isNotEmpty ? client.name.substring(0, 1) : "?",
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    client.name,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  if (client.phone != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.phone, size: 14, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text(client.phone!, style: const TextStyle(color: Colors.grey)),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  "${client.totalDebt.toStringAsFixed(2)} د.ج",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: client.totalDebt > 0 ? AppTheme.dangerColor : AppTheme.successColor,
                  ),
                ),
                if (client.totalDebt > 0 && canCollectDebt) ...[
                  const SizedBox(height: 4),
                  ElevatedButton.icon(
                    onPressed: () => _showPaymentDialog(context, ref),
                    icon: const Icon(Icons.payments, size: 14),
                    label: const Text('تحصيل', style: TextStyle(fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
