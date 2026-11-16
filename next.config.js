/** @type {import('next').NextConfig} */
const config = {
  // Panel nie ma strony głównej — „/” prowadzi na pulpit (niezalogowanych middleware odsyła na /login).
  async redirects() {
    return [{ source: '/', destination: '/dashboard', permanent: false }];
  },
  // Panelu nie da się osadzić w ramce na obcej stronie (clickjacking przycisków Zatwierdź/Odrzuć).
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
module.exports = config;
