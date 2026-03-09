import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/theme/app_theme.dart';
import 'presentation/screens/splash_screen.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/home_screen.dart';
import 'presentation/screens/van_stock_screen.dart';
import 'presentation/screens/create_van_sale_screen.dart';
import 'presentation/screens/van_sales_screen.dart';
import 'presentation/screens/van_sale_detail_screen.dart';
import 'presentation/screens/caisse_screen.dart';
import 'presentation/screens/clients_screen.dart';
import 'presentation/screens/dispense_screen.dart';
import 'presentation/screens/pending_transfers_screen.dart';
import 'presentation/screens/add_client_screen.dart';
import 'presentation/screens/request_products_screen.dart';
import 'presentation/screens/my_requests_screen.dart';
import 'presentation/screens/debt_collection_screen.dart';
import 'data/models/sale_model.dart';

final navigatorKey = GlobalKey<NavigatorState>();

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Tracksera Cashvan',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      locale: const Locale('ar'),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('ar')],
      navigatorObservers: [homeRouteObserver],
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
        '/my-stock': (context) => const VanStockScreen(),
        '/create-sale': (context) => const CreateVanSaleScreen(),
        '/sales': (context) => const VanSalesScreen(),
        '/caisse': (context) => const CaisseScreen(),
        '/clients': (context) => const ClientsScreen(),
        '/dispenses': (context) => const DispenseScreen(),
        '/pending-transfers': (context) => const PendingTransfersScreen(),
        '/add-client': (context) => const AddClientScreen(),
        '/request-products': (context) => const RequestProductsScreen(),
        '/my-requests': (context) => const MyRequestsScreen(),
        '/debt-collection': (context) => const DebtCollectionScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/sale-detail') {
          final sale = settings.arguments as SaleModel;
          return MaterialPageRoute(
            builder: (context) => VanSaleDetailScreen(sale: sale),
          );
        }
        return null;
      },
    );
  }
}
