'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { subDays, format } from 'date-fns'
import { ArrowLeft, History as HistoryIcon, ShoppingBag, Receipt, Calculator, LayoutDashboard, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Transaction, TransactionItem, Product } from '@/types/database'
import { formatCurrency, cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DatePickerWithRange } from '@/components/ui/date-range-picker'

interface DetailedTransactionItem extends TransactionItem {
  products: Product
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedItems, setSelectedItems] = useState<DetailedTransactionItem[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  // Default: 7 hari terakhir
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  })

  // 1. Fetch Transactions in Date Range
  const fetchTransactions = useCallback(async () => {
    if (!date?.from || !date?.to) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', date.from.toISOString())
        .lte('created_at', date.to.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error('Fetch Transactions Error:', err)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    if (date?.from && date?.to) {
      fetchTransactions()
    }
  }, [date, fetchTransactions])


  // 2. Aggregate Stats (Period)
  const stats = useMemo(() => {
    const totalOmzet = transactions.reduce((sum: number, tx: Transaction) => sum + Number(tx.total_price), 0)
    const txCount = transactions.length
    const aov = txCount > 0 ? totalOmzet / txCount : 0
    return { totalOmzet, txCount, aov }
  }, [transactions])

  // 3. Fetch Transaction Detail
  const fetchTransactionDetail = async (tx: Transaction) => {
    setSelectedTransaction(tx)
    setDetailLoading(true)
    try {
      const { data, error } = await supabase
        .from('transaction_items')
        .select('*, products(*)')
        .eq('transaction_id', tx.id)

      if (error) throw error
      setSelectedItems(data as DetailedTransactionItem[])
    } catch (err) {
      console.error('Fetch Detail Error:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 space-y-10 font-sans selection:bg-slate-900 selection:text-white">
      
      {/* HEADER & NAV: Industrial Cleanliness */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
           <Link href="/dashboard">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                 <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Button>
           </Link>
           <div className="space-y-0.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Riwayat transaksi</h1>
              <p className="text-sm font-medium text-slate-400 leading-tight">Laporan penjualan periode terpilih.</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full sm:w-auto">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Link href="/pos" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto rounded-xl bg-slate-900 h-11 px-8 font-bold shadow-xl shadow-slate-900/10 text-white transition-all active:scale-95 hover:bg-slate-800">
              Buka kasir
            </Button>
          </Link>
        </div>
      </header>

      {/* STATS SUMMARY: Executive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm rounded-xl bg-white border-l-4 border-emerald-500 overflow-hidden group">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] font-medium text-slate-400 tracking-widest flex items-center gap-3">
               <ShoppingBag className="w-4 h-4" /> Total omzet periode
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
             <div className="text-3xl font-bold text-slate-900 tracking-tighter tabular-nums">
                {formatCurrency(stats.totalOmzet)}
             </div>
             <p className="text-[10px] text-emerald-600 font-medium mt-1 leading-none">Verified settlement</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white overflow-hidden group">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] font-medium text-slate-400 tracking-widest flex items-center gap-3">
               <Receipt className="w-4 h-4" /> Jumlah transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
             <div className="text-3xl font-bold text-slate-900 tracking-tighter tabular-nums">
                {stats.txCount} <span className="text-sm font-medium text-slate-300 tracking-tight ml-2 opacity-60">Pesanan</span>
             </div>
             <p className="text-[10px] text-slate-300 font-medium mt-1 leading-none opacity-60">Volume periode</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white overflow-hidden group">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] font-medium text-slate-400 tracking-widest flex items-center gap-3">
               <Calculator className="w-4 h-4" /> Rata-rata per transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
             <div className="text-3xl font-bold text-slate-900 tracking-tighter tabular-nums">
                {formatCurrency(stats.aov)}
             </div>
             <p className="text-[10px] text-slate-300 font-medium mt-1 leading-none opacity-60">Average order value</p>
          </CardContent>
        </Card>
      </div>

      {/* TRANSACTION TABLE */}
      <Card className="shadow-sm border-slate-200/60 rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
           <div>
              <CardTitle className="text-base font-bold flex items-center gap-3 text-slate-900 leading-none">
                <HistoryIcon className="w-4 h-4 text-slate-400" /> Daftar penjualan
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-400 mt-1.5 opacity-60">Laporan komprehensif dari {date?.from ? format(date.from, "PP") : "..."} hingga {date?.to ? format(date.to, "PP") : "..."}.</CardDescription>
           </div>
           <Button variant="outline" size="sm" onClick={() => fetchTransactions()} className="h-9 rounded-lg border-slate-100 text-slate-500 font-semibold px-4 hover:bg-slate-50">
              <RefreshCw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} /> Refresh
           </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="py-32 flex flex-col items-center justify-center text-center px-10">
                <RefreshCw className="w-10 h-10 text-slate-200 animate-spin mb-4" />
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300">Mensinkronkan data...</p>
             </div>
          ) : transactions.length === 0 ? (
             <div className="py-24 flex flex-col items-center justify-center text-center px-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-slate-50/50">
                   <LayoutDashboard className="w-8 h-8 text-slate-200" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Tidak ada transaksi pada periode ini</h3>
                <p className="text-sm font-medium text-slate-400 mt-1 max-w-[280px]">Coba ubah rentang tanggal atau buka kasir untuk mencatat penjualan baru. ☕</p>
             </div>
          ) : (
            <Table>
               <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-50">
                  <TableHead className="h-14 text-[10px] font-medium tracking-wider text-slate-400 px-8">Waktu & Tanggal</TableHead>
                  <TableHead className="h-14 text-[10px] font-medium tracking-wider text-slate-400">Id & Pelanggan</TableHead>
                  <TableHead className="h-14 text-[10px] font-medium tracking-wider text-slate-400">Sumber & Metode</TableHead>
                  <TableHead className="h-14 text-[10px] font-medium tracking-wider text-slate-400">Status</TableHead>
                  <TableHead className="text-right h-14 text-[10px] font-medium tracking-wider text-slate-400 px-8">Total harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx: Transaction) => (
                  <TableRow 
                    key={tx.id} 
                    onClick={() => fetchTransactionDetail(tx)}
                    className="hover:bg-slate-50/30 cursor-pointer transition-colors border-slate-50 group h-16"
                  >
                     <TableCell className="px-8 flex flex-col py-3">
                        <span className="text-[11px] font-mono font-bold text-slate-900 tabular-nums mb-1 leading-none">
                           {new Date(tx.created_at!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[9px] font-mono font-medium text-slate-500 tabular-nums leading-none">
                           {new Date(tx.created_at!).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                     </TableCell>
                     <TableCell>
                        <p className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1.5">{tx.customer_name || 'Guest'}</p>
                        <p className="text-[10px] text-slate-500 font-mono font-medium tabular-nums uppercase">#{tx.id.substring(0, 8)}</p>
                     </TableCell>
                     <TableCell>
                        <p className="text-[11px] font-bold text-slate-800 tracking-tight leading-none mb-1.5 uppercase">{tx.source === 'customer_tablet' ? 'Digital menu' : 'Pos counter'}</p>
                        <p className="text-[10px] text-slate-500 font-medium tracking-widest">{tx.payment_method || 'CASH'}</p>
                     </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[10px] font-bold rounded-md px-2.5 h-5 border-none",
                        tx.payment_status === 'pending' ? "bg-red-500 text-white" : "bg-emerald-600 text-white"
                      )}>
                        {tx.payment_status === 'pending' ? 'Pending' : 'Paid'}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right px-8 font-mono font-bold tabular-nums text-sm text-slate-900 tracking-tight">
                       {formatCurrency(tx.total_price)}
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DETAIL SHEET: Focused analytics */}
      <Sheet open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <SheetContent side="right" className="p-0 border-none shadow-2xl flex flex-col h-full sm:max-w-md bg-white overflow-hidden">
          <SheetHeader className="p-8 pb-10 bg-slate-900 text-slate-50 text-left shrink-0">
            <div className="flex items-center gap-4 mb-8">
               <div className="bg-emerald-500/10 p-3 rounded-2xl ring-1 ring-emerald-500/20">
                  <Receipt className="w-5 h-5 text-emerald-400" />
               </div>
               <div>
                  <SheetTitle className="text-xl font-bold text-white tracking-tight">Detail struk belanja</SheetTitle>
                  <p className="text-[10px] text-emerald-400/60 font-semibold tracking-widest uppercase mt-1">Transaction verified</p>
               </div>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-white/5">
               <div className="flex justify-between items-center text-slate-500 font-medium tracking-wider">
                  <span className="text-[10px] uppercase">Customer</span>
                  <span className="text-xs font-bold text-emerald-400">{selectedTransaction?.customer_name || 'Guest'}</span>
               </div>
               <div className="flex justify-between items-center text-slate-500 font-medium tracking-wider">
                  <span className="text-[10px] uppercase">Id transaksi</span>
                  <span className="text-xs font-bold text-slate-300 tabular-nums uppercase">#{selectedTransaction?.id?.substring(0, 8)}</span>
               </div>
               <div className="flex justify-between items-center text-slate-500 font-medium tracking-wider">
                  <span className="text-[10px] uppercase">Waktu presisi</span>
                  <span className="text-xs font-bold text-slate-200 tabular-nums">
                    {selectedTransaction?.created_at ? new Date(selectedTransaction.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                  </span>
               </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden p-0">
             <ScrollArea className="h-full">
                <div className="p-10 space-y-10">
                   <div className="space-y-8">
                      <div className="flex items-center justify-between border-b pb-4 border-slate-50">
                         <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Item terjual</h4>
                         <Badge variant="outline" className="text-[10px] font-bold h-6 bg-slate-50 border-slate-100 tabular-nums text-slate-400 rounded-lg px-3">
                            {selectedItems.length} Produk
                         </Badge>
                      </div>
                      {detailLoading ? (
                        <div className="flex flex-col items-center gap-4 py-24 text-slate-200 justify-center">
                           <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
                           <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300">Memuat detail hub...</span>
                        </div>
                      ) : (
                        <div className="space-y-8">
                           {selectedItems.map((item: DetailedTransactionItem) => (
                             <div key={item.id} className="flex justify-between items-start group">
                                <div className="max-w-[70%]">
                                   <p className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-2">{item.products?.name}</p>
                                   <p className="text-[11px] text-slate-400 font-medium tabular-nums flex items-center gap-2">
                                      <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-900 font-black">{item.quantity}x</span> 
                                      @ {formatCurrency(item.products?.price)}
                                   </p>
                                   {item.note && (
                                      <p className="text-[10px] text-slate-500 font-medium mt-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 inline-block leading-tight">
                                         &quot;{item.note}&quot;
                                      </p>
                                   )}
                                </div>
                                <p className="text-sm font-bold tabular-nums text-slate-900">{formatCurrency(item.subtotal)}</p>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                </div>
             </ScrollArea>
          </div>

          <div className="p-8 bg-slate-50/50 border-t border-slate-100 space-y-8 shrink-0 pb-12 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.05)]">
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-widest uppercase leading-none">
                    <span>Metode pembayaran</span>
                    <span className="text-slate-900 font-bold border-b-2 border-slate-200 pb-0.5">{selectedTransaction?.payment_method || 'CASH'}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-widest uppercase leading-none">
                    <span>Status transaksi</span>
                    <Badge className={cn(
                       "h-6 text-[10px] font-black border-none px-3 rounded-full shadow-sm",
                       selectedTransaction?.payment_status === 'pending' ? "bg-red-500 text-white" : "bg-emerald-600 text-white"
                    )}>
                       {selectedTransaction?.payment_status || 'PAID'}
                    </Badge>
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-200/60">
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] mb-2 leading-none uppercase">Settlement value</p>
                      <p className="text-4xl font-bold text-slate-900 tabular-nums tracking-tighter">
                         <span className="text-xs font-bold text-slate-200 mr-2 not-italic">IDR</span>
                         {selectedTransaction ? selectedTransaction.total_price.toLocaleString('id-ID') : '0'}
                      </p>
                    </div>
                 </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-sm"
                onClick={() => setSelectedTransaction(null)}
              >
                Tutup laporan
              </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}
