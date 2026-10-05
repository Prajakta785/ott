import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
  color?: 'wine' | 'primary' | 'sakura' | 'terracotta' | 'matcha' | 'latte' | 'rose' | 'peach' | 'mint' | 'sky' | 'gold' | 'emerald' | 'blue' | 'indigo';
}

export function StatsCard({
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
  color = 'indigo',
}: StatsCardProps) {
  const colorStyles: Record<string, { border: string; iconBg: string; iconText: string; tagBg: string; tagText: string }> = {
    wine: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#FFF1F2] border-[#FFE4E6]',
      iconText: 'text-[#BE123C]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    rose: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#FFF1F2] border-[#FFE4E6]',
      iconText: 'text-[#E11D48]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    sakura: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#FFF1F2] border-[#FFE4E6]',
      iconText: 'text-[#BE123C]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    primary: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#FFF1F2] border-[#FFE4E6]',
      iconText: 'text-[#BE123C]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    gold: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#FFFBEB] border-[#FEF3C7]',
      iconText: 'text-[#D97706]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    peach: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#FFF1ED] border-[#FFD8CC]',
      iconText: 'text-[#EA580C]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    terracotta: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#FFF1ED] border-[#FFD8CC]',
      iconText: 'text-[#EA580C]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    matcha: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      iconText: 'text-[#166534]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    emerald: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      iconText: 'text-[#166534]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    latte: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#F5EFE6] border-[#E5DBCA]',
      iconText: 'text-[#7A6F68]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
    indigo: {
      border: 'border-[#E5DBCA] hover:border-[#D4A373]',
      iconBg: 'bg-[#FFF1ED] border-[#FFD8CC]',
      iconText: 'text-[#EA580C]',
      tagBg: 'bg-[#EAF5EF] border-[#B7E2CD]',
      tagText: 'text-[#166534]',
    },
  };

  const currentStyle = colorStyles[color] || colorStyles.peach;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-white border p-6 transition-all duration-300 group shadow-soft hover:shadow-soft-md hover:-translate-y-0.5',
        currentStyle.border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-[#7A6F68]">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-[#2D2522] mt-1.5 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-[#A89C94] mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3.5 rounded-2xl border transition-all duration-300 group-hover:scale-105 shadow-xs', currentStyle.iconBg, currentStyle.iconText)}>
          {icon}
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold">
          <span className={cn('flex items-center font-bold px-2.5 py-0.5 rounded-full border', currentStyle.tagBg, currentStyle.tagText)}>
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
            )}
            {change}
          </span>
          <span className="text-[#A89C94] text-[11px] font-medium ml-1">Live Metric</span>
        </div>
      )}
    </div>
  );
}
