import type { MirrorCharacterLookup, SupportedToken, WalletCharacter } from "@bounty-board/frontier-client";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { frontierClient } from "../lib/frontier";
import { formatMessage, getTranslation } from "../lib/language";

export type CreateBountyFormValue = {
  targetUID: string;
  rewardAmount: string;
  token: SupportedToken["symbol"];
  killCount: number;
  timeframeDays: number;
  isFutureKiller: boolean;
  remarks: string;
};

type CreateBountyModalProps = {
  isOpen: boolean;
  currentLang: "en" | "zh";
  availableTokens: SupportedToken[];
  selectedCharacter: WalletCharacter | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (value: CreateBountyFormValue) => Promise<void>;
};

const initialForm: CreateBountyFormValue = {
  targetUID: "",
  rewardAmount: "",
  token: "SUI",
  killCount: 1,
  timeframeDays: 7,
  isFutureKiller: false,
  remarks: ""
};

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function isPositiveIntegerString(value: string) {
  return /^[1-9]\d*$/.test(value);
}

function getRangeProgressStyle(value: number, min: number, max: number) {
  const percent = ((value - min) / (max - min)) * 100;

  return {
    background: `linear-gradient(90deg, #ff0000 0%, #ff0000 ${percent}%, rgba(255, 255, 255, 0.14) ${percent}%, rgba(255, 255, 255, 0.14) 100%)`
  };
}

function formatDisplayAmount(value: number) {
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  });

  if (!formatted.includes(".")) {
    return formatted;
  }

  return formatted.replace(/\.?0+$/, "");
}

export function CreateBountyModal({
  isOpen,
  currentLang,
  availableTokens,
  selectedCharacter,
  isSubmitting,
  onClose,
  onSubmit
}: CreateBountyModalProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const fm = (key: string, params: Record<string, string | number>) => formatMessage(currentLang, key, params);
  const [formData, setFormData] = useState<CreateBountyFormValue>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const environment = frontierClient.environment;
  const deferredTargetUID = useDeferredValue(formData.targetUID.trim());
  const shouldLookupTarget = !formData.isFutureKiller && deferredTargetUID.length > 0;
  const targetItemId = isPositiveIntegerString(deferredTargetUID) ? Number(deferredTargetUID) : null;
  const isTargetLookupStale = !formData.isFutureKiller && formData.targetUID.trim() !== deferredTargetUID;
  const targetLookupQuery = useQuery({
    queryKey: [
      "target-character-lookup",
      environment.simulationWorldPackageId,
      environment.simulationWorldObjectRegistryId,
      targetItemId
    ],
    enabled: Boolean(shouldLookupTarget && targetItemId),
    queryFn: async () =>
      frontierClient.getCharacterByItemId({
        worldPackageId: environment.simulationWorldPackageId,
        worldObjectRegistryId: environment.simulationWorldObjectRegistryId,
        itemId: targetItemId!,
        tenant: "utopia"
      })
  });
  const targetLookup = (targetLookupQuery.data ?? null) as MirrorCharacterLookup | null;
  const targetLookupError = targetLookupQuery.error instanceof Error ? targetLookupQuery.error.message : null;

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof CreateBountyFormValue>(field: K, value: CreateBountyFormValue[K]) {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!selectedCharacter) {
      nextErrors.form = t("wallet.noRoles");
    }
    if (!formData.isFutureKiller && !formData.targetUID.trim()) {
      nextErrors.targetUID = t("validation.targetUIDRequired");
    } else if (!formData.isFutureKiller && !isPositiveIntegerString(formData.targetUID.trim())) {
      nextErrors.targetUID = t("validation.targetUIDInvalid");
    }
    if (!formData.rewardAmount || Number(formData.rewardAmount) <= 0) {
      nextErrors.rewardAmount = t("validation.rewardAmountPositive");
    }
    if (formData.killCount < 1 || formData.killCount > 1000) {
      nextErrors.killCount = t("validation.killCountRange");
    }
    if (formData.timeframeDays < 7 || formData.timeframeDays > 365) {
      nextErrors.timeframeDays = t("validation.timeframeRange");
    }
    if (utf8ByteLength(formData.remarks) > 64) {
      nextErrors.remarks = t("validation.remarksLength");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData);
      setFormData(initialForm);
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Failed to submit"
      });
    }
  }

  const perKillReward =
    formData.rewardAmount && formData.killCount > 0
      ? Number(formData.rewardAmount) / formData.killCount || 0
      : 0;

  return (
    <div className="modal-backdrop animate-slide-in fixed inset-0 z-50 flex items-center justify-center p-5 md:p-6">
      <div className="custom-scrollbar relative max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-white/20 bg-[#000000] p-4 md:p-6">
        <div className="border border-white/10 bg-[#000000]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/20 bg-[#000000] px-7 py-6 md:px-8">
            <h2 className="text-xl font-light uppercase tracking-wider text-white">{t("createBounty.title")}</h2>
            <button onClick={onClose} type="button" className="text-white/50 transition-colors duration-300 hover:text-[#FF0000]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
              </svg>
            </button>
          </div>

          <form className="app-stack-lg px-7 py-7 md:px-8 md:py-8" onSubmit={handleSubmit}>
            <div className="app-stack-md">
            <div className="app-panel-inset app-stack-xs">
              <div className="text-white/70">{t("wallet.selectedRole")}</div>
              <div className="font-mono text-sm text-white">
                {selectedCharacter?.metadata.name ?? "--"} / {selectedCharacter?.itemId ?? "--"}
              </div>
            </div>

            <div className="app-panel-inset">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <div className="toggle-switch">
                  <input checked={formData.isFutureKiller} onChange={(event) => updateField("isFutureKiller", event.target.checked)} type="checkbox" />
                  <span className="toggle-slider" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-light tracking-wide text-white">{t("createBounty.futureKillerLabel")}</div>
                  <div className="mt-1 font-mono text-xs text-white/50">{t("createBounty.futureKillerHint")}</div>
                </div>
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-light tracking-wide text-white/70">{t("createBounty.targetUID")}</label>
              {formData.isFutureKiller ? (
                <div className="w-full border border-[#FF0000]/50 bg-[#2A2A2A] px-4 py-3 font-mono text-sm text-[#FF0000]">
                  {t("createBounty.futureKillerAutoGenerate")}
                </div>
              ) : (
                <input
                  className="w-full px-4 py-3 font-mono text-sm font-light tracking-wide"
                  onChange={(event) => updateField("targetUID", event.target.value)}
                  placeholder={t("createBounty.targetUIDPlaceholder")}
                  type="text"
                  value={formData.targetUID}
                />
              )}
              {!formData.isFutureKiller && formData.targetUID.trim() ? (
                <div className="mt-2">
                  {isTargetLookupStale || targetLookupQuery.isLoading || targetLookupQuery.isFetching ? (
                    <p className="font-mono text-xs text-white/60">{t("createBounty.targetLookupLoading")}</p>
                  ) : targetItemId === null ? (
                    <p className="font-mono text-xs text-[#FF0000]">{t("createBounty.targetLookupInvalid")}</p>
                  ) : targetLookupError ? (
                    <p className="font-mono text-xs text-[#FF0000]">
                      {fm("createBounty.targetLookupError", { message: targetLookupError })}
                    </p>
                  ) : targetLookup ? (
                    <div className="app-panel-inset app-stack-xs">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                        {t("createBounty.targetLookupFound")}
                      </div>
                      <div className="font-mono text-sm text-white">
                        {targetLookup.metadata.name ?? "--"} / {targetLookup.itemId}
                      </div>
                      <div className="app-grid-metrics">
                        <div className="app-stack-xs">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                            {t("createBounty.targetLookupName")}
                          </div>
                          <div className="font-mono text-xs text-white">{targetLookup.metadata.name ?? "--"}</div>
                        </div>
                        <div className="app-stack-xs">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                            {t("createBounty.targetLookupTenant")}
                          </div>
                          <div className="font-mono text-xs text-white">{targetLookup.tenant}</div>
                        </div>
                      </div>
                      <div className="app-stack-xs">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                          {t("createBounty.targetLookupObjectId")}
                        </div>
                        <div className="break-all font-mono text-xs text-white">{targetLookup.objectId}</div>
                      </div>
                    </div>
                  ) : targetLookupQuery.isFetched ? (
                    <p className="font-mono text-xs text-[#FF0000]">{t("createBounty.targetLookupMissing")}</p>
                  ) : null}
                </div>
              ) : null}
              {errors.targetUID ? <p className="mt-1 font-mono text-xs text-[#FF0000]">{errors.targetUID}</p> : null}
            </div>

            <div className="app-grid-form">
              <div>
                <label className="mb-2 block text-sm font-light tracking-wide text-white/70">{t("createBounty.rewardAmount")}</label>
                <input
                  className="w-full px-4 py-3 font-mono text-sm font-light tracking-wide"
                  min="0"
                  onChange={(event) => updateField("rewardAmount", event.target.value)}
                  placeholder={t("createBounty.rewardAmountPlaceholder")}
                  step="any"
                  type="number"
                  value={formData.rewardAmount}
                />
                {errors.rewardAmount ? <p className="mt-1 font-mono text-xs text-[#FF0000]">{errors.rewardAmount}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-light tracking-wide text-white/70">{t("createBounty.tokenType")}</label>
                <select
                  className="w-full px-4 py-3 font-mono text-sm font-light tracking-wide"
                  onChange={(event) => updateField("token", event.target.value as SupportedToken["symbol"])}
                  value={formData.token}
                >
                  {availableTokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-light tracking-wide text-white/70">
                  {t("createBounty.killCountLabel")}: {formData.killCount}
                </label>
                <span className="font-mono text-sm font-light text-[#FF0000]">
                  {t("createBounty.perKillReward")}: {formatDisplayAmount(perKillReward)} {formData.token}
                </span>
              </div>
              <input
                className="range-progress w-full"
                max="1000"
                min="1"
                onChange={(event) => updateField("killCount", Number(event.target.value))}
                style={getRangeProgressStyle(formData.killCount, 1, 1000)}
                type="range"
                value={formData.killCount}
              />
              <div className="mt-1 flex justify-between font-mono text-xs text-white/30">
                <span>{t("createBounty.minKills")}</span>
                <span>{t("createBounty.maxKills")}</span>
              </div>
              {errors.killCount ? <p className="mt-1 font-mono text-xs text-[#FF0000]">{errors.killCount}</p> : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-light tracking-wide text-white/70">
                  {t("createBounty.timeframe")}: {formData.timeframeDays} {t("common.days")}
                </label>
              </div>
              <input
                className="range-progress w-full"
                max="365"
                min="7"
                onChange={(event) => updateField("timeframeDays", Number(event.target.value))}
                style={getRangeProgressStyle(formData.timeframeDays, 7, 365)}
                type="range"
                value={formData.timeframeDays}
              />
              <div className="mt-1 flex justify-between font-mono text-xs text-white/30">
                <span>{t("createBounty.minDays")}</span>
                <span>{t("createBounty.maxDays")}</span>
              </div>
              <div className="mt-2 font-mono text-xs text-white/50">
                {fm("createBounty.timeframeHint", {
                  count: formData.killCount,
                  days: formData.timeframeDays,
                  reward: `${perKillReward} ${formData.token}`
                })}
              </div>
              {errors.timeframeDays ? <p className="mt-1 font-mono text-xs text-[#FF0000]">{errors.timeframeDays}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-light tracking-wide text-white/70">{t("createBounty.remarks")}</label>
              <textarea
                className="w-full resize-none px-4 py-3 font-mono text-sm font-light tracking-wide"
                onChange={(event) => updateField("remarks", event.target.value)}
                placeholder={t("createBounty.remarksPlaceholder")}
                rows={3}
                value={formData.remarks}
              />
              <div className="mt-1 flex justify-between font-mono text-xs text-white/30">
                <span>{t("createBounty.remarksLimitEn")}</span>
                <span>{utf8ByteLength(formData.remarks)} / 64 bytes</span>
              </div>
              {errors.remarks ? <p className="mt-1 font-mono text-xs text-[#FF0000]">{errors.remarks}</p> : null}
            </div>
          </div>

            {errors.form ? <p className="font-mono text-xs text-[#FF0000]">{errors.form}</p> : null}

            <div className="app-actions-end border-t border-white/10 pt-4">
              <button className="btn-secondary px-4 py-2 text-sm" onClick={onClose} type="button">
                {t("createBounty.cancel")}
              </button>
              <button className="btn-primary px-6 py-2 text-sm" disabled={isSubmitting} type="submit">
                {isSubmitting ? t("taskList.loading") : t("createBounty.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
