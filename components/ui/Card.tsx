import { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surfaceLowest border border-outlineVariant rounded-xl ${className}`}
      {...props}
    />
  );
}
