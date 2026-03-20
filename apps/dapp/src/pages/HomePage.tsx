import { useEnvironment } from "../hooks/useEnvironment";
import { KillmailFeed } from "../features/killmail/KillmailFeed";

export function HomePage() {
  const environment = useEnvironment();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,69,0,0.12),_transparent_35%),linear-gradient(180deg,_#050505_0%,_#141414_45%,_#050505_100%)] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">EVE Frontier Utopia</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-white">
              Killmail-fed bounty board scaffold for the Frontier dapp
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
              This workspace keeps `bounty_board` as the local business package and uses world killmail events as the
              current external event feed. Frontend configuration carries both the world package and the local
              `bounty_board` package, so reward and claim flows can be added on top of the same scaffold.
            </p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Network</dt>
                <dd className="mt-2 text-sm font-medium text-white">{environment.network}</dd>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">World API</dt>
                <dd className="mt-2 break-all text-sm font-medium text-white">{environment.worldApiUrl}</dd>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Killmail Source</dt>
                <dd className="mt-2 break-all text-sm font-medium text-white">{environment.worldPackageId}</dd>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Bounty Board Package</dt>
                <dd className="mt-2 break-all text-sm font-medium text-white">{environment.bountyBoardPackageId}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-[2rem] border border-orange-400/20 bg-orange-400/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">Current Scope</p>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-orange-50/90">
              <li>Use world killmail events as the current external trigger and verification feed.</li>
              <li>Keep the local Move package as a runnable `bounty_board` business skeleton.</li>
              <li>Run `bun run sync:addresses` to update the local `bounty_board` package id after deployment.</li>
              <li>Read killmail events directly from `worldPackageId`, not from a separate local contract.</li>
            </ol>
          </section>
        </div>

        <div className="mt-12">
          <KillmailFeed />
        </div>
      </div>
    </main>
  );
}
