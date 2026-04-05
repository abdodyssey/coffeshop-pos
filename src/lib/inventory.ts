import { supabase } from './supabase'

export interface StockUpdateResult {
  success: boolean
  message: string
  noRecipe?: boolean
  affectedCount?: number
  error?: string
}

/**
 * Mengurangi stok bahan baku secara atomik menggunakan Postgres RPC.
 * Menjamin integritas data: Jika satu bahan gagal (misal stok kurang), 
 * seluruh proses dibatalkan (rollback) oleh database.
 * 
 * @param productId ID Produk yang dipesan
 * @param quantity Jumlah produk yang dipesan
 */
export async function updateStock(productId: string, quantity: number): Promise<StockUpdateResult> {
  try {
    // Memanggil RPC 'process_sale_stock' yang mengupdate ingredients & inventory_logs
    const { data: affectedCount, error } = await supabase.rpc('process_sale_stock', {
      p_product_id: productId,
      p_quantity: quantity
    })

    if (error) {
      // Jika RPC 'process_sale_stock' mengeluarkan RAISE EXCEPTION, error-nya ditangkap di sini.
      throw new Error(error.message)
    }

    // Jika affectedCount adalah 0, berarti produk tidak memiliki resep terdaftar
    if (affectedCount === 0) {
      return { 
        success: true, 
        message: 'Berhasil, namun tidak ada stok yang dikurangi (resep kosong)', 
        noRecipe: true 
      }
    }

    return { 
      success: true, 
      message: 'Berhasil mengupdate stok secara atomik', 
      affectedCount 
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error in updateStock (Atomic):', errorMessage)
    return { success: false, error: errorMessage, message: 'Stock update failed' }
  }
}
