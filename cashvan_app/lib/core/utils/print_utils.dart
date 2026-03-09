import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../data/models/sale_model.dart';

class PrintUtils {
  static Future<void> printSaleReceipt(SaleModel sale) async {
    final pdf = await _generateSalePdf(sale);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf,
      name: 'فاتورة_${sale.reference ?? sale.id}',
    );
  }

  static Future<Uint8List> _generateSalePdf(SaleModel sale) async {
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
                      'فاتورة بيع',
                      style: pw.TextStyle(font: arabicFontBold, fontSize: 24),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      sale.reference ?? '#${sale.id}',
                      style: pw.TextStyle(font: arabicFont, fontSize: 14),
                    ),
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
                  pw.Text(
                    'العميل: ${sale.clientName ?? "بيع نقدي"}',
                    style: pw.TextStyle(font: arabicFont),
                  ),
                  pw.Text(
                    'التاريخ: ${_formatDate(sale.date)}',
                    style: pw.TextStyle(font: arabicFont),
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Products Table
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
                  ...sale.items.map((item) {
                    final ppp = item.piecesPerPackage;
                    final total = item.totalPieces;
                    final cartons = ppp > 1 ? total ~/ ppp : 0;
                    final remain = ppp > 1 ? total % ppp : total;
                    return pw.TableRow(
                      children: [
                        _cell(item.productName ?? 'منتج #${item.productId}', arabicFont),
                        _cell(ppp > 1 ? '$ppp' : '-', arabicFont, align: pw.TextAlign.center),
                        _cell(ppp > 1 ? '$cartons' : '-', arabicFontBold, align: pw.TextAlign.center),
                        _cell(ppp > 1 ? '$remain' : '-', arabicFont, align: pw.TextAlign.center),
                        _cell('$total', arabicFontBold, align: pw.TextAlign.center),
                        _cell('${item.unitPrice.toStringAsFixed(0)}', arabicFont, align: pw.TextAlign.center),
                        _cell('${item.subtotal.toStringAsFixed(0)}', arabicFontBold, align: pw.TextAlign.center),
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

              if (sale.note != null && sale.note!.isNotEmpty) ...[
                pw.SizedBox(height: 20),
                pw.Text('ملاحظات: ${sale.note}', style: pw.TextStyle(font: arabicFont, fontSize: 10)),
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
