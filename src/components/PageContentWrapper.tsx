'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/providers/SidebarProvider'

export function PageContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()
  
  // Jangan beri padding di halaman menu pelanggan, Terminal Kasir (POS), atau Landing Page
  const isFullWidth = pathname?.startsWith('/menu') || pathname === '/pos' || pathname === '/'

  return (
    <div className={cn(
      "min-h-dvh transition-all duration-300 ease-in-out",
      !isFullWidth && (isCollapsed ? "lg:pl-20" : "lg:pl-64")
    )}>
      {children}
    </div>
  )
}
