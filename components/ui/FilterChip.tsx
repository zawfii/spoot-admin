import Link from 'next/link';
import { ReactNode } from 'react';

// Chip filtra jak w aplikacji: wybrany = zielony, reszta = ciepła szarość.
export function FilterChip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center shrink-0 min-h-10 px-4 rounded-full text-sm font-heading font-semibold whitespace-nowrap transition-colors ${
        active ? 'bg-primary text-onPrimary' : 'bg-cardMuted text-onSurface hover:bg-cardMutedDark'
      }`}
    >
      {children}
    </Link>
  );
}
