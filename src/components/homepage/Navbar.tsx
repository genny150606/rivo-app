'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Route, Shield, Smartphone, Award, Gift, Users, UserCog, BarChart3, Receipt,
  Menu, X, ChevronDown, Store, Utensils, Coffee, Hotel, Dumbbell, Briefcase
} from 'lucide-react';

const productItems = [
  { name: 'Smart Router', icon: Route, href: '#' },
  { name: 'Review Shield', icon: Shield, href: '#' },
  { name: 'Universal Hub', icon: Smartphone, href: '#' },
  { name: 'Loyalty', icon: Award, href: '#' },
  { name: 'Coupons', icon: Gift, href: '#' },
  { name: 'CRM', icon: Users, href: '#' },
  { name: 'Staff', icon: UserCog, href: '#' },
  { name: 'Analytics', icon: BarChart3, href: '#' },
  { name: 'Smart Bill', icon: Receipt, href: '#' },
];

const solutionItems = [
  { name: 'Ristoranti', icon: Utensils, href: '#' },
  { name: 'Bar', icon: Coffee, href: '#' },
  { name: 'Hotel', icon: Hotel, href: '#' },
  { name: 'Retail', icon: Store, href: '#' },
  { name: 'Palestre', icon: Dumbbell, href: '#' },
  { name: 'Servizi', icon: Briefcase, href: '#' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'product' | 'solutions' | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDropdown = (name: 'product' | 'solutions') => {
    if (openDropdown === name) setOpenDropdown(null);
    else setOpenDropdown(name);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled ? 'bg-[#09090B]/80 backdrop-blur-xl border-b border-zinc-800/50 py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-50">
            <Image src="/brand/rivo-icon.png" alt="RIVO Logo" width={32} height={32} className="rounded-md" />
            <span className="text-xl font-bold tracking-tight text-white">RIVO</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium text-zinc-300 hover:text-white transition-colors py-2 cursor-default">
                Prodotto <ChevronDown size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-[#121214] border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 p-4 grid grid-cols-2 gap-2">
                {productItems.map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div className="p-2 bg-zinc-900 rounded-md text-lime-500 border border-zinc-800">
                      <item.icon size={16} />
                    </div>
                    <span className="text-sm font-medium text-zinc-200">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium text-zinc-300 hover:text-white transition-colors py-2 cursor-default">
                Soluzioni <ChevronDown size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[320px] bg-[#121214] border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 p-3 grid grid-cols-1 gap-1">
                {solutionItems.map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div className="p-2 bg-zinc-900 rounded-md text-lime-500 border border-zinc-800">
                      <item.icon size={16} />
                    </div>
                    <span className="text-sm font-medium text-zinc-200">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Link href="#come-funziona" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Come funziona
            </Link>
            <Link href="#" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Risorse
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Accedi
            </Link>
            <Link href="#" className="bg-lime-500 hover:bg-lime-400 text-black text-sm font-semibold rounded-lg px-4 py-2 transition-colors">
              Richiedi demo
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-zinc-300 hover:text-white z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Full Screen Menu */}
      <div className={`md:hidden fixed inset-0 bg-[#09090B] z-40 transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col pt-24 px-6 overflow-y-auto pb-10`}>
        <div className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => toggleDropdown('product')}
              className="flex justify-between items-center text-lg font-medium text-white border-b border-zinc-800 pb-2"
            >
              Prodotto <ChevronDown size={18} className={`transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'product' && (
              <div className="grid grid-cols-1 gap-2 pl-2">
                {productItems.map((item) => (
                  <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 text-zinc-300">
                    <item.icon size={18} className="text-lime-500" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => toggleDropdown('solutions')}
              className="flex justify-between items-center text-lg font-medium text-white border-b border-zinc-800 pb-2"
            >
              Soluzioni <ChevronDown size={18} className={`transition-transform ${openDropdown === 'solutions' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'solutions' && (
              <div className="grid grid-cols-1 gap-2 pl-2">
                {solutionItems.map((item) => (
                  <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 text-zinc-300">
                    <item.icon size={18} className="text-lime-500" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="#come-funziona" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-white border-b border-zinc-800 pb-2">
            Come funziona
          </Link>
          
          <Link href="#" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-white border-b border-zinc-800 pb-2">
            Risorse
          </Link>

          <div className="flex flex-col gap-4 mt-8">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 border border-zinc-700 text-white rounded-lg font-medium">
              Accedi
            </Link>
            <Link href="#" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 bg-lime-500 text-black rounded-lg font-semibold">
              Richiedi demo
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
