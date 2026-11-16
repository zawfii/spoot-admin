import { ReactNode } from 'react';

export function PageHeader({ title, subtitle, eyebrow, actions }: { title: string; subtitle?: ReactNode; eyebrow?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 lg:mb-8">
      <div className="flex flex-col gap-1 min-w-0">
        {eyebrow && <p className="font-heading font-bold text-[11px] leading-4 tracking-[0.8px] uppercase text-onSurfaceVariant">{eyebrow}</p>}
        <h1 className="font-heading font-bold text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 text-onSurface">{title}</h1>
        {subtitle && <p className="text-sm lg:text-[15px] leading-[22px] text-onSurfaceVariant">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
