// Webowa kopia components/Logo.tsx z aplikacji (repo spotto) — ta sama geometria.
// Jedyna zieleń w logo to #164938.
const PALETTE = {
  'kolor-jasne': ['#164938', '#ff751f', '#164938'],
  'kolor-ciemne': ['#ffffff', '#ff751f', '#ffffff'],
} as const;

export function Logo({ variant = 'kolor-jasne', size = 22 }: { variant?: keyof typeof PALETTE; size?: number }) {
  const [text, disc, ring] = PALETTE[variant];
  const mark = size * 0.654;
  return (
    <span role="img" aria-label="Spoot" className="inline-flex items-center font-heading font-bold" style={{ fontSize: size, lineHeight: 1.115, color: text }}>
      <span aria-hidden="true">sp</span>
      <svg aria-hidden="true" width={mark * 1.53} height={mark} viewBox="0 0 153 100" style={{ margin: `0 ${size * 0.0385}px` }}>
        <circle cx={50} cy={50} r={50} fill={disc} />
        <circle cx={103} cy={50} r={47} fill="none" stroke={ring} strokeWidth={6} />
      </svg>
      <span aria-hidden="true">t</span>
    </span>
  );
}
