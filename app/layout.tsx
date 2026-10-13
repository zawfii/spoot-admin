import type { Metadata } from 'next';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const heading = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  variable: '--font-heading',
});

const body = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

export const metadata: Metadata = { title: 'Spoot Admin' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-surface text-onSurface font-sans">{children}</body>
    </html>
  );
}
