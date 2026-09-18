import React from 'react';

interface ManualUnitInputProps {
  value: string;
  onChange: (unit: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  id?: string;
}

export const COMMON_UNITS = [
  'পিস',
  'কার্টুন',
  'কেজি',
  'প্যাকেট',
  'লিটার',
  'বক্স',
  'গ্রাম',
  'বস্তা',
  'ডজন',
  'রোল',
  'জার'
];

export const ManualUnitInput: React.FC<ManualUnitInputProps> = ({
  value,
  onChange,
  placeholder = 'পিস / কার্টুন / কেজি...',
  className = '',
  compact = false,
  id,
}) => {
  const datalistId = id ? `unit-list-${id}` : `unit-list-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="relative">
        <input
          type="text"
          id={id}
          list={datalistId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-2xs text-center"
        />
        <datalist id={datalistId}>
          {COMMON_UNITS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
      </div>

      {/* Quick selection pills */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {['পিস', 'কার্টুন', 'কেজি', 'প্যাকেট'].map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => onChange(u)}
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-all ${
              value === u
                ? 'bg-teal-700 text-white shadow-2xs ring-1 ring-teal-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  );
};
