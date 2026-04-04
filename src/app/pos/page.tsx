"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  Search,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { updateStock } from "@/lib/inventory";
import { setupSeedData } from "@/lib/setup-db";
import { cn } from "@/lib/utils";

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch products on mount
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, searchQuery]);

  // Cart logic
  const addToCart = (product: Product) => {
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
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
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

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Checkout logic
  // Perbaikan Final pada handleCheckout (src/app/pos/page.tsx)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setNotification(null);

    try {
      // 1. Insert ke tabel 'transactions' sesuai Payload yang Anda minta
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert([
          {
            total_price: cartTotal,
            payment_method: "Cash",
          },
        ])
        .select()
        .single();

      if (txError) {
        console.error("Payload Transactions Error:", txError);
        throw new Error(`Gagal menyimpan transaksi: ${txError.message}`);
      }

      // 2. Loop untuk simpan detail item & jalankan pengurangan stok secara atomik
      for (const item of cart) {
        // Validasi kolom: subtotal, quantity, product_id, transaction_id
        const { error: itemError } = await supabase
          .from("transaction_items")
          .insert([
            {
              transaction_id: transaction.id,
              product_id: item.id,
              quantity: item.quantity,
              subtotal: item.price * item.quantity,
            },
          ]);

        if (itemError) {
          console.error("Payload Transaction Items Error:", itemError);
          throw new Error(`Gagal menyimpan item detail ${item.name}`);
        }

        // 3. Panggil RPC untuk update stok bahan baku berdasarkan resep
        const stockResult = await updateStock(item.id, item.quantity);
        if (!stockResult.success) {
          throw new Error(stockResult.error);
        }
      }

      setNotification({
        type: "success",
        message: "Transaksi Berhasil Masuk Database!",
      });
      setCart([]);
    } catch (error: any) {
      console.error("--- DEBUG CHECKOUT ---");
      console.error(error);
      setNotification({
        type: "error",
        message:
          error.message || "Error 400: Cek struktur tabel dan payload anda.",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const res = await setupSeedData();
    if (res.success) {
      setNotification({
        type: "success",
        message: "Seed data berhasil dimasukkan!",
      });
      // Reload products
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (!error) setProducts(data || []);
    } else {
      setNotification({ type: "error", message: res.error || "Seed gagal" });
    }
    setIsSeeding(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* LEFT: Product List */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Kopi Kasir POS</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari menu..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 lg:pb-0">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="group flex flex-col bg-white border border-neutral-200 rounded-2xl p-4 text-left hover:shadow-xl hover:border-amber-200 transition-all active:scale-95 touch-manipulation"
              >
                <div className="h-32 bg-neutral-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-neutral-300 font-medium">
                      No Image
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-amber-700">
                  {product.name}
                </h3>
                <p className="text-amber-600 font-bold mt-1 text-sm">
                  Rp {product.price.toLocaleString("id-ID")}
                </p>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-10 text-center text-neutral-500">
                Menu tidak ditemukan.
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Cart */}
      <div className="w-full lg:w-96 bg-white border-l border-neutral-200 flex flex-col shadow-2xl z-10 lg:static fixed bottom-0 lg:h-full h-[60vh] rounded-t-3xl lg:rounded-none">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold">Keranjang</h2>
          </div>
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">
            {cart.length} Pesanan
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-3 items-center group">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-neutral-500">
                  Rp {item.price.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-neutral-50 p-1 rounded-lg">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-bold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="w-8 h-8 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-10">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Silakan pilih menu</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-neutral-50 lg:bg-white border-t border-neutral-100 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-amber-700">
              Rp {cartTotal.toLocaleString("id-ID")}
            </span>
          </div>

          <button
            disabled={cart.length === 0 || isCheckingOut}
            onClick={handleCheckout}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2",
              cart.length === 0
                ? "bg-neutral-300"
                : "bg-amber-600 hover:bg-amber-700 active:scale-[0.98] shadow-lg shadow-amber-200",
            )}
          >
            {isCheckingOut ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-b-transparent rounded-full" />
                Processing...
              </div>
            ) : (
              "Bayar Sekarang"
            )}
          </button>
        </div>
      </div>

      {/* Secret Seed Button (Development Only) */}
      <button
        onClick={handleSeed}
        disabled={isSeeding}
        title="Seed Database Data"
        className="fixed bottom-6 left-6 w-12 h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-2xl transition-all z-[9999] flex items-center justify-center animate-bounce hover:animate-none"
      >
        {isSeeding ? (
          <div className="animate-spin w-4 h-4 border-2 border-white border-b-transparent rounded-full" />
        ) : (
          <div className="flex flex-col items-center">
            <Plus className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase">Seed</span>
          </div>
        )}
      </button>

      {/* Notifications */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
          <div
            className={cn(
              "px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-medium",
              notification.type === "success" ? "bg-emerald-600" : "bg-red-600",
            )}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {notification.message}
            <button
              onClick={() => setNotification(null)}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
