"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Coffee,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    criticalCount: 0,
    activeMenuCount: 0
  });
  const [revenueHistory, setRevenueHistory] = useState<{name: string, total: number}[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Today's Revenue
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const { data: txsToday } = await supabase
        .from("transactions")
        .select("total_price, payment_status")
        .gte("created_at", startOfDay.toISOString());
      
      const revenue = (txsToday || [])
        .filter(t => t.payment_status === 'paid')
        .reduce((sum, t) => sum + Number(t.total_price), 0);
      
      // 2. Fetch Active Menu Count
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: 'exact', head: true });

      // 3. Fetch Critical Stock Count
      const { data: ings } = await supabase
        .from("ingredients")
        .select("current_stock, minimum_stock_alert");
      
      const critCount = (ings || []).filter(ing => 
        Number(ing.current_stock) <= Number(ing.minimum_stock_alert)
      ).length;

      setMetrics({
        todayRevenue: revenue,
        criticalCount: critCount,
        activeMenuCount: productCount || 0
      });

      // 4. Fetch Revenue History (Last 7 Days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: history } = await supabase
        .from("transactions")
        .select("total_price, created_at")
        .gte("created_at", sevenDaysAgo.toISOString())
        .eq("payment_status", "paid");

      const dailyRevenue: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyRevenue[d.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })] = 0;
      }

      (history || []).forEach(tx => {
        const date = new Date(tx.created_at!).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
        if (dailyRevenue[date] !== undefined) {
          dailyRevenue[date] += Number(tx.total_price);
        }
      });

      setRevenueHistory(Object.entries(dailyRevenue).map(([name, total]) => ({ name, total })));

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-stone-50/50 p-6 md:p-10 space-y-8 font-sans">
      
      {/* 1. Header: Pure Motivation */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
         <div className="text-left w-full">
            <h1 className="text-2xl font-black tracking-tight text-stone-900 leading-none">Dashboard</h1>
            <p className="text-xs font-medium text-stone-400 mt-2 italic focus-within:not-italic">Visualisasi performa operasional Coffee & Code.</p>
         </div>
         <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-full h-9 px-5 bg-white border-stone-100 shadow-sm text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2.5", loading && "animate-spin")} /> Update data
         </Button>
      </header>

      {/* 2. Primary Metrics: Industrial Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="shadow-none border-stone-200/60 rounded-2xl bg-white overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
               <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] leading-none mb-1">Omzet Hari Ini</p>
                  <h3 className="text-2xl font-black tracking-tighter text-stone-900 font-mono">
                    {formatCurrency(metrics.todayRevenue)}
                  </h3>
               </div>
               <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-all group-hover:scale-110 shadow-sm shadow-emerald-500/5">
                  <TrendingUp className="w-5 h-5" />
               </div>
            </CardContent>
         </Card>

         <Card className={cn(
            "shadow-none border-stone-200/60 rounded-2xl bg-white overflow-hidden group transition-all",
            metrics.criticalCount > 0 && "ring-1 ring-red-500/20"
         )}>
            <CardContent className="p-6 flex items-center justify-between">
               <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] leading-none mb-1">Bahan Baku Kritis</p>
                  <h3 className={cn(
                    "text-2xl font-black tracking-tighter font-mono",
                    metrics.criticalCount > 0 ? "text-red-600" : "text-stone-900"
                  )}>
                    {metrics.criticalCount} <span className="text-[10px] font-black uppercase text-stone-300 ml-1 tracking-widest">SKU</span>
                  </h3>
               </div>
               <div className={cn(
                 "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                 metrics.criticalCount > 0 ? "bg-red-50 text-red-600 shadow-red-500/5" : "bg-stone-50 text-stone-400 shadow-stone-500/5"
               )}>
                  <AlertTriangle className="w-5 h-5" />
               </div>
            </CardContent>
            {metrics.criticalCount > 0 && (
              <div className="px-6 pb-4 -mt-1 group/btn">
                 <Link href="/dashboard/stok" className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors">
                   Audit stok sekarang <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                 </Link>
              </div>
            )}
         </Card>

         <Card className="shadow-none border-stone-200/60 rounded-2xl bg-white overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
               <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] leading-none mb-1">Total Menu Aktif</p>
                  <h3 className="text-2xl font-black tracking-tighter text-stone-900 font-mono">
                    {metrics.activeMenuCount} <span className="text-[10px] font-black uppercase text-stone-300 ml-1 tracking-widest">Item</span>
                  </h3>
               </div>
               <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-sm shadow-stone-500/5">
                  <Coffee className="w-5 h-5" />
               </div>
            </CardContent>
         </Card>
      </div>

      {/* 3. Performance Graph: Simple Aesthetic Visualization */}
      <Card className="shadow-none border-stone-200/60 rounded-2xl bg-white overflow-hidden p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-stone-900 tracking-tight">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Performa Penjualan
            </CardTitle>
            <p className="text-[10px] text-stone-400 mt-2 font-bold tracking-[0.2em] uppercase opacity-60">Insight pendapatan 7 hari terakhir</p>
          </div>
          <div className="bg-stone-50 px-4 py-2 rounded-xl text-[10px] font-bold text-stone-400 uppercase tracking-widest border border-stone-100">
             7 Hari Terakhir
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 700, fill: '#A8A29E'}} 
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 700, fill: '#A8A29E'}} 
                dx={-10}
                tickFormatter={(val) => `Rp${val/1000}k`}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  fontWeight: 700
                }}
                formatter={(val) => [`Rp${Number(val).toLocaleString('id-ID')}`, 'Pendapatan']}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#1c1917" 
                strokeWidth={4} 
                dot={{r: 4, fill: '#1c1917', strokeWidth: 0}}
                activeDot={{r: 6, strokeWidth: 0, fill: '#10b981'}}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

    </div>
  );
}
