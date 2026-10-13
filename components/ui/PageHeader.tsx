import { ReactNode } from 'react';

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-heading font-bold text-onSurface">{title}</h1>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
