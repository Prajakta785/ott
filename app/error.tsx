'use client';

import React, { useEffect } from 'react';
import { RotateCw, Home, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root application caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-luxury space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-7 h-7 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">
            काहीतरी अडचण आली आहे (System Notice)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            पेज लोड करताना तात्पुरती समस्या आली. कृपया 'पुन्हा लोड करा' बटनावर क्लिक करा.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            <span>पुन्हा लोड करा (Reload)</span>
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य पान (Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
