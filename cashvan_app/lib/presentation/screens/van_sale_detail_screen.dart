import 'dart:typed_data';
import 'package:flutter/material.dart' hide TextDirection;
import 'package:flutter/material.dart' as material show TextDirection;
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/sale_model.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class VanSaleDetailScreen extends ConsumerWidget {
  final SaleModel sale;

  const VanSaleDetailScreen({super.key, required this.sale});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canCollectDebt = ref.watch(authProvider).user?.canCollectDebt == true;
    return Directionality(
      textDirection: material.TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('تفاصيل البيع'),
          actions: [
            IconButton(
              icon: const Icon(Icons.print),
              onPressed: () => _printReceipt(context, canCollectDebt),
              tooltip: 'طباعة الفاتورة',
            ),
          ],
        ),
        body: _buildContent(context),
        bottomNavigationBar: Container(
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
          child: ElevatedButton.icon(
            onPressed: () => _printReceipt(context, canCollectDebt),
            icon: const Icon(Icons.print),
            label: const Text('طباعة الفاتورة'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 48),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.primaryColor, AppTheme.primaryColor.withValues(alpha: 0.8)],
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
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'رقم البيع',
                          style: TextStyle(fontSize: 12, color: Colors.white70),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          sale.reference ?? '#${sale.id}',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    _PaymentStatusBadge(status: sale.paymentStatus),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _HeaderStat(
                        icon: Icons.calendar_today,
                        label: 'التاريخ',
                        value: _formatDateShort(sale.createdAt ?? sale.date),
                      ),
                      Container(width: 1, height: 30, color: Colors.white24),
                      _HeaderStat(
                        icon: Icons.inventory_2,
                        label: 'المنتجات',
                        value: '${sale.items.length}',
                      ),
                      Container(width: 1, height: 30, color: Colors.white24),
                      _HeaderStat(
                        icon: Icons.payments,
                        label: 'الدفع',
                        value: sale.paymentStatusLabel,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Client Info
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.person, color: AppTheme.primaryColor),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('العميل', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 2),
                    Text(
                      sale.clientName ?? 'بيع نقدي',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    if (sale.clientPhone != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.phone, size: 14, color: Colors.grey[500]),
                          const SizedBox(width: 4),
                          Text(
                            sale.clientPhone!,
                            style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Products Section
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.shopping_cart, size: 20, color: Colors.blue),
            ),
            const SizedBox(width: 10),
            const Text('المنتجات', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${sale.items.length} منتج',
                style: const TextStyle(fontSize: 12, color: Colors.blue, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                ),
                child: const Row(
                  children: [
                    Expanded(flex: 3, child: Text('المنتج', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black54))),
                    Expanded(child: Text('ق/ك', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black54))),
                    Expanded(child: Text('كراتين', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black54))),
                    Expanded(child: Text('قطع', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black54))),
                    Expanded(child: Text('إجمالي', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black54))),
                    Expanded(child: Text('السعر', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black54))),
                    Expanded(flex: 2, child: Text('المجموع', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black54))),
                  ],
                ),
              ),
              ...sale.items.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    color: index.isEven ? Colors.white : Colors.grey[50],
                    border: Border(top: BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: Builder(
                    builder: (context) {
                      final ppp = item.piecesPerPackage;
                      final total = item.totalPieces;
                      final cartons = ppp > 1 ? total ~/ ppp : 0;
                      final remain = ppp > 1 ? total % ppp : total;
                      return Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: Text(
                              item.productName ?? 'منتج #${item.productId}',
                              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              ppp > 1 ? '$ppp' : '-',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 11, color: Colors.blue[700], fontWeight: FontWeight.bold),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              ppp > 1 ? '$cartons' : '-',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              ppp > 1 ? '$remain' : '-',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                          ),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '$total',
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryColor),
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              '${item.unitPrice.toStringAsFixed(0)}',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 11),
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: Text(
                              '${item.subtotal.toStringAsFixed(0)} د.ج',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Summary
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.successColor.withValues(alpha: 0.05),
                AppTheme.successColor.withValues(alpha: 0.1),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.successColor.withValues(alpha: 0.2)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _SummaryRow(label: 'المجموع الفرعي', value: '${sale.totalAmount.toStringAsFixed(0)} د.ج'),
                if (sale.discount > 0)
                  _SummaryRow(label: 'الخصم', value: '-${sale.discount.toStringAsFixed(0)} د.ج', isNegative: true),
                if (sale.tax > 0)
                  _SummaryRow(label: 'الضريبة', value: '${sale.tax.toStringAsFixed(0)} د.ج'),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.receipt_long, color: AppTheme.successColor),
                          SizedBox(width: 8),
                          Text('الإجمالي', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Text(
                        '${sale.grandTotal.toStringAsFixed(0)} د.ج',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.successColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                _SummaryRow(label: 'المدفوع', value: '${sale.paidAmount.toStringAsFixed(0)} د.ج'),
                if (sale.dueAmount > 0)
                  _SummaryRow(
                    label: 'المتبقي',
                    value: '${sale.dueAmount.toStringAsFixed(0)} د.ج',
                    isNegative: true,
                  ),
              ],
            ),
          ),
        ),

        if (sale.note != null && sale.note!.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.note, size: 18, color: Colors.amber),
                    ),
                    const SizedBox(width: 10),
                    const Text('ملاحظات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(sale.note!, style: TextStyle(color: Colors.grey[700], height: 1.5)),
              ],
            ),
          ),
        ],
        const SizedBox(height: 80),
      ],
    );
  }

  String _formatDateShort(String? date) {
    if (date == null) return '-';
    try {
      final parsed = DateTime.parse(date);
      return '${parsed.day.toString().padLeft(2, '0')}/${parsed.month.toString().padLeft(2, '0')} ${parsed.hour.toString().padLeft(2, '0')}:${parsed.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return date;
    }
  }

  String _formatDate(String? date) {
    if (date == null) return '-';
    try {
      final parsed = DateTime.parse(date);
      return DateFormat('dd/MM/yyyy HH:mm').format(parsed);
    } catch (_) {
      return date;
    }
  }

  Future<void> _printReceipt(BuildContext context, bool canCollectDebt) async {
    final pdf = await _generateReceiptPdf(canCollectDebt: canCollectDebt);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf,
      name: 'فاتورة_${sale.reference ?? sale.id}',
    );
  }

  Future<Uint8List> _generateReceiptPdf({bool canCollectDebt = false}) async {
    final pdf = pw.Document();
    final arabicFont = await PdfGoogleFonts.cairoRegular();
    final arabicFontBold = await PdfGoogleFonts.cairoBold();

    pw.Widget cell(String text, pw.Font font, {pw.TextAlign? align}) {
      return pw.Padding(
        padding: const pw.EdgeInsets.all(8),
        child: pw.Text(text, style: pw.TextStyle(font: font), textAlign: align),
      );
    }

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        textDirection: pw.TextDirection.rtl,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Center(
                child: pw.Column(
                  children: [
                    pw.Text('فاتورة', style: pw.TextStyle(font: arabicFontBold, fontSize: 24)),
                    pw.SizedBox(height: 4),
                    pw.Text(sale.reference ?? '#${sale.id}', style: pw.TextStyle(font: arabicFont, fontSize: 14)),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),
              pw.Divider(),
              pw.SizedBox(height: 10),

              // Client & Date
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('العميل: ${sale.clientName ?? "بيع نقدي"}', style: pw.TextStyle(font: arabicFont)),
                  pw.Text('التاريخ: ${_formatDate(sale.date)}', style: pw.TextStyle(font: arabicFont)),
                ],
              ),
              pw.SizedBox(height: 20),

              // Products Table - 7 columns matching seller app
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400),
                columnWidths: {
                  0: const pw.FlexColumnWidth(3),
                  1: const pw.FlexColumnWidth(0.8),
                  2: const pw.FlexColumnWidth(1),
                  3: const pw.FlexColumnWidth(0.8),
                  4: const pw.FlexColumnWidth(1),
                  5: const pw.FlexColumnWidth(1.2),
                  6: const pw.FlexColumnWidth(1.5),
                },
                children: [
                  // Header Row
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                    children: [
                      cell('المنتج', arabicFontBold),
                      cell('ق/ك', arabicFontBold, align: pw.TextAlign.center),
                      cell('كراتين', arabicFontBold, align: pw.TextAlign.center),
                      cell('قطع', arabicFontBold, align: pw.TextAlign.center),
                      cell('إجمالي', arabicFontBold, align: pw.TextAlign.center),
                      cell('السعر', arabicFontBold, align: pw.TextAlign.center),
                      cell('المجموع', arabicFontBold, align: pw.TextAlign.center),
                    ],
                  ),
                  // Data Rows
                  ...sale.items.map((item) {
                    final ppp = item.piecesPerPackage;
                    final total = item.totalPieces;
                    final cartons = ppp > 1 ? total ~/ ppp : 0;
                    final remain = ppp > 1 ? total % ppp : total;
                    return pw.TableRow(
                      children: [
                        cell(item.productName ?? 'منتج #${item.productId}', arabicFont),
                        cell(ppp > 1 ? '$ppp' : '-', arabicFont, align: pw.TextAlign.center),
                        cell(ppp > 1 ? '$cartons' : '-', arabicFontBold, align: pw.TextAlign.center),
                        cell(ppp > 1 ? '$remain' : '-', arabicFont, align: pw.TextAlign.center),
                        cell('$total', arabicFontBold, align: pw.TextAlign.center),
                        cell('${item.unitPrice.toStringAsFixed(0)}', arabicFont, align: pw.TextAlign.center),
                        cell('${item.subtotal.toStringAsFixed(0)}', arabicFontBold, align: pw.TextAlign.center),
                      ],
                    );
                  }),
                ],
              ),
              pw.SizedBox(height: 20),

              // Summary
              pw.Container(
                alignment: pw.Alignment.centerLeft,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('المجموع الفرعي:', style: pw.TextStyle(font: arabicFont)),
                        pw.Text('${sale.totalAmount.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
                      ],
                    ),
                    if (sale.discount > 0) ...[
                      pw.SizedBox(height: 4),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('الخصم:', style: pw.TextStyle(font: arabicFont)),
                          pw.Text('-${sale.discount.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
                        ],
                      ),
                    ],
                    if (sale.tax > 0) ...[
                      pw.SizedBox(height: 4),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('الضريبة:', style: pw.TextStyle(font: arabicFont)),
                          pw.Text('${sale.tax.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
                        ],
                      ),
                    ],
                    pw.SizedBox(height: 8),
                    pw.Divider(),
                    pw.SizedBox(height: 8),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('الإجمالي:', style: pw.TextStyle(font: arabicFontBold, fontSize: 16)),
                        pw.Text('${sale.grandTotal.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFontBold, fontSize: 16)),
                      ],
                    ),
                    pw.SizedBox(height: 4),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('المدفوع:', style: pw.TextStyle(font: arabicFont)),
                        pw.Text('${sale.paidAmount.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
                      ],
                    ),
                    if (sale.dueAmount > 0) ...[
                      pw.SizedBox(height: 4),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('المتبقي:', style: pw.TextStyle(font: arabicFont)),
                          pw.Text('${sale.dueAmount.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont, color: PdfColors.red)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              // Debt section (only if canCollectDebt is enabled)
              if (canCollectDebt && sale.clientId != null) ...[
                pw.SizedBox(height: 16),
                pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey400),
                    borderRadius: pw.BorderRadius.circular(4),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('معلومات الدين', style: pw.TextStyle(font: arabicFontBold, fontSize: 13)),
                      pw.SizedBox(height: 8),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('الدين السابق:', style: pw.TextStyle(font: arabicFont)),
                          pw.Text('${(sale.clientBalance - sale.dueAmount).toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
                        ],
                      ),
                      pw.SizedBox(height: 4),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('مبلغ الفاتورة:', style: pw.TextStyle(font: arabicFont)),
                          pw.Text('${sale.grandTotal.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
                        ],
                      ),
                      pw.SizedBox(height: 4),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('المدفوع:', style: pw.TextStyle(font: arabicFont)),
                          pw.Text('${sale.paidAmount.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont, color: PdfColors.green)),
                        ],
                      ),
                      pw.SizedBox(height: 4),
                      pw.Divider(),
                      pw.SizedBox(height: 4),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('إجمالي الدين:', style: pw.TextStyle(font: arabicFontBold, fontSize: 14)),
                          pw.Text('${sale.clientBalance.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFontBold, fontSize: 14, color: PdfColors.red)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],

              if (sale.note != null && sale.note!.isNotEmpty) ...[
                pw.SizedBox(height: 20),
                pw.Text('ملاحظات: ${sale.note}', style: pw.TextStyle(font: arabicFont, fontSize: 10)),
              ],

              pw.Spacer(),

              // Footer
              pw.Center(
                child: pw.Text('شكراً لتعاملكم معنا', style: pw.TextStyle(font: arabicFont, fontSize: 12)),
              ),
            ],
          );
        },
      ),
    );

    return Uint8List.fromList(await pdf.save());
  }
}

class _HeaderStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _HeaderStat({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 18, color: Colors.white70),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10)),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isNegative;

  const _SummaryRow({required this.label, required this.value, this.isNegative = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700])),
          Text(value, style: TextStyle(color: isNegative ? Colors.red : null)),
        ],
      ),
    );
  }
}

class _PaymentStatusBadge extends StatelessWidget {
  final String status;

  const _PaymentStatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case 'paid':
        bgColor = AppTheme.successColor.withValues(alpha: 0.2);
        textColor = Colors.white;
        label = 'مدفوع';
        break;
      case 'partial':
        bgColor = AppTheme.warningColor.withValues(alpha: 0.2);
        textColor = Colors.white;
        label = 'مدفوع جزئياً';
        break;
      default:
        bgColor = AppTheme.dangerColor.withValues(alpha: 0.2);
        textColor = Colors.white;
        label = 'غير مدفوع';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textColor),
      ),
    );
  }
}
