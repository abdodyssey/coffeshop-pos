import { supabase } from './supabase'

export interface PredictionData {
  ingredient_id: string
  daily_average: number
  days_left: number | 'unknown'
}

/**
 * Menghitung prediksi sisa hari stok berdasarkan penggunaan 7 hari terakhir.
 */
export async function calculateInventoryPredictions(ingredients: any[]) {
  const predictions: Record<string, PredictionData> = {}
  
  // Ambil tanggal 7 hari yang lalu
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const dateStr = sevenDaysAgo.toISOString()

  for (const ingredient of ingredients) {
    // 1. Ambil log penggunaan (negatif) dalam 7 hari terakhir
    const { data: logs, error } = await supabase
      .from('inventory_logs')
      .select('change_amount')
      .eq('ingredient_id', ingredient.id)
      .lt('change_amount', 0) // Hanya penggunaan/pengurangan
      .gte('created_at', dateStr)

    if (error) {
      console.error(`Prediction error for ${ingredient.name}:`, error)
      predictions[ingredient.id] = { 
        ingredient_id: ingredient.id, 
        daily_average: 0, 
        days_left: 'unknown' 
      }
      continue
    }

    // 2. Hitung Total Penggunaan (abs)
    const totalUsage = logs.reduce((sum, log) => sum + Math.abs(Number(log.change_amount)), 0)
    const dailyAverage = totalUsage / 7

    // 3. Hitung Sisa Hari
    let daysLeft: number | 'unknown' = 'unknown'
    if (dailyAverage > 0) {
      daysLeft = ingredient.current_stock / dailyAverage
    }

    predictions[ingredient.id] = {
      ingredient_id: ingredient.id,
      daily_average: dailyAverage,
      days_left: daysLeft
    }
  }

  return predictions
}
