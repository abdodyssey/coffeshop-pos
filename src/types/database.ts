export interface Ingredient {
  id: string
  name: string
  unit: string // 'gram', 'ml', 'pcs'
  current_stock: number
  minimum_stock_alert: number
  ideal_stock: number
  price_per_unit?: number
  created_at?: string
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  image_url?: string
  description?: string
  is_active?: boolean
  created_at?: string
}

export interface Recipe {
  id: string
  product_id: string
  ingredient_id: string
  quantity_required: number // Misal: 18 (gram)
}

export interface Transaction {
  id: string
  total_price: number
  customer_name?: string
  payment_method?: string // 'Cash', 'QRIS'
  payment_status?: 'paid' | 'pending' | 'cancelled'
  source?: 'pos' | 'customer_tablet'
  created_at?: string
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  subtotal: number
  note?: string
}

export interface InventoryLog {
  id: string
  ingredient_id: string
  change_amount: number
  type: 'in' | 'out' | 'usage' | 'adjustment'
  reason?: string
  created_at?: string
}
