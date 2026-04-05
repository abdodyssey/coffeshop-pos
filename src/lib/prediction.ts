import { supabase } from './supabase'
import { Ingredient } from '@/types/database'

export interface PredictionData {
  ingredient_id: string
  daily_average: number
  days_left: number | 'unknown' | 'calculating'
}

/**
 * Menghitung prediksi sisa hari stok berdasarkan penggunaan rill dari transaksi 7 hari terakhir.
 */
export async function calculateInventoryPredictions(ingredients: Ingredient[]) {
  const predictions: Record<string, PredictionData> = {}
  
  // Ambil tanggal 7 hari yang lalu
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const dateStr = sevenDaysAgo.toISOString()

  try {
    // 1. Ambil semua transaksi sukses dalam 7 hari terakhir
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('payment_status', 'paid')
      .gte('created_at', dateStr)

    const transactionIds = (transactions || []).map(t => t.id)
    
    if (transactionIds.length === 0) {
      for (const ingredient of ingredients) {
        predictions[ingredient.id] = { 
          ingredient_id: ingredient.id, 
          daily_average: 0, 
          days_left: 'unknown' 
        }
      }
      return predictions
    }

    // 2. Ambil semua items dalam transaksi tersebut
    const { data: items } = await supabase
      .from('transaction_items')
      .select('product_id, quantity')
      .in('transaction_id', transactionIds)

    if (!items || items.length === 0) {
       for (const ingredient of ingredients) {
        predictions[ingredient.id] = { 
          ingredient_id: ingredient.id, 
          daily_average: 0, 
          days_left: 'unknown' 
        }
      }
      return predictions
    }

    // 3. Ambil resep produk
    const productIds = Array.from(new Set(items.map(i => i.product_id)))
    const { data: recipes } = await supabase
      .from('recipes')
      .select('product_id, ingredient_id, quantity_required')
      .in('product_id', productIds)

    const recipesByProduct: Record<string, { ingredient_id: string, quantity_required: number }[]> = {}
    recipes?.forEach(r => {
      if (!recipesByProduct[r.product_id]) recipesByProduct[r.product_id] = []
      recipesByProduct[r.product_id].push(r)
    })

    // 4. Hitung penggunaan total per bahan
    const usageByIngredient: Record<string, number> = {}
    items.forEach(item => {
      const productRecipes = recipesByProduct[item.product_id] || []
      productRecipes.forEach(recipe => {
        const totalUsed = Number(recipe.quantity_required) * Number(item.quantity)
        usageByIngredient[recipe.ingredient_id] = (usageByIngredient[recipe.ingredient_id] || 0) + totalUsed
      })
    })

    // 5. Hitung rata-rata harian dan sisa hari
    const divisor = 7
    for (const ingredient of ingredients) {
      const totalUsage = usageByIngredient[ingredient.id] || 0
      const dailyAverage = totalUsage / divisor
      
      let daysLeft: number | 'unknown' | 'calculating' = 'unknown'
      if (dailyAverage > 0) {
        daysLeft = Number(ingredient.current_stock) / dailyAverage
      } else if (totalUsage === 0) {
        daysLeft = 'unknown'
      }

      predictions[ingredient.id] = {
        ingredient_id: ingredient.id,
        daily_average: dailyAverage,
        days_left: daysLeft
      }
    }

  } catch (err: unknown) {
    console.error(`Prediction Calculation Error:`, err instanceof Error ? err.message : err)
    // Fallback if failed
    for (const ingredient of ingredients) {
      predictions[ingredient.id] = { 
        ingredient_id: ingredient.id, 
        daily_average: 0, 
        days_left: 'unknown' 
      }
    }
  }

  return predictions
}
