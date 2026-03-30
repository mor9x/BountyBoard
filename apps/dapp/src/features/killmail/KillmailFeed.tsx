import { useKillmailEvents } from "../../hooks/useKillmailEvents";
import { getTranslation } from "../../lib/language";

type KillmailFeedProps = {
  currentLang: "en" | "zh";
};

export function KillmailFeed({ currentLang }: KillmailFeedProps) {
  const { data, error, isLoading } = useKillmailEvents();
  const t = (key: string) => getTranslation(currentLang, key);
  const events = [...(data?.nodes ?? [])].sort((left, right) => {
    const leftTime = left.timestamp ? Date.parse(left.timestamp) : 0;
    const rightTime = right.timestamp ? Date.parse(right.timestamp) : 0;
    return rightTime - leftTime;
  });

  return (
    <section className="app-panel app-stack-md">
      <div className="app-stack-xs">
        <h2 className="text-lg uppercase tracking-wider text-white">{t("feed.title")}</h2>
        {isLoading ? <p className="font-mono text-xs text-white/50">{t("taskList.loading")}</p> : null}
        {error ? <p className="font-mono text-xs text-[#FF0000]">{error instanceof Error ? error.message : "Unknown error"}</p> : null}
        {!isLoading && !error && data?.nodes.length === 0 ? <p className="font-mono text-xs text-white/50">{t("feed.empty")}</p> : null}
      </div>

      <div className="app-grid-feed">
        {events.map((event) => (
          <article className="app-panel-inset app-stack-sm" key={event.digest ?? event.timestamp}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-white/40">
              <span>{event.lossType ?? event.eventType}</span>
              <span>{event.timestamp ?? "No timestamp"}</span>
            </div>
            <dl className="grid gap-3 text-xs text-white/80 sm:grid-cols-2">
              <div>
                <dt className="uppercase tracking-[0.18em] text-white/40">Digest</dt>
                <dd className="break-all text-white/70">{event.digest ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-white/40">Killmail ID</dt>
                <dd className="text-white">{event.killmailItemId ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-white/40">Killer</dt>
                <dd className="text-white">{event.killerId?.itemId ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-white/40">Victim</dt>
                <dd className="text-white">{event.victimId?.itemId ?? "Unavailable"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
