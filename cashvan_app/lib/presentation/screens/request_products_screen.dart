import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../data/models/product_model.dart';
import '../../data/services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

/// Simple warehouse model for the dropdown
class _Warehouse {
  final int id;
  final String name;

  _Warehouse({required this.id, required this.name});

  factory _Warehouse.fromJson(Map<String, dynamic> json) {
    return _Warehouse(
      id: json['id'] as int,
      name: json['name']?.toString() ?? '',
    );
  }
}

/// Item in the request cart
class _RequestItem {
  final ProductModel product;
  int cartons;
  int extraPieces;

  _RequestItem({required this.product, this.cartons = 1, this.extraPieces = 0});

  int get piecesPerPackage => product.piecesPerPackage > 0 ? product.piecesPerPackage : 1;
  double get totalQuantity {
    if (piecesPerPackage <= 1) return cartons.toDouble();
    return cartons + (extraPieces / piecesPerPackage);
  }

  int get totalPieces => (cartons * piecesPerPackage) + extraPieces;
}

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

class RequestProductsScreen extends ConsumerStatefulWidget {
  const RequestProductsScreen({super.key});

  @override
  ConsumerState<RequestProductsScreen> createState() => _RequestProductsScreenState();
}

class _RequestProductsScreenState extends ConsumerState<RequestProductsScreen> {
  List<_Warehouse> _warehouses = [];
  _Warehouse? _selectedWarehouse;
  bool _loadingWarehouses = true;

  List<ProductModel> _products = [];
  bool _loadingProducts = true;
  String _productSearch = '';

  final List<_RequestItem> _cartItems = [];
  final _notesController = TextEditingController();
  bool _isSubmitting = false;

  final Map<int, TextEditingController> _qtyControllers = {};
  final Map<int, TextEditingController> _piecesControllers = {};

  @override
  void initState() {
    super.initState();
    _loadWarehouses();
    _loadProducts();
  }

  @override
  void dispose() {
    _notesController.dispose();
    for (var c in _qtyControllers.values) {
      c.dispose();
    }
    for (var c in _piecesControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadWarehouses() async {
    try {
      final response = await ApiService.instance.getWarehouses();
      if (response.statusCode == 200) {
        final List data = response.data is List
            ? response.data
            : (response.data['data'] as List? ?? []);
        final user = ref.read(authProvider).user;
        final myWarehouseId = user?.warehouseId;

        setState(() {
          _warehouses = data
              .map((e) => _Warehouse.fromJson(e as Map<String, dynamic>))
              .where((w) => w.id != myWarehouseId) // Exclude driver's own warehouse
              .toList();
          // Auto-select the main warehouse (first available)
          if (_warehouses.isNotEmpty) {
            _selectedWarehouse = _warehouses.first;
          }
          _loadingWarehouses = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingWarehouses = false);
      }
    }
  }

  Future<void> _loadProducts() async {
    try {
      final response = await ApiService.instance.getProducts(params: {
        'per_page': 500,
        'is_active': 1,
      });
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> list;
        if (data is Map) {
          list = data['data'] as List<dynamic>? ?? [];
        } else if (data is List) {
          list = data;
        } else {
          list = [];
        }
        setState(() {
          _products = list.map((e) => ProductModel.fromJson(e)).toList();
          _loadingProducts = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingProducts = false);
      }
    }
  }

  void _addToCart(ProductModel product) {
    final existing = _cartItems.where((ci) => ci.product.id == product.id).firstOrNull;
    if (existing != null) return;
    setState(() {
      _cartItems.add(_RequestItem(product: product));
    });
  }

  void _removeFromCart(int productId) {
    setState(() {
      _cartItems.removeWhere((ci) => ci.product.id == productId);
      _qtyControllers.remove(productId)?.dispose();
      _piecesControllers.remove(productId)?.dispose();
    });
  }

  void _updateCartons(int productId, int value) {
    final item = _cartItems.where((ci) => ci.product.id == productId).firstOrNull;
    if (item == null) return;
    setState(() {
      item.cartons = value < 0 ? 0 : value;
    });
  }

  void _updateExtraPieces(int productId, int value) {
    final item = _cartItems.where((ci) => ci.product.id == productId).firstOrNull;
    if (item == null) return;
    setState(() {
      item.extraPieces = value < 0 ? 0 : value;
    });
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

  Future<void> _submitRequest() async {
    if (_selectedWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى اختيار المستودع')),
      );
      return;
    }
    if (_cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى إضافة منتجات')),
      );
      return;
    }

    // Remove items with 0 quantity
    final validItems = _cartItems.where((ci) => ci.totalPieces > 0).toList();
    if (validItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى تحديد كمية لمنتج واحد على الأقل')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final data = {
        'warehouse_id': _selectedWarehouse!.id,
        'items': validItems.map((ci) => {
          'product_id': ci.product.id,
          'quantity': ci.totalPieces,
        }).toList(),
        'notes': _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      };

      final response = await ApiService.instance.createProductRequest(data);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم إرسال طلب المنتجات بنجاح'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          Navigator.pop(context, true);
        }
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
        _showError('خطأ', errorMessage);
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

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: PopScope(
        canPop: _cartItems.isEmpty,
        onPopInvokedWithResult: (didPop, result) async {
          if (didPop) return;
          final shouldPop = await showDialog<bool>(
            context: context,
            builder: (context) => Directionality(
              textDirection: TextDirection.rtl,
              child: AlertDialog(
                title: const Text('تأكيد الخروج'),
                content: const Text('لديك منتجات في السلة. هل أنت متأكد من الخروج؟ سيتم فقدان جميع البيانات.'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('لا، البقاء'),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    child: const Text('نعم، خروج', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),
          );
          if (shouldPop == true && context.mounted) {
            Navigator.pop(context);
          }
        },
        child: Scaffold(
        appBar: AppBar(
          title: const Text('طلب منتجات'),
          actions: [
            if (_cartItems.isNotEmpty)
              Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_cart),
                    onPressed: () => _showCartSheet(),
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
                        '${_cartItems.length}',
                        style: const TextStyle(color: Colors.white, fontSize: 10),
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
        body: Column(
          children: [
            // Warehouse selector
            _buildWarehouseSelector(),
            // Product search
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
            // Product list
            Expanded(child: _buildProductList()),
          ],
        ),
        bottomNavigationBar: _buildBottomBar(),
      ),
      ),
    );
  }

  Widget _buildWarehouseSelector() {
    if (_loadingWarehouses) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }
    if (_selectedWarehouse == null) return const SizedBox.shrink();
    // Show selected warehouse as info bar (auto-selected, no dropdown needed)
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(12),
        color: AppTheme.primaryColor.withValues(alpha: 0.05),
      ),
      child: Row(
        children: [
          Icon(Icons.warehouse, color: AppTheme.primaryColor, size: 20),
          const SizedBox(width: 8),
          Text(
            'المستودع: ${_selectedWarehouse!.name}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductList() {
    if (_loadingProducts) {
      return const Center(child: CircularProgressIndicator());
    }

    var filtered = _products.toList();
    if (_productSearch.isNotEmpty) {
      filtered = filtered
          .where((p) =>
              p.name.contains(_productSearch) ||
              p.id.toString().contains(_productSearch) ||
              (p.barcode ?? '').contains(_productSearch))
          .toList();
    }

    if (filtered.isEmpty) {
      return const Center(child: Text('لا توجد منتجات'));
    }

    return ListView.builder(
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final product = filtered[index];
        final cartItem = _cartItems.where((ci) => ci.product.id == product.id).firstOrNull;
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
                        product.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (product.piecesPerPackage > 1)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            '${product.piecesPerPackage} قطعة/كرتون',
                            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                if (inCart)
                  _buildCartControls(product, cartItem)
                else
                  ElevatedButton.icon(
                    onPressed: () => _addToCart(product),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('إضافة'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCartControls(ProductModel product, _RequestItem cartItem) {
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
                  if (cartItem.cartons > 1) {
                    _updateCartons(product.id, cartItem.cartons - 1);
                  } else if (cartItem.extraPieces > 0) {
                    _updateCartons(product.id, 0);
                  } else {
                    _removeFromCart(product.id);
                  }
                },
                iconSize: 20,
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(),
              ),
              SizedBox(
                width: 50,
                child: TextField(
                  controller: _getQtyController(product.id, cartItem.cartons),
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                    isDense: true,
                  ),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  onSubmitted: (value) {
                    int qty = int.tryParse(value) ?? 0;
                    if (qty > 0) {
                      _updateCartons(product.id, qty);
                    } else {
                      _removeFromCart(product.id);
                    }
                  },
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => _updateCartons(product.id, cartItem.cartons + 1),
                iconSize: 20,
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ),
        Text('كرتون', style: TextStyle(fontSize: 9, color: Colors.grey[600])),
        if (product.piecesPerPackage > 1) ...[
          const SizedBox(height: 4),
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
                      ? () => _updateExtraPieces(product.id, cartItem.extraPieces - 1)
                      : null,
                  iconSize: 16,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                ),
                SizedBox(
                  width: 30,
                  child: TextField(
                    controller: _getPiecesController(product.id, cartItem.extraPieces),
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
                      _updateExtraPieces(product.id, pieces);
                    },
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.add, size: 16,
                    color: cartItem.extraPieces >= product.piecesPerPackage - 1
                        ? Colors.grey
                        : Colors.orange[800],
                  ),
                  onPressed: cartItem.extraPieces >= product.piecesPerPackage - 1
                      ? null
                      : () => _updateExtraPieces(product.id, cartItem.extraPieces + 1),
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

  void _showCartSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Directionality(
              textDirection: TextDirection.rtl,
              child: DraggableScrollableSheet(
                initialChildSize: 0.7,
                maxChildSize: 0.9,
                minChildSize: 0.4,
                expand: false,
                builder: (context, scrollController) {
                  return Column(
                    children: [
                      // Handle bar
                      Container(
                        margin: const EdgeInsets.only(top: 12),
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            const Icon(Icons.shopping_cart),
                            const SizedBox(width: 8),
                            Text(
                              'سلة الطلب (${_cartItems.length} منتج)',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1),
                      Expanded(
                        child: _cartItems.isEmpty
                            ? const Center(child: Text('السلة فارغة'))
                            : ListView.builder(
                                controller: scrollController,
                                itemCount: _cartItems.length,
                                itemBuilder: (context, index) {
                                  final item = _cartItems[index];
                                  return ListTile(
                                    title: Text(item.product.name,
                                        style: const TextStyle(fontWeight: FontWeight.bold)),
                                    subtitle: Text(
                                      item.piecesPerPackage > 1
                                          ? '${item.cartons} كرتون${item.extraPieces > 0 ? ' + ${item.extraPieces} قطعة' : ''} (${item.totalPieces} ق)'
                                          : '${item.cartons} قطعة',
                                      style: TextStyle(color: Colors.grey[600]),
                                    ),
                                    trailing: IconButton(
                                      icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                                      onPressed: () {
                                        setState(() => _removeFromCart(item.product.id));
                                        setSheetState(() {});
                                      },
                                    ),
                                  );
                                },
                              ),
                      ),
                      // Notes
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: TextField(
                          controller: _notesController,
                          decoration: InputDecoration(
                            labelText: 'ملاحظات (اختياري)',
                            prefixIcon: const Icon(Icons.note),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          maxLines: 2,
                        ),
                      ),
                    ],
                  );
                },
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildBottomBar() {
    if (_cartItems.isEmpty) return const SizedBox.shrink();

    final totalProducts = _cartItems.length;
    final totalPieces = _cartItems.fold<int>(0, (sum, ci) => sum + ci.totalPieces);

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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$totalProducts منتج - $totalPieces قطعة',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              if (_selectedWarehouse != null)
                Text(
                  _selectedWarehouse!.name,
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitRequest,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('إرسال الطلب', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
