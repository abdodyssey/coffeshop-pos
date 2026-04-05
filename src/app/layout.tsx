import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/Navigation";
import { PageContentWrapper } from "@/components/PageContentWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/providers/SidebarProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Code & Coffee | Smart Inventory & POS",
  description: "Advanced Coffee Shop Point of Sale & Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-stone-50" suppressHydrationWarning>
        <SidebarProvider>
          <TooltipProvider>
            <Navigation />
            <main className="flex-1">
              <PageContentWrapper>{children}</PageContentWrapper>
            </main>
          </TooltipProvider>
        </SidebarProvider>
        
        <Toaster 
          position="top-right" 
          visibleToasts={3} 
          closeButton 
          theme="light"
          toastOptions={{
            classNames: {
              toast: "group toast group-[.toaster]:rounded-3xl group-[.toaster]:px-6 group-[.toaster]:py-4 group-[.toaster]:shadow-2xl group-[.toaster]:border-slate-200 font-sans",
              title: "font-bold text-slate-900 group-[.success]:text-slate-900 group-[.error]:text-slate-50",
              description: "text-slate-600 font-medium group-[.error]:text-slate-400",
              success: "group-[.success]:bg-slate-50 group-[.success]:text-slate-900 group-[.success]:border-slate-200",
              error: "group-[.error]:bg-slate-950 group-[.error]:text-slate-50 group-[.error]:border-slate-800",
            }
          }}
        />
      </body>
    </html>
  );
}
