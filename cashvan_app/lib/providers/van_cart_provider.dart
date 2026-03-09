import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'session_provider.dart';

class CartItem {
  final StockItemInfo stockItem;
  int quantity; // Cartons
  int extraPieces; // Extra individual pieces
  double unitPrice; // Price per piece
  double discount;

  CartItem({
    required this.stockItem,
    this.quantity = 1,
    this.extraPieces = 0,
    required this.unitPrice,
    this.discount = 0,
  });

  int get piecesPerPackage => stockItem.piecesPerPackage;

  int get totalPieces => (quantity * piecesPerPackage) + extraPieces;

  double get subtotal => (unitPrice * totalPieces) - discount;

  // Quantity to send to backend: total pieces (integer)
  int get orderQuantity => totalPieces;

  Map<String, dynamic> toSaleItem() {
    return {
      'product_id': stockItem.productId,
      'quantity': totalPieces,
      'unit_price': unitPrice,
      'discount': discount,
    };
  }
}

class CartState {
  final List<CartItem> items;
  final int? clientId;
  final String? clientName;
  final int? clientCategoryId;

  CartState({
    this.items = const [],
    this.clientId,
    this.clientName,
    this.clientCategoryId,
  });

  double get totalAmount {
    return items.fold(0, (sum, item) => sum + item.subtotal);
  }

  int get itemCount => items.length;

  CartState copyWith({
    List<CartItem>? items,
    int? clientId,
    String? clientName,
    int? clientCategoryId,
    bool clearClient = false,
    bool clearClientCategoryId = false,
  }) {
    return CartState(
      items: items ?? this.items,
      clientId: clearClient ? null : (clientId ?? this.clientId),
      clientName: clearClient ? null : (clientName ?? this.clientName),
      clientCategoryId: clearClientCategoryId || clearClient
          ? null
          : (clientCategoryId ?? this.clientCategoryId),
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(CartState());

  void setClient(int clientId, String clientName, {int? clientCategoryId}) {
    state = state.copyWith(
      clientId: clientId,
      clientName: clientName,
      clientCategoryId: clientCategoryId,
      clearClientCategoryId: clientCategoryId == null,
    );

    // Re-price existing cart items based on client category
    if (state.items.isNotEmpty) {
      final updatedItems = List<CartItem>.from(state.items);
      for (var item in updatedItems) {
        item.unitPrice = item.stockItem.getPriceForCategory(clientCategoryId);
      }
      state = state.copyWith(items: updatedItems);
    }
  }

  void clearClient() {
    state = state.copyWith(clearClient: true);
  }

  void addItem(StockItemInfo stockItem, {int quantity = 1, double? price}) {
    final existingIndex = state.items.indexWhere(
      (item) => item.stockItem.productId == stockItem.productId,
    );

    if (existingIndex >= 0) {
      final updatedItems = List<CartItem>.from(state.items);
      updatedItems[existingIndex].quantity += quantity;
      state = state.copyWith(items: updatedItems);
    } else {
      final unitPrice =
          price ?? stockItem.getPriceForCategory(state.clientCategoryId);
      final newItem = CartItem(
        stockItem: stockItem,
        quantity: quantity,
        unitPrice: unitPrice,
      );
      state = state.copyWith(items: [...state.items, newItem]);
    }
  }

  void removeItem(int productId) {
    final updatedItems = state.items
        .where((item) => item.stockItem.productId != productId)
        .toList();
    state = state.copyWith(items: updatedItems);
  }

  void updateQuantity(int productId, int quantity) {
    if (quantity <= 0) {
      final updatedItems = List<CartItem>.from(state.items);
      final index = updatedItems.indexWhere(
        (item) => item.stockItem.productId == productId,
      );
      if (index >= 0 && updatedItems[index].extraPieces > 0) {
        updatedItems[index].quantity = 0;
        state = state.copyWith(items: updatedItems);
        return;
      }
      removeItem(productId);
      return;
    }

    final updatedItems = List<CartItem>.from(state.items);
    final index = updatedItems.indexWhere(
      (item) => item.stockItem.productId == productId,
    );
    if (index >= 0) {
      updatedItems[index].quantity = quantity;
      // Cap extra pieces if they exceed remaining stock after cartons
      final ppp = updatedItems[index].piecesPerPackage > 0 ? updatedItems[index].piecesPerPackage : 1;
      final totalPiecesInStock = updatedItems[index].stockItem.availableQuantity.floor();
      final piecesUsedByCartons = quantity * ppp;
      final remainingPieces = totalPiecesInStock - piecesUsedByCartons;
      final maxExtra = ppp > 1 ? remainingPieces.clamp(0, ppp - 1) : 0;
      if (updatedItems[index].extraPieces > maxExtra) {
        updatedItems[index].extraPieces = maxExtra;
      }
      state = state.copyWith(items: updatedItems);
    }
  }

  void updateExtraPieces(int productId, int pieces) {
    final updatedItems = List<CartItem>.from(state.items);
    final index = updatedItems.indexWhere(
      (item) => item.stockItem.productId == productId,
    );
    if (index >= 0) {
      final item = updatedItems[index];
      final ppp = item.piecesPerPackage > 0 ? item.piecesPerPackage : 1;
      final totalPiecesInStock = item.stockItem.availableQuantity.floor();
      final piecesUsedByCartons = item.quantity * ppp;
      final remainingPieces = totalPiecesInStock - piecesUsedByCartons;
      // Max extra pieces: can't exceed ppp-1, and can't exceed remaining stock
      final maxPieces = ppp > 1 ? remainingPieces.clamp(0, ppp - 1) : 0;
      updatedItems[index].extraPieces = pieces.clamp(0, maxPieces);
      if (updatedItems[index].quantity <= 0 &&
          updatedItems[index].extraPieces <= 0) {
        updatedItems.removeAt(index);
      }
      state = state.copyWith(items: updatedItems);
    }
  }

  void updatePrice(int productId, double price) {
    final updatedItems = List<CartItem>.from(state.items);
    final index = updatedItems.indexWhere(
      (item) => item.stockItem.productId == productId,
    );
    if (index >= 0) {
      updatedItems[index].unitPrice = price;
      state = state.copyWith(items: updatedItems);
    }
  }

  void clearCart() {
    state = CartState();
  }

  List<Map<String, dynamic>> getSaleItems() {
    return state.items.map((item) => item.toSaleItem()).toList();
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});
