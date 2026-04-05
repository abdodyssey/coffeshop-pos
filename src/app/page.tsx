"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Coffee,
  Smartphone,
  Zap,
  Layers,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  MapPin,
  Clock,
  Phone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const [featuredProducts, setFeaturedProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase.from("products").select("*").limit(4);
      setFeaturedProducts(data || []);
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col w-full bg-[#F5F5F4] text-[#2D241E] selection:bg-[#2D241E] selection:text-white overflow-x-hidden relative font-sans">
      
      {/* 0. NAVIGATION HEADER: Integrated Cleanliness */}
      <header className="absolute top-0 left-0 w-full z-50 px-6 sm:px-10 py-8 flex items-center justify-between mix-blend-difference">
        <div className="flex items-center gap-4">
           <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-2xl">
              <Coffee className="w-5 h-5 text-white" />
           </div>
           <div className="hidden sm:block">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] leading-none mb-1">CODE & COFFEE</h2>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Est. 2026</p>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="hidden lg:flex items-center gap-3 text-stone-400 text-[10px] font-black uppercase tracking-[0.25em]">
              <MapPin className="w-3 h-3" /> Plaju, Palembang
           </div>
           <Link href="/dashboard">
              <Button variant="outline" className="rounded-full border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white hover:text-[#2D241E] font-bold text-[10px] uppercase tracking-widest h-10 px-8 transition-all active:scale-95 shadow-xl">
                 Buka POS <ArrowRight className="ml-2 w-3.5 h-3.5" />
              </Button>
           </Link>
        </div>
      </header>

      {/* 1. HERO SECTION: Espresso Noir with Cream Transition */}
      <section className="relative h-[95vh] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image & Overlays */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-coffee.png"
            alt="Code & Coffee Interior"
            fill
            priority
            className="object-cover brightness-[0.5] contrast-[1.1]"
          />
          {/* Subtle Color Overlay */}
          <div className="absolute inset-0 bg-[#2D241E]/30 mix-blend-overlay"></div>
          {/* Transition Gradient to Cream */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#F5F5F4]"></div>
        </div>

        {/* Floating Blobs (Abstract Coffee vibes) */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#2D241E] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-stone-400 rounded-full blur-[140px] opacity-10"></div>

        <div className="container relative z-10 px-6 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block text-[10px] font-black tracking-[0.6em] text-white/50 uppercase mb-8 bg-white/5 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/10 shadow-2xl">
              The Digital Hub — Experience Coffee
            </span>
            <h1 className="text-[12vw] sm:text-7xl md:text-9xl font-black text-white tracking-[-0.07em] mb-8 leading-[0.8] drop-shadow-2xl">
              CODE & <br /> <span className="text-stone-300">COFFEE</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-xl text-stone-200 font-medium leading-relaxed mb-12 opacity-90 px-4">
              Where algorithms meet artisanal beans. Experience the next
              generation of digital coffee culture in a space built for focus.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/menu">
                <Button className="h-16 px-12 rounded-full bg-[#2D241E] text-white hover:bg-stone-800 font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-[#2D241E]/30">
                  Lihat Menu Digital <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="h-16 px-12 rounded-full border-white/30 bg-white/5 backdrop-blur-2xl text-white hover:bg-white hover:text-[#2D241E] font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl"
              >
                Order WhatsApp <Phone className="ml-3 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce opacity-60">
          <div className="w-px h-16 bg-linear-to-b from-white to-transparent"></div>
          <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">
            Explore
          </span>
        </div>
      </section>

      {/* 2. THE TECH SIDE: Warm & Digital */}
      <section className="py-40 bg-[#F5F5F4] relative">
        <div className="container mx-auto px-10">
          <div className="flex flex-col items-center text-center mb-24">
             <span className="text-[10px] font-black text-stone-400 tracking-[0.5em] uppercase mb-4">The Infrastructure</span>
             <h2 className="text-5xl font-black tracking-tighter text-[#2D241E]">ENGINEERED FOR <br/> <span className="text-stone-300">PRODUCTIVITY</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              className="group space-y-8 p-10 bg-white rounded-[2rem] shadow-sm border border-stone-100 hover:shadow-2xl transition-all duration-500"
            >
              <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 shadow-inner group-hover:bg-[#2D241E] transition-colors duration-500">
                <Smartphone className="w-7 h-7 text-[#2D241E] group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#2D241E] tracking-tight mb-4">
                  Full Digital Flow
                </h3>
                <p className="text-stone-500 font-medium leading-relaxed">
                  Seamlessly scan and order. Our interface is designed for minimal distraction and maximum flow.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 50 }}
              viewport={{ once: true }}
              className="group space-y-8 p-10 bg-[#2D241E] rounded-[2rem] shadow-2xl shadow-[#2D241E]/20 text-white"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-white transition-colors duration-500">
                <Zap className="w-7 h-7 text-white group-hover:text-[#2D241E] transition-colors" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-4 text-stone-200">
                  Real-time Intelligence
                </h3>
                <p className="text-stone-400 font-medium leading-relaxed">
                  Our system predicts demand and manages inventory with precision, so your roast is always perfect.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              className="group space-y-8 p-10 bg-white rounded-[2rem] shadow-sm border border-stone-100 hover:shadow-2xl transition-all duration-500"
            >
              <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 shadow-inner group-hover:bg-[#2D241E] transition-colors duration-500">
                <Layers className="w-7 h-7 text-[#2D241E] group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#2D241E] tracking-tight mb-4">
                  Creator Economy
                </h3>
                <p className="text-stone-500 font-medium leading-relaxed">
                  A sanctuary for developers. We provide high-speed connectivity and ergonomic environments.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED MENU: The Espresso Palette */}
      <section className="py-40 bg-white relative overflow-hidden">
        {/* Blob Decoration */}
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#2D241E] rounded-full blur-[150px] opacity-5"></div>
        
        <div className="container mx-auto px-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
            <div>
              <span className="text-[10px] font-black tracking-[0.5em] text-stone-400 uppercase mb-4 block">
                The Artisanal Roast
              </span>
              <h2 className="text-5xl md:text-7xl font-black text-[#2D241E] tracking-tight">
                CRAFTED <br /> <span className="text-stone-200 text-6xl md:text-8xl">EXPERIENCES</span>
              </h2>
            </div>
            <Link
              href="/menu"
              className="group flex items-center gap-4 text-sm font-black text-[#2D241E] hover:opacity-70 transition-opacity uppercase tracking-widest"
            >
              Explore Full Menu{" "}
              <div className="w-12 h-12 rounded-full bg-[#2D241E] text-white flex items-center justify-center transition-transform group-hover:translate-x-3 shadow-xl">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[450px] bg-stone-50 animate-pulse rounded-3xl border border-stone-100"
                  />
                ))
              : featuredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.6 }}
                  >
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group hover:shadow-3xl transition-all duration-700 hover:-translate-y-4 p-1 border border-stone-50">
                      <CardContent className="p-0 text-[#2D241E]">
                        <div className="aspect-4/5 bg-stone-50 relative rounded-[2rem] overflow-hidden mb-6 shadow-inner">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform duration-1500 group-hover:scale-110 group-hover:rotate-2"
                            />
                          ) : (
                            <Coffee className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 text-stone-200" />
                          )}
                          <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-2xl px-4 py-1.5 rounded-full shadow-2xl border border-stone-100">
                            <span className="text-xs font-black tracking-tight">
                              IDR {product.price.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                        <div className="px-6 pb-6 mt-3">
                          <h4 className="text-xl font-black tracking-tighter mb-1.5 truncate group-hover:text-stone-400 transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-[#2D241E]/20"></div>
                             <p className="text-[9px] font-black text-stone-300 uppercase tracking-[0.25em] leading-none">
                               {product.category}
                             </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
          </div>
        </div>
      </section>

      {/* 4. FOOTER: Deep Espresso Noir */}
      <footer className="bg-[#2D241E] text-white pt-48 pb-20 relative overflow-hidden">
        {/* Massive Background Label */}
        <div className="absolute -top-10 -right-20 text-[25vw] font-black text-white/3 pointer-events-none leading-none select-none tracking-tighter">
          COFFEE
        </div>

        <div className="container mx-auto px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 border-b border-white/5 pb-32">
            <div className="space-y-12">
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.8] text-white">
                VISIT THE <br />{" "}
                <span className="text-stone-600 block mt-4">WORKSPACE</span>
              </h2>
              <p className="text-stone-400 font-medium text-xl leading-relaxed max-w-lg opacity-80">
                Experience the integration of high-end technology and specialty
                coffee in an environment built for focus. We serve precision in every cup.
              </p>

              <div className="flex items-center gap-5">
                <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-[#2D241E] transition-all transform hover:rotate-12 hover:scale-110">
                  <ExternalLink className="w-6 h-6" />
                </button>
                <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-[#2D241E] transition-all transform hover:-rotate-12 hover:scale-110">
                  <MessageCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
              <div className="space-y-8 p-10 bg-white/5 rounded-[40px] border border-white/5">
                <div className="flex items-center gap-4 text-stone-500">
                  <MapPin className="w-5 h-5 shrink-0" />
                  <span className="text-xs uppercase font-black tracking-[0.3em]">
                    Location
                  </span>
                </div>
                <p className="text-2xl font-black leading-tight">
                  Jl. Ahmad Yani, Plaju <br /> Palembang, Indonesia
                </p>
              </div>
              <div className="space-y-8 p-10 bg-white/5 rounded-[40px] border border-white/5">
                <div className="flex items-center gap-4 text-stone-500">
                  <Clock className="w-5 h-5 shrink-0" />
                  <span className="text-xs uppercase font-black tracking-[0.3em]">
                    Operation
                  </span>
                </div>
                <p className="text-2xl font-black leading-tight">
                  Mon — Sun <br /> 08:00 — 23:00
                </p>
              </div>
            </div>
          </div>

          <div className="pt-20 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="bg-white p-3 rounded-2xl group-hover:rotate-12 transition-transform shadow-2xl">
                 <Coffee className="w-6 h-6 text-[#2D241E]" />
              </div>
              <span className="text-xl font-black tracking-tighter">
                DEVTECTIVE INDUSTRIES
              </span>
            </div>
            <div className="text-right">
               <p className="text-[11px] font-black text-stone-600 tracking-[0.4em] uppercase mb-1">
                 Crafted with Precision in Palembang
               </p>
               <p className="text-[10px] font-medium text-stone-700 opacity-50 uppercase tracking-widest">
                 © 2026 Code & Coffee. All Rights Reserved.
               </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
