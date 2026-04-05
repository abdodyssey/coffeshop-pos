"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  ChevronRight,
  Utensils,
  RefreshCw,
  Search,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Product, Ingredient, Recipe } from "@/types/database";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

export default function RecipeManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for new recipe item
  const [newIngredientId, setNewIngredientId] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: prods } = await supabase.from("products").select("*").order("name");
      const { data: ings } = await supabase.from("ingredients").select("*").order("name");
      const { data: recs } = await supabase.from("recipes").select("*");

      setProducts(prods || []);
      setIngredients(ings || []);
      setRecipes(recs || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Gagal memuat data resep");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const productRecipes = useMemo(() => {
    return recipes.filter(r => r.product_id === selectedProduct?.id);
  }, [recipes, selectedProduct]);

  const handleAddIngredient = async () => {
    if (!selectedProduct || !newIngredientId || !newQuantity) {
      toast.error("Pilih bahan dan masukkan jumlah!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("recipes")
        .upsert({
          product_id: selectedProduct.id,
          ingredient_id: newIngredientId,
          quantity_required: parseFloat(newQuantity)
        }, { onConflict: "product_id,ingredient_id" });

      if (error) throw error;

      toast.success("Bahan berhasil ditambahkan ke resep");
      setNewIngredientId("");
      setNewQuantity("");
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan resep");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIngredient = async (ingredientId: string) => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .match({ product_id: selectedProduct.id, ingredient_id: ingredientId });

      if (error) throw error;
      toast.success("Bahan dihapus dari resep");
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus resep");
    }
  };

  const formatNumber = (val: number | string) => {
    return new Intl.NumberFormat("id-ID").format(Number(val));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/30 p-6 md:p-10 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3">
           <Link href="/dashboard" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 tracking-[0.2em] flex items-center gap-2 transition-colors uppercase">
              <ArrowLeft className="w-3 h-3" /> Dashboard
           </Link>
           <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-4">
              Matriks Resep <Settings2 className="w-8 h-8 text-slate-100" />
           </h1>
           <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase opacity-60 pl-1">Inventory consumption architect</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Field className="w-full">
            <FieldContent className="hidden">
              <FieldLabel>Cari Katalog</FieldLabel>
            </FieldContent>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors z-10" />
              <Input 
                placeholder="Cari katalog menu..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 h-11 rounded-lg border-slate-200 bg-white shadow-sm focus-visible:ring-slate-900 transition-all text-sm font-medium"
              />
            </div>
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const recipeItems = recipes.filter(r => r.product_id === product.id);
          return (
            <Card key={product.id} className="group border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 rounded-xl overflow-hidden bg-white">
               <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                     <div className="bg-slate-50 p-3 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                        <Utensils className="w-5 h-5" />
                     </div>
                     <Badge variant="outline" className="rounded-full text-[9px] font-bold uppercase tracking-widest px-3 py-0.5 border-slate-100 text-slate-400 bg-white">
                        {product.category || 'Standard'}
                     </Badge>
                  </div>
                  
                  <div className="space-y-1 mb-8 text-left">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none truncate">{product.name}</h3>
                    <p className="text-xs font-mono text-slate-400 font-bold tracking-tight">IDR {formatNumber(product.price)}</p>
                  </div>

                  <div className="space-y-4 text-left">
                     <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <p className="text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase">Komposisi</p>
                        <span className="text-[10px] font-bold text-slate-900 font-mono tracking-tighter">{recipeItems.length} items</span>
                     </div>
                     
                     <div className="flex flex-wrap gap-1.5 pt-1">
                        {recipeItems.length > 0 ? (
                           recipeItems.slice(0, 3).map((r, i) => {
                             const ing = ingredients.find(ing => ing.id === r.ingredient_id);
                             return (
                                <span key={i} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-100/50">
                                   {ing?.name}
                                </span>
                             )
                           })
                        ) : (
                           <span className="text-[10px] font-bold py-1 text-slate-200 uppercase tracking-widest">Belum ada bahan</span>
                        )}
                        {recipeItems.length > 3 && <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-slate-50 text-slate-400">+{recipeItems.length - 3}</span>}
                     </div>
                  </div>

                  <Dialog onOpenChange={(open) => {
                    if (open) setSelectedProduct(product);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-8 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] tracking-[0.2em] uppercase shadow-lg transition-all active:scale-95 shadow-slate-900/10">
                         Atur Resep <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden border-none shadow-2xl bg-white">
                       <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                          <div className="flex items-center gap-4">
                             <div className="bg-slate-900 p-3 rounded-lg shadow-lg">
                                <Utensils className="w-5 h-5 text-white" />
                             </div>
                             <div className="text-left">
                                <DialogTitle className="text-base font-bold tracking-tight text-slate-900">Arsitek Resep</DialogTitle>
                                <p className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">Pemetaan resep {product.name}</p>
                             </div>
                          </div>
                       </DialogHeader>

                       <div className="p-6 space-y-8">
                          <div className="space-y-3 text-left">
                             <p className="text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase pl-1">Bangun Komposisi</p>
                             <div className="rounded-xl border border-slate-100 overflow-hidden bg-white/50">
                                <Table>
                                   <TableHeader className="bg-slate-50/80">
                                      <TableRow className="border-slate-50 hover:bg-transparent h-10">
                                         <TableHead className="px-6 text-xs font-semibold text-slate-500 text-left">Bahan baku</TableHead>
                                         <TableHead className="px-6 text-xs font-semibold text-slate-500 text-left">Takaran / dosis</TableHead>
                                         <TableHead className="text-right px-6 text-xs font-semibold text-slate-500">Aksi</TableHead>
                                      </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                      {productRecipes.length === 0 ? (
                                         <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={3} className="h-24 text-center text-[10px] font-bold text-slate-200 uppercase tracking-widest">Matriks masih kosong</TableCell>
                                         </TableRow>
                                      ) : (
                                         productRecipes.map(r => {
                                            const ing = ingredients.find(i => i.id === r.ingredient_id);
                                            return (
                                               <TableRow key={r.ingredient_id} className="border-slate-50 h-12 hover:bg-slate-50/50 transition-colors">
                                                  <TableCell className="px-6 text-xs font-bold text-slate-900 text-left">{ing?.name}</TableCell>
                                                  <TableCell className="px-6 text-left font-mono">
                                                     <span className="text-xs font-bold text-slate-900">{formatNumber(r.quantity_required)}</span>
                                                     <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase opacity-70">{ing?.unit}</span>
                                                  </TableCell>
                                                  <TableCell className="px-6 text-right">
                                                     <Button 
                                                       variant="ghost" 
                                                       size="icon" 
                                                       onClick={() => handleRemoveIngredient(r.ingredient_id)}
                                                       className="w-8 h-8 rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-40 hover:opacity-100"
                                                     >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                     </Button>
                                                  </TableCell>
                                               </TableRow>
                                            )
                                         })
                                      )}
                                   </TableBody>
                                </Table>
                             </div>
                          </div>

                             <FieldGroup className="p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                                <Field>
                                   <FieldLabel>Bahan Baku</FieldLabel>
                                   <FieldDescription>Pilih bahan dasar untuk komposisi menu ini.</FieldDescription>
                                   <Select value={newIngredientId} onValueChange={setNewIngredientId}>
                                      <SelectTrigger className="h-11 border-slate-200 rounded-xl bg-white focus:ring-0 shadow-sm font-bold text-xs">
                                         <SelectValue placeholder="Pilih Bahan..." />
                                      </SelectTrigger>
                                      <SelectContent position="item-aligned" className="rounded-xl border-slate-100 shadow-2xl">
                                         <SelectGroup>
                                           <ScrollArea className="h-48">
                                              {ingredients.map(ing => (
                                                 <SelectItem key={ing.id} value={ing.id} className="text-xs font-medium py-3 pl-3">{ing.name} ({ing.unit})</SelectItem>
                                              ))}
                                           </ScrollArea>
                                         </SelectGroup>
                                      </SelectContent>
                                   </Select>
                                </Field>
                                <Field>
                                   <FieldLabel>Takaran ({ingredients.find(i => i.id === newIngredientId)?.unit || 'val'})</FieldLabel>
                                   <FieldDescription>Masukkan jumlah presisi untuk konsistensi rasa.</FieldDescription>
                                   <Input 
                                     type="number" 
                                     placeholder="0.00" 
                                     value={newQuantity}
                                     onChange={e => setNewQuantity(e.target.value)}
                                     className="h-11 border-slate-200 rounded-lg bg-white focus-visible:ring-0 shadow-sm font-mono font-bold text-sm"
                                   />
                                </Field>

                                 <DialogFooter className="pt-2">
                                   <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                       <Button 
                                         className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all text-xs shadow-xl active:scale-95 shadow-slate-900/10"
                                         disabled={isSubmitting}
                                       >
                                          {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : "Terapkan ke resep"}
                                       </Button>
                                     </AlertDialogTrigger>
                                     <AlertDialogContent className="rounded-2xl border-none shadow-3xl p-8">
                                       <AlertDialogHeader>
                                         <AlertDialogTitle className="text-sm font-bold text-slate-900 font-sans tracking-tight">Simpan resep?</AlertDialogTitle>
                                         <AlertDialogDescription className="text-[11px] leading-relaxed text-slate-400 font-medium font-sans">
                                           Perubahan ini akan memengaruhi kalkulasi stok otomatis ke depannya. Pastikan komposisi sudah akurat.
                                         </AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter className="mt-4 gap-2">
                                         <AlertDialogCancel className="h-11 rounded-lg text-xs font-bold border-slate-100">Batalkan</AlertDialogCancel>
                                         <AlertDialogAction 
                                           onClick={handleAddIngredient}
                                           className="h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border-none px-6"
                                         >
                                           Ya, simpan resep
                                         </AlertDialogAction>
                                       </AlertDialogFooter>
                                     </AlertDialogContent>
                                   </AlertDialog>
                                 </DialogFooter>
                             </FieldGroup>
                       </div>
                    </DialogContent>
                  </Dialog>
               </CardContent>
            </Card>
          )
        })}
      </div>
      
      {loading && (
         <div className="fixed inset-0 bg-white/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
           <RefreshCw className="w-12 h-12 animate-spin mb-6 text-slate-900 opacity-20" />
           <p className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-900">Menyelaraskan Katalog...</p>
         </div>
      )}
    </div>
  );
}
