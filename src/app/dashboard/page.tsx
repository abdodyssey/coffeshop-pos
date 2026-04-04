'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Package, 
  ArrowUpCircle, 
  Clock, 
  RefreshCw,
  Zap,
  TrendingDown,
  Trash2,
  ListRestart,
  BarChart as BarChartIcon,
  X,
  Plus,
  History
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { Ingredient, InventoryLog } from '@/types/database'
import { calculateInventoryPredictions, PredictionData } from '@/lib/prediction'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [predictions, setPredictions] = useState<Record<string, PredictionData>>({})
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)
  
  // MODAL STATES
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false)
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false)
  const [targetIngredientId, setTargetIngredientId] = useState('')
  const [amount, setAmount] = useState('')
  const [wasteReason, setWasteReason] = useState('Susu Tumpah')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Fetching Data
  const fetchData = async () => {
    try {
      const { data: ings } = await supabase.from('ingredients').select('*').order('name')
      setIngredients(ings || [])
      
      const preds = await calculateInventoryPredictions(ings || [])
      setPredictions(preds)

      const { data: logData } = await supabase
        .from('inventory_logs')
        .select('*, ingredients(name)')
        .order('created_at', { ascending: false })
        .limit(20)
      setLogs(logData as any[] || [])

    } catch (err) {
      console.error('Fetch Dashboard Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('dashboard-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => fetchData()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // 2. Chart Formatting Data
  const chartData = useMemo(() => {
    const days = 7
    const result = []
    const coffeeId = ingredients.find(i => i.name.includes('Kopi'))?.id
    const milkId = ingredients.find(i => i.name.includes('Susu'))?.id

    for (let i = days; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      
      const dayLogs = logs.filter(l => 
        new Date(l.created_at!).toDateString() === d.toDateString() && 
        Number(l.change_amount) < 0 && 
        l.reason !== 'Restock'
      )

      const coffeeUsage = Math.abs(dayLogs.filter(l => l.ingredient_id === coffeeId).reduce((s, l) => s + Number(l.change_amount), 0))
      const milkUsage = Math.abs(dayLogs.filter(l => l.ingredient_id === milkId).reduce((s, l) => s + Number(l.change_amount), 0))

      result.push({
        name: dateKey,
        'Kopi (g)': coffeeUsage,
        'Susu (ml)': milkUsage / 10 
      })
    }
    return result
  }, [logs, ingredients])

  // 3. UNIVERSAL STOCK UPDATE LOGIC
  const handleStockUpdate = async (e: React.FormEvent, type: 'Restock' | 'Waste') => {
    e.preventDefault()
    if (!targetIngredientId || !amount || isSubmitting) return
    setIsSubmitting(true)

    try {
      const ingredient = ingredients.find(i => i.id === targetIngredientId)
      if (!ingredient) throw new Error('Bahan tidak ditemukan')

      const amountNum = parseFloat(amount)
      const changeAmount = type === 'Restock' ? amountNum : -amountNum
      const finalReason = type === 'Restock' ? 'Restock' : `Waste: ${wasteReason}`

      // 1. Update stok di tabel ingredients
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({ current_stock: Number(ingredient.current_stock) + changeAmount })
        .eq('id', targetIngredientId)
      if (updateError) throw updateError

      // 2. Catat log aktivitas
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          ingredient_id: targetIngredientId,
          change_amount: changeAmount,
          reason: finalReason
        })
      if (logError) throw logError

      // Close & Reset
      setIsStockInModalOpen(false)
      setIsWasteModalOpen(false)
      setAmount('')
      setTargetIngredientId('')
      fetchData()
    } catch (err: any) {
      alert(`Gagal update stok: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatus = (daysLeft: number | 'unknown') => {
    if (daysLeft === 'unknown') return { label: 'No Data', color: 'bg-slate-500', text: 'text-slate-600' }
    if (daysLeft < 2) return { label: 'Kritis', color: 'bg-red-500', text: 'text-red-500' }
    if (daysLeft <= 5) return { label: 'Peringatan', color: 'bg-amber-500', text: 'text-amber-500' }
    return { label: 'Aman', color: 'bg-emerald-500', text: 'text-emerald-500' }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-6 lg:p-12 font-sans selection:bg-amber-100">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* ROW 1: HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-neutral-100">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-black uppercase tracking-widest leading-none">
                <Zap className="w-3 h-3 fill-amber-700" /> Professional Predictor v2.0
             </div>
             <h1 className="text-5xl font-black tracking-tight leading-tight">Master Intelligence</h1>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={() => {
                   setTargetIngredientId(ingredients[0]?.id || '')
                   setIsWasteModalOpen(true)
                }}
                className="px-8 py-4 bg-white border-2 border-neutral-100 text-neutral-500 font-bold rounded-[2rem] hover:bg-neutral-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
              >
                <Trash2 className="w-5 h-5" /> Catat Waste
             </button>
             <button 
                onClick={() => {
                   setTargetIngredientId(ingredients[0]?.id || '')
                   setIsStockInModalOpen(true)
                }}
                className="px-8 py-4 bg-neutral-900 text-white font-bold rounded-[2rem] hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-2xl active:scale-95"
              >
                <Plus className="w-5 h-5" /> Stock In
             </button>
          </div>
        </header>

        {/* ROW 2: SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ingredients.map(ing => {
            const pred = predictions[ing.id]
            const daysLeft = pred?.days_left ?? 'unknown'
            const status = getStatus(daysLeft)

            return (
              <div key={ing.id} className="relative bg-neutral-50 border border-neutral-100/50 rounded-[3rem] p-10 hover:shadow-2xl hover:bg-white hover:border-amber-100 transition-all duration-700 group">
                <div className="flex justify-between items-start mb-10">
                   <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg group-hover:bg-amber-600 transition-colors duration-500">
                      <Package className="w-8 h-8 text-neutral-400 group-hover:text-white" />
                   </div>
                   <span className={cn("text-xs font-black uppercase tracking-tighter", status.text)}>
                      {status.label}: {daysLeft === 'unknown' ? '?' : Math.ceil(Number(daysLeft))} Hari
                   </span>
                </div>
                <h3 className="text-3xl font-black mb-1">{ing.name}</h3>
                <p className="text-neutral-400 font-bold mb-10">Stok: {ing.current_stock} {ing.unit}</p>

                <div className="h-1.5 w-full bg-neutral-200 rounded-full mb-4 overflow-hidden">
                   <div className={cn("h-full transition-all duration-1000", status.color)} style={{ width: `${daysLeft === 'unknown' ? 0 : Math.min(100, (Number(daysLeft)/14)*100)}%` }} />
                </div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                   <span>Usage Trend</span>
                   <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> {pred?.daily_average.toFixed(1)} / day</span>
                </p>
              </div>
            )
          })}
        </div>

        {/* ROW 3: CHARTS & LOGS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-fit">
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-black text-white flex items-center gap-4">
                   <BarChartIcon className="w-6 h-6 text-amber-500" />
                   Consumption Analytics
                </h2>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2"><div className="w-3 h-1 bg-amber-500 rounded-full"></div><span className="text-[10px] uppercase font-bold text-neutral-400">Kopi</span></div>
                   <div className="flex items-center gap-2"><div className="w-3 h-1 bg-emerald-500 rounded-full"></div><span className="text-[10px] uppercase font-bold text-neutral-400">Susu</span></div>
                </div>
             </div>
             
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 10, fontWeight: 'bold' }} dy={20} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: '20px', fontSize: '10px', color: '#fff', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="Kopi (g)" stroke="#f59e0b" strokeWidth={5} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="Susu (ml)" stroke="#10b981" strokeWidth={5} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white border-2 border-neutral-50 rounded-[3rem] p-10 h-full flex flex-col shadow-sm">
             <h2 className="text-2xl font-black mb-10 flex items-center gap-4">
                <ListRestart className="w-6 h-6 text-neutral-400" />
                Latest Events
             </h2>
             <div className="flex-1 space-y-6 overflow-y-auto pr-4 scrollbar-hide">
                {logs.map(log => (
                   <div key={log.id} className="flex gap-4 items-start pb-6 border-b border-neutral-50 last:border-0 group">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                        log.change_amount < 0 ? "bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white" : "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white"
                      )}>
                         {log.reason?.includes('Waste') ? <Trash2 className="w-4 h-4" /> : log.change_amount < 0 ? <Clock className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                      </div>
                      <div>
                         <p className="text-sm font-black group-hover:text-amber-700 transition-colors">{(log as any).ingredients?.name}</p>
                         <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{log.reason || 'Sale usage'}</p>
                         <p className="text-xs font-bold mt-1">{log.change_amount > 0 ? '+' : ''}{log.change_amount}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* MODAL: STOCK IN */}
        {isStockInModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-neutral-900/60 backdrop-blur-xl animate-in fade-in">
             <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in-95">
                <button onClick={() => setIsStockInModalOpen(false)} className="absolute top-8 right-8 text-neutral-400 hover:text-neutral-900"><X /></button>
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-4 bg-emerald-50 text-emerald-500 rounded-3xl"><Plus /></div>
                   <h2 className="text-3xl font-black tracking-tight">Stock In</h2>
                </div>

                <form onSubmit={(e) => handleStockUpdate(e, 'Restock')} className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Bahan Baku</label>
                      <select 
                        required
                        value={targetIngredientId}
                        onChange={(e) => setTargetIngredientId(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 p-6 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-100 outline-none appearance-none"
                      >
                         {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Jumlah Masuk</label>
                      <input 
                        type="number" 
                        required 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 p-6 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-100 outline-none"
                        placeholder="0.00"
                      />
                   </div>
                   <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full py-6 bg-neutral-900 text-white rounded-3xl font-black text-xl hover:bg-neutral-800 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50"
                   >
                      {isSubmitting ? 'Recording...' : 'Selesaikan Restock'}
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* MODAL: WASTE */}
        {isWasteModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-neutral-900/60 backdrop-blur-xl animate-in fade-in">
             <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in-95">
                <button onClick={() => setIsWasteModalOpen(false)} className="absolute top-8 right-8 text-neutral-400 hover:text-neutral-900"><X /></button>
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-4 bg-red-50 text-red-500 rounded-3xl"><Trash2 /></div>
                   <h2 className="text-3xl font-black tracking-tight">Record Waste</h2>
                </div>

                <form onSubmit={(e) => handleStockUpdate(e, 'Waste')} className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Bahan Baku</label>
                      <select 
                        required
                        value={targetIngredientId}
                        onChange={(e) => setTargetIngredientId(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 p-6 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-red-100 outline-none appearance-none"
                      >
                         {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Jumlah Hilang</label>
                         <input 
                           type="number" 
                           required 
                           value={amount} 
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full bg-neutral-50 border border-neutral-100 p-6 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-red-100 outline-none"
                           placeholder="0.00"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Kategori Alasan</label>
                         <select 
                           value={wasteReason}
                           onChange={(e) => setWasteReason(e.target.value)}
                           className="w-full bg-neutral-50 border border-neutral-100 p-6 rounded-3xl font-bold focus:outline-none focus:ring-4 focus:ring-red-100 outline-none appearance-none"
                         >
                            <option value="Susu Tumpah">Susu Tumpah</option>
                            <option value="Salah Kalibrasi">Salah Kalibrasi</option>
                            <option value="Susu Basi">Susu Basi</option>
                            <option value="Lainnya">Lainnya</option>
                         </select>
                      </div>
                   </div>
                   <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full py-6 bg-neutral-900 text-white rounded-3xl font-black text-xl hover:bg-neutral-800 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50"
                   >
                      {isSubmitting ? 'Recording...' : 'Catat Kerugian'}
                   </button>
                </form>
             </div>
          </div>
        )}

      </div>
    </div>
  )
}
