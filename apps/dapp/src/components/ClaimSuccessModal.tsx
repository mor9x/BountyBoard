import { formatAtomicAmount, getSupportedTokenByCoinType } from "@bounty-board/frontier-client";
import { useQuery } from "@tanstack/react-query";
import { frontierClient, readClient } from "../lib/frontier";
import { getExplorerTransactionUrl } from "../lib/explorer";
import { getTranslation } from "../lib/language";

type ClaimSuccessModalProps = {
  isOpen: boolean;
  currentLang: "en" | "zh";
  amount: number;
  coinType: string;
  tokenSymbol: string;
  transactionDigest: string;
  onClose: () => void;
};

function formatTokenAmount(amount: number, token: { symbol: string; coinType: string; decimals: number } | null) {
  return token ? formatAtomicAmount(amount, token) : amount.toLocaleString();
}

export function ClaimSuccessModal({
  isOpen,
  currentLang,
  amount,
  coinType,
  tokenSymbol,
  transactionDigest,
  onClose
}: ClaimSuccessModalProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const supportedToken = getSupportedTokenByCoinType(coinType);
  const environment = frontierClient.environment;
  const coinMetadataQuery = useQuery({
    queryKey: ["claim-success-coin-metadata", coinType],
    enabled: isOpen && !supportedToken,
    queryFn: async () => readClient.getCoinMetadata({ coinType })
  });
  const token =
    supportedToken ??
    (coinMetadataQuery.data
      ? {
          symbol: tokenSymbol,
          coinType,
          decimals: coinMetadataQuery.data.decimals
        }
      : null);
  const amountLabel = formatTokenAmount(amount, token);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop animate-slide-in fixed inset-0 z-[60] flex items-center justify-center p-5 md:p-6">
      <div className="w-full max-w-2xl border border-white/20 bg-[#000000] p-5 md:p-7">
        <div className="border border-white/10 bg-[#000000]">
          <div className="border-b border-white/10 px-8 py-7 md:px-10 md:py-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#ff8a57]">
              {t("claimSuccess.eyebrow")}
            </div>
            <h2 className="mt-4 text-3xl font-mono font-black uppercase tracking-[0.08em] text-white md:text-[2.6rem]">
              {t("claimSuccess.title")}
            </h2>
          </div>

          <div className="space-y-8 px-8 py-9 md:space-y-10 md:px-10 md:py-10">
            <section className="border border-[#ff5a1f]/25 bg-[rgba(26,11,4,0.86)] px-6 py-8 text-center md:px-8 md:py-10">
              <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/45">
                {t("claimSuccess.amountLabel")}
              </div>
              <div className="mt-5 font-mono text-[2.7rem] font-black leading-none text-white md:text-[4.25rem]">
                {amountLabel}
              </div>
              <div className="mt-4 text-xs font-bold uppercase tracking-[0.45em] text-[#ffb36e]" title={coinType}>
                {tokenSymbol}
              </div>
            </section>

            <section className="border border-white/10 bg-white/[0.03] px-5 py-6 md:px-6 md:py-7">
              <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/35">
                {t("killmail.transactionHash")}
              </div>
              <div className="mt-4 break-all font-mono text-xs leading-6 text-white/75 md:text-[13px]">
                {transactionDigest}
              </div>
            </section>

            <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <a
                className="btn-secondary px-7 py-3.5 text-center text-sm sm:mr-auto"
                href={getExplorerTransactionUrl(transactionDigest, environment.network)}
                rel="noreferrer"
                target="_blank"
              >
                {t("killmail.viewOnExplorer")}
              </a>
              <button
                className="btn-primary min-h-11 min-w-[132px] px-6 py-2.5 text-sm font-bold tracking-[0.14em]"
                onClick={onClose}
                type="button"
              >
                {t("claimSuccess.ok")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
