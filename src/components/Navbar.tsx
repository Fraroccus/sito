/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

export default function Navbar({ isAdmin, onToggleAdmin }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of fixed navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
              onClick={() => scrollToSection('presentazione')}
              className="group flex items-center focus:outline-none text-left"
              id="nav-logo"
            >
              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm sm:text-base text-slate-900 tracking-tight uppercase leading-none">
                  Francesco Rocco
                </span>
                <span className="font-mono text-[9px] text-slate-500 tracking-wider uppercase mt-1">
                  Formatore AI & Progettista
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.target}
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
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 text-slate-600 hover:text-slate-950 focus:outline-none"
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
            <div className="px-4 py-3 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.target}
                  id={`nav-link-mobile-${item.target}`}
                  onClick={() => scrollToSection(item.target)}
                  className="block w-full text-left px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
