import { formatAtomicAmount, getSupportedTokenByCoinType } from "@bounty-board/frontier-client";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { BountyCardModel } from "../lib/bounty-view";
import { formatDate, formatRemainingTime } from "../lib/date-utils";
import { frontierClient, readClient } from "../lib/frontier";
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
  value: ReactNode;
  valueClassName?: string;
};

export type StatTileProps = {
  label: string;
  value: ReactNode;
  footer?: string;
  footerTitle?: string;
  valueClassName?: string;
};

function formatTokenAmount(amount: number, token: { symbol: string; coinType: string; decimals: number } | null) {
  return token ? formatAtomicAmount(amount, token) : amount.toLocaleString();
}

export function TaskCard({ bounty, currentLang, onClaim, onRefund: _onRefund, isPending }: TaskCardProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const fm = (key: string, params: Record<string, string | number>) => formatMessage(currentLang, key, params);
  
  const progressPercent = bounty.killCount > 0 ? Math.min(100, (bounty.completedKills / bounty.killCount) * 100) : 0;
  const isClaimable = bounty.claimableAmount > 0;
  const isRefundable = bounty.status === "refundable" && bounty.refundableAmount > 0;
  const isInsurance = bounty.kind === "insurance";
  const environment = frontierClient.environment;
  const supportedToken = getSupportedTokenByCoinType(bounty.coinType);
  const coinMetadataQuery = useQuery({
    queryKey: ["task-card-coin-metadata", bounty.coinType],
    enabled: !supportedToken,
    queryFn: async () => readClient.getCoinMetadata({ coinType: bounty.coinType })
  });
  const token =
    supportedToken ??
    (coinMetadataQuery.data
      ? {
          symbol: bounty.tokenSymbol,
          coinType: bounty.coinType,
          decimals: coinMetadataQuery.data.decimals
        }
      : null);
  const rewardLabel = formatTokenAmount(bounty.rewardAmount, token);
  const perKillLabel = formatTokenAmount(bounty.perKillReward, token);
  const claimableLabel = formatTokenAmount(bounty.claimableAmount, token);
  const refundableLabel = formatTokenAmount(bounty.refundableAmount, token);

  const targetCharacterQuery = useQuery({
    queryKey: ["bounty-card-target", environment.worldPackageId, bounty.targetItemId],
    enabled: Boolean(!isInsurance && bounty.targetItemId && bounty.targetTenant),
    queryFn: async () =>
      frontierClient.getCharacterByItemId({
        worldPackageId: environment.worldPackageId,
        worldObjectRegistryId: environment.worldObjectRegistryId,
        itemId: bounty.targetItemId!,
        tenant: bounty.targetTenant!
      })
  });

  const targetCharacter = targetCharacterQuery.data ?? null;
  const targetDisplayName = isInsurance ? t("taskCard.awaitingKiller") : targetCharacter?.metadata.name ?? t("taskCard.characterUnknown");
  const targetUid = bounty.targetItemId ?? bounty.targetLabel;
  const targetObjectId = isInsurance ? "--" : targetCharacter?.objectId ?? (targetCharacterQuery.isLoading ? t("taskCard.loadingCharacter") : "--");
  const targetQueryStatus = isInsurance ? null : targetCharacterQuery.isError ? t("taskCard.lookupFailed") : null;
  const titleLabel = isInsurance ? t("taskCard.insured") : t("taskCard.target");
  const lossTypeLabel =
    bounty.lossType === "building"
      ? t("taskCard.lossTypeBuilding")
      : bounty.lossType === "ship"
        ? t("taskCard.lossTypeShip")
        : t("taskCard.lossTypeAny");

  return (
    <article className="w-full">
      <div className="card-hover animate-slide-in relative overflow-hidden border border-white/10 bg-[#070707] ring-1 ring-white/5 transition-all duration-500">
        {/* Background Effects */}
        <div 
          className="absolute inset-0 opacity-20 transition-opacity duration-700 group-hover:opacity-30"
          style={{ backgroundImage: "url(/evebg.png)", backgroundSize: "cover", backgroundPosition: "center", backgroundBlendMode: "luminosity" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/90 to-[#120804]/90" />
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#ff5a1f]/60 to-transparent" />

        <div className={`relative z-10 grid gap-6 p-10 md:p-14 lg:p-16 ${isClaimable ? "pointer-events-none blur-[4px] opacity-30" : ""}`}>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_440px] xl:gap-20">
            
            {/* Left Section: Target Info */}
            <section className="space-y-12">
              <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-1 bg-[#ff5a1f]" />
                  <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">{titleLabel}</div>
                </div>
                {bounty.isFutureKiller && (
                  <span className="border border-[#ff5a1f]/40 bg-[#ff5a1f]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ff8a57]">
                    {t("taskCard.futureKiller")}
                  </span>
                )}
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="font-mono text-5xl font-black uppercase leading-none tracking-normal text-white md:text-6xl lg:text-7xl">
                    {targetDisplayName}
                  </div>
                  {targetQueryStatus && (
                    <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#FFD166]">{targetQueryStatus}</div>
                  )}
                </div>

                <div className="grid gap-10 border-t border-white/5 pt-10 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField label={t("taskCard.uid")} value={targetUid} valueClassName="text-3xl font-black text-white" />
                  <DetailField label={t("taskCard.objectId")} value={targetObjectId} valueClassName="break-all font-mono text-[12px] leading-relaxed text-white/30" />
                  <DetailField label={t("taskCard.lossType")} value={lossTypeLabel} valueClassName="text-2xl font-black text-[#ffb36e]" />
                </div>
              </div>
            </section>

            {/* Right Section: Stats & Notes */}
            <aside>
              <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <StatTile label={t("taskCard.totalReward")} value={rewardLabel} footer={bounty.tokenSymbol} footerTitle={bounty.coinType} valueClassName="text-3xl font-black text-[#ff5a1f]" />
                <StatTile label={t("taskCard.perKillReward")} value={perKillLabel} footer={bounty.tokenSymbol} footerTitle={bounty.coinType} valueClassName="text-3xl font-black text-white" />
                <StatTile label={t("taskCard.deadline")} value={formatDate(bounty.deadline)} valueClassName="text-base font-bold text-white/70" />
                <StatTile label={t("taskCard.timeRemaining")} value={formatRemainingTime(bounty.deadline, currentLang)} valueClassName={bounty.status === "expired" ? "text-2xl font-black text-white/10" : "text-2xl font-black text-[#9CFF57] shadow-sm"} />
              </div>
            </aside>
          </div>

          <div className={`grid gap-8 pt-10 ${bounty.note ? "lg:grid-cols-[1fr_440px] xl:gap-20" : ""}`}>
            <div className="space-y-6 border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                  {isInsurance ? t("taskCard.triggerCondition") : t("taskCard.progress")}
                </div>
                <div className="font-mono text-sm font-bold tracking-widest text-white/90">
                  {isInsurance ? fm("taskCard.futureKillerHint", { insured: bounty.targetLabel, uid: targetUid }) : fm("taskCard.killProgress", { completed: bounty.completedKills, total: bounty.killCount })}
                </div>
              </div>
              {!isInsurance && (
                <div className="h-2 overflow-hidden bg-white/5 ring-1 ring-white/10">
                  <div
                    className="h-full bg-[#ff5a1f] transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,90,31,0.6)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            {bounty.note ? (
              <div className="relative border border-white/10 bg-white/[0.02] p-8 transition-colors hover:bg-white/[0.04]">
                <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-white/25">{t("createBounty.remarks")}</div>
                <div className="font-mono text-[16px] leading-[1.6] text-white/50 italic">"{bounty.note}"</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Overlays for Claim/Refund */}
        {isClaimable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-8 backdrop-blur-sm bg-black/40">
            <button
              aria-busy={isPending}
              className="group grid min-w-[320px] gap-4 border border-[#00ff9c]/30 bg-[rgba(4,17,13,0.92)] px-10 py-8 text-center transition-all duration-500 hover:border-[#65ffbc] hover:bg-[rgba(7,32,23,0.96)] hover:shadow-[0_0_50px_rgba(0,255,156,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => onClaim(bounty)}
              type="button"
            >
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[#65ffbc]">{t("taskCard.claimable")}</span>
              <span className="font-mono text-4xl font-black text-white">{claimableLabel}</span>
              <span className="text-xs uppercase tracking-[0.4em] text-white/40" title={bounty.coinType}>{bounty.tokenSymbol}</span>
            </button>
          </div>
        )}

        {isRefundable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-8 backdrop-blur-sm bg-black/40">
            <button
              aria-busy={isPending}
              className="group grid min-w-[320px] gap-4 border border-[#ffb066]/30 bg-[rgba(28,15,5,0.94)] px-10 py-8 text-center transition-all duration-500 hover:border-[#ffb066] hover:bg-[rgba(40,20,6,0.98)] hover:shadow-[0_0_50px_rgba(255,176,102,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => _onRefund(bounty)}
              type="button"
            >
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[#ffb066]">{t("taskCard.refundReward")}</span>
              <span className="font-mono text-4xl font-black text-white">{refundableLabel}</span>
              <span className="text-xs uppercase tracking-[0.4em] text-white/40" title={bounty.coinType}>{bounty.tokenSymbol}</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
