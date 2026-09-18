import React, { useState, useMemo } from 'react';
import { DataExportToolbar } from '../common/DataExportToolbar';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Truck,
  ShoppingBag,
  PackageCheck,
  Plus,
  Search,
  Download,
  Fuel,
  MapPin,
  CheckCircle2,
  Calendar,
  Printer,
  Share2,
  X,
  FileText,
  Building2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

import { TransportMapView } from './TransportMapView';

export const TransportView: React.FC = () => {
  const { transportTrips, addTransportTrip, sales, purchases, suppliers, customers, settings } = useERP();

  // Sub-section tab: 'PURCHASE' | 'SALES' | 'ALL' | 'MAP'
  const [activeTab, setActiveTab] = useState<'PURCHASE' | 'SALES' | 'ALL' | 'MAP'>('PURCHASE');
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewTrip, setPreviewTrip] = useState<any | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleSoftReset = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setActiveTab('PURCHASE');
  };

  // Form State
  const [tripType, setTripType] = useState<'PURCHASE' | 'SALES'>('PURCHASE');
  const [tripDate, setTripDate] = useState(new Date().toISOString().substring(0, 10));
  const [vehicleNo, setVehicleNo] = useState('ঢাকা মেট্রো-ন ১২-৩৪৫৬');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [routeFrom, setRouteFrom] = useState('সাপ্লায়ার ফ্যাক্টরি');
  const [routeTo, setRouteTo] = useState(settings.factoryAddress || `${settings.companyNameBangla} ফ্যাক্টরি`);
  const [fuelCost, setFuelCost] = useState<number>(1500);
  const [tollCost, setTollCost] = useState<number>(300);
  const [laborCost, setLaborCost] = useState<number>(400);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedPurchaseBill, setSelectedPurchaseBill] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSalesInvoice, setSelectedSalesInvoice] = useState('');
  const [gatePassNo, setGatePassNo] = useState('');
  const [notes, setNotes] = useState('');

  // Segregate trips
  const purchaseTrips = useMemo(() => {
    return transportTrips.filter(t => t.transportType === 'PURCHASE' || t.purpose === 'PURCHASE_PICKUP');
  }, [transportTrips]);

  const salesTrips = useMemo(() => {
    return transportTrips.filter(t => t.transportType === 'SALES' || (t.transportType !== 'PURCHASE' && t.purpose !== 'PURCHASE_PICKUP'));
  }, [transportTrips]);

  // Current view trips based on active tab
  const currentTrips = useMemo(() => {
    let list = activeTab === 'PURCHASE' ? purchaseTrips : activeTab === 'SALES' ? salesTrips : transportTrips;

    return list.filter(t => {
      const matchSearch =
        t.tripNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.routeTo && t.routeTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.supplierName && t.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.purchaseBillNo && t.purchaseBillNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.salesInvoiceNo && t.salesInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDateFrom = !dateFrom || t.date >= dateFrom;
      const matchDateTo = !dateTo || t.date <= dateTo;

      return matchSearch && matchDateFrom && matchDateTo;
    });
  }, [activeTab, purchaseTrips, salesTrips, transportTrips, searchTerm, dateFrom, dateTo]);

  // Metrics
  const totalPurchaseExpenses = purchaseTrips.reduce((sum, t) => sum + (t.totalCost || t.totalTripCost || 0), 0);
  const totalSalesExpenses = salesTrips.reduce((sum, t) => sum + (t.totalCost || t.totalTripCost || 0), 0);
  const totalAllExpenses = totalPurchaseExpenses + totalSalesExpenses;

  // Supplier Purchase Transport Rollup (Party-wise summary per revised rules)
  const supplierPurchaseSummary = useMemo(() => {
    const map = new Map<string, {
      supplierId: string;
      supplierName: string;
      tripCount: number;
      totalCost: number;
      lastDate: string;
    }>();

    purchaseTrips.forEach(t => {
      const name = t.supplierName || 'সাধারণ / নন-লিস্টেড সাপ্লায়ার';
      const id = t.supplierId || name;
      const cost = t.totalCost || t.totalTripCost || 0;
      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          supplierId: id,
          supplierName: name,
          tripCount: 1,
          totalCost: cost,
          lastDate: t.date,
        });
      } else {
        existing.tripCount += 1;
        existing.totalCost += cost;
        if (t.date > existing.lastDate) existing.lastDate = t.date;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);
  }, [purchaseTrips]);

  const handleOpenAddModal = (type: 'PURCHASE' | 'SALES') => {
    setTripType(type);
    if (type === 'PURCHASE') {
      setRouteFrom('সাপ্লায়ার গুদাম / পোর্ট');
      setRouteTo(settings.factoryAddress || `${settings.companyNameBangla} ফ্যাক্টরি`);
    } else {
      setRouteFrom(settings.factoryAddress || `${settings.companyNameBangla} ফ্যাক্টরি`);
      setRouteTo('গ্রাহক ডেলিভারি পয়েন্ট / শোরুম');
    }
    setShowAddModal(true);
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !routeTo.trim()) return;

    const supplierObj = suppliers.find(s => s.id === selectedSupplierId);
    const customerObj = customers.find(c => c.id === selectedCustomerId);

    addTransportTrip({
      date: tripDate,
      vehicleNo: vehicleNo.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      routeFrom: routeFrom.trim(),
      routeTo: routeTo.trim(),
      destination: `${routeFrom} ➔ ${routeTo}`,
      fuelCost,
      tollCost,
      laborCost,
      otherCost,
      costFuel: fuelCost,
      costTollOther: tollCost + otherCost,
      totalCost: fuelCost + tollCost + laborCost + otherCost,
      totalTripCost: fuelCost + tollCost + laborCost + otherCost,
      transportType: tripType,
      purpose: tripType === 'PURCHASE' ? 'PURCHASE_PICKUP' : 'DELIVERY',
      supplierId: tripType === 'PURCHASE' ? selectedSupplierId || undefined : undefined,
      supplierName: tripType === 'PURCHASE' ? supplierObj?.name : undefined,
      purchaseBillNo: tripType === 'PURCHASE' ? selectedPurchaseBill || undefined : undefined,
      customerId: tripType === 'SALES' ? selectedCustomerId || undefined : undefined,
      customerName: tripType === 'SALES' ? customerObj?.name : undefined,
      salesInvoiceNo: tripType === 'SALES' ? selectedSalesInvoice || undefined : undefined,
      gatePassNo: gatePassNo.trim() || undefined,
      associatedInvoiceNo: tripType === 'SALES' ? selectedSalesInvoice : selectedPurchaseBill,
      paidVia: 'CASH',
      status: 'COMPLETED',
      notes: notes.trim() || undefined,
    });

    setShowAddModal(false);
    setDriverName('');
    setNotes('');
  };

  const handleExportCSV = () => {
    const headers = [
      'Trip No',
      'Category',
      'Date',
      'Vehicle No',
      'Driver',
      'Party Ref',
      'Bill/Invoice Ref',
      'Route',
      'Fuel Cost',
      'Toll/Labor',
      'Total Cost',
    ];
    const rows = currentTrips.map(t => [
      t.tripNo,
      t.transportType === 'PURCHASE' ? 'Purchase Transport (Landed/COGS)' : 'Sales Transport (OpEx)',
      t.date,
      t.vehicleNo,
      t.driverName,
      t.transportType === 'PURCHASE' ? t.supplierName || '-' : t.customerName || '-',
      t.transportType === 'PURCHASE' ? t.purchaseBillNo || '-' : t.salesInvoiceNo || '-',
      `${t.routeFrom || ''} -> ${t.routeTo || t.destination || ''}`,
      t.fuelCost || t.costFuel || 0,
      (t.tollCost || 0) + (t.laborCost || 0) + (t.costTollOther || 0),
      t.totalCost || t.totalTripCost || 0,
    ]);
    exportToCSV(`Transport_Report_${activeTab}_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handleShareWhatsApp = (trip: any) => {
    const isPurchase = trip.transportType === 'PURCHASE';
    const msg = `*${settings.companyNameBangla} - পরিবহন খরচ ভাউচার*
-----------------------------
ট্রিপ নম্বর: ${trip.tripNo}
ধরন: ${isPurchase ? 'ক্রয় পরিবহন (Landed Cost / COGS)' : 'বিক্রয় পরিবহন (Operating Expense)'}
তারিখ: ${formatDate(trip.date)}
যানবাহন: ${trip.vehicleNo}
চালক: ${trip.driverName} (${trip.driverPhone || 'N/A'})
রুট: ${trip.routeFrom || '-'} ➔ ${trip.routeTo || trip.destination || '-'}
${isPurchase && trip.supplierName ? `সাপ্লায়ার: ${trip.supplierName}\nবিল নং: ${trip.purchaseBillNo || 'N/A'}\n` : ''}
${!isPurchase && trip.customerName ? `কাস্টমার: ${trip.customerName}\nইনভয়েস নং: ${trip.salesInvoiceNo || 'N/A'}\n` : ''}
${trip.gatePassNo ? `গেট পাস নং: ${trip.gatePassNo}\n` : ''}-----------------------------
ফুয়েল খরচ: ${formatCurrency(trip.fuelCost || trip.costFuel || 0)}
টোল ও লেবার: ${formatCurrency((trip.tollCost || 0) + (trip.laborCost || 0) + (trip.costTollOther || 0))}
*সর্বমোট খরচ: ${formatCurrency(trip.totalCost || trip.totalTripCost || 0)}*
-----------------------------
নোট: ${trip.notes || 'সফলভাবে সম্পন্ন'}`;

    const phone = trip.driverPhone ? trip.driverPhone.replace(/[^0-9]/g, '') : '';
    const url = phone.length >= 10
      ? `https://wa.me/880${phone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-700" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              পরিবহন ও লজিস্টিকস খরচ (Transport Logistics)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            সংশোধিত নীতি: ক্রয় পরিবহন খরচ কোম্পানি বহন করে এবং পার্টি/সাপ্লায়ার-ভিত্তিক পৃথক ট্র্যাকিং হিসেবে থাকে (COGS-এ অটো যোগ হয় না)। বিক্রয় পরিবহন প্রতিটি ইনভয়েসে ঐচ্ছিক কর্তন (অপারেটিং খরচ)।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV ডাউনলোড
          </button>
          <button
            onClick={() => handleOpenAddModal('PURCHASE')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            + ক্রয় পরিবহন (Landed)
          </button>
          <button
            onClick={() => handleOpenAddModal('SALES')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            + বিক্রয় পরিবহন (OpEx)
          </button>
        </div>
      </div>

      {/* KPI Cards: Separating Purchase Transport vs Sales Transport */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Purchase Transport (Landed Cost / COGS) */}
        <div
          onClick={() => setActiveTab('PURCHASE')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'PURCHASE'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              ক্রয় পরিবহন (পার্টি-ভিত্তিক ট্র্যাকিং)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900">
              {purchaseTrips.length} টি ট্রিপ
            </span>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2 font-mono">
            {formatCurrency(totalPurchaseExpenses)}
          </div>
          <p className="text-[11px] text-amber-800/80 mt-1 font-medium">
            কোম্পানি বাহিত খরচ — পণ্যের ক্রয়মূল্যে যোগ হবে না, পার্টি-ভিত্তিক আলাদা ট্র্যাকিং রিপোর্ট
          </p>
        </div>

        {/* Card 2: Sales Transport (Operating Expense) */}
        <div
          onClick={() => setActiveTab('SALES')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'SALES'
              ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-teal-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-teal-600" />
              বিক্রয় পরিবহন (Operating Expense)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-900">
              {salesTrips.length} টি ট্রিপ
            </span>
          </div>
          <div className="text-2xl font-black text-teal-950 mt-2 font-mono">
            {formatCurrency(totalSalesExpenses)}
          </div>
          <p className="text-[11px] text-teal-800/80 mt-1 font-medium">
            কাস্টমার শোরুমে ডেলিভারি ভাড়া (P&L-এর অপারেটিং খরচে যোগ)
          </p>
        </div>

        {/* Card 3: Combined Summary */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'ALL'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-slate-600" />
              সর্বমোট লজিস্টিকস ও পরিবহন ব্যয়
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-800">
              {transportTrips.length} টি মোট
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(totalAllExpenses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>ক্রয়: {((totalPurchaseExpenses / (totalAllExpenses || 1)) * 100).toFixed(0)}%</span>
            <span>বিক্রয়: {((totalSalesExpenses / (totalAllExpenses || 1)) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Sub-section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('PURCHASE')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'PURCHASE'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ক্রয় পরিবহন তালিকা (Purchase Transport - Landed)</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'PURCHASE' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-800'}`}>
            {purchaseTrips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SALES')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'SALES'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>বিক্রয় পরিবহন তালিকা (Sales Transport - OpEx)</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'SALES' ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-800'}`}>
            {salesTrips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'ALL'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>সকল পরিবহন ট্রিপ (All Trips)</span>
        </button>

        <button
          onClick={() => setActiveTab('MAP')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'MAP'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>লাইভ ম্যাপ (Map Tracking)</span>
        </button>
      </div>

      {activeTab === 'MAP' ? (
        <TransportMapView />
      ) : (
        <>
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ট্রিপ নং, চালক, গাড়ির নম্বর, পার্টি বা রুট দিয়ে সার্চ করুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
            <span>শুরু:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
            <span>শেষ:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          {(dateFrom || dateTo || searchTerm) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearchTerm('');
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-xs hover:bg-slate-100"
              title="ফিল্টার মুছুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            id="btn-transport-soft-reset"
            onClick={handleSoftReset}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
            title="পরিবহন ফিল্টার ও সার্চ রিসেট করুন (Soft Reset)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Supplier-wise Purchase Transport Summary Rollup (Active when viewing Purchase or All) */}
      {(activeTab === 'PURCHASE' || activeTab === 'ALL') && supplierPurchaseSummary.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-950 text-xs sm:text-sm">
                সাপ্লায়ার ও পার্টি-ভিত্তিক ক্রয় পরিবহন ট্র্যাকিং সারসংক্ষেপ (Party-wise Purchase Transport Summary)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              মোট সাপ্লায়ার: {supplierPurchaseSummary.length} জন
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="p-4 pb-0"><DataExportToolbar filename="TransportView_Export" /></div>
<table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-100/60 text-amber-900 font-bold border-b border-amber-200 text-[11px]">
                  <th className="py-2.5 px-4">সাপ্লায়ার / পার্টি নাম</th>
                  <th className="py-2.5 px-4 text-center">মোট চালান / ট্রিপ</th>
                  <th className="py-2.5 px-4 text-right">কোম্পানি বাহিত মোট পরিবহন খরচ</th>
                  <th className="py-2.5 px-4 text-center">সর্বশেষ ট্রিপ</th>
                  <th className="py-2.5 px-4 text-center">হিসাব নীতি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/70">
                {supplierPurchaseSummary.map((s, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{s.supplierName}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-700">{s.tripCount} টি</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-900">{formatCurrency(s.totalCost)}</td>
                    <td className="py-2.5 px-4 text-center text-slate-600 font-mono text-[11px]">{formatDate(s.lastDate)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                        আলাদা রিপোর্ট (পণ্যে অটো যোগ নয়)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Professional Accounting Style Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="p-4 pb-0"><DataExportToolbar filename="TransportView_Export" /></div>
<table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 font-bold uppercase tracking-wider text-[11px] border-b-2 border-slate-300">
                <th className="py-3 px-3.5 border-r border-slate-200">ট্রিপ নং ও তারিখ</th>
                <th className="py-3 px-3.5 border-r border-slate-200">শ্রেণি / হিসাব খাত</th>
                <th className="py-3 px-3.5 border-r border-slate-200">গাড়ি ও ড্রাইভার</th>
                <th className="py-3 px-3.5 border-r border-slate-200">পার্টি ও রেফারেন্স</th>
                <th className="py-3 px-3.5 border-r border-slate-200">রুট (From ➔ To)</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-200">ফুয়েল খরচ</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-200">টোল/লেবার</th>
                <th className="py-3 px-3.5 text-right border-r border-slate-200 bg-slate-200/50">মোট পরিবহন খরচ</th>
                <th className="py-3 px-3 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentTrips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    কোনো পরিবহন ট্রিপ রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                currentTrips.map(trip => {
                  const isPurchase = trip.transportType === 'PURCHASE' || trip.purpose === 'PURCHASE_PICKUP';
                  const total = trip.totalCost || trip.totalTripCost || 0;
                  const fuel = trip.fuelCost ?? trip.costFuel ?? 0;
                  const other = (trip.tollCost || 0) + (trip.laborCost || 0) + (trip.costTollOther || 0) + (trip.otherCost || 0);

                  return (
                    <tr key={trip.id} className="hover:bg-teal-50/40 transition-colors even:bg-slate-50/50">
                      {/* Trip No & Date */}
                      <td className="py-3 px-3.5 border-r border-slate-200">
                        <div className="font-mono font-bold text-teal-800">{trip.tripNo}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(trip.date)}
                        </div>
                      </td>

                      {/* Classification Badge */}
                      <td className="py-3 px-3.5 border-r border-slate-200">
                        {isPurchase ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <ShoppingBag className="w-3 h-3 text-amber-700" />
                            ক্রয় (পার্টি ট্র্যাকিং)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                            <Truck className="w-3 h-3 text-teal-700" />
                            বিক্রয় (OpEx)
                          </span>
                        )}
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="py-3 px-3.5 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{trip.vehicleNo}</div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          {trip.driverName} {trip.driverPhone && <span className="font-mono text-slate-400">({trip.driverPhone})</span>}
                        </div>
                      </td>

                      {/* Party & Reference */}
                      <td className="py-3 px-3.5 border-r border-slate-200">
                        {isPurchase ? (
                          <div>
                            <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                              {trip.supplierName || 'সাপ্লায়ার বিল'}
                            </div>
                            <div className="font-mono text-[10px] text-amber-700">
                              {trip.purchaseBillNo ? `বিল: ${trip.purchaseBillNo}` : 'সাধারণ আমদানি'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                              {trip.customerName || 'কাস্টমার ডেলিভারি'}
                            </div>
                            <div className="font-mono text-[10px] text-teal-700">
                              {trip.salesInvoiceNo ? `ইনভয়েস: ${trip.salesInvoiceNo}` : '-'}
                              {trip.gatePassNo && ` | গেট পাস: ${trip.gatePassNo}`}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Route */}
                      <td className="py-3 px-3.5 border-r border-slate-200">
                        <div className="text-slate-700 text-[11px]">
                          <span className="text-slate-500">{trip.routeFrom || 'উৎস'}</span>
                          <span className="mx-1 text-slate-400">➔</span>
                          <span className="font-semibold text-slate-900">{trip.routeTo || trip.destination || 'গন্তব্য'}</span>
                        </div>
                      </td>

                      {/* Fuel */}
                      <td className="py-3 px-3.5 text-right font-mono text-slate-700 border-r border-slate-200">
                        {formatCurrency(fuel)}
                      </td>

                      {/* Toll/Labor */}
                      <td className="py-3 px-3.5 text-right font-mono text-slate-700 border-r border-slate-200">
                        {formatCurrency(other)}
                      </td>

                      {/* Total Cost */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200 bg-slate-50">
                        <span className="text-sm font-black text-slate-950">{formatCurrency(total)}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPreviewTrip(trip)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="প্রিন্ট / ভিউ ভাউচার"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(trip)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="হোয়াটসঅ্যাপে পাঠান"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className={`p-4 text-white flex items-center justify-between ${
              tripType === 'PURCHASE' ? 'bg-amber-800' : 'bg-teal-800'
            }`}>
              <div className="flex items-center gap-2">
                {tripType === 'PURCHASE' ? <ShoppingBag className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                <div>
                  <h3 className="font-bold text-base">
                    {tripType === 'PURCHASE'
                      ? 'নতুন ক্রয় পরিবহন এন্ট্রি (Landed Cost / COGS)'
                      : 'নতুন বিক্রয় পরিবহন এন্ট্রি (Operating Expense)'}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    {tripType === 'PURCHASE'
                      ? 'সাপ্লায়ার থেকে কাঁচামাল আনার খরচ সরাসরি প্রোডাক্ট কস্টে যুক্ত হবে'
                      : 'কাস্টমার শোরুমে ডেলিভারি দেওয়ার পরিবহন খরচ P&L-এর অপারেটিং খরচে যুক্ত হবে'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-5 space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTripType('PURCHASE')}
                  className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tripType === 'PURCHASE' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  ক্রয় পরিবহন (Landed/COGS)
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('SALES')}
                  className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tripType === 'SALES' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  বিক্রয় পরিবহন (OpEx)
                </button>
              </div>

              {/* Date & Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={tripDate}
                    onChange={e => setTripDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">গাড়ির নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Driver Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">চালকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="যেমন: জামাল হোসেন"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">চালকের মোবাইল</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    placeholder="01711-xxxxxx"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Specific Party Selection based on Trip Type */}
              {tripType === 'PURCHASE' ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">সাপ্লায়ার (ঐচ্ছিক)</label>
                    <select
                      value={selectedSupplierId}
                      onChange={e => setSelectedSupplierId(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg"
                    >
                      <option value="">সাপ্লায়ার নির্বাচন করুন...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">পারচেজ বিল নং (ঐচ্ছিক)</label>
                    <select
                      value={selectedPurchaseBill}
                      onChange={e => setSelectedPurchaseBill(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-mono"
                    >
                      <option value="">পারচেজ বিল নির্বাচন করুন...</option>
                      {purchases.map(p => (
                        <option key={p.id} value={p.billNo}>{p.billNo} ({formatCurrency(p.grandTotal)})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                  <div>
                    <label className="block font-semibold text-teal-900 mb-1">কাস্টমার (ঐচ্ছিক)</label>
                    <select
                      value={selectedCustomerId}
                      onChange={e => setSelectedCustomerId(e.target.value)}
                      className="w-full p-2 bg-white border border-teal-200 rounded-lg"
                    >
                      <option value="">কাস্টমার নির্বাচন করুন...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-teal-900 mb-1">সেলস ইনভয়েস নং (ঐচ্ছিক)</label>
                    <select
                      value={selectedSalesInvoice}
                      onChange={e => setSelectedSalesInvoice(e.target.value)}
                      className="w-full p-2 bg-white border border-teal-200 rounded-lg font-mono"
                    >
                      <option value="">সেলস চালান নির্বাচন করুন...</option>
                      {sales.map(s => (
                        <option key={s.id} value={s.invoiceNo}>{s.invoiceNo} ({s.customerName})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Route */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">কোথা থেকে (From) *</label>
                  <input
                    type="text"
                    required
                    value={routeFrom}
                    onChange={e => setRouteFrom(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">কোথায় পৌঁছাবে (To) *</label>
                  <input
                    type="text"
                    required
                    value={routeTo}
                    onChange={e => setRouteTo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-4 gap-2 border border-slate-200 p-3 rounded-xl bg-slate-50">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ফুয়েল/গ্যাস</label>
                  <input
                    type="number"
                    min="0"
                    value={fuelCost}
                    onChange={e => setFuelCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">টোল/ব্রিজ</label>
                  <input
                    type="number"
                    min="0"
                    value={tollCost}
                    onChange={e => setTollCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">লেবার/টিপস</label>
                  <input
                    type="number"
                    min="0"
                    value={laborCost}
                    onChange={e => setLaborCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অন্যান্য</label>
                  <input
                    type="number"
                    min="0"
                    value={otherCost}
                    onChange={e => setOtherCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right"
                  />
                </div>
              </div>

              {/* Gate Pass & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">গেট পাস নং (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={gatePassNo}
                    onChange={e => setGatePassNo(e.target.value)}
                    placeholder="যেমন: GP-2026-001"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মন্তব্য / বিবরণ</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="লোড-আনলোড বা বিশেষ নোট"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                <span className="font-bold text-slate-700">মোট পরিবহন খরচ:</span>
                <span className="font-mono text-lg font-black text-slate-900">
                  {formatCurrency(fuelCost + tollCost + laborCost + otherCost)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-bold text-white rounded-xl shadow-xs transition-colors ${
                    tripType === 'PURCHASE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                >
                  {tripType === 'PURCHASE' ? 'ক্রয় পরিবহন সংরক্ষণ করুন' : 'বিক্রয় পরিবহন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Letterhead Modal */}
      {previewTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Top Toolbar */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm">পরিবহন খরচ বিল ও ভাউচার প্রিভিউ</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareWhatsApp(previewTrip)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট
                </button>
                <button
                  onClick={() => setPreviewTrip(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead Print Area */}
            <div className="p-8 space-y-6 text-slate-800" id="transport-letterhead-print">
              {/* Header Letterhead */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-contain mx-auto mb-2 rounded border border-slate-200 p-0.5"
                  />
                )}
                <h1 className="text-2xl font-black tracking-tight text-slate-900">{settings.companyNameBangla}</h1>
                <p className="text-xs text-slate-600 mt-0.5">{settings.address} | ফোন: {settings.phone} | ইমেইল: {settings.email}</p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                  {previewTrip.transportType === 'PURCHASE'
                    ? 'ক্রয় পরিবহন ট্র্যাকিং ভাউচার (সাপ্লায়ার লজিস্টিকস)'
                    : 'বিক্রয় পরিবহন ব্যয় ভাউচার (Operating Expense)'}
                </div>
              </div>

              {/* Trip Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                <div className="space-y-1">
                  <div><span className="text-slate-500 font-semibold">ট্রিপ নম্বর:</span> <span className="font-mono font-bold text-slate-900">{previewTrip.tripNo}</span></div>
                  <div><span className="text-slate-500 font-semibold">তারিখ:</span> <span className="font-medium text-slate-800">{formatDate(previewTrip.date)}</span></div>
                  <div><span className="text-slate-500 font-semibold">গাড়ির নম্বর:</span> <span className="font-bold text-slate-900">{previewTrip.vehicleNo}</span></div>
                  <div><span className="text-slate-500 font-semibold">চালক:</span> <span className="text-slate-800">{previewTrip.driverName} ({previewTrip.driverPhone || 'N/A'})</span></div>
                </div>

                <div className="space-y-1 text-right">
                  {previewTrip.transportType === 'PURCHASE' ? (
                    <>
                      <div><span className="text-slate-500 font-semibold">সাপ্লায়ার:</span> <span className="font-bold text-slate-900">{previewTrip.supplierName || 'সাধারণ আমদানি'}</span></div>
                      <div><span className="text-slate-500 font-semibold">পারচেজ বিল:</span> <span className="font-mono text-slate-800">{previewTrip.purchaseBillNo || '-'}</span></div>
                    </>
                  ) : (
                    <>
                      <div><span className="text-slate-500 font-semibold">কাস্টমার:</span> <span className="font-bold text-slate-900">{previewTrip.customerName || 'শোরুম ডেলিভারি'}</span></div>
                      <div><span className="text-slate-500 font-semibold">সেলস ইনভয়েস:</span> <span className="font-mono text-slate-800">{previewTrip.salesInvoiceNo || '-'}</span></div>
                    </>
                  )}
                  {previewTrip.gatePassNo && (
                    <div><span className="text-slate-500 font-semibold">গেট পাস নং:</span> <span className="font-mono font-bold text-teal-800">{previewTrip.gatePassNo}</span></div>
                  )}
                  <div><span className="text-slate-500 font-semibold">রুট:</span> <span className="font-medium">{previewTrip.routeFrom || '-'} ➔ {previewTrip.routeTo || previewTrip.destination || '-'}</span></div>
                </div>
              </div>

              {/* Expense Breakdown Table */}
              <table className="w-full text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-2.5 px-3 text-left">ব্যয়ের খাত (Expense Head)</th>
                    <th className="py-2.5 px-3 text-right">পরিমাণ (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-3">ফুয়েল / সিএনজি / গ্যাস খরচ</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(previewTrip.fuelCost ?? previewTrip.costFuel ?? 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">টোল ও ফেরি ভাড়া</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(previewTrip.tollCost ?? 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">লেবার ও আনলোডিং / টিপস</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(previewTrip.laborCost ?? 0)}</td>
                  </tr>
                  {(previewTrip.otherCost > 0 || previewTrip.costTollOther > 0) && (
                    <tr>
                      <td className="py-2 px-3">অন্যান্য আনুষঙ্গিক খরচ</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(previewTrip.otherCost || previewTrip.costTollOther || 0)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-bold text-sm">
                    <td className="py-2.5 px-3">সর্বমোট খরচ</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black">{formatCurrency(previewTrip.totalCost || previewTrip.totalTripCost || 0)}</td>
                  </tr>
                </tbody>
              </table>

              {previewTrip.notes && (
                <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700">মন্তব্য: </span>
                  <span className="text-slate-600">{previewTrip.notes}</span>
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-12 text-center text-xs">
                <div className="border-t border-slate-400 pt-1 font-medium text-slate-600">চালকের স্বাক্ষর</div>
                <div className="border-t border-slate-400 pt-1 font-medium text-slate-600">লজিস্টিকস ইনচার্জ</div>
                <div className="border-t border-slate-400 pt-1 font-medium text-slate-600">হিসাব বিভাগ অনুমোদন</div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    )}
    </div>
  );
};
