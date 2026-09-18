import React, { useState } from 'react';
import { Employee, CompanySettings } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '../../utils/formatters';
import {
  Printer,
  Edit3,
  Check,
  X,
  CreditCard,
  Eye,
  Download,
  Share2,
  Users,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { printDocument } from '../../utils/printPdfUtils';

interface CompanyIDCardProps {
  employee: Employee;
  settings: CompanySettings;
  side?: 'FRONT' | 'BACK' | 'BOTH';
  onEditEmployee?: (emp: Employee) => void;
  readOnly?: boolean;
}

export const CompanyIDCard: React.FC<CompanyIDCardProps> = ({
  employee,
  settings,
  side = 'BOTH',
  onEditEmployee,
  readOnly = false,
}) => {
  // Format joining date to DD-MM-YYYY as shown in the PDF
  const formatCardDate = (dateStr?: string) => {
    if (!dateStr) return '16-07-2026';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const companyName = settings.companyNameEnglish || 'M/S SHARMIN Food';
  const companyAddress = settings.address || '112/2 Road No.8 Block-D Boyra, Housing Stret.';
  const factoryPhone = settings.phone || '01911-430457';
  const companyEmail = settings.email || 'mssharminfood21@gmail.com';
  const issueDateFormatted = employee.issueDate || '16-07-2026';
  const joiningDateFormatted = formatCardDate(employee.joinDate);
  const bloodGroup = employee.bloodGroup || 'B+';
  const nidNumber = employee.nid || '1992269458000012';
  const empIdCode = employee.code || employee.id.replace('EMP-', '') || '01';

  // QR Code payload for digital verification
  const qrPayload = JSON.stringify({
    company: companyName,
    id: employee.code || employee.id,
    name: employee.name,
    designation: employee.designation || employee.role || 'Staff',
    phone: employee.phone,
    blood: bloodGroup,
    issueDate: issueDateFormatted,
    verified: true,
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 select-none">
      {/* ============================================================ */}
      {/* 1. FRONT SIDE OF ID CARD                                    */}
      {/* ============================================================ */}
      {(side === 'FRONT' || side === 'BOTH') && (
        <div
          id={`id-card-front-${employee.id}`}
          className="id-card-element relative overflow-hidden bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/90 transition-all duration-200 hover:shadow-2xl print:shadow-none print:border print:border-slate-300 shrink-0"
          style={{
            width: '240px',
            height: '380px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Navy Header Block */}
          <div className="relative bg-[#121c56] text-white pt-2.5 px-3 pb-7 overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xs pointer-events-none" />

            {/* Top Bar: Left Logo, Center Pill "ID CARD", Right Badge */}
            <div className="flex items-center justify-between relative z-10 mb-1">
              {/* Left Logo / Icon */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 p-0.5 flex items-center justify-center shadow-xs">
                <div className="w-full h-full rounded-full bg-[#121c56] flex items-center justify-center text-[10px] font-black text-amber-300">
                  SF
                </div>
              </div>

              {/* Center Pill "ID CARD" */}
              <div className="px-2.5 py-0.5 rounded-full bg-[#0a113a] border border-blue-400/40 shadow-xs flex items-center justify-center">
                <span className="text-[9px] font-black tracking-widest text-white uppercase font-sans">
                  ID CARD
                </span>
              </div>

              {/* Right Emblem */}
              <div className="px-1 py-0.5 rounded bg-rose-600 border border-amber-400/50 text-[8px] font-extrabold text-amber-100 shadow-2xs tracking-tighter">
                SHARMIN
              </div>
            </div>

            {/* Company Name in Bold White */}
            <div className="text-center relative z-10">
              <h2 className="text-[13px] font-black tracking-wide text-white drop-shadow-xs uppercase font-sans">
                {companyName}
              </h2>
            </div>

            {/* Dynamic Wave Curves SVG (Yellow, Orange & Navy Blue Layers) */}
            <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none z-10">
              <svg
                viewBox="0 0 240 45"
                className="w-full h-11 block"
                preserveAspectRatio="none"
              >
                {/* Yellow wave layer */}
                <path
                  d="M0,25 C60,45 180,0 240,20 L240,45 L0,45 Z"
                  fill="#ffb703"
                />
                {/* Orange wave layer */}
                <path
                  d="M0,32 C70,10 170,45 240,15 L240,45 L0,45 Z"
                  fill="#f97316"
                />
                {/* Clean white bottom cut */}
                <path
                  d="M0,38 C80,48 160,25 240,36 L240,45 L0,45 Z"
                  fill="#ffffff"
                />
              </svg>
            </div>
          </div>

          {/* Photo Frame Section */}
          <div className="relative flex justify-center -mt-5 z-20">
            <div className="w-[78px] h-[88px] rounded-xl bg-white p-1 shadow-md border border-slate-100 relative">
              <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200">
                {employee.photoUrl ? (
                  <img
                    src={employee.photoUrl}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                    <Users className="w-8 h-8 text-slate-400 mb-0.5" />
                    <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">PHOTO</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employee Name & Designation */}
          <div className="text-center px-3 mt-1.5 z-20 relative">
            <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-wide leading-tight">
              {employee.name}
            </h3>
            <p className="text-[10px] font-bold text-slate-600 capitalize leading-tight mt-0.5">
              {employee.designation || employee.role || 'Marketing manager'}
            </p>
          </div>

          {/* Employee Info Fields Grid (Aligned Colons as per PDF) */}
          <div className="px-3.5 mt-2.5 space-y-1 text-[9.5px] leading-tight z-20 relative font-sans">
            <div className="flex items-center">
              <span className="w-[70px] font-semibold text-slate-700 shrink-0">Joining Date</span>
              <span className="font-bold text-slate-900 mx-1">:</span>
              <span className="font-bold text-slate-900 font-mono tracking-tight">{joiningDateFormatted}</span>
            </div>

            <div className="flex items-center">
              <span className="w-[70px] font-semibold text-slate-700 shrink-0">NID No</span>
              <span className="font-bold text-slate-900 mx-1">:</span>
              <span className="font-bold text-slate-900 font-mono tracking-tight truncate">{nidNumber}</span>
            </div>

            <div className="flex items-center">
              <span className="w-[70px] font-semibold text-slate-700 shrink-0">Mobile</span>
              <span className="font-bold text-slate-900 mx-1">:</span>
              <span className="font-bold text-slate-900 font-mono tracking-tight">{employee.phone || factoryPhone}</span>
            </div>

            <div className="flex items-center">
              <span className="w-[70px] font-semibold text-slate-700 shrink-0">Blood Group</span>
              <span className="font-bold text-slate-900 mx-1">:</span>
              <span className="font-bold text-rose-600 font-sans tracking-wide">{bloodGroup}</span>
            </div>

            <div className="flex items-center">
              <span className="w-[70px] font-semibold text-slate-700 shrink-0">ID No</span>
              <span className="font-bold text-slate-900 mx-1">:</span>
              <span className="font-black text-slate-900 font-mono">{empIdCode}</span>
            </div>
          </div>

          {/* Bottom Organic Wave Graphic (Vibrant Orange & Golden Yellow) */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
            <svg
              viewBox="0 0 240 40"
              className="w-full h-9 block"
              preserveAspectRatio="none"
            >
              {/* Yellow underlayer */}
              <path
                d="M0,40 L0,15 C60,35 160,0 240,25 L240,40 Z"
                fill="#ffb703"
              />
              {/* Orange top wave */}
              <path
                d="M0,40 L0,22 C70,10 180,40 240,12 L240,40 Z"
                fill="#f97316"
              />
            </svg>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. BACK SIDE OF ID CARD                                     */}
      {/* ============================================================ */}
      {(side === 'BACK' || side === 'BOTH') && (
        <div
          id={`id-card-back-${employee.id}`}
          className="id-card-element relative overflow-hidden bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/90 transition-all duration-200 hover:shadow-2xl print:shadow-none print:border print:border-slate-300 flex flex-col justify-between p-3.5 shrink-0"
          style={{
            width: '240px',
            height: '380px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Property Statement */}
          <div className="text-center relative z-20 pt-0.5">
            <p className="text-[9px] font-semibold text-slate-700 leading-tight">
              This ID card is the property of
            </p>
            <p className="text-[9.5px] font-bold text-slate-900 leading-tight">
              <span className="font-black">{companyName}</span> & is not
            </p>
            <p className="text-[9.5px] font-bold text-slate-900 leading-tight">
              Transferable.
            </p>

            {/* Issue Date Box */}
            <div className="mt-1.5 inline-block px-3 py-0.5 border border-slate-400/80 rounded-md bg-slate-50/70 shadow-2xs">
              <p className="text-[9px] font-bold text-slate-800 font-mono tracking-tight">
                Issue Date : {issueDateFormatted}
              </p>
            </div>
          </div>

          {/* Return Info Box */}
          <div className="text-center relative z-20 -mt-1">
            <p className="text-[8.5px] font-medium text-slate-600 leading-tight">
              If found please return to:
            </p>
            <h4 className="text-[12px] font-black text-rose-600 uppercase tracking-wide leading-tight mt-0.5">
              {companyName}
            </h4>
            <p className="text-[8.5px] font-medium text-slate-700 leading-tight mt-0.5 px-1">
              {companyAddress}
            </p>
            <p className="text-[8.5px] font-bold text-slate-800 leading-tight mt-0.5 font-mono">
              Factory No : {factoryPhone}
            </p>
            <p className="text-[8px] font-medium text-slate-600 leading-tight truncate px-1">
              E-mail : {companyEmail}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center relative z-20 my-1">
            <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-xs">
              <QRCodeSVG
                value={qrPayload}
                size={68}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Authorized Signature Section */}
          <div className="text-center relative z-20 pb-0.5">
            {/* Stylized Signature Script SVG */}
            <div className="h-6 flex items-center justify-center">
              <svg
                viewBox="0 0 100 24"
                className="w-20 h-5 text-slate-800"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5,16 Q20,3 35,12 T65,8 Q80,18 95,10" />
                <path d="M22,14 Q30,19 45,15" />
                <path d="M70,14 L85,16" />
              </svg>
            </div>
            {/* Signature Line & Text */}
            <div className="w-32 mx-auto border-t border-slate-400/80 pt-0.5">
              <p className="text-[8.5px] font-semibold text-slate-700">
                Authorized Signature
              </p>
            </div>
          </div>

          {/* Dynamic Background Waves for Back (Lavender, Orange & Yellow swooshes) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden opacity-90">
            <svg
              viewBox="0 0 240 380"
              className="w-full h-full block"
              preserveAspectRatio="none"
            >
              {/* Lavender / Violet curve swoosh */}
              <path
                d="M0,280 C60,260 120,330 180,310 C220,295 240,320 240,350 L240,380 L0,380 Z"
                fill="#ede9fe"
                fillOpacity="0.8"
              />
              {/* Golden Yellow wave curve */}
              <path
                d="M0,320 C80,290 140,360 240,320 L240,380 L0,380 Z"
                fill="#fef08a"
                fillOpacity="0.75"
              />
              {/* Vibrant Orange swoosh accent */}
              <path
                d="M100,380 C150,330 200,360 240,335 L240,380 Z"
                fill="#f97316"
                fillOpacity="0.85"
              />
              {/* Top left subtle decorative accent */}
              <path
                d="M0,0 L60,0 C30,40 10,60 0,90 Z"
                fill="#ffedd5"
                fillOpacity="0.6"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
