'use client';

import React from 'react';

export type ArcadeButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'tabActive'
  | 'tabInactive';

export interface ArcadeButtonProps {
  label: string;
  onClick: () => void;
  variant?: ArcadeButtonVariant;
  icon?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const VARIANT_CLASSES: Record<ArcadeButtonVariant, string> = {
  primary:
    'bg-[#F59E0B] text-[#0B1020] font-semibold hover:bg-[#FBBF24] active:translate-y-px border border-[#F59E0B]',
  secondary:
    'bg-[#1D2740] text-[#F1F5F9] font-medium hover:bg-[#263455] border border-[#2B3858]',
  ghost:
    'bg-transparent text-[#CBD5E1] font-medium hover:text-white hover:bg-[#1D2740]/70 border border-transparent',
  danger:
    'bg-[#7F1D1D]/60 text-[#FCA5A5] font-medium hover:bg-[#991B1B]/80 border border-[#EF4444]/40',
  tabActive:
    'bg-[#263455] text-white font-semibold border border-[#3B4E7A]',
  tabInactive:
    'bg-transparent text-[#94A3B8] font-medium hover:text-white hover:bg-[#1D2740]/60 border border-transparent',
};

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-sm gap-2',
};

export function ArcadeButton(props: ArcadeButtonProps): React.ReactElement {
  const {
    label,
    onClick,
    variant = 'secondary',
    icon,
    disabled = false,
    title,
    className = '',
    size = 'md',
  } = props;

  return React.createElement(
    'button',
    {
      type: 'button',
      onClick,
      disabled,
      title,
      className: [
        'inline-flex items-center justify-center rounded-md transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020]',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' '),
    },
    icon ?? null,
    React.createElement('span', null, label),
  );
}
