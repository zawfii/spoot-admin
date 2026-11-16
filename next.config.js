/** @type {import('next').NextConfig} */
const config = {
  // Panel nie ma strony głównej — „/” prowadzi na pulpit (niezalogowanych middleware odsyła na /login).
  async redirects() {
    return [{ source: '/', destination: '/dashboard', permanent: false }];
  },
};
module.exports = config;
