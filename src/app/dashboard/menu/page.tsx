'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Filter,
  Coffee,
  PackageX
} from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const CATEGORIES = ["Coffee", "Non-Coffee", "Snack", "Additional"]

export default function MenuManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  
  // MODAL STATES
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [targetProduct, setTargetProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // FORM DATA
  const [formData, setFormData] = useState({
    name: '',
    category: 'Coffee',
    price: '',
    description: '',
    image_url: ''
  })

  // 1. Fetching Products
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Fetch Menu Error:', err)
      toast.error('Gagal memuat katalog menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // 2. Filtered List
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCat = selectedCategory === "Semua" || p.category === selectedCategory
      return matchSearch && matchCat
    })
  }, [products, searchQuery, selectedCategory])

  // 3. Handle Add/Edit Open
  const openForm = (product?: Product) => {
    if (product) {
      setTargetProduct(product)
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        description: product.description || '',
        image_url: product.image_url || ''
      })
    } else {
      setTargetProduct(null)
      setFormData({
        name: '',
        category: 'Coffee',
        price: '',
        description: '',
        image_url: ''
      })
    }
    setIsFormOpen(true)
  }

  // 4. Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price || isSubmitting) return
    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price),
        description: formData.description,
        image_url: formData.image_url,
        is_active: true
      }

      if (targetProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', targetProduct.id)
        if (error) throw error
        toast.success(`Menu "${formData.name}" berhasil diperbarui.`)
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload])
        if (error) throw error
        toast.success(`Menu "${formData.name}" berhasil ditambahkan.`)
      }

      setIsFormOpen(false)
      fetchProducts()
    } catch (err) {
      toast.error(`Aksi gagal. Silakan coba lagi.`)
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. Handle Delete
  const handleDelete = async () => {
    if (!targetProduct || isSubmitting) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', targetProduct.id)
      if (error) throw error
      toast.success(`Menu telah dihapus dari sistem.`)
      setIsDeleteOpen(false)
      fetchProducts()
    } catch {
      toast.error('Gagal menghapus menu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper
  const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 space-y-8 font-sans">
      
      {/* 1. Header: Administrative Authority */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
           <Badge variant="secondary" className="w-fit bg-emerald-50 text-emerald-600 font-bold tracking-widest uppercase text-[9px] px-3 py-1 rounded-md mb-2 border-emerald-100/50">
             Portal Manajemen Menu
           </Badge>
           <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Pengelolaan Katalog Menu</h1>
           <p className="text-xs font-medium text-slate-400 mt-2">Atur harga, kategori, dan detail produk Code & Coffee.</p>
        </div>
        <Button 
          onClick={() => openForm()}
          className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-900/10 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" /> Tambah Menu Baru
        </Button>
      </header>

      {/* 2. Controls: Filtering Infrastructure - Symmetrized */}
      <div className="flex items-center gap-3">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 z-10" />
            <Input 
              placeholder="Cari nama menu..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-11 pl-11 rounded-xl bg-white border-slate-200 shadow-none focus-visible:ring-slate-100 font-medium w-full"
            />
         </div>
         <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-11 w-[200px] rounded-xl bg-white border-slate-200 shadow-none font-semibold flex items-center">
               <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-300" />
                  <SelectValue placeholder="Semua Kategori" />
               </div>
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl">
               <SelectItem value="Semua" className="font-semibold">Semua Kategori</SelectItem>
               {CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="font-semibold">{cat}</SelectItem>)}
            </SelectContent>
         </Select>
      </div>

      {/* 3. Main Data: Product Registry */}
      <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <Table>
               <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                     <TableHead className="w-12 px-6 h-11"></TableHead>
                     <TableHead className="px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Identitas produk</TableHead>
                     <TableHead className="px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Kategori</TableHead>
                     <TableHead className="px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Harga jual</TableHead>
                     <TableHead className="text-right px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Aksi</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                    <TableRow>
                       <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                             <Loader2 className="w-8 h-8 animate-spin" />
                             <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Sinkronisasi Katalog...</p>
                          </div>
                       </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-200 grayscale opacity-40">
                             <PackageX className="w-12 h-12" />
                             <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Produk tidak ditemukan</p>
                          </div>
                       </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map(product => (
                      <TableRow key={product.id} className="group border-slate-50 transition-colors hover:bg-slate-50/30">
                        <TableCell className="px-6">
                           <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden relative border border-slate-100">
                              {product.image_url ? (
                                 <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center opacity-20"><Coffee className="w-5 h-5" /></div>
                              )}
                           </div>
                        </TableCell>
                        <TableCell className="px-6">
                           <p className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1">{toTitleCase(product.name)}</p>
                           <p className="text-[10px] font-medium text-slate-400 line-clamp-1 max-w-[200px]">{product.description || 'No description provided'}</p>
                        </TableCell>
                        <TableCell className="px-6">
                           <Badge variant="outline" className="text-[10px] font-bold rounded-md bg-slate-50 px-2.5 h-6 border-slate-100 text-slate-400 uppercase tracking-tighter">
                              {product.category}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono font-bold text-slate-900 tabular-nums px-6 text-left">
                           {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell className="px-6 text-right">
                           <div className="flex justify-end gap-2">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-9 w-9 rounded-lg hover:bg-white hover:text-slate-900 hover:shadow-sm"
                                 onClick={() => openForm(product)}
                               >
                                  <Edit2 className="w-4 h-4" />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-500"
                                 onClick={() => { setTargetProduct(product); setIsDeleteOpen(true); }}
                               >
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </div>
                         </TableCell>
                      </TableRow>
                    ))
                  )}
               </TableBody>
            </Table>
         </div>
      </div>

      {/* 4. MODALS: Form & Safety */}
      
      {/* Form Modal: Add/Edit */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-3xl rounded-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 space-y-1 shrink-0">
             <DialogTitle className="text-lg font-bold text-slate-900">
               {targetProduct ? 'Modifikasi detail menu' : 'Tambah menu baru'}
             </DialogTitle>
             <DialogDescription className="text-[11px] font-medium text-slate-400 tracking-tight leading-relaxed">
               Lengkapi informasi produk Code & Coffee dengan akurat untuk tampilan di katalog.
             </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="p-6 bg-white overflow-y-auto scrollbar-hide flex-1">
             <FieldGroup>
               <Field>
                  <FieldLabel>Nama Produk</FieldLabel>
                  <Input 
                    placeholder="Contoh: Matcha Latte hot"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus-visible:ring-slate-100 font-bold"
                    required
                  />
               </Field>
               
               <div className="grid grid-cols-2 gap-5">
                  <Field>
                     <FieldLabel>Kategori</FieldLabel>
                     <FieldDescription>Tentukan penempatan menu di katalog kasir.</FieldDescription>
                     <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/30 font-bold focus:ring-slate-100">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="item-aligned" className="rounded-xl">
                           <SelectGroup>
                             {CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>)}
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </Field>
                  <Field>
                     <FieldLabel>Harga (IDR)</FieldLabel>
                     <Input 
                       type="number"
                       placeholder="25000"
                       value={formData.price}
                       onChange={e => setFormData({...formData, price: e.target.value})}
                       className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus-visible:ring-slate-100 font-mono font-bold tabular-nums"
                       required
                     />
                  </Field>
               </div>

               <Field>
                  <FieldLabel>Deskripsi Singkat</FieldLabel>
                  <Textarea 
                    placeholder="Tuliskan komposisi atau keunggulan menu..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="rounded-xl border-slate-100 bg-slate-50/30 focus-visible:ring-slate-100 font-medium min-h-[80px]"
                  />
               </Field>

               <Field>
                  <FieldLabel>URL Gambar Produk</FieldLabel>
                  <Input 
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/30 focus-visible:ring-slate-100 font-medium"
                  />
               </Field>
             </FieldGroup>
          </form>

          <DialogFooter className="p-6 bg-white border-t border-slate-50 shrink-0">
             <Button 
               onClick={handleSave}
               disabled={isSubmitting}
               className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-2xl shadow-slate-900/10 transition-all active:scale-95"
             >
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : targetProduct ? 'Perbarui detail menu' : 'Simpan produk baru'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-3xl border-none shadow-3xl p-8">
          <AlertDialogHeader>
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-red-50/50">
               <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Hapus menu ini?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-400 leading-relaxed pt-2">
              Tindakan ini tidak dapat dibatalkan. Menu <span className="font-bold text-slate-900 font-serif">&quot;{targetProduct?.name}&quot;</span> akan dihapus selamanya dari katalog operasional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl flex-1 border-slate-100 font-bold text-slate-500">Batalkan</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e: React.MouseEvent) => { e.preventDefault(); handleDelete(); }}
              disabled={isSubmitting}
              className="h-12 rounded-xl flex-1 bg-red-600 hover:bg-red-700 text-white font-bold shadow-xl shadow-red-600/10"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, hapus menu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
