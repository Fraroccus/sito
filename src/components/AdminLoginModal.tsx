/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Admin password
    if (password === 'Fraroccus11!') {
      onLoginSuccess();
      setPassword('');
      onClose();
    } else {
      setError('Password errata. Riprova.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl w-full max-w-sm border border-slate-200 shadow-2xl p-6 space-y-6 relative"
        id="admin-login-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-sans font-black text-lg text-slate-900 uppercase tracking-tight">
            Accesso Area Riservata
          </h3>
          <p className="font-sans text-xs text-slate-500 max-w-xs mx-auto">
            Inserisci la chiave d'accesso per sbloccare l'editing e la rimozione dei percorsi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Password Amministratore
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci password..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900 text-sm"
              />
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {error && (
            <p className="font-sans text-xs text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-center">
              {error}
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-sans font-bold text-xs border border-slate-200 rounded-xl transition-all uppercase tracking-wider"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-sans font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider"
            >
              Accedi
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
