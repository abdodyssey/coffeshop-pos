"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Minus,
  ShoppingCart,
  Search,
  Trash2,
  RefreshCw,
  Coffee,
  ArrowLeft,
  CheckCircle2,
  UserCircle,
  PencilLine,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Product, Ingredient, Recipe } from "@/types/database";
import { updateStock } from "@/lib/inventory";
import { cn } from "@/lib/utils";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";
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
import { toast } from "sonner";

interface CartItem extends Product {
  quantity: number;
  note?: string;
}

const CATEGORIES = ["Semua", "Coffee", "Non-Coffee", "Snack", "Additional"];

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [isNameError, setIsNameError] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .order("name");
      const { data: ings } = await supabase.from("ingredients").select("*");
      const { data: recs } = await supabase.from("recipes").select("*");

      setProducts(prods || []);
      setIngredients(ings || []);
      setRecipes(recs || []);
    } catch (err) {
      console.error("Error fetching baseline data:", err);
      toast.error("Gagal sinkronisasi data intelligence");
    } finally {
      setLoading(false);
    }
  };

  const isSoldOut = (productId: string) => {
    const itemRecipes = recipes.filter((r) => r.product_id === productId);
    if (itemRecipes.length === 0) return false;

    return itemRecipes.some((r) => {
      const ingredient = ingredients.find((i) => i.id === r.ingredient_id);
      return (
        ingredient &&
        Number(ingredient.current_stock) < Number(r.quantity_required)
      );
    });
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("pos-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingredients" },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recipes" },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkStockAvailability = (
    items: { product_id: string; quantity: number }[],
  ) => {
    for (const item of items) {
      const itemRecipes = recipes.filter(
        (r) => r.product_id === item.product_id,
      );
      for (const r of itemRecipes) {
        const ingredient = ingredients.find((i) => i.id === r.ingredient_id);
        if (ingredient) {
          const totalNeeded = Number(r.quantity_required) * item.quantity;
          if (Number(ingredient.current_stock) < totalNeeded) {
            return { ok: false, ingredient: ingredient.name };
          }
        }
      }
    }
    return { ok: true };
  };

  const addToCart = (product: Product) => {
    if (isSoldOut(product.id)) {
      toast.error(`"${product.name}" sedang habis stok.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} ditambahkan`, {
      duration: 1000,
      icon: <ShoppingCart className="w-4 h-4 text-emerald-500" />,
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const updateNote = (productId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          return { ...item, note };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      setIsNameError(true);
      toast.error("Nama pelanggan harus diisi!");
      return;
    }

    setIsNameError(false);
    const stockStatus = checkStockAvailability(
      cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
    );
    if (!stockStatus.ok) {
      toast.error(`Stok ${stockStatus.ingredient} tidak cukup!`);
      return;
    }

    setIsCheckingOut(true);
    try {
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert([{
          total_price: cartTotal,
          customer_name: customerName,
          payment_method: "Cash",
          payment_status: "paid",
          source: "pos",
        }])
        .select().single();

      if (txError) throw txError;

      const transactionItems = cart.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        note: item.note,
      }));

      const { error: itemsError } = await supabase.from("transaction_items").insert(transactionItems);
      if (itemsError) throw itemsError;

      for (const item of cart) {
        await updateStock(item.id, item.quantity);
      }

      toast.success(`Berhasil! Pesanan ${customerName} dicatat.`, {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });
      setCart([]);
      setCustomerName("");
      fetchData();
    } catch (error) {
      toast.error("Transaksi gagal.");
      console.error(error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === "Semua" || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-slate-50 font-sans overflow-hidden fixed inset-0">
      <div className="flex-1 flex flex-col min-h-0 border-r border-slate-100 bg-white shadow-sm z-0">
        <header className="px-10 py-6 border-b border-slate-50 flex shrink-0 items-center justify-between h-24">
          <div className="flex items-center gap-5">
            <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg shadow-slate-900/20">
              <Coffee className="w-5 h-5 text-slate-50" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">Point of Sale</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-[10px] text-slate-500 font-bold tracking-widest opacity-60 uppercase">Code & Coffee Hub</p>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <Link href="/dashboard" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 tracking-widest flex items-center gap-1 transition-colors uppercase">
                  <ArrowLeft className="w-3 h-3" /> Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-xl mx-12">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <Input
                placeholder="Cari menu favorit..."
                className="pl-12 h-12 text-sm font-semibold rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-0 focus:bg-white shadow-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchData} className="h-10 px-4 hover:bg-slate-100 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2.5", loading && "animate-spin")} /> Update
          </Button>
        </header>

        <main className="flex-1 min-h-0 flex flex-col">
          <div className="px-10 py-4 bg-white border-b border-slate-50 shrink-0">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border active:scale-95",
                    selectedCategory === cat
                      ? "bg-slate-900 border-slate-900 text-slate-50 shadow-xl shadow-slate-900/20"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-400 hover:text-slate-900",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-10 bg-white">
            <div className="pt-8 pb-32">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-200 py-40">
                  <RefreshCw className="w-10 h-10 animate-spin mb-6 opacity-20" />
                  <p className="text-[11px] font-bold tracking-[0.3em] opacity-40 uppercase">Sinkronisasi Ekosistem...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-24">
                  {filteredProducts.map((product) => {
                    const soldOut = isSoldOut(product.id);
                    return (
                      <Card
                        key={product.id}
                        onClick={() => !soldOut && addToCart(product)}
                        className={cn(
                          "border border-slate-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group cursor-pointer rounded-[2rem] transition-all duration-500 active:scale-95 bg-white overflow-hidden h-fit hover:shadow-2xl hover:shadow-slate-900/5 hover:-translate-y-2 p-1 relative",
                          soldOut && "grayscale opacity-50 cursor-not-allowed hover:translate-y-0",
                        )}
                      >
                        <CardContent className="p-0 space-y-3">
                          <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden relative rounded-[2rem]">
                            {product.image_url ? (
                              <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 768px) 50vw, 250px" className="object-cover transition-transform group-hover:scale-110 duration-1000" />
                            ) : (
                              <Coffee className="w-10 h-10 text-slate-200 opacity-30" />
                            )}
                            {soldOut && (
                              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <div className="bg-slate-950 text-white px-5 py-2 rounded-full shadow-2xl scale-110">
                                  <p className="text-[10px] font-black tracking-[0.3em] uppercase">Habis</p>
                                </div>
                              </div>
                            )}
                            {!soldOut && (
                              <div className="absolute top-4 right-4 z-10">
                                <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-2xl shadow-xl shadow-slate-950/10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                                  <Plus className="w-4 h-4 text-slate-900" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="px-6 pb-6 mt-3 space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight line-clamp-1">{product.name}</h3>
                            <p className="text-sm font-mono font-bold text-slate-900 tabular-nums">IDR {product.price.toLocaleString("id-ID")}</p>
                            {product.description && <p className="text-[10px] text-slate-400 font-light leading-relaxed line-clamp-2 mt-3 opacity-80">{product.description}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <div className="lg:w-[420px] flex flex-col h-full bg-white shadow-2xl relative z-10 border-l border-slate-100 shrink-0 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col gap-4 bg-white sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 text-slate-50 rounded-lg shadow-lg shadow-slate-900/10"><ShoppingCart className="w-4 h-4" /></div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">Ringkasan Pesanan</h2>
                <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mt-1.5 leading-none opacity-50 uppercase">Order Details</p>
              </div>
            </div>
            <Badge className="h-6 rounded-lg px-2.5 font-bold bg-slate-50 text-slate-400 border border-slate-100 text-[9px] tabular-nums">{cart.length} items</Badge>
          </div>

          <Field className="px-1">
            <FieldContent className="hidden"><FieldLabel>Nama Pelanggan</FieldLabel></FieldContent>
            <div className="relative">
              <UserCircle className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", isNameError ? "text-red-400" : "text-slate-300")} />
              <Input
                placeholder="Nama pelanggan..."
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (e.target.value.trim()) setIsNameError(false);
                }}
                className={cn("pl-10 h-10 text-xs font-bold rounded-xl border-none focus-visible:ring-1 transition-all", isNameError ? "bg-red-50 focus-visible:ring-red-200 placeholder:text-red-300" : "bg-slate-50 focus-visible:ring-slate-200")}
              />
            </div>
          </Field>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/10 px-8 py-6 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200 px-8 text-center py-20 grayscale opacity-40">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm"><ShoppingCart className="w-6 h-6" /></div>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Menunggu Pesanan...</p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <Card key={item.id} className="shadow-none border-slate-50 bg-white rounded-xl group hover:border-slate-200 transition-colors border overflow-hidden">
                  <CardContent className="p-3 flex gap-4 items-center justify-between">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-50 relative">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 opacity-20"><Coffee className="w-3.5 h-3.5 text-slate-900" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-[11px] font-bold text-slate-900 truncate tracking-tight leading-none mb-1">{item.name}</p>
                      <p className="text-[9px] font-mono font-bold text-slate-400 tracking-widest tabular-nums opacity-60">IDR {item.price.toLocaleString("id-ID")}</p>
                      {editingNoteId === item.id ? (
                        <Input
                          autoFocus
                          className="h-7 text-[10px] mt-2 border-slate-100 px-2 rounded-lg bg-slate-50/10 focus-visible:ring-slate-200"
                          placeholder="Note..."
                          onBlur={() => setEditingNoteId(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingNoteId(null)}
                          value={item.note || ""}
                          onChange={(e) => updateNote(item.id, e.target.value)}
                        />
                      ) : item.note ? (
                        <div className="mt-1.5 flex items-center gap-2 group/note">
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] leading-tight">{item.note}</p>
                          <button onClick={() => setEditingNoteId(item.id)} className="opacity-0 group-hover/note:opacity-100 transition-opacity"><PencilLine className="w-2.5 h-2.5 text-slate-300 hover:text-slate-900" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingNoteId(item.id)} className="text-[9px] font-bold text-slate-300 hover:text-slate-400 mt-2 flex items-center gap-1 transition-colors uppercase tracking-[0.15em]"><Plus className="w-2 h-2" /> Note</button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-lg border border-slate-100 shadow-sm shrink-0 w-[72px] justify-between h-8">
                      <button className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-white transition-colors" onClick={() => updateQuantity(item.id, -1)}><Minus className="w-2 h-2" /></button>
                      <span className="text-[10px] font-mono font-black tabular-nums min-w-[16px] text-center">{item.quantity}</span>
                      <button className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-white transition-colors" onClick={() => updateQuantity(item.id, 1)}><Plus className="w-2 h-2" /></button>
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" onClick={() => removeFromCart(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </CardContent>
                </Card>
              ))}
              <div className="pb-10" />
            </>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 space-y-6 pb-10 shrink-0 sticky bottom-0 z-20 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
          <div className="space-y-3 px-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 leading-none">
              <span>Ringkasan</span>
              <span className="flex items-center gap-1.5 text-emerald-500 lowercase tracking-tight font-black">verified safety</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold text-slate-900 tracking-tighter">
              <span className="text-sm font-medium opacity-60 tracking-tighter uppercase">Total pembayaran</span>
              <span className="font-mono tabular-nums text-2xl">{cartTotal.toLocaleString("id-ID")}<span className="text-[11px] font-mono font-black text-slate-500 ml-1 not-italic"> IDR</span></span>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={cart.length === 0 || isCheckingOut} className="w-full h-14 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-4 group active:scale-95 shadow-slate-900/20">
                {isCheckingOut ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Konfirmasi pesanan"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-none shadow-3xl p-8">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold text-slate-900 font-sans tracking-tight">Konfirmasi transaksi?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium text-slate-400 leading-relaxed pt-2">Lanjutkan proses pembayaran untuk pesanan <span className="font-bold text-slate-900 font-serif">&quot;{customerName}&quot;</span> sejumlah <span className="font-bold text-slate-900">IDR {cartTotal.toLocaleString("id-ID")}</span>?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 gap-3">
                <AlertDialogCancel className="h-12 rounded-xl flex-1 border-slate-100 font-bold text-slate-500">Batalkan</AlertDialogCancel>
                <AlertDialogAction onClick={handleCheckout} className="h-12 rounded-xl flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-900/10">Ya, proses pesanan</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
