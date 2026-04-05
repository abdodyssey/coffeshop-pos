'use client'

import { useState, useEffect } from 'react'
import { Coffee, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Product, Ingredient, Recipe } from '@/types/database'
import { cn } from '@/lib/utils'

// Shadcn UI Components
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function DigitalMenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  // Fetching Logic
  const fetchData = async () => {
    setLoading(true)
    setErrorStatus(null)
    try {
      const { data: prods } = await supabase.from('products').select('*').order('name')
      const { data: ings } = await supabase.from('ingredients').select('*')
      const { data: recs } = await supabase.from('recipes').select('*')
      
      setProducts(prods || [])
      setIngredients(ings || [])
      setRecipes(recs || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setErrorStatus(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Listen for inventory changes
    const channel = supabase
       .channel('menu-sync')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
         fetchData()
       })
       .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Check if a specific product is sold out
  const isSoldOut = (productId: string) => {
    const itemRecipes = recipes.filter(r => r.product_id === productId)
    if (itemRecipes.length === 0) return false
    
    return itemRecipes.some(r => {
      const ingredient = ingredients.find(i => i.id === r.ingredient_id)
      return ingredient && Number(ingredient.current_stock) < Number(r.quantity_required)
    })
  }

  const categories = ['Coffee', 'Non-Coffee', 'Snack', 'Additional']

  // Title Case Helper
  const toTitleCase = (str: string) => {
    return (str || '').toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
  }

  return (
    <div className="min-h-screen w-full bg-white font-sans selection:bg-slate-900 selection:text-white flex flex-col relative text-slate-950">
      
      {/* HEADER: Catalog Hero Section */}
      <header className="bg-white px-6 pt-20 pb-12 md:px-16 shrink-0 border-b border-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-500 font-semibold tracking-widest uppercase text-[9px] px-4 py-1 rounded-full border-none">
              Digital Menu Catalog
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-950 leading-[1.1]">
               Welcome to <br /> <span className="text-slate-300 font-medium">Code & Coffee.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 font-medium max-w-md leading-relaxed">
               Fueling your logic, one cup at a time.
            </p>
          </div>
        </div>
      </header>

      {/* CATEGORY TABS: Pure Navigation */}
      <Tabs defaultValue="Coffee" className="flex-1 flex flex-col min-h-0">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 md:px-16 shrink-0 overflow-x-auto scrollbar-hide py-4">
          <div className="max-w-6xl mx-auto">
            <TabsList className="bg-transparent h-fit w-fit flex gap-4 p-0">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className={cn(
                    "rounded-full px-8 py-3 text-sm font-bold tracking-tight transition-all border border-slate-100",
                    "data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:border-slate-950 data-[state=active]:shadow-xl",
                    "bg-slate-50 text-slate-400"
                  )}
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* PRODUCTS GRID: High-Density Catalog */}
        <div className="flex-1 bg-slate-50/20">
          <div className="max-w-6xl mx-auto px-6 md:px-16 py-16 pb-32">
            {errorStatus && (
               <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center space-y-4 mb-8">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                     <span className="text-red-500 font-bold text-xl">!</span>
                  </div>
                  <div>
                    <h3 className="text-red-900 font-bold text-lg">Gagal Memuat Data</h3>
                    <p className="text-red-500 text-xs font-medium tabular-nums opacity-80 mt-1">Error: {errorStatus}</p>
                  </div>
                  <p className="text-[10px] text-red-400 font-medium">Pastikan koneksi internet HP stabil dan database Supabase aktif.</p>
               </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 opacity-20">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="text-xs font-bold tracking-widest uppercase">Loading catalog...</p>
              </div>
            ) : (
              categories.map(cat => (
                <TabsContent key={cat} value={cat} className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products
                          .filter(p => (p.category || 'Coffee').toLowerCase() === cat.toLowerCase())
                          .map((product, index) => {
                            const soldOut = isSoldOut(product.id)
                            return (
                              <Card 
                                key={product.id} 
                                className={cn(
                                  "group border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-2xl hover:shadow-slate-950/5 hover:-translate-y-2 transition-all duration-700 rounded-[2rem] overflow-hidden flex flex-col h-full p-1 bg-white relative",
                                  soldOut && "grayscale opacity-60"
                                )}
                              >
                                 {/* Card Header: Product Frame */}
                                 <CardContent className="p-0 space-y-3 flex flex-col h-full">
                                   <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-slate-50 shrink-0">
                                      {product.image_url ? (
                                          <Image 
                                            src={product.image_url} 
                                            alt={product.name} 
                                            fill 
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            priority={index < 4}
                                            className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                                          />
                                      ) : (
                                         <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 bg-slate-50">
                                            <Coffee className="w-12 h-12" />
                                         </div>
                                      )}

                                      {/* Central Sold Out Overlay */}
                                      {soldOut && (
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                          <div className="bg-slate-950 text-white px-5 py-2 rounded-full shadow-2xl scale-110">
                                            <p className="text-[10px] font-black tracking-[0.3em] uppercase">Habis</p>
                                          </div>
                                        </div>
                                      )}
                                   </div>
                                   
                                   {/* Text Area */}
                                   <div className="px-6 pb-6 mt-3 space-y-1 flex-1">
                                      <h3 className="text-lg font-bold text-slate-950 tracking-tight leading-tight">
                                        {toTitleCase(product.name)}
                                      </h3>
                                      <p className="text-sm font-medium text-slate-500 tabular-nums">
                                        IDR {product.price.toLocaleString('id-ID')}
                                      </p>
                                      
                                      <p className="text-[10px] text-slate-400 font-light leading-relaxed line-clamp-2 mt-3 opacity-90">
                                        {product.description || "The finest craft selected for your daily caffeine intake."}
                                      </p>
                                   </div>
                                 </CardContent>
                              </Card>
                            )
                          })}
                   </div>
                </TabsContent>
              ))
            )}
          </div>
        </div>
      </Tabs>

      {/* FOOTER: Minimalist Attribution */}
      <footer className="py-16 border-t border-slate-50 bg-white px-6 md:px-16 text-center shrink-0">
         <p className="text-[10px] font-bold text-slate-200 uppercase tracking-[0.4em]">
           &copy; 2026 Code & Coffee &bull; Engineered by Devtective
         </p>
      </footer>
    </div>
  )
}
