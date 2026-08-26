import React from 'react';
import { X, ArrowUp, ArrowDown, GripVertical, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ReorderableItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
}

interface ReorderModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  items: ReorderableItem[];
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
}

export default function ReorderModal({
  isOpen,
  title,
  description,
  items,
  onMoveItem,
  onClose,
}: ReorderModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div>
              <h3 className="font-sans font-black text-slate-900 text-lg tracking-tight">
                {title}
              </h3>
              {description && (
                <p className="font-sans text-xs text-slate-500 mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List items */}
          <div className="p-6 overflow-y-auto space-y-2.5 flex-1">
            {items.length === 0 ? (
              <p className="text-center font-sans text-xs text-slate-400 py-8">
                Nessun elemento da riordinare.
              </p>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-7 h-7 rounded-xl bg-slate-200/80 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {item.imageUrl && (
                      <div className="w-8 h-8 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-full h-full object-contain p-0.5"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="font-sans font-bold text-xs text-slate-900 truncate">
                        {item.title}
                      </h4>
                      {item.subtitle && (
                        <p className="font-sans text-[11px] text-slate-500 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>

                    {item.badge && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase rounded-md shrink-0 hidden sm:inline-block">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Reorder Up / Down buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveItem(index, index - 1)}
                      className={`p-2 rounded-xl border transition-all ${
                        index === 0
                          ? 'border-slate-100 bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 cursor-pointer shadow-2xs'
                      }`}
                      title="Sposta Su"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => onMoveItem(index, index + 1)}
                      className={`p-2 rounded-xl border transition-all ${
                        index === items.length - 1
                          ? 'border-slate-100 bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 cursor-pointer shadow-2xs'
                      }`}
                      title="Sposta Giù"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-100"
            >
              <Check className="w-4 h-4" />
              <span>Fatto</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
