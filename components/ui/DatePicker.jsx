'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  compact = false,
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Initial date parsing
  const initialDate = value ? new Date(value) : new Date();
  const validInitialDate = !isNaN(initialDate.getTime()) ? initialDate : new Date();

  const [viewYear, setViewYear] = useState(validInitialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(validInitialDate.getMonth()); // 0-indexed

  // Sync internal view when value prop changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Calculate grid days for currently viewed month
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const startDayOffset = getFirstDayOfMonth(viewYear, viewMonth);

  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    // Format YYYY-MM-DD
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Format value for display
  const formatDisplayDate = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()]?.substring(0, 3) || '';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Selected date matching check
  const isDaySelected = (day) => {
    if (!value) return false;
    const d = new Date(value);
    return (
      d.getFullYear() === viewYear &&
      d.getMonth() === viewMonth &&
      d.getDate() === day
    );
  };

  const isToday = (day) => {
    const now = new Date();
    return (
      now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
    );
  };

  if (compact) {
    return (
      <div className={cn('relative w-full', className)} ref={containerRef}>
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl flex flex-col justify-center focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 shadow-xs h-[56px] cursor-pointer transition-all duration-200 hover:border-slate-300',
            isOpen && 'border-blue-600 ring-2 ring-blue-500/20',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-50'
          )}
        >
          {label && (
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-800 mb-0.5">
              {label}
            </span>
          )}
          <div className="flex items-center justify-between space-x-1">
            <div className="flex items-center space-x-1.5 truncate">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className={cn('font-mono font-extrabold text-slate-800 text-xs truncate', !value && 'text-slate-400 font-normal')}>
                {value ? formatDisplayDate(value) : placeholder}
              </span>
            </div>
            {value && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header / Month Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-800">
                {months[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mt-3 mb-1">
              {daysOfWeek.map((day, idx) => (
                <span key={idx} className="text-[11px] font-bold text-slate-400">
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <span
                  key={`prev-${i}`}
                  className="text-xs text-slate-300 py-1.5 flex items-center justify-center select-none"
                >
                  {prevMonthDays - startDayOffset + i + 1}
                </span>
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const selected = isDaySelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      'text-xs font-semibold py-1.5 rounded-lg transition-all duration-150 flex items-center justify-center',
                      selected && 'bg-blue-600 text-white shadow-xs font-bold',
                      !selected && today && 'border border-blue-500 text-blue-600 bg-blue-50/50',
                      !selected && !today && 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={handleSelectToday}
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative w-full space-y-1.5', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Input Field Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-xs cursor-pointer transition-all duration-200 hover:border-slate-300',
          isOpen && 'border-blue-600 ring-2 ring-blue-500/20',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50'
        )}
      >
        <div className="flex items-center space-x-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span className={cn('font-semibold truncate', !value && 'text-slate-400 font-normal')}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Modern Popover Calendar UI */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-[70] w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1">
              <span className="font-extrabold text-slate-900 text-sm">
                {months[viewMonth]}
              </span>
              <span className="font-extrabold text-blue-600 text-sm">
                {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Previous Month Days */}
            {Array.from({ length: startDayOffset }).map((_, idx) => {
              const dayNum = prevMonthDays - startDayOffset + idx + 1;
              return (
                <span key={`prev-${idx}`} className="py-2 text-slate-300 font-medium select-none">
                  {dayNum}
                </span>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const day = idx + 1;
              const selected = isDaySelected(day);
              const today = isToday(day);

              return (
                <button
                  key={`current-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    'py-2 rounded-xl text-xs font-semibold transition-all duration-150',
                    selected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105'
                      : today
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs font-bold">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-slate-800 transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
