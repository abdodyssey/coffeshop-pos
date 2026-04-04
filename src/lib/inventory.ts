import { supabase } from './supabase'

/**
 * Mengurangi stok bahan baku secara atomik menggunakan Postgres RPC.
 * Menjamin integritas data: Jika satu bahan gagal (misal stok kurang), 
 * seluruh proses dibatalkan (rollback) oleh database.
 * 
 * @param productId ID Produk yang dipesan
 * @param quantity Jumlah produk yang dipesan
 */
export async function updateStock(productId: string, quantity: number) {
  try {
    const { error } = await supabase.rpc('process_sale_stock', {
      p_product_id: productId,
      p_quantity: quantity
    })

    if (error) {
      // Jika RPC 'process_sale_stock' mengeluarkan RAISE EXCEPTION, error-nya ditangkap di sini.
      throw new Error(error.message)
    }

    return { success: true, message: 'Berhasil mengupdate stok secara atomik' }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error in updateStock (Atomic):', errorMessage)
    return { success: false, error: errorMessage }
  }
}
