'use client';

import React from 'react';

/**
 * Lightweight section-level skeleton loader.
 * Renders immediately when a route or section is being loaded,
 * without blocking the surrounding layout (sidebar, header, nav).
 */
export function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Header Banner Skeleton */}
      <div className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#E5DBCA]/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2.5 flex-1 max-w-md w-full">
          <div className="h-6 sm:h-7 bg-slate-200/80 rounded-xl w-3/4" />
          <div className="h-3.5 bg-slate-100 rounded-lg w-1/2" />
        </div>
        <div className="h-9 bg-slate-200/70 rounded-xl w-28 sm:w-36 shrink-0" />
      </div>

      {/* KPI Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DBCA]/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-slate-200/70 rounded w-20" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-6 bg-slate-200/90 rounded-lg w-28" />
            <div className="h-2.5 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5DBCA]/70 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="h-9 bg-slate-100 rounded-xl flex-1" />
        <div className="h-9 bg-slate-100 rounded-xl w-full sm:w-44" />
        <div className="h-9 bg-slate-100 rounded-xl w-full sm:w-32" />
      </div>

      {/* Catalog Table Skeleton */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5DBCA]/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="h-4 bg-slate-200/80 rounded w-36" />
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
        <div className="space-y-3 pt-1">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
              <div className="w-12 h-8 rounded-lg bg-slate-200/70 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-200/80 rounded w-2/5" />
                <div className="h-2.5 bg-slate-100 rounded w-1/4" />
              </div>
              <div className="h-3 bg-slate-100 rounded w-20 hidden sm:block" />
              <div className="h-5 bg-slate-100 rounded-full w-16" />
              <div className="h-6 bg-slate-100 rounded-lg w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight modal loading spinner fallback
 */
export function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl p-6 border border-[#E5DBCA] shadow-2xl flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-700">Loading component...</span>
      </div>
    </div>
  );
}
