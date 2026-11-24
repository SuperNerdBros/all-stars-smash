'use client';

import React from 'react';

export interface StatBarProps {
  label: string;
  valueText: string;
  percent: number;
  accentHex?: string;
}

export function StatBar(props: StatBarProps): React.ReactElement {
  const { label, valueText, percent, accentHex = '#F59E0B' } = props;
  const clamped = Math.max(6, Math.min(100, Math.round(percent)));

  return React.createElement(
    'div',
    { className: 'flex flex-col gap-1' },
    React.createElement(
      'div',
      { className: 'flex items-center justify-between text-xs' },
      React.createElement('span', { className: 'text-[#94A3B8]' }, label),
      React.createElement(
        'span',
        { className: 'font-mono tabular-nums text-[#E2E8F0] font-medium' },
        valueText,
      ),
    ),
    React.createElement(
      'div',
      { className: 'h-1.5 w-full rounded-sm bg-[#0B1020] overflow-hidden' },
      React.createElement('div', {
        className: 'h-full rounded-sm transition-transform duration-150 origin-left',
        style: {
          width: `${clamped}%`,
          backgroundColor: accentHex,
        },
      }),
    ),
  );
}
