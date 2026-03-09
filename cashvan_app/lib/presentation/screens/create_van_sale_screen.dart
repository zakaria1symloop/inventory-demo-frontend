import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../data/models/client_model.dart';
import '../../data/services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/session_provider.dart';
import '../../providers/van_cart_provider.dart';
import '../../core/theme/app_theme.dart';

// Pagination state
class PaginatedState<T> {
  final List<T> items;
  final bool isLoading;
  final bool hasMore;
  final int currentPage;
  final String? error;

  PaginatedState({
    this.items = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.error,
  });

  PaginatedState<T> copyWith({
    List<T>? items,
    bool? isLoading,
    bool? hasMore,
    int? currentPage,
    String? error,
  }) {
    return PaginatedState<T>(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      error: error,
    );
  }
}

// Clients notifier with search+pagination
class SaleClientsNotifier extends StateNotifier<PaginatedState<ClientModel>> {
  String _searchQuery = '';

  SaleClientsNotifier() : super(PaginatedState<ClientModel>()) {
    loadClients();
  }

  Future<void> loadClients({bool refresh = false}) async {
    if (state.isLoading) return;
    if (!refresh && !state.hasMore) return;

    final page = refresh ? 1 : state.currentPage;
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await ApiService.instance.getClients(params: {
        'page': page,
        'per_page': 20,
        if (_searchQuery.isNotEmpty) 'search': _searchQuery,
      });

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> clientsList;
        int? lastPage;

        if (data is Map) {
          clientsList = data['data'] as List<dynamic>? ?? [];
          lastPage = data['last_page'] as int?;
        } else if (data is List) {
          clientsList = data;
        } else {
          clientsList = [];
        }

        final clients = clientsList.map((json) => ClientModel.fromJson(json)).toList();
        final hasMore = lastPage != null ? page < lastPage : clients.length >= 20;

        state = state.copyWith(
          items: refresh ? clients : [...state.items, ...clients],
          isLoading: false,
          hasMore: hasMore,
          currentPage: page + 1,
        );
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(isLoading: false, error: e.toString());
      }
    }
  }

  void search(String query) {
    if (!mounted) return;
    _searchQuery = query;
    state = PaginatedState<ClientModel>();
    loadClients(refresh: true);
  }

  void refresh() {
    if (!mounted) return;
    state = PaginatedState<ClientModel>();
    loadClients(refresh: true);
  }
}

final saleClientsProvider = StateNotifierProvider<SaleClientsNotifier, PaginatedState<ClientModel>>((ref) {
  return SaleClientsNotifier();
});

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

class CreateVanSaleScreen extends ConsumerStatefulWidget {
  const CreateVanSaleScreen({super.key});

  @override
  ConsumerState<CreateVanSaleScreen> createState() => _CreateVanSaleScreenState();
}

class _CreateVanSaleScreenState extends ConsumerState<CreateVanSaleScreen> {
  int _currentStep = 0;
  final _clientSearchController = TextEditingController();
  final _clientScrollController = ScrollController();
  final _paidAmountController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isSubmitting = false;
  String _productSearch = '';
  bool _showOutOfStock = false;

  final Map<int, TextEditingController> _qtyControllers = {};
  final Map<int, TextEditingController> _piecesControllers = {};

  DateTime? _lastClientSearch;

  @override
  void initState() {
    super.initState();
    _clientScrollController.addListener(_onClientScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(cartProvider.notifier).clearCart();
      // Refresh clients list to get latest category/pricing data
      ref.invalidate(saleClientsProvider);
    });
  }

  void _onClientScroll() {
    if (_clientScrollController.position.pixels >=
        _clientScrollController.position.maxScrollExtent - 200) {
      ref.read(saleClientsProvider.notifier).loadClients();
    }
  }

  void _onClientSearchChanged(String value) {
    setState(() {});
    _lastClientSearch = DateTime.now();
    Future.delayed(const Duration(milliseconds: 500), () {
      if (_lastClientSearch != null &&
          DateTime.now().difference(_lastClientSearch!).inMilliseconds >= 500) {
        ref.read(saleClientsProvider.notifier).search(value);
      }
    });
  }

  @override
  void dispose() {
    _clientSearchController.dispose();
    _clientScrollController.dispose();
    _paidAmountController.dispose();
    _notesController.dispose();
    for (var c in _qtyControllers.values) {
      c.dispose();
    }
    for (var c in _piecesControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _getQtyController(int productId, int currentQty) {
    if (!_qtyControllers.containsKey(productId)) {
      _qtyControllers[productId] = TextEditingController(text: currentQty.toString());
    } else if (_qtyControllers[productId]!.text != currentQty.toString()) {
      _qtyControllers[productId]!.text = currentQty.toString();
    }
    return _qtyControllers[productId]!;
  }

  TextEditingController _getPiecesController(int productId, int currentPieces) {
    if (!_piecesControllers.containsKey(productId)) {
      _piecesControllers[productId] = TextEditingController(text: currentPieces.toString());
    } else if (_piecesControllers[productId]!.text != currentPieces.toString()) {
      _piecesControllers[productId]!.text = currentPieces.toString();
    }
    return _piecesControllers[productId]!;
  }

  void _selectClient(ClientModel client) {
    ref.read(cartProvider.notifier).setClient(
      client.id,
      client.name,
      clientCategoryId: client.clientCategoryId,
    );
    setState(() => _currentStep = 1);
  }

  void _skipClient() {
    ref.read(cartProvider.notifier).clearClient();
    setState(() => _currentStep = 1);
  }

  void _showConfirmDialog() {
    final cart = ref.read(cartProvider);
    final paid = double.tryParse(_paidAmountController.text) ?? 0;
    final debt = cart.totalAmount - paid;
    final hasDebt = debt > 0;

    showDialog(
      context: context,
      builder: (dialogContext) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: const Text('تأكيد البيع'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('الإجمالي:'),
                  Text('${cart.totalAmount.toStringAsFixed(0)} د.ج',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('المدفوع:'),
                  Text('${paid.toStringAsFixed(0)} د.ج',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              if (hasDebt) ...[
                const Divider(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('الدين:', style: TextStyle(color: Colors.red[700])),
                    Text('${debt.toStringAsFixed(0)} د.ج',
                        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red[700], fontSize: 16)),
                  ],
                ),
              ],
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('العميل:'),
                  Text(cart.clientName ?? 'بيع نقدي',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                _submitSale();
              },
              child: const Text('تأكيد'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitSale() async {
    final cart = ref.read(cartProvider);
    if (cart.items.isEmpty) return;

    // Check no item is below cost price
    for (final item in cart.items) {
      if (item.stockItem.costPrice > 0 && item.unitPrice < item.stockItem.costPrice) {
        _showError('خطأ في السعر',
            'لا يمكن البيع بأقل من سعر الشراء للمنتج: ${item.stockItem.productName ?? ""}');
        return;
      }
    }

    final paidAmount = double.tryParse(_paidAmountController.text) ?? cart.totalAmount;

    // Paid amount cannot exceed grand total
    if (paidAmount > cart.totalAmount) {
      _showError('خطأ', 'المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي');
      return;
    }

    // Require client when creating debt (partial payment)
    if (paidAmount < cart.totalAmount && cart.clientId == null) {
      _showError('خطأ', 'يجب اختيار عميل عند البيع بالدين');
      return;
    }

    final user = ref.read(authProvider).user;
    final warehouseId = user?.warehouseId;

    if (warehouseId == null) {
      _showError('خطأ', 'لم يتم تعيين مستودع لهذا المستخدم');
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final now = DateTime.now();
      final dateStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

      final saleData = {
        'client_id': cart.clientId,
        'warehouse_id': warehouseId,
        'date': dateStr,
        'items': ref.read(cartProvider.notifier).getSaleItems(),
        'paid_amount': paidAmount,
        'notes': _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      };

      final response = await ApiService.instance.createSale(saleData);

      if (response.statusCode == 200 || response.statusCode == 201) {
        ref.read(cartProvider.notifier).clearCart();
        ref.invalidate(myStockProvider);
        ref.invalidate(mySalesProvider(null));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم إنشاء البيع بنجاح'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        final errorMsg = response.data?['message'] ?? 'فشل في إنشاء البيع';
        _showError('خطأ', errorMsg);
      }
    } on DioException catch (e) {
      if (mounted) {
        String errorMessage = 'حدث خطأ غير متوقع';
        if (e.response?.data != null) {
          final data = e.response!.data;
          if (data is Map && data.containsKey('message')) {
            errorMessage = data['message'];
          }
        }
        _showError('خطأ في البيع', errorMessage);
      }
    } catch (e) {
      if (mounted) {
        _showError('خطأ', 'حدث خطأ: $e');
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showError(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.red),
              const SizedBox(width: 8),
              Expanded(child: Text(title)),
            ],
          ),
          content: Text(message, style: const TextStyle(fontSize: 16)),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('حسناً'),
            ),
          ],
        ),
      ),
    );
  }

  Future<bool> _onWillPop() async {
    final cart = ref.read(cartProvider);
    if (cart.items.isEmpty) return true;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: const Text('تنبيه'),
          content: Text('لديك ${cart.items.length} منتج في السلة. هل تريد الخروج وفقدان البيانات؟'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('البقاء'),
            ),
            TextButton(
              onPressed: () {
                ref.read(cartProvider.notifier).clearCart();
                Navigator.pop(context, true);
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('خروج'),
            ),
          ],
        ),
      ),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);

    return PopScope(
      canPop: _currentStep == 0 && cart.items.isEmpty,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (_currentStep > 0) {
          if (_currentStep == 1 && cart.items.isNotEmpty) {
            final confirm = await _onWillPop();
            if (!confirm) return;
            ref.read(cartProvider.notifier).clearCart();
          }
          setState(() => _currentStep--);
        } else {
          final shouldPop = await _onWillPop();
          if (shouldPop && context.mounted) {
            ref.read(cartProvider.notifier).clearCart();
            Navigator.pop(context);
          }
        }
      },
      child: Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () async {
              if (_currentStep > 0) {
                final cart = ref.read(cartProvider);
                if (_currentStep == 1 && cart.items.isNotEmpty) {
                  final confirm = await _onWillPop();
                  if (!confirm) return;
                  ref.read(cartProvider.notifier).clearCart();
                }
                setState(() => _currentStep--);
              } else {
                final shouldPop = await _onWillPop();
                if (shouldPop && context.mounted) {
                  Navigator.pop(context);
                }
              }
            },
          ),
          title: Text(_getStepTitle()),
          actions: [
            if (cart.items.isNotEmpty)
              Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_cart),
                    onPressed: () => setState(() => _currentStep = 2),
                  ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${cart.items.length}',
                        style: const TextStyle(color: Colors.white, fontSize: 10),
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
        body: _buildCurrentStep(),
        bottomNavigationBar: _buildBottomBar(cart),
      ),
    ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 0:
        return 'اختيار العميل';
      case 1:
        return 'اختيار المنتجات';
      case 2:
        return 'مراجعة البيع';
      default:
        return 'بيع جديد';
    }
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildClientSelection();
      case 1:
        return _buildProductSelection();
      case 2:
        return _buildReview();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildClientSelection() {
    final clientsState = ref.watch(saleClientsProvider);

    return Column(
      children: [
        // Skip client (cash sale) + Add new client
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _skipClient,
                  icon: const Icon(Icons.skip_next),
                  label: const Text('بيع نقدي'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final result = await Navigator.pushNamed(context, '/add-client');
                    if (result == true) {
                      ref.read(saleClientsProvider.notifier).refresh();
                    }
                  },
                  icon: const Icon(Icons.person_add, size: 18),
                  label: const Text('عميل جديد'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.successColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            controller: _clientSearchController,
            decoration: InputDecoration(
              hintText: 'بحث عن عميل...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              suffixIcon: _clientSearchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _clientSearchController.clear();
                        ref.read(saleClientsProvider.notifier).search('');
                        setState(() {});
                      },
                    )
                  : null,
            ),
            onChanged: _onClientSearchChanged,
          ),
        ),
        const SizedBox(height: 8),
        Expanded(child: _buildClientsList(clientsState)),
      ],
    );
  }

  Widget _buildClientsList(PaginatedState<ClientModel> state) {
    if (state.error != null && state.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('خطأ: ${state.error}'),
            ElevatedButton(
              onPressed: () => ref.read(saleClientsProvider.notifier).refresh(),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty && !state.isLoading) {
      return const Center(child: Text('لا يوجد عملاء'));
    }

    return ListView.builder(
      controller: _clientScrollController,
      itemCount: state.items.length + (state.hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == state.items.length) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          );
        }

        final client = state.items[index];
        return ListTile(
          leading: const CircleAvatar(child: Icon(Icons.person)),
          title: Row(
            children: [
              Flexible(child: Text(client.name)),
              if (client.clientCategoryName != null) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: Colors.blue[200]!),
                  ),
                  child: Text(
                    client.clientCategoryName!,
                    style: TextStyle(fontSize: 10, color: Colors.blue[700]),
                  ),
                ),
              ],
            ],
          ),
          subtitle: Text(client.phone ?? ''),
          trailing: const Icon(Icons.arrow_back_ios),
          onTap: () => _selectClient(client),
        );
      },
    );
  }

  Widget _buildProductSelection() {
    final stockAsync = ref.watch(myStockProvider);
    final cart = ref.watch(cartProvider);

    return Column(
      children: [
        // Client info bar (show selected client + category)
        if (cart.clientName != null)
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.person, size: 16, color: AppTheme.primaryColor),
                const SizedBox(width: 6),
                Text(cart.clientName!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                if (cart.clientCategoryId != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange[50],
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: Colors.orange[200]!),
                    ),
                    child: Text(
                      _getClientCategoryLabel(cart),
                      style: TextStyle(fontSize: 10, color: Colors.orange[800]),
                    ),
                  ),
                ],
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'بحث عن منتج...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              suffixIcon: _productSearch.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() => _productSearch = ''),
                    )
                  : null,
            ),
            onChanged: (value) => setState(() => _productSearch = value),
          ),
        ),
        // Switch to show/hide out-of-stock products
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(Icons.visibility, size: 18, color: Colors.grey[600]),
              const SizedBox(width: 6),
              Text(
                'إظهار المنتجات غير المتوفرة',
                style: TextStyle(fontSize: 13, color: Colors.grey[700]),
              ),
              const Spacer(),
              Switch(
                value: _showOutOfStock,
                onChanged: (v) => setState(() => _showOutOfStock = v),
              ),
            ],
          ),
        ),
        Expanded(
          child: stockAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('خطأ: $error'),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(myStockProvider),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            ),
            data: (items) {
              // Filter by stock availability
              var filtered = _showOutOfStock
                  ? items.toList()
                  : items.where((item) => item.availableQuantity > 0).toList();
              if (_productSearch.isNotEmpty) {
                filtered = filtered
                    .where((item) =>
                        (item.productName ?? '').contains(_productSearch) ||
                        item.productId.toString().contains(_productSearch))
                    .toList();
              }

              if (filtered.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('لا توجد منتجات متوفرة'),
                      if (!_showOutOfStock) ...[
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => setState(() => _showOutOfStock = true),
                          child: const Text('إظهار جميع المنتجات'),
                        ),
                      ],
                    ],
                  ),
                );
              }

              return ListView.builder(
                itemCount: filtered.length,
                itemBuilder: (context, index) {
                  final item = filtered[index];
                  final cartItem = cart.items
                      .where((ci) => ci.stockItem.productId == item.productId)
                      .firstOrNull;
                  final inCart = cartItem != null;

                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.productName ?? 'منتج #${item.productId}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                // Price display - uses client category price
                                Builder(builder: (context) {
                                  final cart = ref.watch(cartProvider);
                                  final displayPrice = item.getPriceForCategory(cart.clientCategoryId);
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              displayPrice.toStringAsFixed(2),
                                              style: TextStyle(
                                                color: Theme.of(context).primaryColor,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              'د.ج/قطعة',
                                              style: TextStyle(
                                                color: Theme.of(context).primaryColor.withValues(alpha: 0.8),
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                        if (item.piecesPerPackage > 1)
                                          Text(
                                            '${(displayPrice * item.piecesPerPackage).toStringAsFixed(2)} د.ج/كرتون',
                                            style: TextStyle(
                                              color: Colors.orange[700],
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                      ],
                                    ),
                                  );
                                }),
                                const SizedBox(height: 6),
                                // Available stock in pieces + cartons
                                Row(
                                  children: [
                                    Icon(
                                      item.availableQuantity <= 0
                                          ? Icons.warning_amber_rounded
                                          : Icons.inventory_2_outlined,
                                      size: 14,
                                      color: item.availableQuantity <= 0 ? Colors.red : Colors.grey[600],
                                    ),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        item.availableQuantity <= 0
                                            ? 'غير متوفر'
                                            : 'متوفر: ${_formatStockQty(item.availableQuantity, item.piecesPerPackage)}',
                                        style: TextStyle(
                                          color: item.availableQuantity <= 0 ? Colors.red : Colors.grey[600],
                                          fontSize: 12,
                                          fontWeight: item.availableQuantity <= 0 ? FontWeight.bold : FontWeight.normal,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          if (inCart)
                            _buildCartControls(item, cartItem!)
                          else
                            ElevatedButton.icon(
                              onPressed: item.availableQuantity <= 0
                                  ? null
                                  : () {
                                      ref.read(cartProvider.notifier).addItem(item);
                                    },
                              icon: const Icon(Icons.add, size: 18),
                              label: Text(item.availableQuantity <= 0 ? 'نفذ' : 'إضافة'),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                backgroundColor: item.availableQuantity <= 0 ? Colors.grey : null,
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCartControls(StockItemInfo item, CartItem cartItem) {
    final maxCartons = item.availableQuantity.floor();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Cartons control
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Theme.of(context).primaryColor),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.remove),
                onPressed: () {
                  if (cartItem.quantity > 1) {
                    ref.read(cartProvider.notifier).updateQuantity(
                          item.productId, cartItem.quantity - 1);
                  } else if (cartItem.extraPieces > 0) {
                    ref.read(cartProvider.notifier)
                        .updateQuantity(item.productId, 0);
                  } else {
                    ref.read(cartProvider.notifier)
                        .removeItem(item.productId);
                  }
                },
                iconSize: 20,
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(),
              ),
              SizedBox(
                width: 50,
                child: TextField(
                  controller: _getQtyController(item.productId, cartItem.quantity),
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                    isDense: true,
                  ),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                  onSubmitted: (value) {
                    int qty = int.tryParse(value) ?? 0;
                    if (qty > maxCartons) qty = maxCartons;
                    if (qty > 0) {
                      ref.read(cartProvider.notifier)
                          .updateQuantity(item.productId, qty);
                    } else {
                      ref.read(cartProvider.notifier)
                          .removeItem(item.productId);
                    }
                  },
                ),
              ),
              IconButton(
                icon: Icon(
                  Icons.add,
                  color: cartItem.quantity >= maxCartons
                      ? Colors.grey
                      : null,
                ),
                onPressed: cartItem.quantity >= maxCartons
                    ? null
                    : () {
                        ref.read(cartProvider.notifier).updateQuantity(
                            item.productId, cartItem.quantity + 1);
                      },
                iconSize: 20,
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ),
        Text('كرتون', style: TextStyle(fontSize: 9, color: Colors.grey[600])),
        if (item.piecesPerPackage > 1) ...[
          const SizedBox(height: 4),
          // Extra pieces control
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.orange[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.remove, size: 16),
                  onPressed: cartItem.extraPieces > 0
                      ? () => ref.read(cartProvider.notifier)
                          .updateExtraPieces(item.productId, cartItem.extraPieces - 1)
                      : null,
                  iconSize: 16,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                ),
                SizedBox(
                  width: 30,
                  child: TextField(
                    controller: _getPiecesController(item.productId, cartItem.extraPieces),
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      isDense: true,
                    ),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.orange[800],
                    ),
                    onSubmitted: (value) {
                      int pieces = int.tryParse(value) ?? 0;
                      ref.read(cartProvider.notifier)
                          .updateExtraPieces(item.productId, pieces);
                    },
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.add, size: 16,
                    color: cartItem.extraPieces >= item.piecesPerPackage - 1
                        ? Colors.grey
                        : Colors.orange[800],
                  ),
                  onPressed: cartItem.extraPieces >= item.piecesPerPackage - 1
                      ? null
                      : () => ref.read(cartProvider.notifier)
                          .updateExtraPieces(item.productId, cartItem.extraPieces + 1),
                  iconSize: 16,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                ),
              ],
            ),
          ),
          Text('قطعة', style: TextStyle(fontSize: 9, color: Colors.orange[700])),
        ],
      ],
    );
  }

  String _getClientCategoryLabel(CartState cart) {
    // Try to find category name from selected client
    final clients = ref.read(saleClientsProvider).items;
    final client = clients.where((c) => c.id == cart.clientId).firstOrNull;
    return client?.clientCategoryName ?? 'فئة سعر';
  }

  Widget _buildReview() {
    final cart = ref.watch(cartProvider);

    if (cart.items.isEmpty) {
      return const Center(child: Text('السلة فارغة'));
    }

    // Only set default once (when first entering review step)
    // Don't overwrite if user has cleared or edited the field

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Client card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.person),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('العميل: ${cart.clientName ?? "بيع نقدي"}'),
                      if (cart.clientId != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          _getClientCategoryLabel(cart),
                          style: TextStyle(fontSize: 12, color: Colors.orange[700]),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        // Show existing debt if client has one and user can collect debt
        if (cart.clientId != null)
          Builder(builder: (context) {
            final user = ref.read(authProvider).user;
            if (user?.canCollectDebt != true) return const SizedBox.shrink();
            final clients = ref.read(saleClientsProvider).items;
            final client = clients.where((c) => c.id == cart.clientId).firstOrNull;
            if (client == null || client.totalDebt <= 0) return const SizedBox.shrink();
            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Card(
                color: Colors.red[50],
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: Colors.red[700], size: 22),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'دين سابق',
                          style: TextStyle(color: Colors.red[700], fontWeight: FontWeight.bold),
                        ),
                      ),
                      Text(
                        '${client.totalDebt.toStringAsFixed(0)} د.ج',
                        style: TextStyle(color: Colors.red[700], fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        const SizedBox(height: 16),
        const Text('المنتجات', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ...cart.items.map((item) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.stockItem.productName ?? 'منتج #${item.stockItem.productId}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Wrap(
                          spacing: 6,
                          children: [
                            Text(
                              '${item.unitPrice.toStringAsFixed(0)} د.ج/قطعة',
                              style: TextStyle(color: Colors.grey[600], fontSize: 11),
                            ),
                            if (item.piecesPerPackage > 1)
                              Text(
                                '${(item.unitPrice * item.piecesPerPackage).toStringAsFixed(0)} د.ج/كرتون',
                                style: TextStyle(color: Colors.orange[700], fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${item.subtotal.toStringAsFixed(0)} د.ج',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        item.piecesPerPackage > 1
                            ? '${item.quantity} كرتون${item.extraPieces > 0 ? ' + ${item.extraPieces} ق' : ''}'
                            : '${item.totalPieces} قطعة',
                        style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                    onPressed: () {
                      ref.read(cartProvider.notifier).removeItem(item.stockItem.productId);
                    },
                  ),
                ],
              ),
            ),
          );
        }),
        const Divider(height: 32),

        // Total
        Card(
          color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('الإجمالي', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text(
                  '${cart.totalAmount.toStringAsFixed(0)} د.ج',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Paid amount
        TextField(
          controller: _paidAmountController,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
          ],
          decoration: InputDecoration(
            labelText: 'المبلغ المدفوع',
            suffixText: 'د.ج',
            prefixIcon: const Icon(Icons.payments),
            hintText: cart.totalAmount.toStringAsFixed(0),
          ),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 8),
        // Debt display
        Builder(builder: (context) {
          final paid = double.tryParse(_paidAmountController.text) ?? 0;
          final debt = cart.totalAmount - paid;
          if (paid > cart.totalAmount) {
            return Card(
              color: Colors.red[50],
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Icon(Icons.error, color: Colors.red[700], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'المبلغ المدفوع يتجاوز الإجمالي',
                      style: TextStyle(color: Colors.red[700], fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            );
          }
          if (debt > 0) {
            return Card(
              color: Colors.orange[50],
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.account_balance_wallet, color: Colors.orange[700], size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'الدين المتبقي',
                          style: TextStyle(color: Colors.orange[700], fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Text(
                      '${debt.toStringAsFixed(2)} د.ج',
                      style: TextStyle(color: Colors.orange[700], fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
              ),
            );
          }
          return const SizedBox.shrink();
        }),
        const SizedBox(height: 12),

        // Notes
        TextField(
          controller: _notesController,
          decoration: const InputDecoration(
            labelText: 'ملاحظات (اختياري)',
            prefixIcon: Icon(Icons.note),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 80),
      ],
    );
  }

  Widget? _buildBottomBar(CartState cart) {
    if (_currentStep == 0) return null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () async {
                if (_currentStep == 1) {
                  final cart = ref.read(cartProvider);
                  if (cart.items.isNotEmpty) {
                    final confirm = await _onWillPop();
                    if (!confirm) return;
                  }
                  ref.read(cartProvider.notifier).clearCart();
                }
                setState(() => _currentStep--);
              },
              child: const Text('رجوع'),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isSubmitting
                  ? null
                  : () {
                      if (_currentStep == 1) {
                        if (cart.items.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('يرجى إضافة منتجات للسلة')),
                          );
                          return;
                        }
                        _paidAmountController.text = cart.totalAmount.toStringAsFixed(0);
                        setState(() => _currentStep = 2);
                      } else if (_currentStep == 2) {
                        _showConfirmDialog();
                      }
                    },
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_currentStep == 2 ? 'تأكيد البيع' : 'متابعة'),
            ),
          ),
        ],
      ),
    );
  }
}
