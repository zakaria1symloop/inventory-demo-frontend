'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi, deliveriesApi, usersApi, vehiclesApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import { formatQty, formatQtyLong } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import 'jspdf-autotable';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import { PageHeader } from '@/components/dashboard';
import {
  ArrowsUpDownIcon,
  MapPinIcon,
  TruckIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PrinterIcon,
  EyeIcon,
  PhoneIcon,
  DocumentArrowDownIcon,
  BuildingStorefrontIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  gps_lat?: number;
  gps_lng?: number;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity_confirmed: number;
  unit_price: number;
  product?: {
    id: number;
    name: string;
    pieces_per_package?: number;
  };
}

interface Order {
  id: number;
  reference: string;
  client_id: number;
  date: string;
  grand_total: number;
  client?: Client;
  items?: OrderItem[];
}

interface User {
  id: number;
  name: string;
  phone?: string;
  role: string;
  warehouse_id?: number;
  warehouse?: { id: number; name: string; stock_count?: number };
}

interface Vehicle {
  id: number;
  name: string;
  plate_number?: string;
}

export default function NewDeliveryPage() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';

  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingWarehouse, setIsCreatingWarehouse] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const [autoStart, setAutoStart] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('delivery_auto_start') === 'true';
    }
    return false;
  });

  const [formData, setFormData] = useState({
    livreur_id: '',
    vehicle_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleAutoStartToggle = (checked: boolean) => {
    setAutoStart(checked);
    localStorage.setItem('delivery_auto_start', checked ? 'true' : 'false');
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  const tourSteps: TourStep[] = useMemo(() => [
    { target: '[data-tour="dn-settings"]', title: t('deliveryNew.tourSettingsTitle'), desc: t('deliveryNew.tourSettingsDesc'), position: 'bottom' as const },
    { target: '[data-tour="dn-orders"]', title: t('deliveryNew.tourOrdersTitle'), desc: t('deliveryNew.tourOrdersDesc'), position: 'bottom' as const },
    { target: '[data-tour="dn-summary"]', title: t('deliveryNew.tourSummaryTitle'), desc: t('deliveryNew.tourSummaryDesc'), position: 'left' as const },
  ], [t]);

  useEffect(() => {
    fetchData();
  }, []);

  const toggleOrderExpand = (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // ── Print single order (receipt-style) ──
  const printOrder = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '-9999px';
    iframe.style.top = '-9999px';
    document.body.appendChild(iframe);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Commande ${order.reference}</title>
        <style>
          @media print { @page { size: 80mm auto; margin: 5mm; } }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 10px; max-width: 300px; margin: 0 auto; font-size: 12px; }
          h1 { text-align: center; font-size: 16px; margin-bottom: 8px; border-bottom: 2px dashed #000; padding-bottom: 8px; }
          .info { margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; margin: 4px 0; }
          .info-label { color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border-bottom: 1px solid #eee; padding: 5px 2px; text-align: left; font-size: 11px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total-row { border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px; font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; border-top: 1px dashed #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Commande: ${order.reference}</h1>
        <div class="info">
          <div class="info-row"><span class="info-label">Client:</span> <strong>${order.client?.name || '-'}</strong></div>
          <div class="info-row"><span class="info-label">Tel:</span> <span>${order.client?.phone || '-'}</span></div>
          <div class="info-row"><span class="info-label">Adresse:</span> <span>${order.client?.address || '-'}</span></div>
          <div class="info-row"><span class="info-label">Date:</span> <span>${new Date(order.date).toLocaleDateString('fr-FR')}</span></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Produit</th><th>Qte</th><th>Prix</th><th>Total</th></tr></thead>
          <tbody>
            ${order.items?.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.product?.name || '-'}</td>
                <td>${formatQtyLong(item.quantity_confirmed, item.product?.pieces_per_package)}</td>
                <td>${Number(item.unit_price).toLocaleString('fr-FR')}</td>
                <td>${(Number(item.quantity_confirmed) * Number(item.unit_price)).toLocaleString('fr-FR')}</td>
              </tr>
            `).join('') || '<tr><td colspan="5">Aucun produit</td></tr>'}
          </tbody>
        </table>
        <div class="total-row"><span>Total:</span><span>${Number(order.grand_total).toLocaleString('fr-FR')} DA</span></div>
        <div class="footer">
          <p>Merci pour votre confiance</p>
          <p>${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </body>
      </html>
    `;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => { document.body.removeChild(iframe); }, 1000);
        }, 250);
      };
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
      }, 500);
    }
  };

  // ── Print order via HTML ──
  const downloadOrderPDF = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
    const itemsHtml = (order.items || []).map((item) => {
      const qty = formatQtyLong(item.quantity_confirmed, item.product?.pieces_per_package);
      const name = item.product?.name || '-';
      const total = (Number(item.quantity_confirmed) * Number(item.unit_price)).toFixed(0);
      return `<tr><td>${escape(qty)}</td><td>${escape(name)}</td><td style="text-align:end">${total} DA</td></tr>`;
    }).join('');

    const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escape(order.reference)}</title>
  <style>
    @page { size: 80mm 200mm; margin: 4mm; }
    body { font-family: 'Tajawal', 'Cairo', 'Noto Sans Arabic', system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 11px; color: #000; margin: 0; padding: 0; }
    h1 { font-size: 14px; text-align: center; margin: 0 0 6px; }
    hr { border: 0; border-top: 1px solid #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 2px 0; vertical-align: top; }
    .total { font-size: 13px; font-weight: bold; margin-top: 6px; text-align: end; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
  </style>
</head>
<body>
  <h1>${escape(order.reference)}</h1>
  <hr />
  <div class="row"><span>Client:</span><span>${escape(order.client?.name || '-')}</span></div>
  <div class="row"><span>Tel:</span><span dir="ltr">${escape(order.client?.phone || '-')}</span></div>
  <div class="row"><span>Date:</span><span>${escape(new Date(order.date).toLocaleDateString('fr-FR'))}</span></div>
  <hr />
  <table>
    <thead><tr><th style="text-align:start">Qte</th><th style="text-align:start">Produit</th><th style="text-align:end">Total</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <hr />
  <div class="total">Total: ${Number(order.grand_total).toFixed(0)} DA</div>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
</body>
</html>`;
    const win = window.open('', '_blank', 'width=400,height=800');
    if (!win) {
      toast.error(t('deliveryNew.pdfSuccess'));
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    toast.success(t('deliveryNew.pdfSuccess'));
  };

  const fetchData = async () => {
    try {
      const [ordersRes, usersRes, vehiclesRes] = await Promise.all([
        ordersApi.getUnassigned(),
        usersApi.getAll({ role: 'livreur', is_active: true }),
        vehiclesApi.getAll({ is_active: true }),
      ]);
      setOrders(ordersRes.data);
      const usersData = usersRes.data.data || usersRes.data;
      setLivreurs(usersData.filter((u: User) => u.role === 'livreur'));
      setVehicles(vehiclesRes.data.data || vehiclesRes.data);
    } catch {
      toast.error(t('deliveryNew.errorLoadingData'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);

  const handleSelectOrder = (order: Order) => {
    if (selectedOrders.find((o) => o.id === order.id)) {
      setSelectedOrders(selectedOrders.filter((o) => o.id !== order.id));
    } else {
      setSelectedOrders([...selectedOrders, order]);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders([...orders]);
    }
  };

  const handleRemoveSelected = (orderId: number) => {
    setSelectedOrders(selectedOrders.filter((o) => o.id !== orderId));
  };

  const handleDragStart = (index: number) => { setDraggedIndex(index); };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrders = [...selectedOrders];
    const draggedItem = newOrders[draggedIndex];
    newOrders.splice(draggedIndex, 1);
    newOrders.splice(index, 0, draggedItem);
    setSelectedOrders(newOrders);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => { setDraggedIndex(null); };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === selectedOrders.length - 1)) return;
    const newOrders = [...selectedOrders];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newOrders[index], newOrders[newIndex]] = [newOrders[newIndex], newOrders[index]];
    setSelectedOrders(newOrders);
  };

  const handleCreateWarehouse = async (driver: User) => {
    setIsCreatingWarehouse(true);
    try {
      const warehouseRes = await warehousesApi.create({ name: 'مستودع ' + driver.name, is_main: false, is_active: true });
      const warehouse = warehouseRes.data;
      await warehousesApi.assignUser(warehouse.id, driver.id);
      setLivreurs(prev => prev.map(l =>
        l.id === driver.id
          ? { ...l, warehouse_id: warehouse.id, warehouse: { id: warehouse.id, name: warehouse.name, stock_count: 0 } }
          : l
      ));
      toast.success(t('deliveryNew.warehouseCreated'));
    } catch {
      toast.error(t('deliveryNew.warehouseCreateFailed'));
    } finally {
      setIsCreatingWarehouse(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.livreur_id) {
      toast.error(t('deliveryNew.selectDriverError'));
      return;
    }
    const selectedDriver = livreurs.find(l => l.id === Number(formData.livreur_id));
    if (selectedDriver && !selectedDriver.warehouse) {
      toast.error(t('deliveryNew.noWarehouseDriverError'));
      return;
    }
    if (selectedOrders.length === 0) {
      toast.error(t('deliveryNew.selectOrderError'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await deliveriesApi.create({
        livreur_id: Number(formData.livreur_id),
        vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null,
        date: formData.date,
        notes: formData.notes || null,
        order_ids: selectedOrders.map((o) => o.id),
      });
      const deliveryId = response.data.id;

      if (autoStart) {
        try {
          await deliveriesApi.start(deliveryId);
          toast.success(t('deliveryNew.createdAndStarted'));
        } catch {
          toast.success(t('deliveryNew.createdButStartFailed'));
        }
      } else {
        toast.success(t('deliveryNew.createdSuccess'));
      }
      router.push(`/dashboard/deliveries/${deliveryId}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('deliveryNew.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = selectedOrders.reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);
  const totalProducts = selectedOrders.reduce(
    (sum, o) => sum + (o.items?.reduce((s, i) => s + (Number(i.quantity_confirmed) || 0), 0) || 0), 0
  );

  // ── Merged products for print ──
  const getMergedProducts = () => {
    const merged: Record<number, { name: string; totalQty: number; piecesPerUnit: number; totalPieces: number }> = {};
    selectedOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const pid = item.product_id;
        const ppu = item.product?.pieces_per_package || 1;
        if (!merged[pid]) {
          merged[pid] = { name: item.product?.name || '-', totalQty: 0, piecesPerUnit: ppu, totalPieces: 0 };
        }
        merged[pid].totalQty += Number(item.quantity_confirmed);
        merged[pid].totalPieces += Number(item.quantity_confirmed) * ppu;
      });
    });
    return Object.values(merged).sort((a, b) => a.name.localeCompare(b.name));
  };

  // ── Print merged loading list ──
  const printMergedProducts = () => {
    const products = getMergedProducts();
    const livreur = livreurs.find((l) => l.id === Number(formData.livreur_id));
    const vehicle = vehicles.find((v) => v.id === Number(formData.vehicle_id));
    const dateStr = formData.date ? new Date(formData.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const uniqueClients = new Set(selectedOrders.map(o => o.client_id)).size;
    const totalCartons = products.reduce((s, p) => s + (p.piecesPerUnit > 1 ? Math.floor(p.totalQty / p.piecesPerUnit) : 0), 0);
    const totalPieces = products.reduce((s, p) => s + (p.piecesPerUnit > 1 ? p.totalQty % p.piecesPerUnit : p.totalQty), 0);
    const totalUnits = products.reduce((s, p) => s + p.totalQty, 0);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '-9999px';
    iframe.style.top = '-9999px';
    document.body.appendChild(iframe);

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>بون التحميل</title>
        <style>
          @media print { @page { size: A4; margin: 8mm; } }
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
          body { font-size: 9px; line-height: 1.3; color: #000; padding: 10px 15px; }
          table { border-collapse: collapse; width: 100%; }
          .title-bar { text-align: center; background: #000; color: #fff; padding: 8px; margin-bottom: 10px; }
          .title-bar h1 { font-size: 16px; margin: 0; }
          .title-bar .ref { font-size: 10px; margin-top: 2px; }
          .info-section { margin-bottom: 8px; }
          .info-box { border: 1px solid #000; padding: 5px; font-size: 8px; }
          .info-box h3 { font-size: 9px; font-weight: bold; margin-bottom: 3px; background: #eee; padding: 2px 4px; margin: -5px -5px 4px -5px; }
          .stats-bar { display: flex; justify-content: space-around; background: #f8f8f8; border: 1px solid #ddd; padding: 8px; margin-bottom: 10px; }
          .stat { text-align: center; }
          .stat-value { font-size: 16px; font-weight: bold; color: #1a56db; }
          .stat-label { font-size: 7px; color: #666; text-transform: uppercase; }
          table.products th { background: #333; color: #fff; padding: 5px 4px; font-size: 8px; text-align: center; border: 1px solid #000; }
          table.products td { padding: 4px 3px; font-size: 8px; border: 1px solid #000; text-align: center; }
          table.products td.name { text-align: right; font-weight: 600; font-size: 9px; }
          table.products .carton { font-weight: bold; color: #1a56db; font-size: 11px; }
          table.products .piece { font-weight: bold; color: #047857; }
          table.products .total-qty { font-weight: bold; font-size: 10px; }
          tr:nth-child(even) { background: #fafafa; }
          .total-row { background: #e8f4fd !important; font-weight: bold; }
          .total-row td { font-size: 9px; padding: 6px 4px; border-top: 2px solid #000; }
          .clients-section { margin-top: 12px; }
          .clients-section h3 { font-size: 10px; font-weight: bold; background: #333; color: #fff; padding: 4px 6px; margin-bottom: 0; }
          table.clients th { background: #eee; padding: 4px; font-size: 7px; text-align: center; border: 1px solid #000; }
          table.clients td { padding: 3px 4px; font-size: 8px; border: 1px solid #000; }
          table.clients td.client-name { text-align: right; font-weight: 600; }
          table.clients .client-total { font-weight: bold; }
          .signatures { margin-top: 20px; }
          .signatures td { width: 33%; text-align: center; padding-top: 30px; font-size: 8px; }
          .sig-line { border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 3px; }
          .footer { text-align: center; font-size: 7px; color: #666; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
          .check-col { width: 30px; }
        </style>
      </head>
      <body>
        <div class="title-bar">
          <h1>بون التحميل — Bon de Chargement</h1>
          <div class="ref">${dateStr}</div>
        </div>
        <table class="info-section">
          <tr>
            <td style="width:50%; vertical-align:top;">
              <div class="info-box">
                <h3>معلومات التوصيل</h3>
                <strong>السائق:</strong> ${livreur?.name || '-'}<br>
                ${vehicle ? `<strong>المركبة:</strong> ${vehicle.name}<br>` : ''}
                <strong>التاريخ:</strong> ${dateStr}
              </div>
            </td>
            <td style="width:50%; vertical-align:top; padding-right:8px;">
              <div class="info-box">
                <h3>ملخص</h3>
                <strong>عدد الطلبات:</strong> ${selectedOrders.length}<br>
                <strong>عدد العملاء:</strong> ${uniqueClients}<br>
                <strong>عدد المنتجات:</strong> ${products.length}<br>
                <strong>المبلغ الإجمالي:</strong> ${Number(totalAmount).toLocaleString('fr-FR')} د.ج
              </div>
            </td>
          </tr>
        </table>
        <div class="stats-bar">
          <div class="stat"><div class="stat-value">${selectedOrders.length}</div><div class="stat-label">طلبات</div></div>
          <div class="stat"><div class="stat-value">${uniqueClients}</div><div class="stat-label">عملاء</div></div>
          <div class="stat"><div class="stat-value">${totalCartons}</div><div class="stat-label">كرتون</div></div>
          <div class="stat"><div class="stat-value">${totalPieces}</div><div class="stat-label">قطعة</div></div>
          <div class="stat"><div class="stat-value">${Number(totalAmount).toLocaleString('fr-FR')}</div><div class="stat-label">المبلغ (د.ج)</div></div>
        </div>
        <table class="products">
          <thead>
            <tr>
              <th style="width:25px">#</th>
              <th>المنتج — Produit</th>
              <th style="width:55px">كرتون<br>Carton</th>
              <th style="width:45px">قطعة<br>Pièce</th>
              <th style="width:45px">و/كرتون<br>U/Crt</th>
              <th style="width:55px">الإجمالي<br>Total</th>
              <th class="check-col">✓</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((p, i) => {
              const cartons = p.piecesPerUnit > 1 ? Math.floor(p.totalQty / p.piecesPerUnit) : 0;
              const pieces = p.piecesPerUnit > 1 ? p.totalQty % p.piecesPerUnit : p.totalQty;
              return `
              <tr>
                <td>${i + 1}</td>
                <td class="name">${p.name}</td>
                <td class="carton">${p.piecesPerUnit > 1 ? cartons : '-'}</td>
                <td class="piece">${pieces > 0 ? pieces : (p.piecesPerUnit > 1 ? '-' : p.totalQty)}</td>
                <td>${p.piecesPerUnit > 1 ? p.piecesPerUnit : '-'}</td>
                <td class="total-qty">${p.totalQty}</td>
                <td class="check-col"></td>
              </tr>`;
            }).join('')}
            <tr class="total-row">
              <td colspan="2" style="text-align:right; font-size:9px;">المجموع — Total</td>
              <td class="carton">${totalCartons}</td>
              <td class="piece">${totalPieces}</td>
              <td></td>
              <td class="total-qty">${totalUnits}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div class="clients-section">
          <h3>تفصيل حسب العميل — Détail par client (${selectedOrders.length} طلب)</h3>
          <table class="clients">
            <thead>
              <tr>
                <th style="width:25px">#</th>
                <th>العميل — Client</th>
                <th style="width:70px">المرجع — Réf</th>
                <th style="width:45px">المنتجات</th>
                <th style="width:45px">القطع</th>
                <th style="width:70px">المبلغ (د.ج)</th>
                <th class="check-col">✓</th>
              </tr>
            </thead>
            <tbody>
              ${selectedOrders.map((o, i) => {
                const orderPieces = o.items?.reduce((s, item) => s + (Number(item.quantity_confirmed) || 0), 0) || 0;
                return `
                <tr>
                  <td>${i + 1}</td>
                  <td class="client-name">${o.client?.name || '-'}${o.client?.phone ? ` <span style="color:#666;font-size:7px">(${o.client.phone})</span>` : ''}</td>
                  <td>${o.reference}</td>
                  <td>${o.items?.length || 0}</td>
                  <td>${orderPieces}</td>
                  <td class="client-total">${Number(o.grand_total).toLocaleString('fr-FR')}</td>
                  <td class="check-col"></td>
                </tr>`;
              }).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align:right; font-size:9px;">المجموع — Total</td>
                <td>${selectedOrders.reduce((s, o) => s + (o.items?.reduce((ss, i) => ss + (Number(i.quantity_confirmed) || 0), 0) || 0), 0)}</td>
                <td class="client-total">${Number(totalAmount).toLocaleString('fr-FR')}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <table class="signatures">
          <tr>
            <td><div class="sig-line">المسؤول — Responsable</div></td>
            <td><div class="sig-line">السائق — Chauffeur</div></td>
            <td><div class="sig-line">المستودع — Magasinier</div></td>
          </tr>
        </table>
        <div class="footer">
          <p>تم الطباعة في ${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </body>
      </html>
    `;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => { document.body.removeChild(iframe); }, 1000);
        }, 250);
      };
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
      }, 500);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <PageHeader
        title={t('deliveryNew.title')}
        subtitle={t('deliveryNew.subtitle')}
        breadcrumb={[
          { label: t('sidebar.deliveries'), href: '/dashboard/deliveries' },
          { label: t('deliveryNew.title') },
        ]}
      >
        <button
          onClick={() => setShowTour(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {t('deliveryNew.tourBtn')}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ═══════ Left Side ═══════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* ───── Delivery Settings ───── */}
          <div data-tour="dn-settings" className="surface-pro p-4">
            <h3 className="surface-heading mb-3">{t('deliveryNew.settingsTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Driver */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('deliveryNew.driverLabel')} <span className="text-red-500">{t('deliveryNew.required')}</span>
                </label>
                <select
                  value={formData.livreur_id}
                  onChange={(e) => setFormData({ ...formData, livreur_id: e.target.value })}
                  className="select w-full text-[13px] py-2"
                >
                  <option value="">{t('deliveryNew.selectDriver')}</option>
                  {livreurs.map((livreur) => (
                    <option key={livreur.id} value={livreur.id}>
                      {livreur.name} {livreur.phone && `(${livreur.phone})`}
                    </option>
                  ))}
                </select>

                {formData.livreur_id && (() => {
                  const driver = livreurs.find(l => l.id === Number(formData.livreur_id));
                  if (!driver) return null;
                  return (
                    <div className="mt-2 p-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className={`metric-dot ${driver.warehouse ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                        <BuildingStorefrontIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="t-strong">
                          {driver.warehouse ? driver.warehouse.name : t('deliveryNew.noWarehouse')}
                        </span>
                      </div>
                      {driver.warehouse && driver.warehouse.stock_count !== undefined && (
                        <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-1 ms-5">
                          {driver.warehouse.stock_count > 0
                            ? t('deliveryNew.stockInWarehouse').replace('{count}', String(driver.warehouse.stock_count))
                            : t('deliveryNew.emptyStock')}
                        </p>
                      )}
                      {!driver.warehouse && (
                        <div className="mt-2">
                          <p className="text-gray-500 dark:text-gray-400 text-[11px] mb-2">{t('deliveryNew.noWarehouseError')}</p>
                          <button
                            type="button"
                            onClick={() => handleCreateWarehouse(driver)}
                            disabled={isCreatingWarehouse}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-colors"
                          >
                            {isCreatingWarehouse ? <span className="spinner w-3 h-3"></span> : <BuildingStorefrontIcon className="w-3 h-3" />}
                            {t('deliveryNew.createWarehouse')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Vehicle */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deliveryNew.vehicleLabel')}</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="select w-full text-[13px] py-2"
                >
                  <option value="">{t('deliveryNew.selectVehicle')}</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} {vehicle.plate_number && `(${vehicle.plate_number})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('deliveryNew.dateLabel')} <span className="text-red-500">{t('deliveryNew.required')}</span>
                </label>
                <DateInput
                  value={formData.date}
                  onChange={(v) => setFormData({ ...formData, date: v })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deliveryNew.notesLabel')}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input w-full text-[13px] py-2"
                rows={2}
                placeholder={t('deliveryNew.notesPlaceholder')}
              />
            </div>

            {/* Auto-start toggle */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="metric-dot metric-dot-green" aria-hidden />
                  <div>
                    <p className="text-[13px] font-medium text-gray-700 dark:text-gray-200">{t('deliveryNew.autoStartLabel')}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('deliveryNew.autoStartDesc')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoStart}
                  aria-label={t('deliveryNew.autoStartLabel')}
                  onClick={() => handleAutoStartToggle(!autoStart)}
                  dir="ltr"
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${autoStart ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoStart ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ───── Available Orders ───── */}
          <div data-tour="dn-orders" className="surface-pro overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="surface-heading">{t('deliveryNew.confirmedOrders')}</h3>
                <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">({orders.length})</span>
              </div>
              <button
                onClick={handleSelectAll}
                className="text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {selectedOrders.length === orders.length ? t('deliveryNew.deselectAll') : t('deliveryNew.selectAll')}
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-[13px]">{t('deliveryNew.noOrders')}</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                {orders.map((order) => {
                  const isSelected = selectedOrders.some((o) => o.id === order.id);
                  const isExpanded = expandedOrders.includes(order.id);
                  const hasGps = order.client?.gps_lat && order.client?.gps_lng;

                  return (
                    <div key={order.id} className={`transition-colors ${isSelected ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}>
                      <div onClick={() => handleSelectOrder(order)} className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-gray-700 bg-gray-700 dark:border-gray-300 dark:bg-gray-300' : 'border-gray-300 dark:border-gray-600'}`}>
                              {isSelected && <CheckCircleIcon className="w-3 h-3 text-white dark:text-gray-900" />}
                            </div>
                            <div>
                              <div className="t-strong text-[13px]">{order.reference}</div>
                              <div className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <span>{order.client?.name}</span>
                                {order.client?.phone && (
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <PhoneIcon className="w-3 h-3" />
                                    {order.client.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasGps && <MapPinIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" title={t('deliveryNew.hasGPS')} />}
                            <div className={`text-${isRTL ? 'start' : 'end'}`}>
                              <div className="tnum t-strong text-[13px]">{formatCurrency(order.grand_total)}</div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">{t('deliveryNew.productsCount').replace('{count}', String(order.items?.length || 0))}</div>
                            </div>
                          </div>
                        </div>
                        {order.client?.address && (
                          <div className="mt-1 text-[12px] text-gray-500 dark:text-gray-400 ps-7">{order.client.address}</div>
                        )}
                      </div>

                      <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/40 dark:bg-gray-900/20">
                        <button onClick={(e) => toggleOrderExpand(order.id, e)} className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                          {isExpanded ? (
                            <><ChevronUpIcon className="w-3.5 h-3.5" />{t('deliveryNew.hideProducts')}</>
                          ) : (
                            <><ChevronDownIcon className="w-3.5 h-3.5" />{t('deliveryNew.showProducts')} ({order.items?.length || 0})</>
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => downloadOrderPDF(order, e)} className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title={t('deliveryNew.downloadPDF')}>
                            <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                            {t('deliveryNew.downloadPDF')}
                          </button>
                          <button onClick={(e) => printOrder(order, e)} className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title={t('deliveryNew.print')}>
                            <PrinterIcon className="w-3.5 h-3.5" />
                            {t('deliveryNew.print')}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 bg-gray-50/40 dark:bg-gray-900/20">
                          <div className="table-pro-wrap">
                            <table className="table-pro compact">
                              <thead>
                                <tr>
                                  <th className="text-center w-10">{t('deliveryNew.number')}</th>
                                  <th>{t('deliveryNew.designation')}</th>
                                  <th className="text-center">{t('deliveryNew.quantity')}</th>
                                  <th className="text-center">{t('deliveryNew.unit')}</th>
                                  <th className="text-center">{t('deliveryNew.count')}</th>
                                  <th className="text-center">{t('deliveryNew.unitPrice')}</th>
                                  <th className="text-end">{t('deliveryNew.amount')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((item, idx) => {
                                    const piecesPerUnit = item.product?.pieces_per_package || 1;
                                    const totalPieces = item.quantity_confirmed * piecesPerUnit;
                                    const lineTotal = item.quantity_confirmed * item.unit_price;
                                    return (
                                      <tr key={idx}>
                                        <td className="text-center text-gray-500 tnum">{idx + 1}</td>
                                        <td className="t-strong">{item.product?.name || '-'}</td>
                                        <td className="text-center tnum t-strong">{formatQty(item.quantity_confirmed, piecesPerUnit)}</td>
                                        <td className="text-center tnum t-muted">{formatNumber(piecesPerUnit)}</td>
                                        <td className="text-center tnum">{formatNumber(totalPieces)}</td>
                                        <td className="text-center tnum">{formatNumber(item.unit_price)}</td>
                                        <td className="text-end tnum t-strong">{formatNumber(lineTotal)}</td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr><td colSpan={7} className="py-3 text-center text-gray-500 dark:text-gray-400 text-[12px]">{t('deliveryNew.noProducts')}</td></tr>
                                )}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan={6} className="text-start t-strong">{t('deliveryNew.totalLabel')}</td>
                                  <td className="text-end tnum t-strong">{formatNumber(order.grand_total)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══════ Right Side ═══════ */}
        <div data-tour="dn-summary" className="space-y-4">

          {/* ───── Summary Card ───── */}
          <div className="surface-pro p-4">
            <h3 className="surface-heading mb-3">{t('deliveryNew.summaryTitle')}</h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('deliveryNew.orderCount')}</span>
                <span className="tnum t-strong">{selectedOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('deliveryNew.productCount')}</span>
                <span className="tnum t-strong">{Math.round(totalProducts)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-[14px] font-semibold text-gray-900 dark:text-white">
                <span>{t('deliveryNew.totalAmount')}</span>
                <span className="tnum">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {selectedOrders.length > 0 && (
              <button
                onClick={printMergedProducts}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <PrinterIcon className="w-4 h-4" />
                {t('deliveryNew.printLoadingList')}
              </button>
            )}
          </div>

          {/* ───── Delivery Order (Roadmap) ───── */}
          <div className="surface-pro overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <ArrowsUpDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <div>
                <h3 className="surface-heading">{t('deliveryNew.deliveryOrder')}</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('deliveryNew.dragToReorder')}</p>
              </div>
            </div>

            {selectedOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-[12px]">{t('deliveryNew.selectFromList')}</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                {selectedOrders.map((order, index) => {
                  const hasGps = order.client?.gps_lat && order.client?.gps_lng;
                  const isExpanded = expandedOrders.includes(order.id);

                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`transition-opacity ${draggedIndex === index ? 'opacity-50' : ''}`}
                    >
                      <div className="p-2.5 cursor-move">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveOrder(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 transition-colors">
                              <ChevronUpIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button onClick={() => moveOrder(index, 'down')} disabled={index === selectedOrders.length - 1} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 transition-colors">
                              <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            </button>
                          </div>

                          <div className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center tnum text-[12px] text-gray-700 dark:text-gray-200 flex-shrink-0">
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="t-strong text-[12px] truncate">{order.client?.name}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 tnum">{order.reference} · {formatCurrency(order.grand_total)}</div>
                          </div>

                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button onClick={(e) => toggleOrderExpand(order.id, e)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded transition-colors" title={t('deliveryNew.viewProducts')}>
                              <EyeIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => downloadOrderPDF(order, e)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded transition-colors" title={t('deliveryNew.downloadPDF')}>
                              <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => printOrder(order, e)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded transition-colors" title={t('deliveryNew.print')}>
                              <PrinterIcon className="w-3.5 h-3.5" />
                            </button>
                            {hasGps && (
                              <a
                                href={`https://www.google.com/maps?q=${order.client?.gps_lat},${order.client?.gps_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded transition-colors"
                                title={t('deliveryNew.location')}
                              >
                                <MapPinIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button onClick={() => handleRemoveSelected(order.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors" title={t('deliveryNew.remove')}>
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/20 px-2 py-2">
                          <div className="table-pro-wrap">
                            <table className="table-pro compact text-[11px]">
                              <thead>
                                <tr>
                                  <th className="text-center w-6">#</th>
                                  <th>{t('deliveryNew.designation')}</th>
                                  <th className="text-center">{t('deliveryNew.quantity')}</th>
                                  <th className="text-center">{t('deliveryNew.unit')}</th>
                                  <th className="text-center">{t('deliveryNew.count')}</th>
                                  <th className="text-end">{t('deliveryNew.amount')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((item, idx) => {
                                    const piecesPerUnit = item.product?.pieces_per_package || 1;
                                    const totalPieces = item.quantity_confirmed * piecesPerUnit;
                                    const lineTotal = item.quantity_confirmed * item.unit_price;
                                    return (
                                      <tr key={idx}>
                                        <td className="text-center text-gray-400 tnum">{idx + 1}</td>
                                        <td className="truncate max-w-[100px]">{item.product?.name}</td>
                                        <td className="text-center tnum t-strong">{formatQty(item.quantity_confirmed, piecesPerUnit)}</td>
                                        <td className="text-center tnum t-muted">{piecesPerUnit}</td>
                                        <td className="text-center tnum">{totalPieces}</td>
                                        <td className="text-end tnum">{formatNumber(lineTotal)}</td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr><td colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-2">{t('deliveryNew.noProducts')}</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedOrders.length === 0 || !formData.livreur_id}
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold rounded-md text-white transition-colors disabled:opacity-50 ${autoStart ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner w-4 h-4 border-white"></div>
                    {autoStart ? t('deliveryNew.creatingAndStarting') : t('deliveryNew.creating')}
                  </>
                ) : (
                  <>
                    {autoStart ? <PlayIcon className="w-4 h-4" /> : <TruckIcon className="w-4 h-4" />}
                    {autoStart ? t('deliveryNew.createAndStart') : t('deliveryNew.createDelivery')}
                  </>
                )}
              </button>
              {autoStart && (
                <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mt-2">{t('deliveryNew.autoStartNote')}</p>
              )}
            </div>
          </div>

          {/* ───── Map Preview ───── */}
          {selectedOrders.some((o) => o.client?.gps_lat && o.client?.gps_lng) && (
            <div className="surface-pro p-4">
              <h3 className="surface-heading mb-3 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                {t('deliveryNew.routePreview')}
              </h3>
              <a
                href={`https://www.google.com/maps/dir/${selectedOrders
                  .filter((o) => o.client?.gps_lat && o.client?.gps_lng)
                  .map((o) => `${o.client?.gps_lat},${o.client?.gps_lng}`)
                  .join('/')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <MapPinIcon className="w-4 h-4" />
                {t('deliveryNew.openGoogleMaps')}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ───── Guided Tour ───── */}
      {showTour && (
        <GuidedTour steps={tourSteps} onComplete={() => setShowTour(false)} storageKey="delivery_new_tour_step" />
      )}
    </div>
  );
}
