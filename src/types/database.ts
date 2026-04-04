export interface Ingredient {
  id: string
  name: string
  unit: string // 'gram', 'ml', 'pcs'
  current_stock: number
  minimum_stock_alert: number
  created_at?: string
}

export interface Product {
  id: string
  name: string
  price: number
  category?: string // 'Coffee', 'Non-Coffee', 'Snack'
  image_url?: string
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
  payment_method?: string // 'Cash', 'QRIS'
  created_at?: string
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  subtotal: number
}

export interface InventoryLog {
  id: string
  ingredient_id: string
  change_amount: number
  reason?: string // 'Sale', 'Restock', 'Waste/Spill'
  created_at?: string
}
