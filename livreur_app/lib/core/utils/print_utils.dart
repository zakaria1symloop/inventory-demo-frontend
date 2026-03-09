import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../data/models/delivery_model.dart';

class PrintUtils {
  static Future<void> printOrderReceipt(BuildContext context, DeliveryOrderModel order) async {
    final pdf = await _generateOrderPdf(order);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf,
      name: 'فاتورة_طلب_${order.orderId}',
    );
  }

  static Future<Uint8List> _generateOrderPdf(DeliveryOrderModel order) async {
    final pdf = pw.Document();
    final arabicFont = await PdfGoogleFonts.cairoRegular();
    final arabicFontBold = await PdfGoogleFonts.cairoBold();

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
                    pw.Text(
                      'فاتورة',
                      style: pw.TextStyle(font: arabicFontBold, fontSize: 24),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      '#${order.orderId}',
                      style: pw.TextStyle(font: arabicFont, fontSize: 14),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),
              pw.Divider(),
              pw.SizedBox(height: 10),

              // Client & Date Info
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('العميل: ${order.clientName ?? "غير محدد"}', style: pw.TextStyle(font: arabicFont)),
                  pw.Text('التاريخ: ${_formatDate(order.deliveredAt)}', style: pw.TextStyle(font: arabicFont)),
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
                      _cell('المنتج', arabicFontBold),
                      _cell('ق/ك', arabicFontBold, align: pw.TextAlign.center),
                      _cell('كراتين', arabicFontBold, align: pw.TextAlign.center),
                      _cell('قطع', arabicFontBold, align: pw.TextAlign.center),
                      _cell('إجمالي', arabicFontBold, align: pw.TextAlign.center),
                      _cell('السعر', arabicFontBold, align: pw.TextAlign.center),
                      _cell('المجموع', arabicFontBold, align: pw.TextAlign.center),
                    ],
                  ),
                  // Data Rows - use delivered quantities
                  ...order.items.where((item) => item.quantityDelivered > 0).map((item) {
                    final ppp = item.piecesPerPackage;
                    final total = item.quantityDelivered;
                    final cartons = ppp > 1 ? total ~/ ppp : 0;
                    final remain = ppp > 1 ? total % ppp : total;
                    // Calculate subtotal based on delivered quantity
                    final itemSubtotal = item.quantityConfirmed > 0
                        ? item.subtotal * (total / item.quantityConfirmed)
                        : total * item.unitPrice;
                    return pw.TableRow(
                      children: [
                        _cell(item.productName ?? 'منتج #${item.productId}', arabicFont),
                        _cell(ppp > 1 ? '$ppp' : '-', arabicFont, align: pw.TextAlign.center),
                        _cell(ppp > 1 ? '$cartons' : '-', arabicFontBold, align: pw.TextAlign.center),
                        _cell(ppp > 1 ? '$remain' : '-', arabicFont, align: pw.TextAlign.center),
                        _cell('$total', arabicFontBold, align: pw.TextAlign.center),
                        _cell('${item.unitPrice.toStringAsFixed(0)}', arabicFont, align: pw.TextAlign.center),
                        _cell('${itemSubtotal.toStringAsFixed(0)}', arabicFontBold, align: pw.TextAlign.center),
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
                        pw.Text('${_calcSubtotal(order).toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
                      ],
                    ),
                    if (_calcDiscount(order) > 0) ...[
                      pw.SizedBox(height: 4),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('الخصم:', style: pw.TextStyle(font: arabicFont)),
                          pw.Text('-${_calcDiscount(order).toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
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
                        pw.Text('${_calcGrandTotal(order).toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFontBold, fontSize: 16)),
                      ],
                    ),
                    if (order.amountCollected != null) ...[
                      pw.SizedBox(height: 4),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('المدفوع:', style: pw.TextStyle(font: arabicFont)),
                          pw.Text('${order.amountCollected!.toStringAsFixed(2)} د.ج', style: pw.TextStyle(font: arabicFont)),
                        ],
                      ),
                      if (_calcGrandTotal(order) - order.amountCollected! > 0.01) ...[
                        pw.SizedBox(height: 4),
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text('المتبقي:', style: pw.TextStyle(font: arabicFont)),
                            pw.Text(
                              '${(_calcGrandTotal(order) - order.amountCollected!).toStringAsFixed(2)} د.ج',
                              style: pw.TextStyle(font: arabicFont, color: PdfColors.red),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ],
                ),
              ),

              if (order.notes != null && order.notes!.isNotEmpty) ...[
                pw.SizedBox(height: 20),
                pw.Text('ملاحظات: ${order.notes}', style: pw.TextStyle(font: arabicFont, fontSize: 10)),
              ],

              pw.Spacer(),

              // Footer
              pw.Center(
                child: pw.Text(
                  'شكراً لتعاملكم معنا',
                  style: pw.TextStyle(font: arabicFont, fontSize: 12),
                ),
              ),
            ],
          );
        },
      ),
    );

    return Uint8List.fromList(await pdf.save());
  }

  /// Calculate subtotal from delivered items (before discount)
  static double _calcSubtotal(DeliveryOrderModel order) {
    double total = 0;
    for (var item in order.items) {
      if (item.quantityDelivered > 0) {
        total += item.quantityDelivered * item.unitPrice;
      }
    }
    return total;
  }

  /// Calculate discount from delivered items
  static double _calcDiscount(DeliveryOrderModel order) {
    double total = 0;
    for (var item in order.items) {
      if (item.quantityDelivered > 0 && item.discount > 0) {
        if (item.quantityConfirmed > 0) {
          total += item.discount * (item.quantityDelivered / item.quantityConfirmed);
        }
      }
    }
    return total;
  }

  /// Calculate grand total (subtotal - discount)
  static double _calcGrandTotal(DeliveryOrderModel order) {
    return _calcSubtotal(order) - _calcDiscount(order);
  }

  static pw.Widget _cell(String text, pw.Font font, {pw.TextAlign? align}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(text, style: pw.TextStyle(font: font), textAlign: align),
    );
  }

  static String _formatDate(String? date) {
    if (date == null) return '-';
    try {
      final parsed = DateTime.parse(date);
      return '${parsed.day.toString().padLeft(2, '0')}/${parsed.month.toString().padLeft(2, '0')}/${parsed.year} ${parsed.hour.toString().padLeft(2, '0')}:${parsed.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return date;
    }
  }
}
