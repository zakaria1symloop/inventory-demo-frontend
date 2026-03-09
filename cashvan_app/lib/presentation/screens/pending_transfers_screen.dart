import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../data/models/stock_transfer_model.dart';
import '../../data/services/api_service.dart';
import '../../providers/session_provider.dart';
import '../../core/theme/app_theme.dart';

/// Format transfer quantity (in pieces) as cartons + pieces
String _formatTransferQty(num qty, int piecesPerPackage) {
  final totalPieces = qty.toInt();
  if (piecesPerPackage <= 1) {
    return '$totalPieces قطعة';
  }
  final cartons = totalPieces ~/ piecesPerPackage;
  final pieces = totalPieces % piecesPerPackage;
  if (pieces == 0) return '$cartons كرتون';
  if (cartons == 0) return '$totalPieces قطعة';
  return '${cartons}ك + ${pieces}ق';
}

class PendingTransfersScreen extends ConsumerStatefulWidget {
  const PendingTransfersScreen({super.key});

  @override
  ConsumerState<PendingTransfersScreen> createState() => _PendingTransfersScreenState();
}

class _PendingTransfersScreenState extends ConsumerState<PendingTransfersScreen> {
  bool _isCollecting = false;
  int? _collectingId;

  Future<void> _collectTransfer(StockTransferModel transfer) async {
    if (!transfer.isLoading) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يجب أن يكون التحويل في مرحلة التحميل قبل الاستلام')),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: const Text('تأكيد الاستلام'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('هل تريد استلام التحويل ${transfer.reference ?? '#${transfer.id}'}?'),
              const SizedBox(height: 8),
              Text(
                '${transfer.items.length} منتج من ${transfer.fromWarehouseName ?? 'المستودع'}',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange, size: 18),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'سيتم إضافة المنتجات إلى مستودعك',
                        style: TextStyle(fontSize: 12, color: Colors.orange),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('تأكيد الاستلام'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isCollecting = true;
      _collectingId = transfer.id;
    });

    try {
      final response = await ApiService.instance.collectTransfer(transfer.id);

      if (response.statusCode == 200 || response.statusCode == 201) {
        ref.invalidate(pendingTransfersProvider);
        ref.invalidate(myStockProvider);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم استلام البضاعة بنجاح'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        String msg = 'فشل في الاستلام';
        if (e.response?.data is Map && e.response!.data['message'] != null) {
          msg = e.response!.data['message'];
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppTheme.dangerColor),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: $e'), backgroundColor: AppTheme.dangerColor),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCollecting = false;
          _collectingId = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final transfersAsync = ref.watch(pendingTransfersProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('التحويلات'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref.invalidate(pendingTransfersProvider),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async => ref.invalidate(pendingTransfersProvider),
          child: transfersAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('خطأ: $error'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(pendingTransfersProvider),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            ),
            data: (transfers) {
              if (transfers.isEmpty) {
                return ListView(
                  children: const [
                    SizedBox(height: 100),
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.swap_horiz, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('لا توجد تحويلات في الانتظار', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    ),
                  ],
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: transfers.length,
                itemBuilder: (context, index) {
                  final transfer = transfers[index];
                  return _TransferCard(
                    transfer: transfer,
                    isCollecting: _isCollecting && _collectingId == transfer.id,
                    onCollect: () => _collectTransfer(transfer),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}

class _TransferCard extends StatelessWidget {
  final StockTransferModel transfer;
  final bool isCollecting;
  final VoidCallback onCollect;

  const _TransferCard({
    required this.transfer,
    required this.isCollecting,
    required this.onCollect,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(transfer.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        transfer.reference ?? '#${transfer.id}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'من: ${transfer.fromWarehouseName ?? 'المستودع'}',
                        style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    transfer.statusLabel,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),

            // Status progress
            const SizedBox(height: 12),
            _StatusProgressBar(status: transfer.status),

            // Items summary
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${transfer.items.length} منتج',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 6),
                  ...transfer.items.take(3).map((item) {
                    final ppp = item.product?.piecesPerPackage ?? 1;
                    final qtyDisplay = _formatTransferQty(item.quantity, ppp);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          Icon(Icons.circle, size: 6, color: Colors.grey[400]),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              item.product?.name ?? 'منتج #${item.productId}',
                              style: const TextStyle(fontSize: 12),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            qtyDisplay,
                            style: TextStyle(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    );
                  }),
                  if (transfer.items.length > 3)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        '... و ${transfer.items.length - 3} منتجات أخرى',
                        style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                      ),
                    ),
                ],
              ),
            ),

            // Date + Creator
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.access_time, size: 14, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(
                  _formatDate(transfer.createdAt),
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
                if (transfer.creatorName != null) ...[
                  const Spacer(),
                  Icon(Icons.person_outline, size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    transfer.creatorName!,
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  ),
                ],
              ],
            ),

            // Collect button (only for loading status)
            if (transfer.isLoading) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: isCollecting ? null : onCollect,
                  icon: isCollecting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.check_circle),
                  label: Text(isCollecting ? 'جاري الاستلام...' : 'استلام البضاعة'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.successColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],

            // Pending info
            if (transfer.isPending) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.hourglass_top, size: 18, color: Colors.blue[600]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'في انتظار الموافقة والتحميل',
                        style: TextStyle(fontSize: 12, color: Colors.blue[700]),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.blue;
      case 'loading':
        return Colors.orange;
      case 'collected':
        return AppTheme.successColor;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }
}

class _StatusProgressBar extends StatelessWidget {
  final String status;

  const _StatusProgressBar({required this.status});

  @override
  Widget build(BuildContext context) {
    final steps = ['pending', 'loading', 'collected'];
    final currentIndex = steps.indexOf(status);

    return Row(
      children: [
        for (int i = 0; i < steps.length; i++) ...[
          if (i > 0)
            Expanded(
              child: Container(
                height: 3,
                color: i <= currentIndex
                    ? _getStepColor(steps[i])
                    : Colors.grey[300],
              ),
            ),
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: i <= currentIndex
                  ? _getStepColor(steps[i])
                  : Colors.grey[300],
            ),
            child: Center(
              child: i < currentIndex
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : i == currentIndex
                      ? Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                          ),
                        )
                      : null,
            ),
          ),
        ],
      ],
    );
  }

  Color _getStepColor(String step) {
    switch (step) {
      case 'pending':
        return Colors.blue;
      case 'loading':
        return Colors.orange;
      case 'collected':
        return AppTheme.successColor;
      default:
        return Colors.grey;
    }
  }
}
