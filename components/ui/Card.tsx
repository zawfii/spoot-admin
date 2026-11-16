import { HTMLAttributes } from 'react';

// Karty w Spoot są płaskie: ciepła szarość, bez ramki i cienia.
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-cardMuted rounded-xl ${className}`} {...props} />;
}
