import { getTranslation } from "../lib/language";
import { LanguageToggle } from "./LanguageToggle";

type NavbarProps = {
  currentLang: "en" | "zh";
  isCreateBountyPending: boolean;
  isWalletConnecting: boolean;
  isWalletConnected: boolean;
  walletAddress?: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onLanguageToggle: () => void;
  onCreateBounty: () => void;
};

function formatWalletAddress(address?: string) {
  if (!address) {
    return null;
  }

  if (address.length <= 16) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

export function Navbar({
  currentLang,
  isCreateBountyPending,
  isWalletConnecting,
  isWalletConnected,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
  onLanguageToggle,
  onCreateBounty
}: NavbarProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const walletPreview = formatWalletAddress(walletAddress);

  return (
    <nav className="sticky top-6 z-40 border-b border-white/20 bg-[#000000] backdrop-blur-sm md:top-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-8 md:pt-10">
        <div className="flex justify-end pr-16">
          <button
            className={`pointer-events-auto mt-3 flex h-[46px] w-[216px] items-center justify-center border px-4 py-2 font-mono text-sm tracking-[0.08em] transition-colors duration-300 md:mt-5 ${
              isWalletConnected
                ? "border-[#FF0000]/45 bg-[#FF0000]/10 text-white hover:border-[#FF0000] hover:bg-[#FF0000]/14"
                : "border-white/20 bg-[#2A2A2A] text-white/70 hover:border-[#FF0000]/50"
            }`}
            disabled={isWalletConnecting}
            onClick={isWalletConnected ? onDisconnectWallet : onConnectWallet}
            type="button"
          >
            {isWalletConnected && walletPreview ? (
              <span className="text-[#FFB066]">{walletPreview}</span>
            ) : (
              <span>
                {t("wallet.statusLabel")} {t("wallet.disconnected")}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="app-container app-stack-lg px-0 pt-8 pb-10 md:pt-10 md:pb-14">
        <div className="flex justify-center">
          <div className="group flex justify-center">
            <div className="w-full max-w-[208px] md:max-w-[220px]">
              <img
                src="/eve-frontier-logo.png"
                alt="EVE Frontier Logo"
                className="mt-4 block h-auto w-full object-contain md:mt-6"
                onError={(event) => {
                  const image = event.currentTarget;
                  image.style.display = "none";
                  const fallback = image.nextElementSibling as HTMLElement | null;
                  if (fallback) {
                    fallback.style.display = "flex";
                  }
                }}
              />
              <div className="hidden aspect-[348/138] w-full items-center justify-center border border-[#FF0000]">
                <svg className="h-12 w-12 text-[#FF0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="app-stack-sm text-center">
          <div className="app-stack-xs">
            <h1 className="text-4xl font-mono font-bold uppercase tracking-wider text-white sm:text-5xl md:text-6xl">
              {currentLang === "en" ? "Bounty Board" : "赏金榜"}
            </h1>
            <p className="font-mono text-sm font-light tracking-wide text-white/70">
              {currentLang === "en" ? "Star Hunter" : "星际猎杀"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-light uppercase tracking-wider text-white/50">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FF0000]/30 to-[#FF0000]/50" />
            <span className="px-4 whitespace-nowrap">{t("appSubtitle")}</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#FF0000]/30 to-[#FF0000]/50" />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between md:pt-6 md:pb-6">
          <button
            className="btn-primary flex items-center justify-center gap-3 px-6 py-3 text-base font-bold sm:justify-start"
            disabled={isCreateBountyPending}
            onClick={onCreateBounty}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
            <span className="font-light tracking-wider">{t("createBounty.button")}</span>
          </button>

          <div className="app-cluster sm:justify-end">
            <LanguageToggle currentLang={currentLang} onToggle={onLanguageToggle} />
          </div>
        </div>
      </div>
    </nav>
  );
}
