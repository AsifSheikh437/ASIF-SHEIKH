import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { Product } from '../../types';

interface SearchableProductSelectProps {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({
  products,
  value,
  onChange,
  placeholder = 'পণ্য খুঁজুন...',
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Enhanced search implementation (matches starting substring, includes, fuzzy, or SKU/code)
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm.trim()) return products;
    const cleanTerm = searchTerm.trim().toLowerCase();

    return products
      .map((p) => {
        const bn = (p.nameBangla || '').toLowerCase();
        const en = (p.nameEnglish || '').toLowerCase();
        const sku = ((p as any).sku || p.id || '').toLowerCase();

        let score = 0;
        // Exact prefix match gets highest priority
        if (bn.startsWith(cleanTerm) || en.startsWith(cleanTerm)) {
          score = 100;
        } else if (bn.includes(cleanTerm) || en.includes(cleanTerm)) {
          score = 75;
        } else if (sku.includes(cleanTerm)) {
          score = 50;
        } else {
          // Subsequence/fuzzy match
          let patternIdx = 0;
          let strIdx = 0;
          while (patternIdx < cleanTerm.length && strIdx < bn.length) {
            if (cleanTerm[patternIdx] === bn[strIdx]) {
              patternIdx++;
            }
            strIdx++;
          }
          if (patternIdx === cleanTerm.length) {
            score = 25;
          }
        }
        return { product: p, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);
  }, [products, searchTerm]);

  // Reset highlight index when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredProducts.length]);

  const handleSelectProduct = (prodId: string) => {
    onChange(prodId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[highlightedIndex]) {
        handleSelectProduct(filteredProducts[highlightedIndex].id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef} onKeyDown={handleKeyDown}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg text-left focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all shadow-2xs"
      >
        <span className={`block truncate text-xs font-semibold ${selectedProduct ? 'text-slate-900' : 'text-slate-400'}`}>
          {selectedProduct ? `${selectedProduct.nameBangla} (স্টক: ${selectedProduct.currentStock} ${selectedProduct.unit})` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-150 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent text-xs font-medium focus:outline-hidden text-slate-800 placeholder-slate-400"
              placeholder="২-৩ টি অক্ষর লিখুন (যেমন: ময়দা, চিনি, বিস্কুট)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div ref={listRef} className="overflow-y-auto p-1 flex-1 max-h-56 divide-y divide-slate-50">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                "{searchTerm}" নামে কোনো পণ্য পাওয়া যায়নি
              </div>
            ) : (
              filteredProducts.map((p, idx) => {
                const isSelected = value === p.id;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p.id)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : isSelected
                        ? 'bg-slate-100 text-teal-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{p.nameBangla}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {p.nameEnglish} • কোড: {p.id}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        p.currentStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        স্টক: {p.currentStock} {p.unit}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>মোট {filteredProducts.length} টি পণ্য পাওয়া গেছে</span>
            <span>Enter চাপুন সিলেক্ট করতে</span>
          </div>
        </div>
      )}
    </div>
  );
};
