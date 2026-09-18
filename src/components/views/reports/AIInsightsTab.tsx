import React, { useState } from 'react';
import { useERP } from '../../../context/ERPContext';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

export const AIInsightsTab: React.FC = () => {
  const { sales } = useERP();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Create a simplified version of sales to send to Gemini to save tokens
      const simplifiedSales = sales.map(s => ({
        date: s.date,
        total: s.grandTotal,
        items: s.items.map(i => ({
          name: i.productName,
          qty: i.quantity,
          revenue: i.total
        }))
      }));

      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ salesData: simplifiedSales }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `HTTP Error: ${response.status}`;
        
        if (errorMessage.includes('resource_exhausted') || errorMessage.includes('quota')) {
          errorMessage = "You have exceeded your Gemini API quota or rate limit. Please wait a minute and try again, or check your Google AI Studio billing details.";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while fetching insights.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs min-h-[400px]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI Business Insights
          </h2>
          <p className="text-sm text-slate-500">Get Gemini AI-powered analysis of your sales trends and future projections.</p>
        </div>
        
        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl transition-colors shadow-xs"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isLoading ? 'Analyzing Data...' : 'Generate Insights'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-800">Failed to generate insights</h4>
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        </div>
      )}

      {insights ? (
        <div className="prose prose-slate prose-sm sm:prose-base max-w-none bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="markdown-body">
            <Markdown>{insights}</Markdown>
          </div>
        </div>
      ) : (
        !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Unlock AI Projections</h3>
            <p className="text-slate-500 max-w-md text-sm">
              Click the button above to let Gemini analyze your historical sales, detect patterns, and project your revenue for the upcoming month.
            </p>
          </div>
        )
      )}
    </div>
  );
};
