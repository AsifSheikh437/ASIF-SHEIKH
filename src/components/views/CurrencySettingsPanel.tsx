import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DollarSign, Plus, Trash2, Save } from 'lucide-react';
import { CurrencyRate } from '../../types';

export const CurrencySettingsPanel: React.FC = () => {
  const { settings, updateSettings } = useERP();
  
  const [baseCurrency, setBaseCurrency] = useState(settings.baseCurrency || 'BDT');
  const [currencies, setCurrencies] = useState<CurrencyRate[]>(settings.currencies || []);
  const [newCode, setNewCode] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newRate, setNewRate] = useState<number>(1);

  const handleAddCurrency = () => {
    if (!newCode || !newSymbol || newRate <= 0) {
      alert('অনুগ্রহ করে সঠিক তথ্য দিন।');
      return;
    }
    const updatedCurrencies = [...currencies, { code: newCode.toUpperCase(), symbol: newSymbol, rate: newRate }];
    setCurrencies(updatedCurrencies);
    setNewCode('');
    setNewSymbol('');
    setNewRate(1);
  };

  const handleRemoveCurrency = (index: number) => {
    const updated = [...currencies];
    updated.splice(index, 1);
    setCurrencies(updated);
  };

  const handleSave = () => {
    updateSettings({
      baseCurrency,
      currencies
    });
    alert('কারেন্সি সেটিংস সেভ করা হয়েছে।');
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-teal-700" />
          <h3 className="font-bold text-slate-900 text-sm">মাল্টি-কারেন্সি (Multi-Currency) সেটিংস</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">বেস কারেন্সি কোড (Base Currency Code)</label>
          <input
            type="text"
            value={baseCurrency}
            onChange={e => setBaseCurrency(e.target.value)}
            className="w-full max-w-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
            placeholder="e.g. BDT, USD"
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 mb-3">অন্যান্য কারেন্সি রেট</h4>
          
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1 max-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">কোড (Code)</label>
              <input 
                type="text"
                placeholder="USD"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex-1 max-w-[100px]">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">প্রতীক (Symbol)</label>
              <input 
                type="text"
                placeholder="$"
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex-1 max-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">বিনিময় হার (Exchange Rate)</label>
              <input 
                type="number"
                min="0.0001"
                step="0.01"
                value={newRate}
                onChange={e => setNewRate(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCurrency}
              className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold rounded-lg text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              যোগ করুন
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-bold">Code</th>
                  <th className="px-4 py-2 font-bold">Symbol</th>
                  <th className="px-4 py-2 font-bold">Exchange Rate</th>
                  <th className="px-4 py-2 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currencies.map((curr, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-xs font-bold text-slate-800">{curr.code}</td>
                    <td className="px-4 py-2 text-xs text-slate-600">{curr.symbol}</td>
                    <td className="px-4 py-2 text-xs text-slate-600">1 {curr.code} = {curr.rate} {baseCurrency}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleRemoveCurrency(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {currencies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-xs text-slate-400">
                      কোনো কারেন্সি যোগ করা হয়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
};
