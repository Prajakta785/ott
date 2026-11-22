'use client';

import React, { useEffect } from 'react';
import { RotateCw, LayoutDashboard, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Dashboard caught error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-luxury space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">
            काहीतरी चूक झाली (Something went wrong)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            डेटा लोड करताना तात्पुरती अडचण आली आहे. कृपया पुन्हा प्रयत्न करा किंवा डॅशबोर्डवर जा.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            <span>पुन्हा प्रयत्न करा (Try Again)</span>
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>डॅशबोर्ड</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
