"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Trash2,
  Plus,
  Box,
  BookOpen,
  Edit2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Ingredient } from "@/types/database";
import {
  calculateInventoryPredictions,
} from "@/lib/prediction";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
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

export default function StokOpnamePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [predictions, setPredictions] = useState<
    Record<string, { daily_average: number, days_left: number | 'unknown' | 'calculating' }>
  >({});
  
  // MODAL STATES
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [targetIngredientId, setTargetIngredientId] = useState("");
  const [amount, setAmount] = useState("");
  const [wasteReason, setWasteReason] = useState("Susu Tumpah");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ADD NEW INGREDIENT STATE
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    unit: "gram",
    current_stock: "",
    minimum_stock_alert: "",
    ideal_stock: ""
  });

  // EDIT STATE
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // BULK SELECTION STATE
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);

  const fetchData = async () => {
    try {
      const { data: ings } = await supabase
        .from("ingredients")
        .select("*")
        .order("name");
      const ingredientsData = ings || [];
      setIngredients(ingredientsData);

      const preds = await calculateInventoryPredictions(ingredientsData);
      setPredictions(preds);
    } catch (err) {
      console.error("Fetch Stok Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("stok-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingredients" },
        () => fetchData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name || !newIngredient.current_stock || !newIngredient.minimum_stock_alert || !newIngredient.ideal_stock) {
      toast.error("Mohon lengkapi semua data bahan baku!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("ingredients")
        .insert([
          {
            name: newIngredient.name,
            unit: newIngredient.unit,
            current_stock: Number(newIngredient.current_stock),
            minimum_stock_alert: Number(newIngredient.minimum_stock_alert),
            ideal_stock: Number(newIngredient.ideal_stock),
          },
        ]);

      if (error) throw error;

      toast.success(`Bahan baku [${newIngredient.name}] berhasil ditambahkan`);
      setIsAddIngredientModalOpen(false);
      setNewIngredient({
        name: "",
        unit: "gram",
        current_stock: "",
        minimum_stock_alert: "",
        ideal_stock: ""
      });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan bahan baku");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("ingredients")
        .update({
          name: editingIngredient.name,
          unit: editingIngredient.unit,
          current_stock: Number(editingIngredient.current_stock),
          minimum_stock_alert: Number(editingIngredient.minimum_stock_alert),
          ideal_stock: Number(editingIngredient.ideal_stock),
        })
        .eq("id", editingIngredient.id);

      if (error) throw error;

      toast.success(`Informasi [${editingIngredient.name}] berhasil diperbarui`);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === ingredients.length && ingredients.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(ingredients.map(ing => ing.id));
    }
  };

  const toggleSelectRow = (id: string | number) => {
    const stringId = String(id);
    if (selectedRows.includes(stringId)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== stringId));
    } else {
      setSelectedRows([...selectedRows, stringId]);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success(`Bahan baku [${name}] berhasil dihapus`);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedRows.length || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .in('id', selectedRows);
      if (error) throw error;
      toast.success(`Berhasil menghapus ${selectedRows.length} bahan baku`);
      setSelectedRows([]);
      setIsBulkDeleteAlertOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus data masal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockUpdate = async (e: React.FormEvent, type: "Restock" | "Waste") => {
    e.preventDefault();
    if (!targetIngredientId || !amount || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const ingredient = ingredients.find((i) => i.id === targetIngredientId);
      if (!ingredient) throw new Error("Bahan tidak ditemukan");

      const amountNum = parseFloat(amount);
      const changeAmount = type === "Restock" ? amountNum : -amountNum;
      const finalReason = type === "Restock" ? "Restock" : `Waste: ${wasteReason}`;

      const { error: updateError } = await supabase
        .from("ingredients")
        .update({
          current_stock: Number(ingredient.current_stock) + changeAmount,
        })
        .eq("id", targetIngredientId);
      if (updateError) throw updateError;

      const { error: logError } = await supabase.from("inventory_logs").insert({
        ingredient_id: targetIngredientId,
        change_amount: changeAmount,
        reason: finalReason,
      });
      if (logError) throw logError;

      setIsStockInModalOpen(false);
      setIsWasteModalOpen(false);
      setAmount("");
      setTargetIngredientId("");
      fetchData();

      toast.success(type === "Restock" ? "Stok masuk berhasil dicatat!" : "Kerugian stok berhasil dicatatkan!");
    } catch (err: unknown) {
      toast.error(`Gagal mencatat perubahan stok: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (ing: Ingredient, daysLeft: number | "unknown" | "calculating") => {
    if (Number(ing.current_stock) <= Number(ing.minimum_stock_alert)) {
      return <Badge variant="destructive" className="text-[11px] font-bold rounded-md px-2.5 py-0.5 shadow-sm shadow-red-500/20">Kritis</Badge>;
    }
    if (daysLeft === "unknown" || daysLeft === "calculating")
      return <Badge variant="secondary" className="text-[10px] font-medium rounded-md px-2.5 py-1 bg-stone-50 border-stone-100 text-stone-400">{daysLeft === 'calculating' ? 'Menghitung...' : 'Data minim'}</Badge>;
    const days = Number(daysLeft);
    if (days <= 7) return <Badge className="text-[11px] bg-amber-50 text-amber-600 hover:bg-amber-50 border-amber-200 rounded-md px-2.5 py-0.5 shadow-sm shadow-amber-500/5">Waspada</Badge>;
    return <Badge className="text-[11px] bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-emerald-200 rounded-md px-2.5 py-0.5 shadow-sm shadow-emerald-500/5">Aman</Badge>;
  };

  return (
    <div className="min-h-screen bg-stone-50/50 p-6 md:p-10 space-y-8 font-sans">
       {/* Sidebar Logic Header */}
       <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
             <h1 className="text-2xl font-black tracking-tight text-stone-900 leading-none">Stok & Opname</h1>
             <p className="text-xs font-medium text-stone-400 mt-2">Manajemen persediaan bahan baku dan audit digital.</p>
          </div>
       </header>

       {/* Bulk Action Toolbar */}
       {selectedRows.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Item Terpilih</span>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-full h-6 w-6 flex items-center justify-center p-0 text-[10px] font-black">{selectedRows.length}</Badge>
             </div>
             <div className="flex items-center gap-4">
                 <Button 
                   variant="ghost"
                   onClick={() => setSelectedRows([])}
                   className="h-10 px-4 text-xs font-bold text-stone-400 hover:text-white hover:bg-white/5 transition-all"
                 >
                   Batalkan pilihan
                 </Button>
               
                 <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="h-10 px-6 rounded-full text-xs font-bold active:scale-95 transition-all">
                       Hapus bahan baku ({selectedRows.length}) <Trash2 className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8">
                     <AlertDialogHeader>
                        <AlertDialogTitle className="text-sm font-bold text-stone-900 font-sans tracking-tight">Hapus bahan baku terpilih?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[11px] leading-relaxed text-stone-400 font-medium font-sans mt-2">
                           Tindakan ini tidak bisa dibatalkan. Sebanyak {selectedRows.length} bahan baku akan dihapus permanen dari sistem.
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="h-11 rounded-lg text-xs font-bold border-stone-100">Batalkan</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} className="h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold border-none">
                           {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Ya, hapus pilihan"}
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
       )}

      <div className="rounded-xl border border-stone-200/60 bg-white overflow-hidden shadow-sm">
         <header className="p-6 border-b border-stone-50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
               <div className="text-base font-bold flex items-center gap-3 text-stone-900 leading-none">
                  <Box className="w-4 h-4 text-stone-400" /> Pengelolaan stok bahan baku
               </div>
               <div className="text-[10px] text-stone-400 mt-2 font-medium tracking-widest uppercase opacity-60">Wawasan stok digital</div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/dashboard/recipes">
                <Button variant="outline" className="h-9 px-4 rounded-lg text-xs font-bold border-stone-100 hover:bg-stone-50 text-stone-500 shadow-sm">
                   <BookOpen className="w-3.5 h-3.5 mr-2 text-stone-400" /> Atur resep
                </Button>
              </Link>
              <div className="w-px h-6 bg-stone-100" />

              <Dialog open={isAddIngredientModalOpen} onOpenChange={setIsAddIngredientModalOpen}>
                 <DialogTrigger asChild>
                   <Button variant="outline" className="h-9 px-4 rounded-lg text-xs font-bold border-stone-100 hover:bg-stone-50 text-stone-900 shadow-sm">
                     <Plus className="w-3.5 h-3.5 mr-2" /> Tambah bahan baru
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                   <DialogHeader className="p-6 bg-stone-50 border-b border-stone-100">
                     <DialogTitle className="text-sm font-bold text-stone-900 font-sans tracking-tight">Registrasi master bahan baku</DialogTitle>
                     <DialogDescription className="text-[10px] text-stone-400 font-medium tracking-tight opacity-60 mt-1">Daftarkan jenis bahan baku baru.</DialogDescription>
                  </DialogHeader>
                   <form onSubmit={handleCreateIngredient} className="p-8">
                     <FieldGroup>
                        <Field>
                           <FieldContent>
                             <FieldLabel>Nama bahan</FieldLabel>
                             <FieldDescription>Identitas unik bahan baku di sistem</FieldDescription>
                           </FieldContent>
                           <Input placeholder="Susu UHT" value={newIngredient.name} onChange={e => setNewIngredient({...newIngredient, name: e.target.value})} className="h-11" />
                        </Field>

                        <Field>
                           <FieldContent>
                             <FieldLabel>Satuan</FieldLabel>
                             <FieldDescription>Gunakan gram untuk padat, ml untuk cair, pcs untuk satuan.</FieldDescription>
                           </FieldContent>
                           <Select value={newIngredient.unit} onValueChange={val => setNewIngredient({...newIngredient, unit: val})}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent position="item-aligned" className="rounded-xl">
                                   <SelectGroup>
                                      <SelectItem value="gram">gram (gr)</SelectItem>
                                      <SelectItem value="ml">miliLiter (ml)</SelectItem>
                                      <SelectItem value="pcs">pieces (pcs)</SelectItem>
                                   </SelectGroup>
                                </SelectContent>
                             </Select>
                        </Field>

                        <Field orientation="horizontal">
                           <FieldContent>
                             <FieldLabel>Stok awal</FieldLabel>
                             <FieldDescription>Saldo pembukaan gudang</FieldDescription>
                           </FieldContent>
                           <Input type="number" placeholder="0" value={newIngredient.current_stock} onChange={e => setNewIngredient({...newIngredient, current_stock: e.target.value})} className="w-32 h-11 font-mono" />
                        </Field>

                        <div className="grid grid-cols-2 gap-6">
                          <Field>
                             <FieldLabel className="text-red-400">Min alert</FieldLabel>
                             <Input type="number" placeholder="Batas" value={newIngredient.minimum_stock_alert} onChange={e => setNewIngredient({...newIngredient, minimum_stock_alert: e.target.value})} className="h-11 font-mono" />
                          </Field>
                          <Field>
                             <FieldLabel>Stok ideal</FieldLabel>
                             <Input type="number" placeholder="Aman" value={newIngredient.ideal_stock} onChange={e => setNewIngredient({...newIngredient, ideal_stock: e.target.value})} className="h-11 font-mono" />
                          </Field>
                        </div>
                     </FieldGroup>
                     <DialogFooter className="mt-8">
                        <Button type="submit" className="w-full h-12 bg-stone-900 text-white font-bold" disabled={isSubmitting}>
                           {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : "Daftarkan ke gudang utama"}
                        </Button>
                     </DialogFooter>
                   </form>
                 </DialogContent>
              </Dialog>

              <div className="h-6 w-px bg-stone-100" />
              <Dialog open={isWasteModalOpen} onOpenChange={setIsWasteModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-9 px-4 rounded-lg text-xs font-bold border-stone-200 text-stone-600 hover:bg-stone-50" onClick={() => setTargetIngredientId(ingredients[0]?.id || "")}>
                     <Trash2 className="w-3.5 h-3.5 mr-2" /> Waste
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-xl p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-6 bg-stone-50 border-b border-stone-100">
                     <DialogTitle className="text-sm font-bold text-stone-900 font-sans tracking-tight">Input data waste</DialogTitle>
                  </DialogHeader>
                   <form onSubmit={(e) => handleStockUpdate(e, "Waste")} className="p-6">
                      <FieldGroup>
                        <Field>
                          <FieldLabel>Bahan baku</FieldLabel>
                          <Select value={targetIngredientId} onValueChange={setTargetIngredientId}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Pilih bahan..." /></SelectTrigger>
                            <SelectContent position="item-aligned" className="rounded-xl">
                              <SelectGroup>
                                {ingredients.map(ing => <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>)}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel>Jumlah</FieldLabel>
                            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="h-11 font-mono font-bold" />
                          </Field>
                          <Field>
                            <FieldLabel>Alasan</FieldLabel>
                            <Select value={wasteReason} onValueChange={setWasteReason}>
                               <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                               <SelectContent position="item-aligned" className="rounded-xl">
                                 <SelectGroup>
                                   <SelectItem value="Susu Tumpah">Susu Tumpah</SelectItem>
                                   <SelectItem value="Salah Kalibrasi">Salah Kalibrasi</SelectItem>
                                   <SelectItem value="Gagal Operasional">Gagal Operasional</SelectItem>
                                   <SelectItem value="Expired / Basi">Expired / Basi</SelectItem>
                                 </SelectGroup>
                              </SelectContent>
                           </Select>
                         </Field>
                      </div>
                    </FieldGroup>
                    <DialogFooter className="mt-8">
                       <Button type="submit" variant="destructive" className="w-full h-12" disabled={isSubmitting}>
                          {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Simpan data waste"}
                       </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isStockInModalOpen} onOpenChange={setIsStockInModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="h-9 px-4 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-stone-800" onClick={() => setTargetIngredientId(ingredients[0]?.id || "")}>
                     <Plus className="w-3.5 h-3.5 mr-2" /> Stock in
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-xl p-0 overflow-hidden border-none shadow-2xl">
                   <DialogHeader className="p-6 bg-stone-50 border-b border-stone-100">
                     <DialogTitle className="text-sm font-bold text-stone-900 font-sans tracking-tight">Portal stok masuk</DialogTitle>
                   </DialogHeader>
                    <form onSubmit={(e) => handleStockUpdate(e, "Restock")} className="p-6">
                      <FieldGroup>
                        <Field>
                          <FieldLabel>Pilih bahan baku</FieldLabel>
                          <Select value={targetIngredientId} onValueChange={setTargetIngredientId}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Pilih bahan..." /></SelectTrigger>
                            <SelectContent position="item-aligned" className="rounded-xl">
                              <SelectGroup>
                                {ingredients.map(ing => <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>)}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Jumlah masuk</FieldLabel>
                          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="h-11 font-mono font-bold" />
                        </Field>
                      </FieldGroup>
                      <DialogFooter className="mt-8">
                         <Button type="submit" className="w-full h-12 bg-stone-900 text-white" disabled={isSubmitting}>
                            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Simpan stok masuk"}
                         </Button>
                      </DialogFooter>
                    </form>
                </DialogContent>
              </Dialog>
           </div>
         </header>
         
         <div className="overflow-x-auto">
            <Table>
               <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent border-stone-100">
                  <TableHead className="w-12 px-6 h-11 text-slate-500">
                     <Checkbox checked={selectedRows.length === ingredients.length && ingredients.length > 0} onCheckedChange={toggleSelectAll} className="border-stone-200 border-2" />
                  </TableHead>
                  <TableHead className="px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Bahan baku</TableHead>
                  <TableHead className="px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Persediaan digital</TableHead>
                  <TableHead className="px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Penggunaan / hari</TableHead>
                  <TableHead className="px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Status operasional</TableHead>
                  <TableHead className="text-right px-6 h-11 text-xs font-semibold text-slate-500 align-middle">Aksi</TableHead>
                </TableRow>
              </TableHeader>
             <TableBody>
                {ingredients.map((ing) => {
                  const pred = predictions[ing.id];
                  const daysLeft = pred?.days_left ?? "unknown";
                  const isSelected = selectedRows.includes(String(ing.id));
                  
                  return (
                    <TableRow key={ing.id} className={cn("hover:bg-stone-50/30 transition-all border-stone-50 h-16 group", isSelected && "bg-stone-50/50")}>
                       <TableCell className="px-6">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectRow(ing.id)} className="border-stone-200 border-2" />
                       </TableCell>
                       <TableCell className="px-6">
                           <div className="flex flex-col text-left">
                              <span className="text-sm font-bold text-stone-900 tracking-tight leading-none mb-1.5">{ing.name}</span>
                              <span className="text-[10px] font-mono text-stone-400 leading-none">{ing.unit}</span>
                           </div>
                       </TableCell>
                       <TableCell className="min-w-[200px] px-6">
                          <div className="flex items-center gap-3">
                              <div className="flex-1">
                                 <Progress value={Math.min(100, (Number(ing.current_stock) / Number(ing.ideal_stock)) * 100)} className={cn("h-1.5", Number(ing.current_stock) <= Number(ing.minimum_stock_alert) && "[&>div]:bg-red-500")} />
                              </div>
                              <span className={cn("text-[11px] font-mono font-bold tabular-nums w-24 text-left", (Number(ing.current_stock) <= Number(ing.minimum_stock_alert) || Number(ing.current_stock) < 0) ? "text-red-600" : "text-stone-900")}>
                                 {Number(ing.current_stock).toLocaleString('id-ID')}
                              </span>
                          </div>
                       </TableCell>
                       <TableCell className="text-[11px] font-mono font-bold text-stone-500 tabular-nums opacity-80 px-6">
                          {pred?.daily_average.toFixed(1)} <span className="text-[9px] font-medium opacity-40 ml-1 leading-none">{ing.unit} / hari</span>
                       </TableCell>
                       <TableCell className="text-left px-6">
                          {getStatusBadge(ing, daysLeft)}
                       </TableCell>
                        <TableCell className="px-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition-all"
                               onClick={() => {
                                 setEditingIngredient(ing);
                                 setIsEditModalOpen(true);
                               }}
                             >
                                <Edit2 className="w-3.5 h-3.5" />
                             </Button>

                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                      <Trash2 className="w-3.5 h-3.5" />
                                   </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8">
                                   <AlertDialogHeader>
                                      <AlertDialogTitle className="text-sm font-bold text-stone-900 font-sans tracking-tight">Hapus bahan baku?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-[11px] leading-relaxed text-stone-400 font-medium font-sans">
                                         Tindakan ini tidak bisa dibatalkan. Stok bahan <span className="font-bold text-stone-900">{ing.name}</span> akan dihapus permanen dari sistem.
                                      </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter className="mt-4 gap-2">
                                      <AlertDialogCancel className="h-11 rounded-lg text-xs font-bold border-stone-100">Batalkan</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteItem(ing.id, ing.name)} 
                                        className="h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold border-none"
                                      >
                                         {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : "Ya, hapus"}
                                      </AlertDialogAction>
                                   </AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                           </div>
                        </TableCell>
                     </TableRow>
                  )
                })}
             </TableBody>
           </Table>
         </div>
       </div>

       {/* EDIT MODAL INFRASTRUCTURE */}
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-stone-50 border-b border-stone-100">
              <DialogTitle className="text-sm font-bold text-stone-900 font-sans tracking-tight">Update Data Master Bahan</DialogTitle>
              <DialogDescription className="text-[10px] text-stone-400 font-medium tracking-tight opacity-60 mt-1">Perbarui parameter teknis untuk {editingIngredient?.name}.</DialogDescription>
            </DialogHeader>
            {editingIngredient && (
              <form onSubmit={handleUpdateIngredient} className="p-8">
                <FieldGroup>
                   <Field>
                      <FieldContent>
                        <FieldLabel>Nama Bahan</FieldLabel>
                        <FieldDescription>Ubah identitas label bahan baku</FieldDescription>
                      </FieldContent>
                      <Input value={editingIngredient.name} onChange={e => setEditingIngredient({...editingIngredient, name: e.target.value})} className="h-11 font-bold" />
                   </Field>

                   <Field>
                      <FieldContent>
                        <FieldLabel>Satuan</FieldLabel>
                        <FieldDescription>Konsistensi unit pengukuran sangat krusial.</FieldDescription>
                      </FieldContent>
                      <Select value={editingIngredient.unit} onValueChange={val => setEditingIngredient({...editingIngredient, unit: val})}>
                          <SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent position="item-aligned" className="rounded-xl">
                             <SelectGroup>
                                <SelectItem value="gram">gram (gr)</SelectItem>
                                <SelectItem value="ml">miliLiter (ml)</SelectItem>
                                <SelectItem value="pcs">pieces (pcs)</SelectItem>
                             </SelectGroup>
                          </SelectContent>
                       </Select>
                   </Field>

                   <Field orientation="horizontal">
                      <FieldContent>
                        <FieldLabel>Koreksi Stok</FieldLabel>
                        <FieldDescription>Hanya ubah jika ada selisih audit fisik.</FieldDescription>
                      </FieldContent>
                      <Input type="number" value={editingIngredient.current_stock} onChange={e => setEditingIngredient({...editingIngredient, current_stock: Number(e.target.value)})} className="w-32 h-11 font-mono font-bold" />
                   </Field>

                   <div className="grid grid-cols-2 gap-6">
                     <Field>
                        <FieldLabel className="text-red-400">Min Alert</FieldLabel>
                        <Input type="number" value={editingIngredient.minimum_stock_alert} onChange={e => setEditingIngredient({...editingIngredient, minimum_stock_alert: Number(e.target.value)})} className="h-11 font-mono font-bold" />
                     </Field>
                     <Field>
                        <FieldLabel>Stok Ideal</FieldLabel>
                        <Input type="number" value={editingIngredient.ideal_stock} onChange={e => setEditingIngredient({...editingIngredient, ideal_stock: Number(e.target.value)})} className="h-11 font-mono font-bold" />
                     </Field>
                   </div>
                </FieldGroup>
                <DialogFooter className="mt-8">
                   <Button type="submit" className="w-full h-12 bg-stone-900 text-white font-bold" disabled={isSubmitting}>
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : "Simpan Perubahan Master"}
                   </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
       </Dialog>
    </div>
  );
}
