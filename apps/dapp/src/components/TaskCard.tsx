import { formatAtomicAmount, getSupportedTokenBySymbol } from "@bounty-board/frontier-client";
import { useQuery } from "@tanstack/react-query";
import type { BountyCardModel } from "../lib/bounty-view";
import { formatDate, formatRemainingTime } from "../lib/date-utils";
import { frontierClient } from "../lib/frontier";
import { formatMessage, getTranslation } from "../lib/language";
import { DetailField } from "./DetailField";
import { StatTile } from "./StatTile";

type TaskCardProps = {
  bounty: BountyCardModel;
  currentLang: "en" | "zh";
  onClaim: (bounty: BountyCardModel) => void;
  onRefund: (bounty: BountyCardModel) => void;
  isPending?: boolean;
};

export type DetailFieldProps = {
  label: string;
  value: string | number;
  valueClassName?: string;
};

export type StatTileProps = {
  label: string;
  value: string;
  footer?: string;
  valueClassName?: string;
};

export function TaskCard({ bounty, currentLang, onClaim, onRefund: _onRefund, isPending }: TaskCardProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const fm = (key: string, params: Record<string, string | number>) => formatMessage(currentLang, key, params);
  const progressPercent = bounty.killCount > 0 ? Math.min(100, (bounty.completedKills / bounty.killCount) * 100) : 0;
  const isClaimable = bounty.claimableAmount > 0;
  const isRefundable = bounty.refundableAmount > 0;
  const isInsurance = bounty.kind === "insurance";
  const environment = frontierClient.environment;
  const token = getSupportedTokenBySymbol(bounty.tokenSymbol as Parameters<typeof getSupportedTokenBySymbol>[0]);
  const rewardLabel = token ? formatAtomicAmount(bounty.rewardAmount, token) : bounty.rewardAmount.toLocaleString();
  const perKillLabel = token ? formatAtomicAmount(bounty.perKillReward, token) : bounty.perKillReward.toLocaleString();
  const claimableLabel = token ? formatAtomicAmount(bounty.claimableAmount, token) : bounty.claimableAmount.toLocaleString();
  const refundableLabel = token ? formatAtomicAmount(bounty.refundableAmount, token) : bounty.refundableAmount.toLocaleString();

  const targetCharacterQuery = useQuery({
    queryKey: [
      "bounty-card-target",
      environment.simulationWorldPackageId,
      environment.simulationWorldObjectRegistryId,
      bounty.targetItemId,
      bounty.targetTenant
    ],
    enabled: Boolean(!isInsurance && bounty.targetItemId && bounty.targetTenant),
    queryFn: async () =>
      frontierClient.getCharacterByItemId({
        worldPackageId: environment.simulationWorldPackageId,
        worldObjectRegistryId: environment.simulationWorldObjectRegistryId,
        itemId: bounty.targetItemId!,
        tenant: bounty.targetTenant!
      })
  });

  const targetCharacter = targetCharacterQuery.data ?? null;
  const targetDisplayName = isInsurance
    ? t("taskCard.awaitingKiller")
    : targetCharacter?.metadata.name ?? t("taskCard.characterUnknown");
  const targetUid = bounty.targetItemId ?? bounty.targetLabel;
  const targetObjectId =
    isInsurance ? "--" : targetCharacter?.objectId ?? (targetCharacterQuery.isLoading ? t("taskCard.loadingCharacter") : "--");
  const targetQueryStatus = isInsurance ? null : targetCharacterQuery.isError ? t("taskCard.lookupFailed") : null;
  const titleLabel = isInsurance ? t("taskCard.insured") : t("taskCard.target");

  return (
    <article className="mx-auto w-full max-w-[1280px]">
      <div
        className="card-hover animate-slide-in relative overflow-hidden border border-white/12 bg-[#070707] transition-all duration-300"
        style={{
          backgroundImage: "url(/evebg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay"
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,90,31,0.08),transparent_24%),linear-gradient(135deg,rgba(0,0,0,0.95),rgba(0,0,0,0.9)_42%,rgba(18,8,4,0.9))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/85 to-transparent" />

        <div
          className={`relative z-10 px-6 py-6 transition-all duration-300 md:px-8 md:py-8 ${
            isClaimable ? "pointer-events-none blur-[4px] opacity-30" : ""
          }`}
        >
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.16fr)_340px]">
            <section className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="text-xs font-light uppercase tracking-[0.2em] text-white/44">{titleLabel}</div>
                {bounty.isFutureKiller ? (
                  <span className="border border-[#ff5a1f]/35 bg-[#ff5a1f]/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#ff8a57]">
                    {t("taskCard.futureKiller")}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-5 border border-white/8 bg-black/42 px-6 py-6 md:px-7 md:py-7">
                <div className="grid gap-4 border-b border-white/7 pb-5">
                  <div className="relative pl-6">
                    <div className="absolute inset-y-1 left-0 w-[2px] bg-gradient-to-b from-[#ff5a1f] via-[#ff7a45] to-transparent" />
                    <div className="grid gap-2">
                      <div className="truncate font-mono text-[28px] font-semibold leading-none tracking-[0.07em] text-white md:text-[32px]">
                        {targetDisplayName}
                      </div>
                      {targetQueryStatus ? (
                        <div className="font-mono text-[11px] leading-5 tracking-[0.05em] text-[#FFD166]">{targetQueryStatus}</div>
                      ) : null}
                      {isInsurance ? (
                        <div className="font-mono text-[11px] leading-5 tracking-[0.05em] text-white/60">
                          {fm("taskCard.futureKillerHint", { insured: bounty.targetLabel, uid: targetUid })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
                  <DetailField
                    label={t("taskCard.uid")}
                    value={targetUid}
                    valueClassName="text-[20px] leading-none text-white"
                  />
                  <DetailField
                    label={t("taskCard.objectId")}
                    value={targetObjectId}
                    valueClassName="break-all text-[11px] leading-5 text-white/72"
                  />
                </div>
              </div>

              <div className="grid gap-3 border border-white/8 bg-black/38 px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-light uppercase tracking-[0.22em] text-white/40">
                    {isInsurance ? t("taskCard.triggerCondition") : t("taskCard.progress")}
                  </div>
                  <div className="font-mono text-sm tracking-[0.08em] text-white/88">
                    {isInsurance
                      ? fm("taskCard.futureKillerHint", { insured: bounty.targetLabel, uid: targetUid })
                      : fm("taskCard.killProgress", { completed: bounty.completedKills, total: bounty.killCount })}
                  </div>
                </div>
                {isInsurance ? null : (
                  <div className="h-2.5 overflow-hidden bg-white/6">
                    <div
                      className="h-full bg-gradient-to-r from-[#ff5a1f] via-[#ff7846] to-[#ffd166] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </section>

            <aside className="grid gap-4 self-start">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                <StatTile
                  label={t("taskCard.totalReward")}
                  value={rewardLabel}
                  footer={bounty.tokenSymbol}
                  valueClassName="text-[28px] text-[#ff5a1f]"
                />
                <StatTile
                  label={t("taskCard.perKillReward")}
                  value={perKillLabel}
                  footer={bounty.tokenSymbol}
                  valueClassName="text-[28px] text-white"
                />
                <StatTile
                  label={t("taskCard.deadline")}
                  value={formatDate(bounty.deadline)}
                  valueClassName="text-[14px] leading-6 text-white/82"
                />
                <StatTile
                  label={t("taskCard.timeRemaining")}
                  value={formatRemainingTime(bounty.deadline, currentLang)}
                  valueClassName={bounty.status === "expired" ? "text-[24px] text-white/35" : "text-[24px] text-[#9CFF57]"}
                />
              </div>

              {bounty.note ? (
                <section className="grid gap-3 border border-[#ff5a1f]/14 bg-gradient-to-br from-[#170800]/88 via-black/84 to-black/74 p-5">
                  <div className="text-xs font-light uppercase tracking-[0.24em] text-[#ff8a57]/70">{t("createBounty.remarks")}</div>
                  <div className="font-mono text-[15px] leading-8 tracking-[0.05em] text-white/82">{bounty.note}</div>
                </section>
              ) : null}
            </aside>
          </div>
        </div>

        {isClaimable ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 md:p-8">
            <button
              aria-busy={isPending}
              className="grid min-w-[280px] gap-3 border border-[#00ff9c]/26 bg-[rgba(4,17,13,0.88)] px-8 py-7 text-center transition-all duration-300 hover:border-[#65ffbc]/60 hover:bg-[rgba(7,32,23,0.94)] hover:shadow-[0_0_32px_rgba(0,255,156,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => onClaim(bounty)}
              type="button"
            >
              <span className="text-[11px] font-light uppercase tracking-[0.24em] text-[#65ffbc]">{t("taskCard.claimable")}</span>
              <span className="font-mono text-[30px] leading-none tracking-[0.04em] text-white">
                {claimableLabel}
              </span>
              <span className="text-sm uppercase tracking-[0.26em] text-white/48">{bounty.tokenSymbol}</span>
            </button>
          </div>
        ) : null}

        {isRefundable ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 md:p-8">
            <button
              aria-busy={isPending}
              className="grid min-w-[280px] gap-3 border border-[#ffb066]/26 bg-[rgba(28,15,5,0.9)] px-8 py-7 text-center transition-all duration-300 hover:border-[#ffb066]/60 hover:bg-[rgba(40,20,6,0.95)] hover:shadow-[0_0_32px_rgba(255,176,102,0.16)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => _onRefund(bounty)}
              type="button"
            >
              <span className="text-[11px] font-light uppercase tracking-[0.24em] text-[#ffb066]">{t("taskCard.refundReward")}</span>
              <span className="font-mono text-[30px] leading-none tracking-[0.04em] text-white">
                {refundableLabel}
              </span>
              <span className="text-sm uppercase tracking-[0.26em] text-white/48">{bounty.tokenSymbol}</span>
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
