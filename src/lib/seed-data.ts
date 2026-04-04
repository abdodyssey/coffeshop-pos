import { Ingredient, Product, Recipe } from '@/types/database'

export const mockIngredients: Ingredient[] = [
  {
    id: 'ing-coffee',
    name: 'Biji Kopi House Blend',
    unit: 'gram',
    current_stock: 5000, // 5kg
    min_stock: 500,
    price_per_unit: 180, // per gram (e.g., 180,000 / 1000)
  },
  {
    id: 'ing-milk',
    name: 'Susu Full Cream',
    unit: 'ml',
    current_stock: 10000, // 10L
    min_stock: 1000,
    price_per_unit: 20, // per ml (e.g., 20,000 / 1000)
  },
  {
    id: 'ing-sugar',
    name: 'Gula Cair',
    unit: 'ml',
    current_stock: 2000, // 2L
    min_stock: 200,
    price_per_unit: 10, // per ml
  },
]

export const mockProducts: Product[] = [
  {
    id: 'prod-latte',
    name: 'Kopi Susu Gula Aren',
    price: 25000,
    category: 'Coffee',
  },
]

export const mockRecipes: Recipe[] = [
  {
    id: 'rec-1',
    product_id: 'prod-latte',
    ingredient_id: 'ing-coffee',
    amount_needed: 18, // 18 gram espresso
  },
  {
    id: 'rec-2',
    product_id: 'prod-latte',
    ingredient_id: 'ing-milk',
    amount_needed: 150, // 150 ml milk
  },
  {
    id: 'rec-3',
    product_id: 'prod-latte',
    ingredient_id: 'ing-sugar',
    amount_needed: 15, // 15 ml syrup
  },
]
