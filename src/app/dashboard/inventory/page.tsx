'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { inventoryApi, warehousesApi, categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import DateInput from '@/components/ui/DateInput';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  XMarkIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  DocumentChartBarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Product {
  id: number;
  name: string;
  barcode: string;
  cost_price: number;
  retail_price: number;
  stock_alert: number;
  pieces_per_package: number;
  total_stock: number;
  available_stock?: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  unit_sale?: { id: number; name: string; short_name: string };
  stock?: Array<{ warehouse_id: number; quantity: number; warehouse?: { id: number; name: string } }>;
}

interface Warehouse {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface EditingProduct {
  productId: number;
  warehouseId: number;
  currentQty: number;
  newQty: string;
  mode: 'adjust' | 'transfer';
  toWarehouseId?: string;
  reason?: string;
  isLoss?: boolean;
}

interface ReportProduct {
  product_id: number;
  product_name: string;
  barcode: string;
  category: string;
  unit: string;
  ppp: number;
  cost_price: number;
  retail_price: number;
  opening_stock: number;
  total_in: number;
  total_out: number;
  closing_stock: number;
  by_type: Record<string, number>;
}

interface ReportData {
  warehouse: { id: number; name: string; user: string | null };
  from_date: string | null;
  to_date: string | null;
  products: ReportProduct[];
  summary: {
    total_products: number;
    total_opening: number;
    total_in: number;
    total_out: number;
    total_closing: number;
    total_cost_value: number;
    total_retail_value: number;
  };
}

// ---- Tab type ----
type TabType = 'inventory' | 'report';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Inline editing state
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Report state
  const [reportWarehouse, setReportWarehouse] = useState<string>('');
  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportSearch, setReportSearch] = useState<string>('');

  // Physical count state: { [product_id]: counted_quantity }
  const [physicalCounts, setPhysicalCounts] = useState<Record<number, string>>({});
  const [physicalCartons, setPhysicalCartons] = useState<Record<number, string>>({});
  const [physicalPieces, setPhysicalPieces] = useState<Record<number, string>>({});
  const [isSavingCount, setIsSavingCount] = useState(false);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    product_name: true, barcode: true, category: true, unit: false, ppp: true,
    opening_stock: true, opening_cartons: true, total_in: true, total_in_cartons: true, total_out: true, total_out_cartons: true, closing_stock: true, closing_cartons: true,
    physical: true, diff: true,
    cost_price: false, cost_value: true, retail_price: false, retail_value: true,
  });

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    totalRetailValue: 0,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') fetchProducts();
  }, [selectedWarehouse, selectedCategory, stockFilter, searchTerm, currentPage, activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'Escape') {
        if (editingProduct) cancelEditing();
        else if (isInputFocused) (target as HTMLInputElement).blur();
        return;
      }

      if (isInputFocused) return;

      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); fetchProducts(); return; }
      if (e.key === '1') { e.preventDefault(); setStockFilter(f => f === 'in_stock' ? '' : 'in_stock'); setCurrentPage(1); return; }
      if (e.key === '2') { e.preventDefault(); setStockFilter(f => f === 'low_stock' ? '' : 'low_stock'); setCurrentPage(1); return; }
      if (e.key === '3') { e.preventDefault(); setStockFilter(f => f === 'out_of_stock' ? '' : 'out_of_stock'); setCurrentPage(1); return; }
      if (e.key === 'ArrowLeft' && currentPage > 1) { e.preventDefault(); setCurrentPage(p => p - 1); return; }
      if (e.key === 'ArrowRight' && currentPage < totalPages) { e.preventDefault(); setCurrentPage(p => p + 1); return; }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingProduct, searchTerm, selectedWarehouse, selectedCategory, stockFilter, currentPage, totalPages]);

  const fetchInitialData = async () => {
    try {
      const [warehousesRes, categoriesRes] = await Promise.all([
        warehousesApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setCategories(categoriesRes.data.data || categoriesRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page: currentPage, per_page: 30 };
      if (searchTerm) params.search = searchTerm;
      if (selectedWarehouse) params.warehouse_id = selectedWarehouse;
      if (selectedCategory) params.category_id = selectedCategory;
      if (stockFilter) params.stock_status = stockFilter;

      const response = await inventoryApi.getAll(params);
      const data = response.data;
      setProducts(data.data || []);
      setTotalPages(data.last_page || 1);

      const allProducts = data.data || [];
      const inStock = allProducts.filter((p: Product) => Number(p.total_stock) > Number(p.stock_alert) * (Number(p.pieces_per_package) || 1)).length;
      const lowStock = allProducts.filter((p: Product) => Number(p.total_stock) > 0 && Number(p.total_stock) <= Number(p.stock_alert) * (Number(p.pieces_per_package) || 1)).length;
      const outOfStock = allProducts.filter((p: Product) => Number(p.total_stock) <= 0).length;
      const totalCostValue = allProducts.reduce((sum: number, p: Product) => sum + (Number(p.total_stock) || 0) * (Number(p.cost_price) || 0), 0);
      const totalRetailValue = allProducts.reduce((sum: number, p: Product) => sum + (Number(p.total_stock) || 0) * (Number(p.retail_price) || 0), 0);

      setStats({ totalProducts: data.total || allProducts.length, inStock, lowStock, outOfStock, totalValue: totalCostValue, totalRetailValue });
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReport = async () => {
    if (!reportWarehouse) {
      toast.error('اختر المستودع أولاً');
      return;
    }
    setIsLoadingReport(true);
    setPhysicalCounts({});
    try {
      const params: { warehouse_id: number; from_date?: string; to_date?: string } = {
        warehouse_id: parseInt(reportWarehouse),
      };
      if (reportFromDate) params.from_date = reportFromDate;
      if (reportToDate) params.to_date = reportToDate;
      const response = await inventoryApi.getReport(params);
      setReportData(response.data);
    } catch {
      toast.error('خطأ في تحميل التقرير');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // ---- Column definitions for export ----
  const allExportColumns = [
    { key: 'product_name', label: 'المنتج', group: 'basic' },
    { key: 'barcode', label: 'الباركود', group: 'basic' },
    { key: 'category', label: 'الفئة', group: 'basic' },
    { key: 'unit', label: 'الوحدة', group: 'basic' },
    { key: 'ppp', label: 'قطعة/كرتون', group: 'basic' },
    { key: 'opening_stock', label: 'الافتتاحي (قطع)', group: 'stock' },
    { key: 'opening_cartons', label: 'الافتتاحي (كراتين)', group: 'stock' },
    { key: 'total_in', label: 'الوارد (قطع)', group: 'stock' },
    { key: 'total_in_cartons', label: 'الوارد (كراتين)', group: 'stock' },
    { key: 'total_out', label: 'الصادر (قطع)', group: 'stock' },
    { key: 'total_out_cartons', label: 'الصادر (كراتين)', group: 'stock' },
    { key: 'closing_stock', label: 'النظامي (قطع)', group: 'stock' },
    { key: 'closing_cartons', label: 'النظامي (كراتين)', group: 'stock' },
    { key: 'physical', label: 'الجرد الفعلي', group: 'count' },
    { key: 'diff', label: 'الفرق', group: 'count' },
    { key: 'cost_price', label: 'ثمن الشراء (للوحدة)', group: 'value' },
    { key: 'cost_value', label: 'إجمالي الشراء', group: 'value' },
    { key: 'retail_price', label: 'ثمن البيع (للوحدة)', group: 'value' },
    { key: 'retail_value', label: 'إجمالي البيع', group: 'value' },
  ];

  const columnGroups = [
    { key: 'basic', label: 'معلومات المنتج' },
    { key: 'stock', label: 'حركة المخزون' },
    { key: 'count', label: 'الجرد الفعلي' },
    { key: 'value', label: 'القيمة المالية' },
  ];

  const toggleExportColumn = (key: string) => {
    setExportColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroupColumns = (groupKey: string) => {
    const groupCols = allExportColumns.filter(c => c.group === groupKey);
    const allOn = groupCols.every(c => exportColumns[c.key]);
    const newVal = !allOn;
    setExportColumns(prev => {
      const updated = { ...prev };
      groupCols.forEach(c => { updated[c.key] = newVal; });
      return updated;
    });
  };

  const selectedExportColumns = allExportColumns.filter(c => exportColumns[c.key]);

  // ---- Excel Export (styled .xlsx) ----
  const exportToExcel = async () => {
    if (!reportData) return;

    const cols = selectedExportColumns;
    if (cols.length === 0) { toast.error('اختر عمود واحد على الأقل'); return; }

    const productsToExport = filteredReportProducts;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TrackSera';
    wb.created = new Date();
    const ws = wb.addWorksheet('تقرير الجرد', { views: [{ rightToLeft: true }] });

    // --- Colors ---
    const brandColor = '1B4F72';
    const headerBg = '2E86C1';
    const headerFont = 'FFFFFF';
    const titleBg = '1B4F72';
    const subtitleBg = 'D6EAF8';
    const stripeBg = 'F2F8FD';
    const totalBg = 'D5F5E3';
    const borderColor = 'B0C4DE';
    const greenFont = '1E8449';
    const redFont = 'C0392B';

    const thin = { style: 'thin' as const, color: { argb: borderColor } };
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };

    const colCount = cols.length;

    // Row 1: Title
    const titleRow = ws.addRow([`تقرير جرد مخزون: ${reportData.warehouse.name}${reportData.warehouse.user ? ' — ' + reportData.warehouse.user : ''}`]);
    ws.mergeCells(1, 1, 1, colCount);
    titleRow.height = 36;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: headerFont } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleBg } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 2: Period + Date
    const period = `الفترة: ${reportData.from_date || 'البداية'} — ${reportData.to_date || 'اليوم'}  |  تاريخ التصدير: ${new Date().toLocaleDateString('ar-DZ')}`;
    const periodRow = ws.addRow([period]);
    ws.mergeCells(2, 1, 2, colCount);
    periodRow.height = 24;
    const periodCell = periodRow.getCell(1);
    periodCell.font = { name: 'Calibri', size: 11, color: { argb: brandColor } };
    periodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subtitleBg } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 3: Empty separator
    ws.addRow([]);

    // Row 4: Headers
    const headerLabels = cols.map(c => c.label);
    const headerRow = ws.addRow(headerLabels);
    headerRow.height = 28;
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: headerFont } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = borderAll;
    });

    // Find column indices (1-based) for formula references
    const physicalColIdx = cols.findIndex(c => c.key === 'physical') + 1;
    const diffColIdx = cols.findIndex(c => c.key === 'diff') + 1;
    const closingColIdx = cols.findIndex(c => c.key === 'closing_stock') + 1;
    const colLetter = (idx: number) => String.fromCharCode(64 + idx); // 1->A, 2->B, etc.

    // Data rows (start at Excel row 5: title=1, period=2, empty=3, header=4)
    productsToExport.forEach((p, idx) => {
      const counted = physicalCounts[p.product_id];
      const countedVal = counted !== undefined && counted !== '' ? parseInt(counted) : null;

      const ppp = p.ppp || 1;
      const fmtCartons = (qty: number) => {
        const c = Math.floor(qty / ppp), r = qty % ppp;
        if (c > 0 && r > 0) return `${c} كرتون + ${r} قطعة`;
        if (c > 0) return `${c} كرتون`;
        if (r > 0) return `${r} قطعة`;
        return '0';
      };
      const valueMap: Record<string, string | number | null> = {
        product_name: p.product_name,
        barcode: p.barcode || '',
        category: p.category || '',
        unit: p.unit || '',
        ppp: p.ppp,
        opening_stock: p.opening_stock,
        opening_cartons: ppp > 1 ? fmtCartons(p.opening_stock) : '-',
        total_in: p.total_in,
        total_in_cartons: ppp > 1 ? fmtCartons(p.total_in) : '-',
        total_out: p.total_out,
        total_out_cartons: ppp > 1 ? fmtCartons(p.total_out) : '-',
        closing_stock: p.closing_stock,
        closing_cartons: ppp > 1 ? fmtCartons(p.closing_stock) : '-',
        physical: countedVal,
        diff: null, // will be formula
        cost_price: p.cost_price,
        cost_value: p.closing_stock * p.cost_price,
        retail_price: p.retail_price,
        retail_value: p.closing_stock * p.retail_price,
      };

      const rowData = cols.map(c => valueMap[c.key] ?? '');
      const row = ws.addRow(rowData);
      const excelRowNum = 4 + idx + 1; // header is row 4

      // Insert formula for diff column: =IF(physical="","",physical-closing)
      if (diffColIdx > 0 && physicalColIdx > 0 && closingColIdx > 0) {
        const pLetter = colLetter(physicalColIdx);
        const cLetter = colLetter(closingColIdx);
        const diffCell = row.getCell(diffColIdx);
        diffCell.value = { formula: `IF(${pLetter}${excelRowNum}="","",${pLetter}${excelRowNum}-${cLetter}${excelRowNum})` } as any;
      }

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colKey = cols[colNumber - 1]?.key;
        cell.font = { name: 'Calibri', size: 11 };
        cell.alignment = { horizontal: colKey === 'product_name' ? 'right' : 'center', vertical: 'middle' };
        cell.border = borderAll;

        // Stripe
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stripeBg } };
        }

        if (colKey === 'total_in' && p.total_in > 0) {
          cell.font = { name: 'Calibri', size: 11, color: { argb: greenFont } };
        }
        if (colKey === 'total_out' && p.total_out > 0) {
          cell.font = { name: 'Calibri', size: 11, color: { argb: redFont } };
        }
        if (colKey === 'diff') {
          cell.font = { name: 'Calibri', size: 11, bold: true };
        }

        // Number format for currency columns
        if (['cost_price', 'cost_value', 'retail_price', 'retail_value'].includes(colKey)) {
          cell.numFmt = '#,##0.00 "د.ج"';
        }
      });
    });

    // Summary row
    const sumMap: Record<string, string | number> = {
      product_name: `الإجمالي (${productsToExport.length} منتج)`,
      barcode: '', category: '', unit: '', ppp: '',
      opening_stock: productsToExport.reduce((s, p) => s + p.opening_stock, 0),
      opening_cartons: '-',
      total_in: productsToExport.reduce((s, p) => s + p.total_in, 0),
      total_in_cartons: '-',
      total_out: productsToExport.reduce((s, p) => s + p.total_out, 0),
      total_out_cartons: '-',
      closing_stock: productsToExport.reduce((s, p) => s + p.closing_stock, 0),
      closing_cartons: '-',
      physical: '', diff: '',
      cost_price: '',
      cost_value: productsToExport.reduce((s, p) => s + p.closing_stock * p.cost_price, 0),
      retail_price: '',
      retail_value: productsToExport.reduce((s, p) => s + p.closing_stock * p.retail_price, 0),
    };
    const totalRowData = cols.map(c => sumMap[c.key] ?? '');
    const totalRow = ws.addRow(totalRowData);
    const totalExcelRow = 4 + productsToExport.length + 1;
    totalRow.height = 28;

    // Add SUM formulas for physical and diff in the summary row
    if (physicalColIdx > 0) {
      const pLetter = colLetter(physicalColIdx);
      totalRow.getCell(physicalColIdx).value = { formula: `SUM(${pLetter}5:${pLetter}${totalExcelRow - 1})` } as any;
    }
    if (diffColIdx > 0) {
      const dLetter = colLetter(diffColIdx);
      totalRow.getCell(diffColIdx).value = { formula: `SUM(${dLetter}5:${dLetter}${totalExcelRow - 1})` } as any;
    }

    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colKey = cols[colNumber - 1]?.key;
      cell.font = { name: 'Calibri', size: 12, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: totalBg } };
      cell.alignment = { horizontal: colKey === 'product_name' ? 'right' : 'center', vertical: 'middle' };
      cell.border = borderAll;
      if (['cost_value', 'retail_value'].includes(colKey)) {
        cell.numFmt = '#,##0.00 "د.ج"';
      }
    });

    // Auto column widths
    const defaultWidths: Record<string, number> = {
      product_name: 32, barcode: 18, category: 16, unit: 10, ppp: 12,
      opening_stock: 14, opening_cartons: 16, total_in: 12, total_in_cartons: 16, total_out: 12, total_out_cartons: 16, closing_stock: 16, closing_cartons: 16,
      physical: 14, diff: 12,
      cost_price: 14, cost_value: 16, retail_price: 14, retail_value: 16,
    };
    cols.forEach((c, i) => {
      ws.getColumn(i + 1).width = defaultWidths[c.key] || 14;
    });

    // Generate and download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const wName = reportData.warehouse.name.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    saveAs(blob, `inventory_${wName}_${dateStr}.xlsx`);
    setShowExportModal(false);
    toast.success('تم تصدير الملف بنجاح');
  };

  // ---- Physical count functions ----
  const setPhysicalCount = (productId: number, value: string) => {
    setPhysicalCounts(prev => ({ ...prev, [productId]: value }));
  };

  const setPhysicalByCarton = (productId: number, cartonsStr: string, ppp: number) => {
    setPhysicalCartons(prev => ({ ...prev, [productId]: cartonsStr }));
    const cartons = parseInt(cartonsStr) || 0;
    const pieces = parseInt(physicalPieces[productId]) || 0;
    const total = cartons * ppp + pieces;
    setPhysicalCounts(prev => ({ ...prev, [productId]: cartonsStr === '' && (physicalPieces[productId] === undefined || physicalPieces[productId] === '') ? '' : String(total) }));
  };

  const setPhysicalByPiece = (productId: number, piecesStr: string, ppp: number) => {
    setPhysicalPieces(prev => ({ ...prev, [productId]: piecesStr }));
    const cartons = parseInt(physicalCartons[productId]) || 0;
    const pieces = parseInt(piecesStr) || 0;
    const total = cartons * ppp + pieces;
    setPhysicalCounts(prev => ({ ...prev, [productId]: piecesStr === '' && (physicalCartons[productId] === undefined || physicalCartons[productId] === '') ? '' : String(total) }));
  };

  const getPhysicalDiff = (productId: number, systemQty: number): number | null => {
    const counted = physicalCounts[productId];
    if (counted === undefined || counted === '') return null;
    const val = parseInt(counted);
    if (isNaN(val)) return null;
    return val - systemQty;
  };

  const getCountedProducts = () => {
    if (!reportData) return [];
    return reportData.products.filter(p => {
      const counted = physicalCounts[p.product_id];
      if (counted === undefined || counted === '') return false;
      const val = parseInt(counted);
      return !isNaN(val) && val !== p.closing_stock;
    });
  };

  const saveAllCounts = async () => {
    const toSave = getCountedProducts();
    if (toSave.length === 0) {
      toast.error('لا توجد فروقات للحفظ');
      return;
    }
    setIsSavingCount(true);
    let successCount = 0;
    let errorCount = 0;
    for (const p of toSave) {
      try {
        await inventoryApi.count({
          product_id: p.product_id,
          warehouse_id: parseInt(reportWarehouse),
          counted_quantity: parseInt(physicalCounts[p.product_id]),
          notes: `جرد فعلي - الفرق: ${parseInt(physicalCounts[p.product_id]) - p.closing_stock}`,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }
    setIsSavingCount(false);
    if (successCount > 0) toast.success(`تم تعديل ${successCount} منتج`);
    if (errorCount > 0) toast.error(`فشل تعديل ${errorCount} منتج`);
    // Refresh report
    setPhysicalCounts({});
    fetchReport();
  };

  // ---- Editing functions ----
  const startEditing = (product: Product, warehouseId: number, currentQty: number, mode: 'adjust' | 'transfer') => {
    setEditingProduct({ productId: product.id, warehouseId, currentQty, newQty: currentQty.toString(), mode, toWarehouseId: '', reason: '' });
  };

  const cancelEditing = () => setEditingProduct(null);

  const handleQuickAdjust = (type: 'add' | 'remove', amount: number = 1) => {
    if (!editingProduct) return;
    const newQty = type === 'add' ? editingProduct.currentQty + amount : Math.max(0, editingProduct.currentQty - amount);
    setEditingProduct({ ...editingProduct, newQty: newQty.toString() });
  };

  const saveAdjustment = async () => {
    if (!editingProduct) return;
    const newQty = parseInt(editingProduct.newQty);
    if (isNaN(newQty) || newQty < 0) { toast.error('الكمية غير صالحة'); return; }
    if (newQty === editingProduct.currentQty) { cancelEditing(); return; }

    setIsProcessing(true);
    try {
      await inventoryApi.adjust({
        product_id: editingProduct.productId,
        warehouse_id: editingProduct.warehouseId,
        quantity: newQty,
        type: 'set',
        reason: editingProduct.reason || (editingProduct.isLoss ? 'خسارة مخزون' : 'تعديل مباشر'),
        is_loss: newQty < editingProduct.currentQty && editingProduct.isLoss,
      });
      toast.success(editingProduct.isLoss ? 'تم تسجيل الخسارة' : 'تم تعديل المخزون');
      cancelEditing();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في التعديل');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveTransfer = async () => {
    if (!editingProduct || !editingProduct.toWarehouseId) { toast.error('اختر المستودع الهدف'); return; }
    const qty = parseInt(editingProduct.newQty);
    if (isNaN(qty) || qty <= 0) { toast.error('الكمية غير صالحة'); return; }
    if (qty > editingProduct.currentQty) { toast.error('الكمية أكبر من المتوفر'); return; }

    setIsProcessing(true);
    try {
      await inventoryApi.transfer({
        product_id: editingProduct.productId,
        from_warehouse_id: editingProduct.warehouseId,
        to_warehouse_id: parseInt(editingProduct.toWarehouseId),
        quantity: qty,
        notes: editingProduct.reason,
      });
      toast.success('تم التحويل بنجاح');
      cancelEditing();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في التحويل');
    } finally {
      setIsProcessing(false);
    }
  };

  // ---- Helpers ----
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const fmtCartonPieces = (totalPieces: number, ppp: number): string => {
    if (!ppp || ppp <= 1) return totalPieces.toString();
    const cartons = Math.floor(totalPieces / ppp);
    const pieces = totalPieces % ppp;
    if (cartons > 0 && pieces > 0) return `${cartons} كرتون + ${pieces} قطعة`;
    if (cartons > 0) return `${cartons} كرتون`;
    if (pieces > 0) return `${pieces} قطعة`;
    return '0';
  };

  const getStockStatusBadge = (product: Product) => {
    if (product.total_stock <= 0)
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">نفذ</span>;
    if (product.total_stock <= product.stock_alert * (product.pieces_per_package || 1))
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">منخفض</span>;
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">متوفر</span>;
  };

  const getProductStockForWarehouse = (product: Product, warehouseId: number) => {
    const stock = product.stock?.find(s => s.warehouse_id === warehouseId);
    return stock?.quantity || 0;
  };

  // Filter report products by search
  const filteredReportProducts = reportData?.products.filter(p => {
    if (!reportSearch) return true;
    const term = reportSearch.toLowerCase();
    return p.product_name.toLowerCase().includes(term) || (p.barcode && p.barcode.toLowerCase().includes(term));
  }) ?? [];

  // ====== RENDER ======
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'inventory'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <CubeIcon className="w-4 h-4 inline-block ml-1" />
          المخزون
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'report'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <DocumentChartBarIcon className="w-4 h-4 inline-block ml-1" />
          تقرير الجرد
        </button>
      </div>

      {/* ========== TAB 1: INVENTORY ========== */}
      {activeTab === 'inventory' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold dark:text-white">إدارة المخزون</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">تتبع ومراقبة مخزون المنتجات</p>
            </div>
            <button onClick={() => fetchProducts()} className="btn btn-secondary">
              <ArrowPathIcon className="w-5 h-5" />
              تحديث
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="card p-3">
              <div className="flex items-center gap-2">
                <CubeIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">المنتجات</p>
                  <p className="text-lg font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </div>
            <div className="card p-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">متوفر</p>
                  <p className="text-lg font-bold text-green-600">{stats.inStock}</p>
                </div>
              </div>
            </div>
            <div className="card p-3">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-500">منخفض</p>
                  <p className="text-lg font-bold text-yellow-600">{stats.lowStock}</p>
                </div>
              </div>
            </div>
            <div className="card p-3">
              <div className="flex items-center gap-2">
                <XMarkIcon className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs text-gray-500">نفذ</p>
                  <p className="text-lg font-bold text-red-600">{stats.outOfStock}</p>
                </div>
              </div>
            </div>
            <div className="card p-3">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">إجمالي الشراء</p>
                  <p className="text-sm font-bold text-purple-600">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </div>
            <div className="card p-3">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-500">إجمالي البيع</p>
                  <p className="text-sm font-bold text-indigo-600">{formatCurrency(stats.totalRetailValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative col-span-2 md:col-span-1">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="بحث بالاسم أو الباركود..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="input pr-9 text-sm"
                />
              </div>
              <select value={selectedWarehouse} onChange={(e) => { setSelectedWarehouse(e.target.value); setCurrentPage(1); }} className="select text-sm">
                <option value="">كل المستودعات</option>
                {warehouses.map((wh) => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
              </select>
              <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }} className="select text-sm">
                <option value="">كل الفئات</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }} className="select text-sm">
                <option value="">كل الحالات</option>
                <option value="in_stock">متوفر</option>
                <option value="low_stock">منخفض</option>
                <option value="out_of_stock">نفذ</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="card p-0 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-right px-4 py-3 text-sm">المنتج</th>
                      <th className="text-right px-4 py-3 text-sm">الفئة</th>
                      <th className="text-center px-4 py-3 text-sm">الوحدة</th>
                      {selectedWarehouse ? (
                        <th className="text-center px-4 py-3 text-sm">مخزون المستودع</th>
                      ) : (
                        warehouses.slice(0, 3).map(wh => (
                          <th key={wh.id} className="text-center px-4 py-3 text-sm">{wh.name}</th>
                        ))
                      )}
                      <th className="text-center px-4 py-3 text-sm">الكمية</th>
                      <th className="text-center px-4 py-3 text-sm">ش/قطعة</th>
                      <th className="text-center px-4 py-3 text-sm">إجمالي ش</th>
                      <th className="text-center px-4 py-3 text-sm">ب/قطعة</th>
                      <th className="text-center px-4 py-3 text-sm">إجمالي ب</th>
                      <th className="text-center px-4 py-3 text-sm">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={20} className="text-center py-8 text-gray-500">لا توجد منتجات</td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const isEditing = editingProduct?.productId === product.id;
                        const totalPieces = Number(product.total_stock) || 0;
                        const ppp = Number(product.pieces_per_package) || 1;
                        const costPerPiece = Number(product.cost_price) || 0;
                        const retailPerPiece = Number(product.retail_price) || 0;

                        return (
                          <tr key={product.id} className={isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}>
                            <td className="px-4 py-2">
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.barcode}</div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.category?.name || '-'}</td>
                            <td className="px-4 py-2 text-center text-sm">
                              {product.unit_sale?.short_name || '-'}
                              {ppp > 1 && <span className="text-xs text-blue-600 block">({ppp})</span>}
                            </td>

                            {selectedWarehouse ? (
                              <td className="px-4 py-2 text-center">
                                {isEditing && editingProduct?.warehouseId === parseInt(selectedWarehouse) ? (
                                  <div className="flex items-center justify-center gap-1">
                                    {editingProduct.mode === 'adjust' ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => handleQuickAdjust('remove')} className="p-1 bg-red-100 hover:bg-red-200 rounded" disabled={isProcessing}>
                                            <MinusIcon className="w-4 h-4 text-red-600" />
                                          </button>
                                          <input type="number" value={editingProduct.newQty} onChange={(e) => setEditingProduct({ ...editingProduct, newQty: e.target.value })} className="w-16 text-center border rounded px-1 py-0.5 text-sm dark:bg-gray-700 dark:border-gray-600" autoFocus />
                                          <button onClick={() => handleQuickAdjust('add')} className="p-1 bg-green-100 hover:bg-green-200 rounded" disabled={isProcessing}>
                                            <PlusIcon className="w-4 h-4 text-green-600" />
                                          </button>
                                          <button onClick={saveAdjustment} className="p-1 bg-blue-500 hover:bg-blue-600 rounded ml-1" disabled={isProcessing}>
                                            <CheckIcon className="w-4 h-4 text-white" />
                                          </button>
                                          <button onClick={cancelEditing} className="p-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 rounded" disabled={isProcessing}>
                                            <XMarkIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                          </button>
                                        </div>
                                        {parseFloat(editingProduct.newQty) < editingProduct.currentQty && (
                                          <label className="flex items-center gap-1 text-xs text-red-600 cursor-pointer">
                                            <input type="checkbox" checked={editingProduct.isLoss || false} onChange={(e) => setEditingProduct({ ...editingProduct, isLoss: e.target.checked })} className="w-3 h-3" />
                                            خسارة
                                          </label>
                                        )}
                                      </div>
                                    ) : (
                                      <>
                                        <input type="number" value={editingProduct.newQty} onChange={(e) => setEditingProduct({ ...editingProduct, newQty: e.target.value })} className="w-16 text-center border rounded px-1 py-0.5 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="الكمية" />
                                        <select value={editingProduct.toWarehouseId} onChange={(e) => setEditingProduct({ ...editingProduct, toWarehouseId: e.target.value })} className="text-xs border rounded px-1 py-0.5 dark:bg-gray-700 dark:border-gray-600">
                                          <option value="">إلى...</option>
                                          {warehouses.filter(w => w.id !== parseInt(selectedWarehouse)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                        <button onClick={saveTransfer} className="p-1 bg-purple-500 hover:bg-purple-600 rounded" disabled={isProcessing}>
                                          <CheckIcon className="w-4 h-4 text-white" />
                                        </button>
                                        <button onClick={cancelEditing} className="p-1 bg-gray-200 hover:bg-gray-300 rounded">
                                          <XMarkIcon className="w-4 h-4 text-gray-600" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="font-bold cursor-pointer hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => startEditing(product, parseInt(selectedWarehouse), getProductStockForWarehouse(product, parseInt(selectedWarehouse)), 'adjust')} title="انقر للتعديل">
                                      {getProductStockForWarehouse(product, parseInt(selectedWarehouse))}
                                    </span>
                                    {warehouses.length > 1 && (
                                      <button onClick={() => startEditing(product, parseInt(selectedWarehouse), getProductStockForWarehouse(product, parseInt(selectedWarehouse)), 'transfer')} className="text-xs text-purple-600 hover:text-purple-800 px-1" title="تحويل">⇄</button>
                                    )}
                                  </div>
                                )}
                              </td>
                            ) : (
                              warehouses.slice(0, 3).map(wh => {
                                const qty = getProductStockForWarehouse(product, wh.id);
                                const isEditingThis = isEditing && editingProduct?.warehouseId === wh.id;
                                return (
                                  <td key={wh.id} className="px-4 py-2 text-center">
                                    {isEditingThis ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center justify-center gap-1">
                                          <button onClick={() => handleQuickAdjust('remove')} className="p-0.5 bg-red-100 hover:bg-red-200 rounded" disabled={isProcessing}><MinusIcon className="w-3 h-3 text-red-600" /></button>
                                          <input type="number" value={editingProduct?.newQty} onChange={(e) => setEditingProduct({ ...editingProduct!, newQty: e.target.value })} className="w-12 text-center border rounded px-1 py-0.5 text-xs dark:bg-gray-700 dark:border-gray-600" autoFocus />
                                          <button onClick={() => handleQuickAdjust('add')} className="p-0.5 bg-green-100 hover:bg-green-200 rounded" disabled={isProcessing}><PlusIcon className="w-3 h-3 text-green-600" /></button>
                                          <button onClick={saveAdjustment} className="p-0.5 bg-blue-500 hover:bg-blue-600 rounded" disabled={isProcessing}><CheckIcon className="w-3 h-3 text-white" /></button>
                                          <button onClick={cancelEditing} className="p-0.5 bg-gray-200 hover:bg-gray-300 rounded"><XMarkIcon className="w-3 h-3 text-gray-600" /></button>
                                        </div>
                                        {editingProduct && parseFloat(editingProduct.newQty) < editingProduct.currentQty && (
                                          <label className="flex items-center gap-1 text-xs text-red-600 cursor-pointer">
                                            <input type="checkbox" checked={editingProduct.isLoss || false} onChange={(e) => setEditingProduct({ ...editingProduct, isLoss: e.target.checked })} className="w-3 h-3" />
                                            خسارة
                                          </label>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={`cursor-pointer hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 ${qty > 0 ? 'font-medium' : 'text-gray-400'}`} onClick={() => startEditing(product, wh.id, qty, 'adjust')} title="انقر للتعديل">
                                        {qty}
                                      </span>
                                    )}
                                  </td>
                                );
                              })
                            )}

                            <td className="px-4 py-2 text-center">
                              <div className="font-bold">{totalPieces} <span className="text-xs font-normal text-gray-500">قطعة</span></div>
                              {ppp > 1 && <div className="text-xs text-blue-600 dark:text-blue-400">{fmtCartonPieces(totalPieces, ppp)}</div>}
                            </td>
                            <td className="px-4 py-2 text-center text-sm">{formatCurrency(costPerPiece)}</td>
                            <td className="px-4 py-2 text-center text-sm font-medium text-purple-700 dark:text-purple-400">{formatCurrency(totalPieces * costPerPiece)}</td>
                            <td className="px-4 py-2 text-center text-sm">{formatCurrency(retailPerPiece)}</td>
                            <td className="px-4 py-2 text-center text-sm font-medium text-indigo-700 dark:text-indigo-400">{formatCurrency(totalPieces * retailPerPiece)}</td>
                            <td className="px-4 py-2 text-center">{getStockStatusBadge(product)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {products.length > 0 && (
                    <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
                      <tr>
                        <td className="px-4 py-3 text-sm" colSpan={selectedWarehouse ? 4 : 3 + Math.min(3, warehouses.length)}>الإجمالي</td>
                        <td className="px-4 py-3 text-center text-sm">{products.reduce((s, p) => s + (Number(p.total_stock) || 0), 0)} قطعة</td>
                        <td className="px-4 py-3 text-center text-sm">-</td>
                        <td className="px-4 py-3 text-center text-sm text-purple-700 dark:text-purple-400">
                          {formatCurrency(products.reduce((s, p) => s + (Number(p.total_stock) || 0) * (Number(p.cost_price) || 0), 0))}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">-</td>
                        <td className="px-4 py-3 text-center text-sm text-indigo-700 dark:text-indigo-400">
                          {formatCurrency(products.reduce((s, p) => s + (Number(p.total_stock) || 0) * (Number(p.retail_price) || 0), 0))}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t dark:border-gray-700">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn btn-secondary text-sm py-1 px-3">السابق</button>
                <span className="text-sm text-gray-600 dark:text-gray-400">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn btn-secondary text-sm py-1 px-3">التالي</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========== TAB 2: INVENTORY REPORT ========== */}
      {activeTab === 'report' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold dark:text-white">تقرير الجرد</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">مقارنة المخزون النظامي بالفعلي مع تصدير Excel</p>
            </div>
            {reportData && (
              <button onClick={() => setShowExportModal(true)} className="btn btn-primary gap-2">
                <ArrowDownTrayIcon className="w-5 h-5" />
                تصدير Excel
              </button>
            )}
          </div>

          {/* Report Filters */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-sm dark:text-gray-300">فلاتر التقرير</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">المستودع *</label>
                <select value={reportWarehouse} onChange={(e) => setReportWarehouse(e.target.value)} className="select text-sm">
                  <option value="">اختر المستودع</option>
                  {warehouses.map((wh) => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">من تاريخ</label>
                <DateInput value={reportFromDate} onChange={(v) => setReportFromDate(v)} placeholder="من تاريخ" className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">إلى تاريخ</label>
                <DateInput value={reportToDate} onChange={(v) => setReportToDate(v)} placeholder="إلى تاريخ" className="text-sm" />
              </div>
              <div className="relative">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">بحث منتج</label>
                <MagnifyingGlassIcon className="absolute right-3 bottom-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="اسم أو باركود..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="input pr-9 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button onClick={fetchReport} disabled={isLoadingReport || !reportWarehouse} className="btn btn-primary w-full">
                  {isLoadingReport ? <div className="spinner w-4 h-4"></div> : 'عرض التقرير'}
                </button>
              </div>
            </div>
          </div>

          {/* Report Results */}
          {reportData && (
            <>
              {/* Report Header */}
              <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold dark:text-white">{reportData.warehouse.name}</h2>
                    {reportData.warehouse.user && (
                      <p className="text-sm text-gray-500">المسؤول: {reportData.warehouse.user}</p>
                    )}
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">المنتجات</p>
                      <p className="text-lg font-bold text-blue-600">{reportData.summary.total_products}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">الافتتاحي</p>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{reportData.summary.total_opening}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">الوارد</p>
                      <p className="text-lg font-bold text-green-600">+{reportData.summary.total_in}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">الصادر</p>
                      <p className="text-lg font-bold text-red-600">-{reportData.summary.total_out}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">الإغلاق</p>
                      <p className="text-lg font-bold text-indigo-600">{reportData.summary.total_closing}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">القيمة</p>
                      <p className="text-lg font-bold text-purple-600">{formatCurrency(reportData.summary.total_cost_value)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action bar: save counts + differences summary */}
              {getCountedProducts().length > 0 && (
                <div className="card p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {getCountedProducts().length} منتج بفروقات جاهز للتعديل
                      </span>
                    </div>
                    <button
                      onClick={saveAllCounts}
                      disabled={isSavingCount}
                      className="btn btn-primary gap-2 text-sm"
                    >
                      {isSavingCount ? <div className="spinner w-4 h-4"></div> : <CheckIcon className="w-4 h-4" />}
                      تطبيق الجرد الفعلي
                    </button>
                  </div>
                </div>
              )}

              {/* Report Table */}
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-right px-3 py-2.5 text-xs">#</th>
                        <th className="text-right px-3 py-2.5 text-xs">المنتج</th>
                        <th className="text-right px-3 py-2.5 text-xs">الفئة</th>
                        <th className="text-center px-3 py-2.5 text-xs">ق/ك</th>
                        <th className="text-center px-3 py-2.5 text-xs bg-gray-100 dark:bg-gray-750">افتتاحي</th>
                        <th className="text-center px-3 py-2.5 text-xs bg-green-50 dark:bg-green-900/20">وارد</th>
                        <th className="text-center px-3 py-2.5 text-xs bg-red-50 dark:bg-red-900/20">صادر</th>
                        <th className="text-center px-3 py-2.5 text-xs bg-blue-50 dark:bg-blue-900/20 font-bold">نظامي</th>
                        <th className="text-center px-3 py-2.5 text-xs bg-yellow-50 dark:bg-yellow-900/20 font-bold min-w-[120px]">فعلي</th>
                        <th className="text-center px-3 py-2.5 text-xs bg-orange-50 dark:bg-orange-900/20 font-bold">الفرق</th>
                        <th className="text-center px-3 py-2.5 text-xs">إجمالي الشراء</th>
                        <th className="text-center px-3 py-2.5 text-xs">إجمالي البيع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredReportProducts.map((p, i) => {
                        const diff = getPhysicalDiff(p.product_id, p.closing_stock);
                        const hasDiff = diff !== null && diff !== 0;
                        return (
                          <tr key={p.product_id} className={hasDiff ? (diff! > 0 ? 'bg-green-50/30 dark:bg-green-900/10' : 'bg-red-50/30 dark:bg-red-900/10') : 'hover:bg-gray-50 dark:hover:bg-gray-800'}>
                            <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                            <td className="px-3 py-2">
                              <div className="text-sm font-medium">{p.product_name}</div>
                              {p.barcode && <div className="text-xs text-gray-400">{p.barcode}</div>}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-500">{p.category || '-'}</td>
                            <td className="px-3 py-2 text-center text-xs">{p.ppp > 1 ? p.ppp : '-'}</td>
                            <td className="px-3 py-2 text-center bg-gray-50/50 dark:bg-gray-800/50">
                              <div className="text-sm">{p.opening_stock}</div>
                              {p.ppp > 1 && p.opening_stock > 0 && <div className="text-[10px] text-gray-400">{fmtCartonPieces(p.opening_stock, p.ppp)}</div>}
                            </td>
                            <td className="px-3 py-2 text-center bg-green-50/50 dark:bg-green-900/10">
                              <div className="text-sm font-medium text-green-700 dark:text-green-400">{p.total_in > 0 ? `+${p.total_in}` : '-'}</div>
                              {p.ppp > 1 && p.total_in > 0 && <div className="text-[10px] text-green-500/70">{fmtCartonPieces(p.total_in, p.ppp)}</div>}
                            </td>
                            <td className="px-3 py-2 text-center bg-red-50/50 dark:bg-red-900/10">
                              <div className="text-sm font-medium text-red-700 dark:text-red-400">{p.total_out > 0 ? `-${p.total_out}` : '-'}</div>
                              {p.ppp > 1 && p.total_out > 0 && <div className="text-[10px] text-red-500/70">{fmtCartonPieces(p.total_out, p.ppp)}</div>}
                            </td>
                            <td className="px-3 py-2 text-center bg-blue-50/50 dark:bg-blue-900/10">
                              <div className="text-sm font-bold">{p.closing_stock}</div>
                              {p.ppp > 1 && p.closing_stock > 0 && <div className="text-[10px] text-blue-500/70">{fmtCartonPieces(p.closing_stock, p.ppp)}</div>}
                            </td>
                            <td className="px-3 py-1 text-center bg-yellow-50/50 dark:bg-yellow-900/10">
                              {p.ppp > 1 ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      value={physicalCartons[p.product_id] ?? ''}
                                      onChange={(e) => setPhysicalByCarton(p.product_id, e.target.value, p.ppp)}
                                      placeholder={String(Math.floor(p.closing_stock / p.ppp))}
                                      className="w-12 text-center border border-yellow-300 dark:border-yellow-700 rounded px-1 py-0.5 text-xs bg-white dark:bg-gray-800 focus:ring-2 focus:ring-yellow-400 outline-none"
                                    />
                                    <span className="text-[9px] text-gray-500">ك</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={p.ppp - 1}
                                      value={physicalPieces[p.product_id] ?? ''}
                                      onChange={(e) => setPhysicalByPiece(p.product_id, e.target.value, p.ppp)}
                                      placeholder={String(p.closing_stock % p.ppp)}
                                      className="w-10 text-center border border-yellow-300 dark:border-yellow-700 rounded px-1 py-0.5 text-xs bg-white dark:bg-gray-800 focus:ring-2 focus:ring-yellow-400 outline-none"
                                    />
                                    <span className="text-[9px] text-gray-500">ق</span>
                                  </div>
                                  {physicalCounts[p.product_id] !== undefined && physicalCounts[p.product_id] !== '' && (
                                    <div className="text-[10px] text-yellow-700 dark:text-yellow-400 font-medium">= {physicalCounts[p.product_id]} قطعة</div>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  value={physicalCounts[p.product_id] ?? ''}
                                  onChange={(e) => setPhysicalCount(p.product_id, e.target.value)}
                                  placeholder={String(p.closing_stock)}
                                  className="w-16 text-center border border-yellow-300 dark:border-yellow-700 rounded px-1 py-0.5 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                                />
                              )}
                            </td>
                            <td className="px-3 py-2 text-center bg-orange-50/50 dark:bg-orange-900/10">
                              {diff !== null ? (
                                <span className={`text-sm font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                  {diff > 0 ? `+${diff}` : diff === 0 ? '0' : diff}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center text-xs text-purple-700 dark:text-purple-400">{formatCurrency(p.closing_stock * p.cost_price)}</td>
                            <td className="px-3 py-2 text-center text-xs text-indigo-700 dark:text-indigo-400">{formatCurrency(p.closing_stock * p.retail_price)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold">
                      {(() => {
                        const fp = filteredReportProducts;
                        const tOpening = fp.reduce((s, p) => s + p.opening_stock, 0);
                        const tIn = fp.reduce((s, p) => s + p.total_in, 0);
                        const tOut = fp.reduce((s, p) => s + p.total_out, 0);
                        const tClosing = fp.reduce((s, p) => s + p.closing_stock, 0);
                        const tCostVal = fp.reduce((s, p) => s + p.closing_stock * p.cost_price, 0);
                        const tRetailVal = fp.reduce((s, p) => s + p.closing_stock * p.retail_price, 0);
                        const anyFilled = fp.some(p => physicalCounts[p.product_id] !== undefined && physicalCounts[p.product_id] !== '');
                        const totalCounted = fp.reduce((sum, p) => {
                          const c = physicalCounts[p.product_id];
                          return sum + (c !== undefined && c !== '' ? parseInt(c) || 0 : p.closing_stock);
                        }, 0);
                        const totalDiff = totalCounted - tClosing;
                        return (
                          <tr>
                            <td colSpan={4} className="px-3 py-3 text-sm">الإجمالي ({fp.length} منتج)</td>
                            <td className="px-3 py-3 text-center text-sm">{tOpening}</td>
                            <td className="px-3 py-3 text-center text-sm text-green-700 dark:text-green-400">+{tIn}</td>
                            <td className="px-3 py-3 text-center text-sm text-red-700 dark:text-red-400">-{tOut}</td>
                            <td className="px-3 py-3 text-center text-sm">{tClosing}</td>
                            <td className="px-3 py-3 text-center text-sm">{anyFilled ? totalCounted : '—'}</td>
                            <td className="px-3 py-3 text-center text-sm">
                              {anyFilled ? <span className={totalDiff > 0 ? 'text-green-600' : totalDiff < 0 ? 'text-red-600' : ''}>{totalDiff > 0 ? `+${totalDiff}` : totalDiff}</span> : '—'}
                            </td>
                            <td className="px-3 py-3 text-center text-xs text-purple-700 dark:text-purple-400">{formatCurrency(tCostVal)}</td>
                            <td className="px-3 py-3 text-center text-xs text-indigo-700 dark:text-indigo-400">{formatCurrency(tRetailVal)}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Hints */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>أدخل الكمية الفعلية في عمود &quot;فعلي&quot; - الفرق يحسب تلقائياً</p>
                <p>اضغط &quot;تطبيق الجرد الفعلي&quot; لتعديل المخزون حسب الجرد الفعلي</p>
              </div>
            </>
          )}

          {!reportData && !isLoadingReport && (
            <div className="card p-12 text-center">
              <DocumentChartBarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">اختر المستودع وحدد الفترة</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">سيتم عرض تقرير شامل بحركة كل منتج مع إمكانية التصدير للمقارنة مع الجرد الفعلي</p>
            </div>
          )}
        </>
      )}
      {/* ========== EXPORT MODAL ========== */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowDownTrayIcon className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">تصدير إلى Excel</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-white/80 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">اختر الأعمدة التي تريد تصديرها:</p>

              <div className="space-y-4">
                {columnGroups.map(group => {
                  const groupCols = allExportColumns.filter(c => c.group === group.key);
                  const allOn = groupCols.every(c => exportColumns[c.key]);
                  const someOn = groupCols.some(c => exportColumns[c.key]);
                  return (
                    <div key={group.key} className="border rounded-lg dark:border-gray-700 overflow-hidden">
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroupColumns(group.key)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                          allOn ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          allOn ? 'bg-blue-600 border-blue-600' : someOn ? 'bg-blue-300 border-blue-300' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {(allOn || someOn) && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                        </div>
                        {group.label}
                        <span className="text-xs text-gray-400 mr-auto">
                          ({groupCols.filter(c => exportColumns[c.key]).length}/{groupCols.length})
                        </span>
                      </button>
                      {/* Group Columns */}
                      <div className="grid grid-cols-2 gap-1 p-3">
                        {groupCols.map(col => (
                          <label
                            key={col.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm ${
                              exportColumns[col.key]
                                ? 'bg-blue-50 dark:bg-blue-900/15 text-blue-800 dark:text-blue-300'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={exportColumns[col.key]}
                              onChange={() => toggleExportColumn(col.key)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {col.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedExportColumns.length} عمود محدد
              </span>
              <div className="flex gap-2">
                <button onClick={() => setShowExportModal(false)} className="btn btn-secondary text-sm">
                  إلغاء
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={selectedExportColumns.length === 0}
                  className="btn btn-primary text-sm gap-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  تصدير ({filteredReportProducts.length} منتج)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
