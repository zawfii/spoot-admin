// Karta listy/przewodnika tak, jak wygląda na Starcie w aplikacji: okładka z przyciemnieniem
// albo emoji na ciepłym tle, tytuł i podpis.
export function AppCardPreview({ title, coverUrl, emoji, subtitle }: { title: string; coverUrl?: string | null; emoji?: string | null; subtitle: string }) {
  return (
    <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-surfaceHigh">
      {coverUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}
      <div className={`absolute inset-x-0 bottom-0 p-3 flex flex-col gap-0.5 ${coverUrl ? 'text-white' : 'text-onSurface'}`}>
        {!coverUrl && emoji && <span className="text-3xl leading-10">{emoji}</span>}
        <span className="font-heading font-bold text-sm leading-5 line-clamp-2">{title.trim() || 'Bez tytułu'}</span>
        <span className="text-xs opacity-80">{subtitle}</span>
      </div>
    </div>
  );
}
