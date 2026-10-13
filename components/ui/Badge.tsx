import { HTMLAttributes } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surfaceLow text-onSurfaceVariant',
  success: 'bg-primary/10 text-primaryLight',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
  brand: 'bg-secondaryFixed text-onSecondaryFixed',
};

export function Badge({ tone = 'neutral', className = '', ...props }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
