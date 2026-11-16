import { HTMLAttributes } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

// Tekst zawsze ciemnozielony (kontrast), kolor statusu niesie tło i kropka.
const toneClasses: Record<Tone, [string, string]> = {
  neutral: ['bg-cardMutedDark', 'bg-onSurfaceVariant'],
  success: ['bg-ratedSurface', 'bg-ratingHigh'],
  warning: ['bg-secondaryFixed', 'bg-secondary'],
  danger: ['bg-red-100', 'bg-red-600'],
  brand: ['bg-secondaryFixed', 'bg-secondary'],
};

export function Badge({ tone = 'neutral', className = '', children, ...props }: Props) {
  const [bg, dot] = toneClasses[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs leading-[18px] font-heading font-semibold text-onSurface whitespace-nowrap ${bg} ${className}`}
      {...props}
    >
      <span aria-hidden="true" className={`w-[7px] h-[7px] rounded-full ${dot}`} />
      {children}
    </span>
  );
}

// Apka (app/admin-places.tsx) zatwierdza miejsca jako 'active'; zaseedowane mają status null.
export function PlaceStatusBadge({ status }: { status: string | null }) {
  if (status === 'pending') return <Badge tone="warning">Oczekuje</Badge>;
  if (status === 'rejected') return <Badge tone="danger">Odrzucone</Badge>;
  return <Badge tone="success">Zatwierdzone</Badge>;
}
