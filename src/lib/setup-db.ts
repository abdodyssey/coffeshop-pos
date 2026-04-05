import { supabase } from './supabase'

export async function setupSeedData() {
  console.log('Starting Seed Setup (Custom Schema)...')
  
  try {
    // 1. Insert Ingredients
    const { data: ingredients, error: ingError } = await supabase
      .from('ingredients')
      .upsert([
        { name: 'Biji Kopi', unit: 'gram', current_stock: 5000, minimum_stock_alert: 500 },
        { name: 'Susu UHT', unit: 'ml', current_stock: 10000, minimum_stock_alert: 1000 },
        { name: 'Gula Aren', unit: 'ml', current_stock: 2000, minimum_stock_alert: 200 }
      ], { onConflict: 'name' })
      .select()

    if (ingError) throw ingError
    if (!ingredients || ingredients.length === 0) throw new Error('Failed to seed ingredients')

    // 2. Insert Product
    const { data: product, error: prodError } = await supabase
      .from('products')
      .upsert([
        { name: 'Kopi Susu Gula Aren', price: 18000, category: 'Coffee' }
      ], { onConflict: 'name' })
      .select()
      .single()

    if (prodError) throw prodError

    // 3. Insert Recipes
    const coffeeIng = ingredients.find(i => i.name === 'Biji Kopi')
    const milkIng = ingredients.find(i => i.name === 'Susu UHT')
    const sugarIng = ingredients.find(i => i.name === 'Gula Aren')

    if (!coffeeIng || !milkIng || !sugarIng) throw new Error('Missing ingredients after seed')

    const { error: recError } = await supabase
      .from('recipes')
      .upsert([
        { product_id: product.id, ingredient_id: coffeeIng.id, quantity_required: 18 },
        { product_id: product.id, ingredient_id: milkIng.id, quantity_required: 150 },
        { product_id: product.id, ingredient_id: sugarIng.id, quantity_required: 20 }
      ], { onConflict: 'product_id,ingredient_id' })

    if (recError) throw recError
    console.log('Seed success with original schema!')

    return { success: true, message: 'Database seeded successfully with custom schema!' }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Seed Error Detail:', error)
    return { success: false, error: errorMessage }
  }
}
