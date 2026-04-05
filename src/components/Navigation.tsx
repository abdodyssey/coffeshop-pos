'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Box, 
  History, 
  Store, 
  Menu as MenuIcon, 
  Coffee,
  ChevronRight,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { useSidebar } from '@/providers/SidebarProvider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const MENU_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Stok & Opname', icon: Box, href: '/dashboard/stok' },
  { label: 'Kelola Menu', icon: MenuIcon, href: '/dashboard/menu' },
  { label: 'Riwayat Transaksi', icon: History, href: '/dashboard/history' },
]

export function Navigation() {
  const pathname = usePathname()
  const { isCollapsed, toggle } = useSidebar()
  
  // Jangan tampilkan sidebar di halaman menu pelanggan, POS, atau Landing Page (Full Width)
  if (pathname?.startsWith('/menu') || pathname === '/pos' || pathname === '/') return null

  const NavItem = ({ item, isActive }: { item: typeof MENU_ITEMS[0], isActive: boolean }) => {
    const content = (
      <div className={cn(
        "group flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden",
        isActive 
          ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20" 
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-900",
        isCollapsed ? "justify-center px-0 w-12 h-12" : "justify-between"
      )}>
        <div className={cn("flex items-center z-10", isCollapsed ? "justify-center" : "gap-4")}>
          <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-slate-300 group-hover:text-slate-900")} />
          {!isCollapsed && <span className="text-sm font-semibold tracking-tight whitespace-nowrap">{item.label}</span>}
        </div>
        {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 text-white/40" />}
      </div>
    )

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href={item.href}>{content}</Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-900 text-white border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 ml-2">
            {item.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return <Link href={item.href}>{content}</Link>
  }

  const NavContent = (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      {/* Sidebar Header with Toggle */}
      <div className={cn("p-6 border-b border-slate-50 mb-6 flex items-center transition-all duration-300", isCollapsed ? "justify-center h-24" : "justify-between h-24")}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg shadow-lg shadow-slate-900/20">
               <Coffee className="w-4 h-4 text-slate-50" />
            </div>
            <div>
               <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">Code & Coffee</h1>
               <p className="text-[10px] text-slate-400 font-medium leading-none mt-1 whitespace-nowrap">by Devtective</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="bg-slate-900 p-2.5 rounded-lg shadow-lg shadow-slate-900/20">
             <Coffee className="w-5 h-5 text-slate-50" />
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-8 w-8 text-slate-300 hover:text-slate-900 transition-all", isCollapsed ? "absolute -right-4 top-1/2 -translate-y-1/2 bg-white border border-slate-100 shadow-sm rounded-full z-50 hover:bg-white" : "")}
          onClick={toggle}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      <nav className={cn("flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide", isCollapsed && "flex flex-col items-center")}>
        {MENU_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} isActive={pathname === item.href} />
        ))}
      </nav>

      {/* Operational Group: Pushed to bottom */}
      <div className={cn("mt-auto p-4 border-t border-slate-50 bg-slate-50/30 space-y-4 pt-6 pb-8", isCollapsed && "px-0 flex flex-col items-center")}>
        {!isCollapsed && <p className="text-[10px] font-medium text-slate-400 tracking-[0.2em] uppercase px-4 mb-2 opacity-50">Operasional</p>}
        
        <TooltipProvider>
          <div className={cn("flex flex-col w-full", isCollapsed ? "items-center space-y-4" : "px-4 space-y-3")}>
            {/* Buka Kasir */}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href="/pos" className={cn(isCollapsed ? "" : "w-full")}>
                  <div className={cn(
                    "flex items-center gap-4 transition-all cursor-pointer group rounded-xl",
                    isCollapsed ? "justify-center w-12 h-12 bg-slate-900 text-white shadow-xl shadow-slate-900/20" : "bg-slate-900 text-white px-4 py-3.5 shadow-xl shadow-slate-900/10 hover:bg-slate-800"
                  )}>
                     <ShoppingCart className={cn("w-5 h-5 transition-transform group-hover:scale-110", isCollapsed ? "text-white" : "text-slate-50")} />
                     {!isCollapsed && (
                       <>
                         <div className="flex-1">
                           <p className="text-sm font-bold tracking-tight leading-none mb-1">Buka kasir</p>
                           <p className="text-[10px] font-medium opacity-60 leading-none">Pos terminal hub</p>
                         </div>
                         <ChevronRight className="w-3.5 h-3.5 opacity-40 ml-auto" />
                       </>
                     )}
                  </div>
                </Link>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right" className="bg-slate-900 text-white border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 ml-2">Buka kasir</TooltipContent>}
            </Tooltip>

            {/* Menu Digital */}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href="/menu" target="_blank" className={cn(isCollapsed ? "" : "w-full")}>
                  <div className={cn(
                    "flex items-center gap-4 transition-all cursor-pointer group rounded-xl",
                    isCollapsed ? "justify-center w-12 h-12 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-emerald-500/10 text-emerald-600 px-4 py-3.5 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                  )}>
                     <Store className={cn("w-5 h-5 transition-transform group-hover:scale-110", isCollapsed ? "text-emerald-600" : "text-emerald-600 group-hover:text-white")} />
                     {!isCollapsed && (
                       <>
                         <div className="flex-1">
                           <p className="text-sm font-bold tracking-tight leading-none mb-1">Menu digital</p>
                           <p className="text-[10px] font-medium opacity-60 leading-none">Customer view portal</p>
                         </div>
                         <ChevronRight className="w-3.5 h-3.5 opacity-40 ml-auto" />
                       </>
                     )}
                  </div>
                </Link>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right" className="bg-slate-900 text-white border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 ml-2">Menu digital</TooltipContent>}
            </Tooltip>
          </div>
        </TooltipProvider>

        {!isCollapsed && (
          <div className="pt-4 border-t border-slate-100/50">
             <p className="text-[9px] font-medium text-slate-300 tracking-widest text-center">Code & Coffee v1.2.0 • Engineered by Devtective</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen fixed inset-y-0 left-0 border-r border-slate-100 z-50 bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {NavContent}
      </aside>

      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-6 left-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl bg-white shadow-xl border-slate-100 active:scale-95 transition-all">
               <MenuIcon className="w-5 h-5 text-slate-900" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-none shadow-3xl">
            {NavContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
