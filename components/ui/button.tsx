import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold' | 'lavender' | 'peach' | 'sakura' | 'terracotta' | 'matcha';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl shadow-sm active:scale-[0.98]',
      sakura:
        'bg-gradient-to-r from-[#F472B6] to-[#FB7185] hover:from-[#EC4899] hover:to-[#F43F5E] text-white shadow-glow-sakura font-semibold active:scale-[0.98]',
      terracotta:
        'bg-gradient-to-r from-[#E07A5F] to-[#D4A373] hover:from-[#C8644A] hover:to-[#B07D4C] text-white shadow-glow-terracotta font-semibold active:scale-[0.98]',
      matcha:
        'bg-gradient-to-r from-[#4E876C] to-[#81B29A] hover:from-[#3C6C55] hover:to-[#6C9E85] text-white font-semibold shadow-sm active:scale-[0.98]',
      lavender:
        'bg-gradient-to-r from-[#A78BFA] to-[#818CF8] hover:from-[#8B5CF6] hover:to-[#6366F1] text-white font-semibold active:scale-[0.98]',
      peach:
        'bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold rounded-xl shadow-sm active:scale-[0.98]',
      gold:
        'bg-gradient-to-r from-[#D4A373] to-[#E07A5F] hover:from-[#B07D4C] hover:to-[#C8644A] text-white font-semibold active:scale-[0.98]',
      secondary:
        'bg-[#F5EFE6] hover:bg-[#EDE4D6] text-[#2D2522] border border-[#E5DBCA] rounded-xl font-medium active:scale-[0.98]',
      outline:
        'bg-white hover:bg-[#F5EFE6] text-[#2D2522] border border-[#E5DBCA] hover:border-[#D4A373] rounded-xl font-medium shadow-soft',
      ghost:
        'bg-transparent hover:bg-[#F5EFE6] text-[#7A6F68] hover:text-[#2D2522] rounded-xl',
      danger:
        'bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] border border-[#FCA5A5] rounded-xl font-medium',
    };

    const sizes = {
      sm: 'h-8 px-3.5 text-xs rounded-xl gap-1.5',
      md: 'h-9 px-4 text-xs font-bold rounded-xl gap-2',
      lg: 'h-11 px-6 text-sm font-bold rounded-xl gap-2.5',
      icon: 'h-9 w-9 p-0 rounded-xl justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#F472B6]/40',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
