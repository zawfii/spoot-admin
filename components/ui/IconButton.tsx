import { ButtonHTMLAttributes } from 'react';
import { Icon, IconName } from '@/components/Icon';

// Przycisk z samą ikoną; label idzie do aria-label i dymka.
export function IconButton({ icon, label, className = '', ...props }: { icon: IconName; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-md text-onSurfaceVariant hover:bg-cardMutedDark/60 hover:text-onSurface disabled:opacity-30 disabled:pointer-events-none ${className}`}
      {...props}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
