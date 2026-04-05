'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, RefreshCw, Save, ClipboardCheck, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Ingredient } from '@/types/database'
import { cn } from '@/lib/utils'

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

export default function OpnamePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Local state for physical stock inputs: Record<id, string>
  const [physicalAmounts, setPhysicalAmounts] = useState<Record<string, string>>({})

  // 1. Fetch Ingredients
  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase.from('ingredients').select('*').order('name')
      if (error) throw error
      setIngredients(data || [])
    } catch (err) {
      console.error('Fetch Ingredients Error:', err)
      toast.error('Gagal mengambil data bahan baku.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIngredients()
  }, [])

  // 2. Handle Input change
  const handleInputChange = (id: string, value: string) => {
    setPhysicalAmounts(prev => ({ ...prev, [id]: value }))
  }

  // 3. Calculation Helper
  const getDiff = (id: string, systemStock: number) => {
    const physicalStr = physicalAmounts[id]
    if (physicalStr === undefined || physicalStr === '') return null
    return parseFloat(physicalStr) - systemStock
  }

  // 4. Save Changes (Atomic Audit)
  const handleSaveOpname = async () => {
    const updatedIds = Object.keys(physicalAmounts).filter(id => physicalAmounts[id] !== '')
    if (updatedIds.length === 0) {
      toast.info('Tidak ada perubahan yang dimasukkan.')
      return
    }

    setIsSubmitting(true)
    try {
      for (const id of updatedIds) {
        const physicalValue = parseFloat(physicalAmounts[id])
        const ingredient = ingredients.find(i => i.id === id)
        if (!ingredient) continue

        const diff = physicalValue - Number(ingredient.current_stock)
        
        // Skip if there's no actual change
        if (diff === 0) continue

        // Update Ingredient stock
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ current_stock: physicalValue })
          .eq('id', id)
        
        if (updateError) throw updateError

        // Log adjustment
        const { error: logError } = await supabase
          .from('inventory_logs')
          .insert({
            ingredient_id: id,
            change_amount: diff,
            reason: 'Stock Opname Adjustment'
          })
          
        if (logError) throw logError
      }

      toast.success('Stok Opname Berhasil! Seluruh stok fisik telah diperbarui.', {
        description: 'Setiap selisih telah dicatat secara otomatis dalam riwayat log.',
        className: "p-6 font-bold"
      })
      
      // Cleanup & Refresh
      setPhysicalAmounts({})
      fetchIngredients()

    } catch (err) {
      toast.error(`Gagal menyimpan audit: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/30 p-6 md:p-12 space-y-10">
      
      {/* HEADER & NAV */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <Link href="/dashboard">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-md border-neutral-200">
                 <ArrowLeft className="w-5 h-5" />
              </Button>
           </Link>
           <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Audit Stok (Opname)</h1>
              <p className="text-sm text-neutral-500">Sesuaikan stok sistem dengan kondisi fisik di dapur.</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={() => fetchIngredients()} className="h-10 rounded-md border-neutral-100 font-bold">
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} /> Refresh
           </Button>
           <Link href="/dashboard/history">
              <Button variant="outline" size="sm" className="h-10 rounded-md border-neutral-100 font-bold">
                 Buka Riwayat
              </Button>
           </Link>
        </div>
      </header>

      {/* WARNING ALERT */}
      <div className="bg-amber-50 border border-amber-200/60 p-5 rounded-md flex items-start gap-4">
         <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
         <div>
            <h4 className="text-sm font-bold text-amber-900">Petunjuk Opname</h4>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
               Masukkan jumlah **stok fisik** yang Anda hitung secara manual. Sistem akan secara otomatis menghitung selisih dan melakukan audit stok agar data prediksi inventaris tetap akurat.
            </p>
         </div>
      </div>

      {/* AUDIT TABLE */}
      <Card className="shadow-sm border-neutral-200/60 rounded-md bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-neutral-50 px-8 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-base font-bold flex items-center gap-3 text-stone-900">
                <ClipboardCheck className="w-5 h-5 text-stone-400" />
                Daftar Audit Bahan Baku
              </CardTitle>
           </div>
           <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase border-stone-200 text-stone-400">
              {ingredients.length} Bahan baku
           </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-50/50">
              <TableRow className="hover:bg-transparent border-neutral-50">
                <TableHead className="h-10 text-[11px] font-bold uppercase tracking-widest text-neutral-400 px-8">Nama Bahan</TableHead>
                <TableHead className="h-10 text-[11px] font-bold uppercase tracking-widest text-neutral-400">Stok Sistem</TableHead>
                <TableHead className="h-10 text-[11px] font-bold uppercase tracking-widest text-neutral-400" style={{ width: '200px' }}>Stok Fisik</TableHead>
                <TableHead className="text-right h-10 text-[11px] font-bold uppercase tracking-widest text-neutral-400 px-8">Selisih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map(ing => {
                const diff = getDiff(ing.id, ing.current_stock)
                
                return (
                  <TableRow key={ing.id} className="hover:bg-stone-50 transition-colors border-neutral-50">
                    <TableCell className="py-5 px-8 font-bold text-stone-900 text-sm">
                      {ing.name}
                    </TableCell>
                    <TableCell className="py-5 text-sm font-bold text-stone-400 tabular-nums">
                      {ing.current_stock.toLocaleString('id-ID')} <span className="text-[10px] uppercase font-bold ml-1">{ing.unit}</span>
                    </TableCell>
                    <TableCell className="py-5">
                       <Input 
                         type="number"
                         placeholder="Isi stok fisik..."
                         className={cn(
                           "h-10 rounded-md border-neutral-200 bg-neutral-50/50 focus:bg-white text-sm font-bold transition-all",
                           physicalAmounts[ing.id] ? "border-stone-900 ring-offset-2 ring-1 ring-stone-900/10" : ""
                         )}
                         value={physicalAmounts[ing.id] || ''}
                         onChange={(e) => handleInputChange(ing.id, e.target.value)}
                       />
                    </TableCell>
                    <TableCell className="py-5 text-right px-8">
                       {diff !== null && (
                         <div className={cn(
                            "inline-flex items-center gap-2 font-bold tabular-nums text-sm",
                            diff < 0 ? "text-red-500" : diff > 0 ? "text-emerald-500" : "text-neutral-300"
                         )}>
                            {diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : diff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                            {diff > 0 ? '+' : ''}{diff.toLocaleString('id-ID')}
                         </div>
                       )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* FOOTER ACTION: Fitts's Law (Massive & Primary) */}
      <footer className="flex pt-6">
         <Button 
           size="lg" 
           onClick={handleSaveOpname}
           disabled={isSubmitting || Object.keys(physicalAmounts).length === 0}
           className="w-full md:w-auto md:min-w-[320px] h-14 rounded-md text-base font-bold bg-stone-900 hover:bg-stone-800 shadow-2xl shadow-stone-900/20 transition-all hover:scale-[0.99] active:scale-[0.97]"
         >
           {isSubmitting ? (
             <RefreshCw className="w-5 h-5 animate-spin mr-3" /> 
           ) : (
             <Save className="w-5 h-5 mr-3" />
           )}
           Simpan audit & rekonsiliasi
         </Button>
      </footer>

    </div>
  )
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'outline', className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold leading-non transition-colors",
      variant === 'outline' ? "border border-neutral-200 text-neutral-400" : "bg-neutral-100 text-neutral-900",
      className
    )}>
      {children}
    </span>
  )
}
