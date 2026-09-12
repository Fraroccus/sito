/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

export default function Navbar({ isAdmin, onToggleAdmin }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const wasOpen = isOpen;
    if (wasOpen) {
      setIsOpen(false);
    }

    const performScroll = () => {
      if (id === 'presentazione') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        return;
      }

      const element = document.getElementById(id);
      if (element) {
        const navHeight = 70;
        const currentScroll = window.scrollY ?? window.pageYOffset ?? 0;
        const elementRectTop = element.getBoundingClientRect().top;
        const targetY = Math.max(0, elementRectTop + currentScroll - navHeight);

        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      }
    };

    // On mobile, delay slightly so the touch gesture completes and DOM collapse doesn't cancel the smooth scroll
    if (wasOpen) {
      setTimeout(performScroll, 120);
    } else {
      performScroll();
    }
  };

  const menuItems = [
    { label: 'Chi Sono', target: 'presentazione' },
    { label: 'Percorsi Formativi', target: 'percorsi' },
    { label: 'Contatti', target: 'contatti' },
    { label: 'Collaborazioni', target: 'collaborazioni' },
    { label: 'Intervista Video', target: 'video-intervista' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Monogram */}
          <div className="flex-shrink-0 flex items-center">
            <button 
              type="button"
              onClick={() => scrollToSection('presentazione')}
              className="group flex items-center focus:outline-none text-left cursor-pointer"
              id="nav-logo"
            >
              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm sm:text-base text-slate-900 tracking-tight uppercase leading-none">
                  Francesco Rocco
                </span>
                <span className="font-mono text-[9px] sm:text-[9.5px] text-slate-500 tracking-[0.14em] sm:tracking-[0.16em] uppercase mt-1">
                  Formatore & Progettista
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.target}
                type="button"
                id={`nav-link-${item.target}`}
                onClick={() => scrollToSection(item.target)}
                className="font-sans text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              id="mobile-menu-toggle"
              aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-slate-950 focus:outline-none touch-manipulation cursor-pointer rounded-lg hover:bg-slate-100 active:bg-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-slate-200 bg-white"
            id="mobile-menu-container"
          >
            <div className="px-4 py-3 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.target}
                  type="button"
                  id={`nav-link-mobile-${item.target}`}
                  onClick={() => scrollToSection(item.target)}
                  className="w-full text-left px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 active:bg-indigo-100 transition-colors flex items-center justify-between touch-manipulation cursor-pointer min-h-[44px]"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
