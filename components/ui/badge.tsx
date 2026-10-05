import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'sakura' | 'rose' | 'terracotta' | 'peach' | 'matcha' | 'mint' | 'latte' | 'gold' | 'emerald' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md';
}

export function Badge({ 
  className, 
  variant = 'default', 
  size = 'sm', 
  children, 
  ...props 
}: BadgeProps) {
  const variants = {
    default: 'bg-[#F5EFE6] text-[#6E6259] border border-[#E5DBCA]',
    primary: 'bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]',
    sakura: 'bg-[#FDF2F8] text-[#BE185D] border border-[#FBCFE8]',
    rose: 'bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]',
    terracotta: 'bg-[#FFF1ED] text-[#C2410C] border border-[#FFD8CC]',
    peach: 'bg-[#FFF1ED] text-[#C2410C] border border-[#FFD8CC]',
    matcha: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]',
    mint: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]',
    latte: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
    gold: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
    emerald: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]',
    secondary: 'bg-[#F5EFE6] text-[#7A6F68] border border-[#E5DBCA]',
    outline: 'border border-[#E5DBCA] text-[#7A6F68] bg-white/60',
    danger: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-medium',
    md: 'text-sm px-3 py-1 rounded-full font-medium',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 transition-colors', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
