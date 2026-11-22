'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-luxury space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto text-2xl font-black font-mono">
          404
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">
            पेज सापडले नाही (Page Not Found)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            तुम्ही शोधत असलेले पेज अस्तित्वात नाही किंवा बदलण्यात आले आहे.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>डॅशबोर्डवर परत जा</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
