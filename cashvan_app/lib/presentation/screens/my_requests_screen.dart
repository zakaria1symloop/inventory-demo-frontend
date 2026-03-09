import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/product_request_model.dart';
import '../../providers/session_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';

class MyRequestsScreen extends ConsumerStatefulWidget {
  const MyRequestsScreen({super.key});

  @override
  ConsumerState<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends ConsumerState<MyRequestsScreen> {
  bool _isDeleting = false;

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.blue;
      case 'fulfilled':
        return AppTheme.successColor;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'approved':
        return 'تمت الموافقة';
      case 'fulfilled':
        return 'تم التسليم';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.hourglass_empty;
      case 'approved':
        return Icons.check_circle_outline;
      case 'fulfilled':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel_outlined;
      default:
        return Icons.help_outline;
    }
  }

  Future<void> _deleteRequest(ProductRequestModel request) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: const Text('حذف الطلب'),
          content: Text('هل تريد حذف الطلب ${request.reference}؟'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('حذف', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true) return;

    setState(() => _isDeleting = true);
    try {
      await ApiService.instance.deleteProductRequest(request.id);
      ref.invalidate(myProductRequestsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم حذف الطلب بنجاح'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('خطأ في حذف الطلب'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isDeleting = false);
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final requestsAsync = ref.watch(myProductRequestsProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('طلباتي'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref.invalidate(myProductRequestsProvider),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(myProductRequestsProvider);
          },
          child: requestsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 12),
                  Text('خطأ: $error', textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(myProductRequestsProvider),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            ),
            data: (requests) {
              if (requests.isEmpty) {
                return ListView(
                  children: const [
                    SizedBox(height: 100),
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.inbox_outlined, size: 64, color: Colors.grey),
                          SizedBox(height: 12),
                          Text('لا توجد طلبات', style: TextStyle(color: Colors.grey, fontSize: 16)),
                        ],
                      ),
                    ),
                  ],
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: requests.length,
                itemBuilder: (context, index) {
                  final request = requests[index];
                  return _RequestCard(
                    request: request,
                    statusColor: _statusColor(request.status),
                    statusLabel: _statusLabel(request.status),
                    statusIcon: _statusIcon(request.status),
                    formatDate: _formatDate,
                    onDelete: request.status == 'pending' ? () => _deleteRequest(request) : null,
                    isDeleting: _isDeleting,
                  );
                },
              );
            },
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () async {
            final result = await Navigator.pushNamed(context, '/request-products');
            if (result == true) {
              ref.invalidate(myProductRequestsProvider);
            }
          },
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

class _RequestCard extends StatefulWidget {
  final ProductRequestModel request;
  final Color statusColor;
  final String statusLabel;
  final IconData statusIcon;
  final String Function(String?) formatDate;
  final VoidCallback? onDelete;
  final bool isDeleting;

  const _RequestCard({
    required this.request,
    required this.statusColor,
    required this.statusLabel,
    required this.statusIcon,
    required this.formatDate,
    this.onDelete,
    this.isDeleting = false,
  });

  @override
  State<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends State<_RequestCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final request = widget.request;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: widget.statusColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: widget.statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(widget.statusIcon, color: widget.statusColor, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              request.reference,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: widget.statusColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                widget.statusLabel,
                                style: TextStyle(
                                  color: widget.statusColor,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${request.warehouseName ?? 'مستودع'} - ${request.items.length} منتج',
                          style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        ),
                        if (request.createdAt != null)
                          Text(
                            widget.formatDate(request.createdAt),
                            style: TextStyle(color: Colors.grey[500], fontSize: 11),
                          ),
                      ],
                    ),
                  ),
                  // Delete button for pending requests
                  if (widget.onDelete != null)
                    IconButton(
                      icon: widget.isDeleting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: widget.isDeleting ? null : widget.onDelete,
                    ),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.grey,
                  ),
                ],
              ),
            ),
          ),
          // Expanded items
          if (_expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ...request.items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.productName ?? 'منتج #${item.productId}',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'طلب: ${item.formattedRequested}',
                              style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                            ),
                            if (item.quantityApproved > 0)
                              Text(
                                'موافق: ${item.formattedApproved}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.successColor, fontWeight: FontWeight.bold),
                              ),
                          ],
                        ),
                      ],
                    ),
                  )),
                  if (request.notes != null && request.notes!.isNotEmpty) ...[
                    const Divider(),
                    Row(
                      children: [
                        const Icon(Icons.note, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            request.notes!,
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (request.adminNotes != null && request.adminNotes!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.admin_panel_settings, size: 16, color: Colors.blue),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'ملاحظات الإدارة: ${request.adminNotes}',
                            style: const TextStyle(color: Colors.blue, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (request.processorName != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'معالج بواسطة: ${request.processorName}',
                      style: TextStyle(color: Colors.grey[500], fontSize: 11),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
