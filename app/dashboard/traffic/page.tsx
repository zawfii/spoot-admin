// Ruch na spootme.pl/dla-restauracji — tablica PostHog „Spoot dla restauracji — skąd wejścia” osadzona przez link udostępniania.
// Liczby zbiera spotto-web (lib/page-stats.ts). Wykresy zmieniasz w PostHog, tu pojawią się same.
// Link do osadzenia (PostHog → Share → Share dashboard publicly) siedzi w zmiennej środowiskowej na Vercelu,
// nie w kodzie: repo jest publiczne, a z linkiem każdy zobaczyłby tablicę.
const EMBED = process.env.POSTHOG_TRAFFIC_EMBED_URL;
const DASHBOARD = 'https://eu.posthog.com/project/298906/dashboard/1155970';

export default function TrafficPage() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-heading text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 font-bold">Ruch: dla restauracji</h1>
        <a href={DASHBOARD} target="_blank" rel="noopener" className="inline-flex items-center min-h-10 px-4 rounded-full text-sm font-heading font-semibold border border-primary/25 hover:bg-surfaceLow">Otwórz w PostHog ↗</a>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Wejścia na <a href="https://spootme.pl/dla-restauracji" target="_blank" rel="noopener" className="font-semibold text-primary underline underline-offset-2">spootme.pl/dla-restauracji</a> z ostatnich 30 dni.
        „Wizytówka (QR)” to wejście z telefonu bez znacznika — kod z wizytówek. Linki do wysyłania oznaczaj <code className="text-xs">?utm_source=mail</code>, <code className="text-xs">sms</code> itd.
      </p>
      {EMBED ? (
        <iframe src={EMBED} title="Statystyki strony dla restauracji" className="w-full h-[1400px] rounded-2xl border bg-surfaceLowest" />
      ) : (
        <p className="rounded-2xl border bg-surfaceLowest p-6 text-sm">Brak zmiennej POSTHOG_TRAFFIC_EMBED_URL w ustawieniach projektu na Vercelu. Do tego czasu tablica jest pod przyciskiem „Otwórz w PostHog”.</p>
      )}
    </div>
  );
}
