'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Select({
  label,
  error,
  options = [],
  value,
  onChange,
  name,
  className,
  placeholder = 'Select option...',
  icon: Icon,
  searchable = false,
  size = 'md'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Find selected option strictly based on matching value
  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value !== null && value !== undefined ? value : '')
  );

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 220 && rect.top > 200) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue) => {
    setIsOpen(false);
    setSearchTerm('');
    if (onChange) {
      onChange({ target: { name, value: optValue } });
    }
  };

  const filteredOptions = searchable && searchTerm
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div className="w-full space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Hidden real input for form integration */}
      <input type="hidden" name={name} value={value || ''} suppressHydrationWarning />

      {/* Custom Interactive Dropdown Button matching vibrant blue theme */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full rounded-xl border border-blue-600/90 bg-white text-slate-900 shadow-xs hover:border-blue-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-left cursor-pointer',
          size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm',
          isOpen ? 'border-blue-600 ring-2 ring-blue-500/25 shadow-sm' : 'border-blue-500/80 hover:border-blue-600',
          error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
          className
        )}
      >
        <div className="flex items-center space-x-2.5 truncate">
          {selectedOption?.icon ? (
            <selectedOption.icon className="w-4 h-4 text-blue-600 shrink-0" />
          ) : Icon ? (
            <Icon className="w-4 h-4 text-blue-600 shrink-0" />
          ) : null}
          <span className={cn('font-semibold truncate', selectedOption ? 'text-slate-800' : 'text-slate-400')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-blue-600 transition-transform duration-200 shrink-0 ml-2',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Custom Modern Dropdown Menu matching reference image */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-[100] w-full rounded-xl bg-white border border-slate-200/90 shadow-xl py-1 overflow-hidden animate-in fade-in duration-150 ring-1 ring-black/5',
            dropUp ? 'bottom-full mb-1.5 slide-in-from-bottom-2' : 'top-full mt-1.5 slide-in-from-top-2'
          )}
        >
          {searchable && options.length > 5 && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optKey = opt.value !== undefined && opt.value !== null && String(opt.value) !== '' ? String(opt.value) : `opt-${idx}-${opt.label}`;
                const isSelected = selectedOption && String(opt.value) === String(selectedOption.value);
                return (
                  <button
                    key={optKey}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(opt.value);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(opt.value);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-left transition-colors cursor-pointer border-b border-slate-50 last:border-0 group',
                      isSelected
                        ? 'bg-blue-50/90 text-blue-600'
                        : 'text-slate-700 hover:bg-blue-50/50 hover:text-blue-600'
                    )}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      {opt.icon && (
                        <opt.icon className={cn(
                          'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                          isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                        )} />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

export default Select;

