import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-onPrimary hover:bg-primaryLight',
  secondary: 'bg-secondary text-onSecondary hover:bg-secondaryLight',
  ghost: 'bg-transparent text-onSurface border border-outlineVariant hover:bg-surfaceLow',
  danger: 'bg-transparent text-red-600 border border-red-200 hover:bg-red-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className = '', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-heading font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
});
