import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Product } from '../../types';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onImport: (adjustments: { productId: string; delta: number; code: string; newStock: number }[], mode: 'ADD' | 'REPLACE') => void;
}

interface ParsedRow {
  code: string;
  quantity: number;
}

interface ValidatedRow {
  code: string;
  quantity: number;
  productId?: string;
  productName?: string;
  currentStock?: number;
  isValid: boolean;
  error?: string;
}

export const StockImportModal: React.FC<StockImportModalProps> = ({
  isOpen,
  onClose,
  products,
  onImport
}) => {
  const [importMode, setImportMode] = useState<'ADD' | 'REPLACE'>('ADD');
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        validateData(rows);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        alert('Error parsing CSV: ' + error.message);
      }
    });
  };

  const validateData = (rows: Record<string, string>[]) => {
    const validated: ValidatedRow[] = rows.map((row, index) => {
      // Look for columns that might mean code/quantity
      const codeKey = Object.keys(row).find(k => k.toLowerCase().includes('code') || k.toLowerCase().includes('sku')) || Object.keys(row)[0];
      const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity')) || Object.keys(row)[1];

      const codeStr = row[codeKey]?.trim();
      const qtyStr = row[qtyKey]?.trim();

      if (!codeStr || !qtyStr) {
        return { code: codeStr || '', quantity: 0, isValid: false, error: 'Missing code or quantity' };
      }

      const quantity = parseFloat(qtyStr);
      if (isNaN(quantity)) {
        return { code: codeStr, quantity: 0, isValid: false, error: 'Invalid quantity format' };
      }

      const product = products.find(p => p.code.toLowerCase() === codeStr.toLowerCase());
      if (!product) {
        return { code: codeStr, quantity, isValid: false, error: 'Product code not found' };
      }

      if (importMode === 'REPLACE' && quantity < 0) {
        return { code: codeStr, quantity, isValid: false, error: 'Cannot replace with negative stock' };
      }

      return {
        code: codeStr,
        quantity,
        productId: product.id,
        productName: product.nameEnglish || product.nameBangla,
        currentStock: product.currentStock,
        isValid: true
      };
    });

    setValidatedRows(validated);
  };

  const handleModeChange = (mode: 'ADD' | 'REPLACE') => {
    setImportMode(mode);
    // Re-validate in case constraints changed
    if (validatedRows.length > 0) {
      setValidatedRows(prev => prev.map(row => {
        if (row.productId && mode === 'REPLACE' && row.quantity < 0) {
          return { ...row, isValid: false, error: 'Cannot replace with negative stock' };
        } else if (row.productId && mode === 'ADD' && row.error === 'Cannot replace with negative stock') {
          return { ...row, isValid: true, error: undefined };
        }
        return row;
      }));
    }
  };

  const handleImport = () => {
    const validAdjustments = validatedRows
      .filter(r => r.isValid && r.productId)
      .map(r => {
        const delta = importMode === 'REPLACE' 
          ? r.quantity - (r.currentStock || 0) 
          : r.quantity;
        return {
          productId: r.productId!,
          code: r.code,
          delta,
          newStock: importMode === 'REPLACE' ? r.quantity : (r.currentStock || 0) + r.quantity
        };
      });

    if (validAdjustments.length > 0) {
      setIsProcessing(true);
      onImport(validAdjustments, importMode);
      setIsProcessing(false);
      onClose();
      setValidatedRows([]);
    }
  };

  const validCount = validatedRows.filter(r => r.isValid).length;
  const invalidCount = validatedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">CSV Stock Import</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Import Mode</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'ADD'} 
                    onChange={() => handleModeChange('ADD')}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Adjust/Add Stock (Delta)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'REPLACE'} 
                    onChange={() => handleModeChange('REPLACE')}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Replace Current Stock</span>
                </label>
              </div>
              <p className="text-xs text-slate-500">
                {importMode === 'ADD' 
                  ? 'The quantity in CSV will be added to the current stock. Use negative values to reduce.' 
                  : 'The quantity in CSV will completely replace the current stock.'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Upload CSV File</label>
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden" 
                id="csv-upload"
              />
              <label 
                htmlFor="csv-upload"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl text-slate-700 font-bold text-sm cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                Select CSV File
              </label>
              <p className="text-[10px] text-slate-400">
                Requires header row with "code" (or "sku") and "quantity" columns.
              </p>
            </div>
          </div>

          {validatedRows.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Preview Data</h3>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> {validCount} Valid</span>
                  {invalidCount > 0 && (
                    <span className="text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> {invalidCount} Invalid</span>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="p-2 border-b">Status</th>
                      <th className="p-2 border-b">Code</th>
                      <th className="p-2 border-b">Product</th>
                      <th className="p-2 border-b text-right">CSV Qty</th>
                      <th className="p-2 border-b text-right">Resulting Stock</th>
                      <th className="p-2 border-b">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validatedRows.map((row, i) => (
                      <tr key={i} className={row.isValid ? 'bg-white' : 'bg-rose-50'}>
                        <td className="p-2">
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                          )}
                        </td>
                        <td className="p-2 font-mono text-slate-700">{row.code}</td>
                        <td className="p-2 text-slate-700">{row.productName || '-'}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">{row.quantity}</td>
                        <td className="p-2 text-right font-mono text-slate-600">
                          {row.isValid ? (
                            importMode === 'ADD' ? (row.currentStock || 0) + row.quantity : row.quantity
                          ) : '-'}
                        </td>
                        <td className="p-2 text-rose-600 max-w-[150px] truncate" title={row.error}>
                          {row.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={validCount === 0 || isProcessing}
            className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isProcessing ? 'Importing...' : `Import ${validCount} Items`}
          </button>
        </div>
      </div>
    </div>
  );
};
