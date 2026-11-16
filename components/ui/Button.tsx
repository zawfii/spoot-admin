import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// secondary = pomarańcz Spoot; tekst zielony, bo biały na pomarańczu nie trzyma kontrastu.
const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-onPrimary hover:bg-primaryLight',
  secondary: 'bg-secondary text-primary hover:bg-secondaryLight',
  ghost: 'bg-transparent text-primary border border-primary/25 hover:bg-surfaceLow',
  danger: 'bg-transparent text-red-700 border border-red-200 hover:bg-red-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className = '', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-heading font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
});
