class ApiConstants {
  static const String baseUrl = 'https://rafik.tracksera.com/api';
  static const Duration timeout = Duration(seconds: 30);

  // Auth
  static const String login = '/login';
  static const String logout = '/logout';
  static const String user = '/user';

  // Stock Transfers
  static const String stockTransfers = '/stock-transfers';
  static const String myPendingTransfers = '/my-pending-transfers';
  static const String myStock = '/my-stock';
  static const String mySales = '/my-sales';

  // Sales (regular sales from driver warehouse)
  static const String sales = '/sales';

  // Clients
  static const String clients = '/clients';
  static const String clientCategories = '/client-categories';

  // Caisses
  static const String myCaisse = '/caisses/my';

  // Dispenses (Expenses)
  static const String dispenses = '/dispenses';

  // Products
  static const String products = '/products';

  // Product Requests
  static const String productRequests = '/product-requests';
  static const String myProductRequests = '/product-requests/my';

  // Warehouses
  static const String warehouses = '/warehouses';
}
