'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  PlusIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/auth';
import { settingsApi } from '@/lib/api';
import GuidedTour from './GuidedTour';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLocale } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/context';
import type { TourStep } from './GuidedTour';

import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  TruckIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UsersIcon,
  RectangleStackIcon,
  MapPinIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ChevronDownIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  DocumentDuplicateIcon,
  DevicePhoneMobileIcon,
  ChartBarSquareIcon,
  ReceiptPercentIcon,
  BuildingLibraryIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  nameKey: TranslationKey;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badgeKey?: TranslationKey;
  feature?: string;
}

interface MenuSection {
  nameKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
  roles?: string[];
}

const menuSections: MenuSection[] = [
  {
    nameKey: 'sidebar.inventory',
    icon: ArchiveBoxIcon,
    items: [
      { nameKey: 'sidebar.inventoryMgmt', href: '/dashboard/inventory', icon: ClipboardDocumentListIcon, feature: 'inventory' },
      { nameKey: 'sidebar.productsMenu', href: '/dashboard/products', icon: CubeIcon, feature: 'products' },
      { nameKey: 'sidebar.categories', href: '/dashboard/categories', icon: TagIcon, feature: 'categories' },
      { nameKey: 'sidebar.brands', href: '/dashboard/brands', icon: RectangleStackIcon, feature: 'brands' },
      { nameKey: 'sidebar.units', href: '/dashboard/units', icon: BuildingStorefrontIcon, feature: 'units' },
      { nameKey: 'sidebar.warehouses', href: '/dashboard/warehouses', icon: BuildingStorefrontIcon, feature: 'warehouses' },
      { nameKey: 'sidebar.stockMovements', href: '/dashboard/stock-movements', icon: ArrowPathIcon, feature: 'stock_movements' },
      { nameKey: 'sidebar.adjustments', href: '/dashboard/adjustments', icon: ClipboardDocumentListIcon, feature: 'adjustments' },
    ],
  },
  {
    nameKey: 'sidebar.purchasesSection',
    icon: ArrowTrendingDownIcon,
    items: [
      { nameKey: 'sidebar.purchaseInvoices', href: '/dashboard/purchases', icon: ArrowTrendingDownIcon, feature: 'purchases' },
      { nameKey: 'sidebar.purchaseOrders', href: '/dashboard/purchase-orders', icon: DocumentDuplicateIcon, badgeKey: 'sidebar.new', feature: 'purchase_orders' },
      { nameKey: 'sidebar.suppliers', href: '/dashboard/suppliers', icon: TruckIcon, feature: 'suppliers' },
      { nameKey: 'sidebar.purchaseReturns', href: '/dashboard/purchase-returns', icon: ArrowUturnLeftIcon, feature: 'purchase_returns' },
    ],
  },
  {
    nameKey: 'sidebar.salesSection',
    icon: ArrowTrendingUpIcon,
    items: [
      { nameKey: 'sidebar.saleInvoices', href: '/dashboard/sales', icon: ArrowTrendingUpIcon, feature: 'sales' },
      { nameKey: 'sidebar.clients', href: '/dashboard/clients', icon: UserGroupIcon, feature: 'clients' },
      { nameKey: 'sidebar.clientCategories', href: '/dashboard/client-categories', icon: TagIcon, badgeKey: 'sidebar.new', feature: 'client_categories' },
      { nameKey: 'sidebar.saleReturns', href: '/dashboard/sale-returns', icon: ArrowUturnLeftIcon, feature: 'sale_returns' },
    ],
  },
  {
    nameKey: 'sidebar.seller',
    icon: ShoppingCartIcon,
    items: [
      { nameKey: 'sidebar.orders', href: '/dashboard/orders', icon: ShoppingCartIcon, feature: 'orders' },
      { nameKey: 'sidebar.livreurRequests', href: '/dashboard/livreur-product-requests', icon: ClipboardDocumentListIcon, feature: 'product_requests' },
    ],
  },
  {
    nameKey: 'sidebar.driver',
    icon: MapPinIcon,
    items: [
      { nameKey: 'sidebar.trips', href: '/dashboard/trips', icon: MapPinIcon, feature: 'trips' },
      { nameKey: 'sidebar.deliveries', href: '/dashboard/deliveries', icon: TruckIcon, feature: 'deliveries' },
      { nameKey: 'sidebar.driverStock', href: '/dashboard/livreur-stock', icon: ArchiveBoxIcon, feature: 'livreur_stock' },
      { nameKey: 'sidebar.driversMap', href: '/dashboard/drivers-map', icon: MapPinIcon, badgeKey: 'sidebar.new', feature: 'drivers_map' },
      { nameKey: 'sidebar.productRequests', href: '/dashboard/livreur-product-requests', icon: ClipboardDocumentListIcon, feature: 'product_requests' },
      { nameKey: 'sidebar.livreurDispenses', href: '/dashboard/dispenses', icon: BanknotesIcon, feature: 'dispenses' },
    ],
  },
  {
    nameKey: 'sidebar.cashvan',
    icon: DevicePhoneMobileIcon,
    items: [
      { nameKey: 'sidebar.stockTransfers', href: '/dashboard/stock-transfers', icon: ArrowPathIcon, feature: 'stock_transfers' },
      { nameKey: 'sidebar.cashvanStock', href: '/dashboard/cashvan-stock', icon: ArchiveBoxIcon, feature: 'livreur_stock' },
      { nameKey: 'sidebar.cashvanProductRequests', href: '/dashboard/cashvan-product-requests', icon: ClipboardDocumentListIcon, feature: 'product_requests' },
    ],
  },
  {
    nameKey: 'sidebar.vehicles',
    icon: TruckIcon,
    items: [
      { nameKey: 'sidebar.vehiclesMenu', href: '/dashboard/vehicles', icon: TruckIcon, feature: 'vehicles' },
    ],
  },
  {
    nameKey: 'sidebar.finance',
    icon: BanknotesIcon,
    items: [
      { nameKey: 'sidebar.caisses', href: '/dashboard/caisses', icon: BanknotesIcon, badgeKey: 'sidebar.new', feature: 'caisses' },
      { nameKey: 'sidebar.payments', href: '/dashboard/payments', icon: CurrencyDollarIcon, feature: 'payments' },
      { nameKey: 'sidebar.expenses', href: '/dashboard/dispenses', icon: BanknotesIcon, badgeKey: 'sidebar.new', feature: 'dispenses' },
    ],
  },
  {
    nameKey: 'sidebar.reportsSection',
    icon: ChartBarSquareIcon,
    items: [
      { nameKey: 'sidebar.reports', href: '/dashboard/reports', icon: ChartBarIcon, feature: 'reports' },
      { nameKey: 'sidebar.transactionsReport', href: '/dashboard/reports/transactions', icon: ReceiptPercentIcon, feature: 'reports' },
      { nameKey: 'sidebar.cashFlowReport', href: '/dashboard/reports/cash-flow', icon: BuildingLibraryIcon, feature: 'reports' },
      { nameKey: 'sidebar.sellersReport', href: '/dashboard/reports/sellers', icon: UsersIcon, feature: 'reports' },
      { nameKey: 'sidebar.profitLossReport', href: '/dashboard/reports/profit-loss', icon: ScaleIcon, feature: 'reports' },
      { nameKey: 'sidebar.returnRatioReport', href: '/dashboard/reports/return-ratio', icon: ArrowUturnLeftIcon, feature: 'reports' },
    ],
  },
  {
    nameKey: 'sidebar.admin',
    icon: WrenchScrewdriverIcon,
    roles: ['admin'],
    items: [
      { nameKey: 'sidebar.fieldEmployees', href: '/dashboard/drivers', icon: UsersIcon, feature: 'deliveries' },
      { nameKey: 'sidebar.employees', href: '/dashboard/employees', icon: UsersIcon, badgeKey: 'sidebar.new', feature: 'employees' },
      { nameKey: 'sidebar.users', href: '/dashboard/users', icon: UsersIcon, feature: 'users' },
      { nameKey: 'sidebar.mobileApp', href: '/dashboard/mobile-app', icon: DevicePhoneMobileIcon, badgeKey: 'sidebar.new' },
      { nameKey: 'sidebar.settings', href: '/dashboard/settings', icon: Cog6ToothIcon, feature: 'settings' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, checkAuth, logout, hasFeature } = useAuthStore();
  const { t, dir } = useLocale();

  const sidebarTourSteps: TourStep[] = useMemo(() => [
    { target: '[data-tour="dashboard-link"]', title: t('tour.dashboardTitle'), desc: t('tour.dashboardDesc'), position: 'auto' },
    { target: '[data-tour="section-sidebar.inventory"]', title: t('tour.inventoryTitle'), desc: t('tour.inventoryDesc'), position: 'auto' },
    { target: '[data-tour="section-sidebar.purchasesSection"]', title: t('tour.purchasesTitle'), desc: t('tour.purchasesDesc'), position: 'auto' },
    { target: '[data-tour="section-sidebar.salesSection"]', title: t('tour.salesTitle'), desc: t('tour.salesDesc'), position: 'auto' },
    { target: '[data-tour="section-sidebar.seller"]', title: t('tour.sellerTitle'), desc: t('tour.sellerDesc'), position: 'auto' },
    { target: '[data-tour="section-sidebar.driver"]', title: t('tour.driverTitle'), desc: t('tour.driverDesc'), position: 'auto' },
    { target: '[data-tour="section-sidebar.cashvan"]', title: t('tour.cashvanTitle'), desc: t('tour.cashvanDesc'), position: 'auto' },
    { target: '[data-tour="section-sidebar.finance"]', title: t('tour.financeTitle'), desc: t('tour.financeDesc'), position: 'auto' },
    { target: '[data-tour="section-sidebar.admin"]', title: t('tour.adminTitle'), desc: t('tour.adminDesc'), position: 'auto' },
  ], [t]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('المخزون');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTimeTour, setIsFirstTimeTour] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  // Fetch company settings for logo
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsApi.getAll();
        const settings = response.data;
        if (settings.company_logo) {
          setCompanyLogo(settings.company_logo);
        }
        if (settings.company_name) {
          setCompanyName(settings.company_name);
        }
        // Check onboarding — only for admin users
        if (user?.role === 'admin' && settings.onboarding_completed !== 'true') {
          setIsFirstTimeTour(true);
          setShowOnboarding(true);
          setSidebarCollapsed(false);
          setSidebarOpen(true);
          setExpandedSections([]);
        }
      } catch (error) {
        // Use defaults if settings fail to load
      }
    };
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  // Initialize and listen for dark mode changes
  useEffect(() => {
    // Apply dark mode class on mount
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for storage changes (when settings page changes dark mode)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode') {
        const newValue = e.newValue === 'true';
        setDarkMode(newValue);
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [darkMode]);

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Auto-expand section containing active route
  useEffect(() => {
    menuSections.forEach((section) => {
      const hasActiveItem = section.items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
      if (hasActiveItem) {
        setExpandedSections((prev) =>
          prev.includes(section.nameKey) ? prev : [...prev, section.nameKey]
        );
      }
    });
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((s) => s !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Alt shortcuts even in inputs
        if (!e.altKey) return;
      }

      // Alt + shortcuts
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 's': // Alt+S = New Sale
            e.preventDefault();
            router.push('/dashboard/sales/new');
            break;
          case 'p': // Alt+P = New Purchase
            e.preventDefault();
            router.push('/dashboard/purchases/new');
            break;
          case 'n': // Alt+N = Products page
            e.preventDefault();
            router.push('/dashboard/products');
            break;
          case 'c': // Alt+C = Clients
            e.preventDefault();
            router.push('/dashboard/clients');
            break;
          case 'f': // Alt+F = Suppliers (Fournisseurs)
            e.preventDefault();
            router.push('/dashboard/suppliers');
            break;
          case 'h': // Alt+H = Home/Dashboard
            e.preventDefault();
            router.push('/dashboard');
            break;
          case 'i': // Alt+I = Inventory
            e.preventDefault();
            router.push('/dashboard/inventory');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [router]);

  const filteredSections = menuSections
    .filter((section) => {
      if (!section.roles) return true;
      return user && section.roles.includes(user.role);
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.feature) return true;
        return hasFeature(item.feature);
      }),
    }))
    .filter((section) => section.items.length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Guided tour for first-time admin users */}
      {showOnboarding && (
        <GuidedTour
          steps={sidebarTourSteps}
          storageKey="sidebar_tour_step"
          saveOnComplete={isFirstTimeTour}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-50 h-full bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 w-64' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full') + ' lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center p-4 border-b dark:border-gray-700 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                {companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${companyLogo}`}
                    alt={companyName}
                    className="w-10 h-10 rounded-xl object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <CubeIcon className="w-6 h-6 text-white" />
                  </div>
                )}
                <span className="font-bold text-lg dark:text-white">{companyName}</span>
              </div>
            )}
            {sidebarCollapsed && (
              companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${companyLogo}`}
                  alt={companyName}
                  className="w-10 h-10 rounded-xl object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <CubeIcon className="w-6 h-6 text-white" />
                </div>
              )
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5 dark:text-white" />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              title={t('sidebar.dashboard')}
              data-tour="dashboard-link"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-2 ${
                pathname === '/dashboard'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <HomeIcon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{t('sidebar.dashboard')}</span>}
            </Link>

            {/* Accordion Sections */}
            <div className="space-y-1">
              {filteredSections.map((section) => {
                const isExpanded = expandedSections.includes(section.nameKey);
                const hasActiveItem = section.items.some(
                  (item) => pathname === item.href || pathname.startsWith(item.href + '/')
                );
                const sectionName = t(section.nameKey);

                return (
                  <div key={section.nameKey}>
                    <button
                      onClick={() => !sidebarCollapsed && toggleSection(section.nameKey)}
                      title={sectionName}
                      data-tour={`section-${section.nameKey}`}
                      className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-colors ${
                        hasActiveItem
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                    >
                      <div className={`flex items-center gap-3 ${sidebarCollapsed ? '' : ''}`}>
                        <section.icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm font-medium">{sectionName}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    {!sidebarCollapsed && (
                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <ul className={`mt-1 space-y-1 ${dir === 'rtl' ? 'mr-4 border-r-2' : 'ml-4 border-l-2'} border-gray-100 dark:border-gray-700`}>
                          {section.items.map((item) => {
                            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && !section.items.some(other => other.href !== item.href && pathname.startsWith(other.href)));
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                                    isActive
                                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-medium'
                                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                                  }`}
                                >
                                  <item.icon className="w-4 h-4" />
                                  <span className="flex-1">{t(item.nameKey)}</span>
                                  {item.badgeKey && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500 text-white leading-none">
                                      {t(item.badgeKey)}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className={`border-t dark:border-gray-700 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={t('sidebar.logout')}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && t('sidebar.logout')}
            </button>
            {/* Collapse toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
              className={`hidden lg:flex items-center gap-2 w-full px-3 py-2 mt-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Bars3Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && t('sidebar.collapse')}
            </button>
            {!sidebarCollapsed && (
              <Link href="/dashboard/changelog" className="block text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                v1.0.6
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-200 ${dir === 'rtl' ? (sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64') : (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64')}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Bars3Icon className="w-6 h-6 dark:text-white" />
            </button>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => {
                  const next = !darkMode;
                  setDarkMode(next);
                  localStorage.setItem('darkMode', String(next));
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('sidebar_tour_step');
                  setIsFirstTimeTour(false);
                  setSidebarCollapsed(false);
                  setSidebarOpen(true);
                  setExpandedSections([]);
                  setShowOnboarding(true);
                }}
                title={t('header.guidedTour')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                {t('header.guidedTour')}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('header.hello', { name: user?.name || '' })}
              </span>
            </div>
          </div>
        </header>

        {/* Email verification banner */}
        {user && !user.email_verified_at && (
          <div className="mx-4 lg:mx-6 mt-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('header.emailNotVerified')}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{t('header.emailVerifyDesc')}</p>
            </div>
            <Link
              href="/verify-email"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
            >
              {t('header.verifyNow')}
            </Link>
          </div>
        )}

        {/* Page content */}
        <main className="p-4 pb-24 lg:px-6 lg:pt-6 lg:pb-24">{children}</main>

        {/* Global Shortcuts Footer Bar */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 text-white shadow-lg">
          <div className={`transition-all duration-200 ${dir === 'rtl' ? (sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64') : (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64')}`}>
            <div className="flex items-center justify-between px-4 py-2">
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/sales/new"
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('footer.newSale')}</span>
                  <kbd className="hidden md:inline bg-green-700 px-1.5 py-0.5 rounded text-xs">Alt+S</kbd>
                </Link>
                <Link
                  href="/dashboard/purchases/new"
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('footer.newPurchase')}</span>
                  <kbd className="hidden md:inline bg-blue-700 px-1.5 py-0.5 rounded text-xs">Alt+P</kbd>
                </Link>
                <Link
                  href="/dashboard/products"
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <CubeIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('footer.productsFooter')}</span>
                  <kbd className="hidden md:inline bg-purple-700 px-1.5 py-0.5 rounded text-xs">Alt+N</kbd>
                </Link>
              </div>

              {/* Shortcuts Info */}
              <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Alt+H</kbd>
                  <span>{t('footer.home')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Alt+C</kbd>
                  <span>{t('footer.clientsFooter')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Alt+F</kbd>
                  <span>{t('footer.suppliersFooter')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-700 px-1.5 py-0.5 rounded">Alt+I</kbd>
                  <span>{t('footer.inventoryFooter')}</span>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
