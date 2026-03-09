class ApiConstants {
  static const String baseUrl = 'https://rafik.tracksera.com/api';
  static const Duration timeout = Duration(seconds: 30);

  // Auth
  static const String login = '/login';
  static const String logout = '/logout';
  static const String user = '/user';

  // Sync
  static const String masterData = '/sync/master-data';
  static const String pushChanges = '/sync/push';

  // Deliveries
  static const String deliveries = '/deliveries';
  static const String myActiveDelivery = '/my-active-delivery';
  static const String myDeliveries = '/my-deliveries';

  // Orders
  static const String orders = '/orders';
  static const String confirmedOrders = '/confirmed-orders';

  // Location
  static const String updateLocation = '/location/update';

  // Stock
  static const String myStock = '/my-stock';

  // Caisse
  static const String myCaisse = '/caisses/my';

  // Stats
  static const String livreurStats = '/dashboard/livreur-stats';
}
