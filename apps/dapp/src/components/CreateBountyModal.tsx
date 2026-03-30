import { formatAtomicAmount, type MirrorCharacterLookup, type SupportedToken, type WalletCharacter } from "@bounty-board/frontier-client";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useState } from "react";
import { frontierClient, readClient } from "../lib/frontier";
import { formatMessage, getTranslation } from "../lib/language";

export type CreateBountyFormValue = {
  targetUID: string;
  rewardAmount: string;
  token: string;
  customCoinType: string;
  customTokenDecimals: number | null;
  lossType: "any" | "ship" | "building";
  killCount: number;
  timeframeDays: number;
  isFutureKiller: boolean;
  remarks: string;
};

type CreateBountyModalProps = {
  isOpen: boolean;
  currentLang: "en" | "zh";
  availableTokens: SupportedToken[];
  walletAddress: string | null;
  selectedCharacter: WalletCharacter | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (value: CreateBountyFormValue) => Promise<void>;
};

const CUSTOM_TOKEN_SYMBOL = "CUSTOM";

function createInitialForm(defaultTokenSymbol: string): CreateBountyFormValue {
  return {
    targetUID: "",
    rewardAmount: "",
    token: defaultTokenSymbol,
    customCoinType: "",
    customTokenDecimals: null,
    lossType: "any",
    killCount: 1,
    timeframeDays: 7,
    isFutureKiller: false,
    remarks: ""
  };
}

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

function sanitizeDecimalInput(value: string) {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [integerPart = "", ...decimalParts] = normalized.split(".");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join("")}`;
}

function isValidCoinType(value: string) {
  return /^0x[a-fA-F0-9]+::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());
}

export function CreateBountyModal({
  isOpen,
  currentLang,
  availableTokens,
  walletAddress,
  selectedCharacter,
  isSubmitting,
  onClose,
  onSubmit
}: CreateBountyModalProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const fm = (key: string, params: Record<string, string | number>) => formatMessage(currentLang, key, params);
  const defaultTokenSymbol = availableTokens[0]?.symbol ?? CUSTOM_TOKEN_SYMBOL;
  const [formData, setFormData] = useState<CreateBountyFormValue>(() => createInitialForm(defaultTokenSymbol));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const environment = frontierClient.environment;
  const deferredTargetUID = useDeferredValue(formData.targetUID.trim());
  const deferredCustomCoinType = useDeferredValue(formData.customCoinType.trim());
  const shouldLookupTarget = !formData.isFutureKiller && deferredTargetUID.length > 0;
  const shouldLookupCustomCoin = formData.token === CUSTOM_TOKEN_SYMBOL && isValidCoinType(deferredCustomCoinType);
  const targetItemId = isPositiveIntegerString(deferredTargetUID) ? Number(deferredTargetUID) : null;
  const isTargetLookupStale = !formData.isFutureKiller && formData.targetUID.trim() !== deferredTargetUID;
  const isCustomCoinLookupStale = formData.token === CUSTOM_TOKEN_SYMBOL && formData.customCoinType.trim() !== deferredCustomCoinType;
  const targetLookupQuery = useQuery({
    queryKey: [
      "target-character-lookup",
      environment.worldPackageId,
      environment.worldObjectRegistryId,
      targetItemId
    ],
    enabled: Boolean(shouldLookupTarget && targetItemId),
    queryFn: async () =>
      frontierClient.getCharacterByItemId({
        worldPackageId: environment.worldPackageId,
        worldObjectRegistryId: environment.worldObjectRegistryId,
        itemId: targetItemId!,
        tenant: "utopia"
      })
  });
  const targetLookup = (targetLookupQuery.data ?? null) as MirrorCharacterLookup | null;
  const targetLookupError = targetLookupQuery.error instanceof Error ? targetLookupQuery.error.message : null;
  const selectedPresetToken = availableTokens.find((token) => token.symbol === formData.token) ?? null;
  const isCustomToken = formData.token === CUSTOM_TOKEN_SYMBOL;
  const tokenDisplay = isCustomToken ? CUSTOM_TOKEN_SYMBOL : formData.token;
  const selectedTokenCoinType = isCustomToken ? formData.customCoinType.trim() : (selectedPresetToken?.coinType ?? "");
  const customCoinMetadataQuery = useQuery({
    queryKey: ["custom-coin-metadata", deferredCustomCoinType],
    enabled: shouldLookupCustomCoin,
    queryFn: async () => readClient.getCoinMetadata({ coinType: deferredCustomCoinType })
  });
  const customCoinMetadata = customCoinMetadataQuery.data ?? null;
  const customCoinDecimals = customCoinMetadata?.decimals ?? null;
  const customCoinLookupError = customCoinMetadataQuery.error instanceof Error ? customCoinMetadataQuery.error.message : null;
  const selectedTokenDecimals = isCustomToken ? customCoinDecimals : (selectedPresetToken?.decimals ?? null);
  const balanceQuery = useQuery({
    queryKey: ["wallet-token-balance", walletAddress, selectedTokenCoinType],
    enabled: Boolean(walletAddress && selectedTokenCoinType && selectedTokenDecimals !== null),
    queryFn: async () =>
      readClient.getBalance({
        owner: walletAddress!,
        coinType: selectedTokenCoinType
      })
  });
  const balanceError = balanceQuery.error instanceof Error ? balanceQuery.error.message : null;
  const selectedTokenInfo =
    selectedTokenCoinType && selectedTokenDecimals !== null
      ? {
          symbol: tokenDisplay,
          coinType: selectedTokenCoinType,
          decimals: selectedTokenDecimals
        }
      : null;
  const formattedBalance =
    selectedTokenInfo && balanceQuery.data
      ? formatAtomicAmount(Number(balanceQuery.data.totalBalance), selectedTokenInfo)
      : null;

  useEffect(() => {
    if (availableTokens.length === 0) {
      return;
    }

    setFormData((previous) => {
      if (previous.token === CUSTOM_TOKEN_SYMBOL || availableTokens.some((token) => token.symbol === previous.token)) {
        return previous;
      }

      return {
        ...previous,
        token: defaultTokenSymbol
      };
    });
  }, [availableTokens, defaultTokenSymbol]);

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
    if (formData.token === CUSTOM_TOKEN_SYMBOL && !formData.customCoinType.trim()) {
      nextErrors.customCoinType = t("validation.customCoinTypeRequired");
    } else if (formData.token === CUSTOM_TOKEN_SYMBOL && !isValidCoinType(formData.customCoinType)) {
      nextErrors.customCoinType = t("validation.customCoinTypeInvalid");
    } else if (formData.token === CUSTOM_TOKEN_SYMBOL && customCoinDecimals === null) {
      nextErrors.customCoinType = t("validation.customCoinTypeMetadataMissing");
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
      await onSubmit({ ...formData, customTokenDecimals: customCoinDecimals });
      setFormData(createInitialForm(defaultTokenSymbol));
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

            {formData.isFutureKiller ? (
              <div className="app-panel-inset app-stack-xs">
                <div className="text-white/70">{t("wallet.selectedRole")}</div>
                <div className="font-mono text-sm text-white">
                  {selectedCharacter?.metadata.name ?? "--"} / {selectedCharacter?.itemId ?? "--"}
                </div>
              </div>
            ) : null}

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
              {!formData.isFutureKiller ? (
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/40">
                  {currentLang === "en" ? "You can find all player character details " : "你可以在这里找到所有玩家角色的信息："}
                  <a
                    className="font-semibold transition-colors hover:text-[#ff6a6a]"
                    href="https://eve-eyes.d0v.xyz/indexer/character-creations"
                    rel="noreferrer"
                    style={{
                      color: "#FF0000",
                      textDecoration: "underline",
                      textDecorationColor: "#FF0000",
                      textDecorationThickness: "2px",
                      textUnderlineOffset: "2px"
                    }}
                    target="_blank"
                  >
                    {currentLang === "en" ? "here" : "点击查看"}
                  </a>
                  {currentLang === "en" ? "." : ""}
                </p>
              ) : null}
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
                      <div className="text-[10px] uppercase tracking-widest text-white/40">
                        {t("createBounty.targetLookupFound")}
                      </div>
                      <div className="font-mono text-sm text-white">
                        {targetLookup.metadata.name ?? "--"} / {targetLookup.itemId}
                      </div>
                      <div className="app-grid-metrics">
                        <div className="app-stack-xs">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">
                            {t("createBounty.targetLookupName")}
                          </div>
                          <div className="font-mono text-xs text-white">{targetLookup.metadata.name ?? "--"}</div>
                        </div>
                        <div className="app-stack-xs">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">
                            {t("createBounty.targetLookupTenant")}
                          </div>
                          <div className="font-mono text-xs text-white">{targetLookup.tenant}</div>
                        </div>
                      </div>
                      <div className="app-stack-xs">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">
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
                <label className="mb-2.5 block text-sm font-light tracking-wide text-white/70">{t("createBounty.rewardAmount")}</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-3.5 font-mono text-sm font-light tracking-wide"
                    inputMode="decimal"
                    onChange={(event) => updateField("rewardAmount", sanitizeDecimalInput(event.target.value))}
                    placeholder={t("createBounty.rewardAmountPlaceholder")}
                    type="text"
                    value={formData.rewardAmount}
                  />
                </div>
                {errors.rewardAmount ? <p className="mt-1.5 font-mono text-xs text-[#FF0000]">{errors.rewardAmount}</p> : null}
              </div>

              <div>
                <label className="mb-2.5 block text-sm font-light tracking-wide text-white/70">{t("createBounty.lossType")}</label>
                <div className="flex gap-2">
                  {(["any", "ship", "building"] as const).map((lossType) => (
                    <button
                      key={lossType}
                      onClick={() => updateField("lossType", lossType)}
                      type="button"
                      className={`flex-1 border px-3 py-3.5 font-mono text-sm transition-all duration-300 ${
                        formData.lossType === lossType
                          ? "border-[#FF0000] bg-[#FF0000] text-black shadow-[0_0_12px_rgba(255,0,0,0.3)]"
                          : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {t(
                        `createBounty.lossType${
                          lossType === "any" ? "Any" : lossType === "ship" ? "Ship" : "Building"
                        }`
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2.5 block text-sm font-light tracking-wide text-white/70">{t("createBounty.tokenType")}</label>
                <div className="flex gap-2">
                  {[...availableTokens, { symbol: CUSTOM_TOKEN_SYMBOL, coinType: "", decimals: 9 }].map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => updateField("token", token.symbol)}
                      type="button"
                      className={`flex-1 border px-3 py-3.5 font-mono text-sm transition-all duration-300 ${
                        formData.token === token.symbol
                          ? "border-[#FF0000] bg-[#FF0000] text-black shadow-[0_0_12px_rgba(255,0,0,0.3)]"
                          : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {token.symbol === CUSTOM_TOKEN_SYMBOL ? t("createBounty.tokenTypeCustom") : token.symbol}
                    </button>
                  ))}
                </div>
                {isCustomToken ? (
                  <div className="mt-3">
                    <input
                      className="w-full px-4 py-3.5 font-mono text-sm font-light tracking-wide"
                      onChange={(event) => updateField("customCoinType", event.target.value)}
                      placeholder={t("createBounty.customCoinTypePlaceholder")}
                      type="text"
                      value={formData.customCoinType}
                    />
                    <div className="mt-2 font-mono text-[10px] leading-relaxed tracking-wide text-white/35">
                      {fm("createBounty.customCoinTypeHint", { coinType: environment.customCoinTypeHint || "--" })}
                    </div>
                    {errors.customCoinType ? (
                      <p className="mt-1.5 font-mono text-xs text-[#FF0000]">{errors.customCoinType}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-3 app-panel-inset app-stack-xs">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Selected Token</div>
                  <div className="font-mono text-sm text-white">{tokenDisplay}</div>
                  <div className="app-stack-xs">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Coin Type</div>
                    <div className="break-all font-mono text-xs text-white/75">{selectedTokenCoinType || "--"}</div>
                  </div>
                  <div className="app-stack-xs">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Decimals</div>
                    <div className="font-mono text-xs text-white/75">
                      {selectedTokenDecimals !== null ? selectedTokenDecimals : "--"}
                    </div>
                  </div>
                  {isCustomToken ? (
                    <div className="app-stack-xs">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Metadata</div>
                      <div className="font-mono text-xs text-white/75">
                        {isCustomCoinLookupStale || customCoinMetadataQuery.isLoading || customCoinMetadataQuery.isFetching
                          ? t("createBounty.customCoinTypeLoading")
                          : customCoinLookupError
                            ? fm("createBounty.customCoinTypeError", { message: customCoinLookupError })
                            : customCoinDecimals !== null
                              ? "Resolved"
                              : customCoinMetadataQuery.isFetched
                                ? t("createBounty.customCoinTypeMissing")
                                : "--"}
                      </div>
                    </div>
                  ) : null}
                  <div className="app-stack-xs">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Wallet Balance</div>
                    <div className="font-mono text-xs text-white/75">
                      {!walletAddress
                        ? "--"
                        : balanceQuery.isLoading || balanceQuery.isFetching
                          ? t("createBounty.walletBalanceLoading")
                          : balanceError
                            ? fm("createBounty.walletBalanceError", { message: balanceError })
                            : formattedBalance !== null
                              ? `${formattedBalance} ${tokenDisplay}`
                              : "--"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-light tracking-wide text-white/70">
                  {t("createBounty.killCountLabel")}: {formData.killCount}
                </label>
                <span className="font-mono text-sm font-light text-[#FF0000]">
                  {t("createBounty.perKillReward")}: {formatDisplayAmount(perKillReward)} {tokenDisplay}
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
              <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-white/20">
                <span>{t("createBounty.minKills")}</span>
                <span>{t("createBounty.maxKills")}</span>
              </div>
              {errors.killCount ? <p className="mt-1.5 font-mono text-xs text-[#FF0000]">{errors.killCount}</p> : null}
            </div>

            <div className="pt-2">
              <div className="mb-3 flex items-center justify-between">
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
              <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-white/20">
                <span>{t("createBounty.minDays")}</span>
                <span>{t("createBounty.maxDays")}</span>
              </div>
              <div className="mt-3 font-mono text-xs leading-relaxed text-white/40">
                {fm("createBounty.timeframeHint", {
                  count: formData.killCount,
                  days: formData.timeframeDays,
                  reward: `${perKillReward} ${tokenDisplay}`
                })}
              </div>
              {errors.timeframeDays ? <p className="mt-1.5 font-mono text-xs text-[#FF0000]">{errors.timeframeDays}</p> : null}
            </div>

            <div>
              <label className="mb-2.5 block text-sm font-light tracking-wide text-white/70">{t("createBounty.remarks")}</label>
              <textarea
                className="w-full resize-none px-4 py-3.5 font-mono text-sm font-light tracking-wide"
                onChange={(event) => updateField("remarks", event.target.value)}
                placeholder={t("createBounty.remarksPlaceholder")}
                rows={3}
                value={formData.remarks}
              />
              <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-white/20">
                <span>{t("createBounty.remarksLimitEn")}</span>
                <span>{utf8ByteLength(formData.remarks)} / 64 bytes</span>
              </div>
              {errors.remarks ? <p className="mt-1.5 font-mono text-xs text-[#FF0000]">{errors.remarks}</p> : null}
            </div>
          </div>

            {errors.form ? <p className="mt-2 font-mono text-xs text-[#FF0000]">{errors.form}</p> : null}

            <div className="app-actions-end border-t border-white/10 pt-6">
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
