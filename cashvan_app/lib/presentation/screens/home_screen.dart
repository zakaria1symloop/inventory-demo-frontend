import 'package:flutter/material.dart' hide TextDirection;
import 'package:flutter/material.dart' as material show TextDirection;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/session_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/user_model.dart';

final homeRouteObserver = RouteObserver<ModalRoute<void>>();

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> with RouteAware {

  @override
  void initState() {
    super.initState();
    // Auto-refresh user data to get latest permissions
    Future.microtask(() {
      ref.read(authProvider.notifier).refreshUser();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final route = ModalRoute.of(context);
    if (route != null) {
      homeRouteObserver.subscribe(this, route);
    }
  }

  @override
  void dispose() {
    homeRouteObserver.unsubscribe(this);
    super.dispose();
  }

  @override
  void didPopNext() {
    // Called when user navigates back to home screen
    ref.read(authProvider.notifier).refreshUser();
    ref.invalidate(pendingTransfersProvider);
    ref.invalidate(myStockProvider);
    ref.invalidate(mySalesProvider(null));
    ref.invalidate(caisseProvider);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final pendingTransfers = ref.watch(pendingTransfersProvider);
    final myStock = ref.watch(myStockProvider);
    final todaySales = ref.watch(mySalesProvider(null));
    final caisse = ref.watch(caisseProvider);

    return Directionality(
      textDirection: material.TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('البيع المتنقل'),
          automaticallyImplyLeading: false,
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                ref.read(authProvider.notifier).refreshUser();
                ref.invalidate(pendingTransfersProvider);
                ref.invalidate(myStockProvider);
                ref.invalidate(mySalesProvider(null));
                ref.invalidate(caisseProvider);
              },
            ),
            PopupMenuButton(
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout, color: AppTheme.dangerColor),
                      SizedBox(width: 8),
                      Text('تسجيل الخروج'),
                    ],
                  ),
                ),
              ],
              onSelected: (value) async {
                if (value == 'logout') {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    Navigator.pushReplacementNamed(context, '/login');
                  }
                }
              },
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            await ref.read(authProvider.notifier).refreshUser();
            ref.invalidate(pendingTransfersProvider);
            ref.invalidate(myStockProvider);
            ref.invalidate(mySalesProvider(null));
            ref.invalidate(caisseProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome Card
                _WelcomeCard(userName: authState.user?.name ?? ''),

                const SizedBox(height: 16),

                // Pending Transfers Alert
                pendingTransfers.when(
                  data: (transfers) {
                    if (transfers.isEmpty) return const SizedBox.shrink();
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _PendingTransfersCard(count: transfers.length),
                    );
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),

                // Stats Row
                _StatsRow(
                  stockCount: myStock.whenOrNull(data: (s) => s.length) ?? 0,
                  salesCount:
                      todaySales.whenOrNull(data: (s) => s.length) ?? 0,
                  salesTotal: todaySales.whenOrNull(
                        data: (s) => s.fold<double>(
                            0, (sum, sale) => sum + sale.grandTotal),
                      ) ??
                      0,
                  caisseBalance: _extractCaisseBalance(caisse),
                ),

                const SizedBox(height: 24),

                // Quick Actions
                const Text(
                  'الإجراءات السريعة',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                _QuickActionsGrid(user: authState.user),
                const SizedBox(height: 24),
                const Align(
                  alignment: Alignment.bottomRight,
                  child: Text('v1.0.6', style: TextStyle(fontSize: 10, color: Colors.grey)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  double _extractCaisseBalance(AsyncValue<Map<String, dynamic>?> caisse) {
    return caisse.whenOrNull(data: (c) {
          if (c == null) return 0.0;
          final caisseData =
              c['caisse'] ?? (c.containsKey('balance') ? c : null);
          if (caisseData == null) return 0.0;
          final bal = caisseData['balance'];
          if (bal is String) return double.tryParse(bal) ?? 0;
          if (bal is num) return bal.toDouble();
          return 0.0;
        }) ??
        0;
  }
}

class _WelcomeCard extends StatelessWidget {
  final String userName;

  const _WelcomeCard({required this.userName});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = DateFormat('EEEE, d MMMM yyyy', 'ar').format(now);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor,
            AppTheme.primaryColor.withValues(alpha: 0.8)
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.local_shipping, color: Colors.white, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'مرحباً، $userName',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  dateStr,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PendingTransfersCard extends StatelessWidget {
  final int count;

  const _PendingTransfersCard({required this.count});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, '/pending-transfers'),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.warningColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border:
              Border.all(color: AppTheme.warningColor.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.warningColor.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.local_shipping,
                  color: AppTheme.warningColor, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$count تحويل في الانتظار',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'اضغط لاستلام البضاعة',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_back_ios,
                size: 16, color: AppTheme.warningColor),
          ],
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final int stockCount;
  final int salesCount;
  final double salesTotal;
  final double caisseBalance;

  const _StatsRow({
    required this.stockCount,
    required this.salesCount,
    required this.salesTotal,
    required this.caisseBalance,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  icon: Icons.inventory_2,
                  label: 'منتجات المخزن',
                  value: '$stockCount',
                  color: AppTheme.primaryColor,
                ),
              ),
              Expanded(
                child: _StatItem(
                  icon: Icons.receipt_long,
                  label: 'مبيعات اليوم',
                  value: '$salesCount',
                  color: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  icon: Icons.payments,
                  label: 'إجمالي المبيعات',
                  value: '${salesTotal.toStringAsFixed(0)} د.ج',
                  color: AppTheme.successColor,
                ),
              ),
              Expanded(
                child: _StatItem(
                  icon: Icons.account_balance_wallet,
                  label: 'رصيد الصندوق',
                  value: '${caisseBalance.toStringAsFixed(0)} د.ج',
                  color: Colors.purple,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: color,
                ),
              ),
              Text(
                label,
                style: TextStyle(color: Colors.grey[600], fontSize: 10),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  final UserModel? user;

  const _QuickActionsGrid({this.user});

  @override
  Widget build(BuildContext context) {
    final actions = [
      _ActionItem(
        icon: Icons.inventory_2,
        label: 'مخزون المستودع',
        color: AppTheme.primaryColor,
        route: '/my-stock',
      ),
      _ActionItem(
        icon: Icons.add_shopping_cart,
        label: 'بيع جديد',
        color: AppTheme.successColor,
        route: '/create-sale',
      ),
      _ActionItem(
        icon: Icons.receipt_long,
        label: 'قائمة المبيعات',
        color: Colors.orange,
        route: '/sales',
      ),
      _ActionItem(
        icon: Icons.swap_horiz,
        label: 'التحويلات',
        color: Colors.indigo,
        route: '/pending-transfers',
      ),
      _ActionItem(
        icon: Icons.account_balance_wallet,
        label: 'الصندوق',
        color: Colors.purple,
        route: '/caisse',
      ),
      _ActionItem(
        icon: Icons.money_off,
        label: 'المصروفات',
        color: Colors.teal,
        route: '/dispenses',
      ),
      _ActionItem(
        icon: Icons.people,
        label: 'العملاء',
        color: Colors.cyan,
        route: '/clients',
      ),
      if (user?.canCollectDebt == true)
        _ActionItem(
          icon: Icons.account_balance_wallet,
          label: 'تحصيل الديون',
          color: AppTheme.dangerColor,
          route: '/debt-collection',
        ),
      _ActionItem(
        icon: Icons.add_shopping_cart,
        label: 'طلب منتجات',
        color: Colors.deepOrange,
        route: '/request-products',
      ),
      _ActionItem(
        icon: Icons.list_alt,
        label: 'طلباتي',
        color: Colors.brown,
        route: '/my-requests',
      ),
    ];

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.0,
      children: actions.map((action) {
        return InkWell(
          onTap: () => Navigator.pushNamed(context, action.route),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderColor),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: action.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(action.icon, color: action.color, size: 28),
                ),
                const SizedBox(height: 8),
                Text(
                  action.label,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _ActionItem {
  final IconData icon;
  final String label;
  final Color color;
  final String route;

  _ActionItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.route,
  });
}
