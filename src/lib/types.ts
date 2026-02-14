// Common types
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'seller' | 'livreur' | 'cashvan';
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  image?: string;
  is_active: boolean;
  parent?: Category;
  children?: Category[];
  products_count?: number;
}

// Brand types
export interface Brand {
  id: number;
  name: string;
  logo?: string;
  is_active: boolean;
  products_count?: number;
}

// Unit types
export interface Unit {
  id: number;
  name: string;
  short_name: string;
  base_unit_id?: number;
  operator?: '*' | '/';
  operation_value?: number;
  is_active: boolean;
  base_unit?: Unit;
}

// Product types
export interface Product {
  id: number;
  name: string;
  category_id: number;
  brand_id?: number;
  unit_buy_id: number;
  unit_sale_id: number;
  barcode?: string;
  description?: string;
  product_unit?: string;
  stock_alert?: number;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  min_selling_price?: number;
  tax_percent?: number;
  pieces_per_package?: number;
  tax_type?: 'exclusive' | 'inclusive';
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  points?: number;
  opening_stock?: number;
  image?: string;
  is_active: boolean;
  category?: Category;
  brand?: Brand;
  unit_buy?: Unit;
  unit_sale?: Unit;
  stocks?: Stock[];
  category_prices?: ProductCategoryPrice[];
}

// Warehouse types
export interface Warehouse {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  is_main: boolean;
  is_active: boolean;
}

// Stock types
export interface Stock {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  product?: Product;
  warehouse?: Warehouse;
}

// Client Category types
export interface ClientCategory {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  clients_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Product Category Price types
export interface ProductCategoryPrice {
  id: number;
  product_id: number;
  client_category_id: number;
  price: number;
}

// Client types
export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gps_lat?: number;
  gps_lng?: number;
  credit_limit?: number;
  balance: number;
  is_active: boolean;
  client_category_id?: number;
  client_category?: ClientCategory;
}

// Supplier types
export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  tax_number?: string;
  balance: number;
  is_active: boolean;
}

// Vehicle types
export interface Vehicle {
  id: number;
  name: string;
  plate_number?: string;
  model?: string;
  is_active: boolean;
}

// Purchase types
export interface Purchase {
  id: number;
  reference: string;
  supplier_id: number;
  warehouse_id: number;
  user_id: number;
  date: string;
  total_amount: number;
  discount: number;
  tax: number;
  shipping: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: 'pending' | 'received' | 'partial';
  payment_status: 'unpaid' | 'partial' | 'paid';
  note?: string;
  supplier?: Supplier;
  warehouse?: Warehouse;
  user?: User;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
  product?: Product;
}

// Sale types
export interface Sale {
  id: number;
  reference: string;
  client_id?: number;
  warehouse_id: number;
  user_id: number;
  date: string;
  total_amount: number;
  discount: number;
  tax: number;
  shipping: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  note?: string;
  client?: Client;
  warehouse?: Warehouse;
  user?: User;
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
  product?: Product;
}

// Order types
export interface Order {
  id: number;
  reference: string;
  trip_id?: number;
  client_id: number;
  seller_id: number;
  warehouse_id: number;
  date: string;
  total_amount: number;
  discount: number;
  tax: number;
  grand_total: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'delivered' | 'partial' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  payment_method?: string;
  notes?: string;
  has_problem?: boolean;
  problem_description?: string;
  problem_reported_at?: string;
  problem_reported_by?: number;
  problem_reporter?: User;
  client?: Client;
  seller?: User;
  warehouse?: Warehouse;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity_ordered: number;
  quantity_confirmed: number;
  quantity_delivered: number;
  quantity_returned: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  notes?: string;
  product?: Product;
}

// Trip types
export interface Trip {
  id: number;
  seller_id: number;
  vehicle_id?: number;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  seller?: User;
  vehicle?: Vehicle;
  stores?: TripStore[];
}

export interface TripStore {
  id: number;
  trip_id: number;
  client_id: number;
  visit_order: number;
  visited_at?: string;
  status: 'pending' | 'visited' | 'skipped';
  notes?: string;
  client?: Client;
}

// Delivery types
export interface Delivery {
  id: number;
  reference: string;
  livreur_id: number;
  vehicle_id?: number;
  date: string;
  start_time?: string;
  end_time?: string;
  status: 'preparing' | 'in_progress' | 'completed' | 'cancelled';
  total_orders: number;
  delivered_count: number;
  failed_count: number;
  notes?: string;
  livreur?: User;
  vehicle?: Vehicle;
  orders?: DeliveryOrder[];
}

export interface DeliveryOrder {
  id: number;
  delivery_id: number;
  order_id: number;
  client_id: number;
  delivery_order: number;
  status: 'pending' | 'delivered' | 'partial' | 'failed' | 'postponed';
  delivered_at?: string;
  attempted_at?: string;
  failure_reason?: string;
  notes?: string;
  order?: Order;
  client?: Client;
}

// Adjustment types
export interface Adjustment {
  id: number;
  reference: string;
  warehouse_id: number;
  user_id: number;
  date: string;
  type: 'addition' | 'subtraction';
  reason?: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  warehouse?: Warehouse;
  user?: User;
  approver?: User;
  items?: AdjustmentItem[];
}

export interface AdjustmentItem {
  id: number;
  adjustment_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  reason?: string;
  product?: Product;
}

// Payment types
export interface Payment {
  id: number;
  reference: string;
  payable_type: string;
  payable_id: number;
  amount: number;
  payment_method: 'cash' | 'bank' | 'check' | 'other';
  date: string;
  notes?: string;
  user_id: number;
  user?: User;
}

// Caisse types
export interface Caisse {
  id: number;
  user_id: number;
  type: 'principale' | 'vendeur' | 'livreur';
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface CaisseTransaction {
  id: number;
  caisse_id: number;
  type: 'in' | 'out';
  amount: number;
  balance_after: number;
  source_type?: string;
  source_id?: number;
  description?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  creator?: User;
}

export interface CaisseSettlement {
  id: number;
  caisse_id: number;
  amount: number;
  type: 'admin_collect' | 'seller_deposit';
  balance_before: number;
  balance_after: number;
  notes?: string;
  settled_by: number;
  created_at: string;
  updated_at: string;
  settler?: User;
}

export interface CaisseTransfer {
  id: number;
  from_caisse_id: number;
  to_caisse_id: number;
  amount: number;
  notes?: string;
  created_by: number;
  created_at: string;
  from_caisse?: Caisse;
  to_caisse?: Caisse;
  creator?: User;
}

export interface CaisseSummary {
  total_balance: number;
  total_caisses: number;
  by_type: Record<string, { count: number; total_balance: number }>;
  today: {
    total_in: number;
    total_out: number;
    total_settled: number;
  };
  caisses: Caisse[];
}

// Van Session types
export interface VanSession {
  id: number;
  reference: string;
  livreur_id: number;
  vehicle_id?: number;
  warehouse_id: number;
  date: string;
  status: 'preparing' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  total_loaded_value: number;
  total_sales: number;
  total_collected: number;
  total_credit: number;
  total_returned_value: number;
  sales_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  livreur?: User;
  vehicle?: Vehicle;
  warehouse?: Warehouse;
  items?: VanSessionItem[];
  sales?: VanSale[];
  returns?: VanReturn[];
}

export interface VanSessionItem {
  id: number;
  van_session_id: number;
  product_id: number;
  quantity_loaded: number;
  quantity_sold: number;
  quantity_returned: number;
  unit_cost: number;
  product?: Product;
  available_quantity?: number;
}

export interface VanSale {
  id: number;
  reference?: string;
  van_session_id: number;
  client_id?: number;
  sale_time?: string;
  total_amount: number;
  discount: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  latitude?: number;
  longitude?: number;
  notes?: string;
  created_at: string;
  client?: Client;
  items?: VanSaleItem[];
}

export interface VanSaleItem {
  id: number;
  van_sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  product?: Product;
}

export interface VanReturn {
  id: number;
  van_session_id: number;
  product_id: number;
  quantity: number;
  reason: 'unsold' | 'damaged' | 'expired' | 'other';
  returnable_to_stock: boolean;
  processed: boolean;
  processed_at?: string;
  notes?: string;
  product?: Product;
}

// Dashboard types
export interface DashboardStats {
  total_products: number;
  total_clients: number;
  total_suppliers: number;
  total_sales_today: number;
  total_sales_month: number;
  total_purchases_today: number;
  total_purchases_month: number;
  pending_orders: number;
  active_deliveries: number;
  low_stock_count: number;
}
