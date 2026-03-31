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
    <nav className="relative z-40 border-b border-white/10 bg-[#000000] shadow-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-10 md:pt-12">
        <div className="flex justify-end pr-10 md:pr-16">
          <button
            className={`pointer-events-auto flex h-[64px] w-[280px] items-center justify-center border px-8 py-3 font-mono text-base font-bold tracking-widest transition-all duration-300 ${
              isWalletConnected
                ? "border-[#FF0000]/40 bg-[#FF0000]/10 text-white hover:border-[#FF0000] hover:bg-[#FF0000]/20"
                : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"
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

      <div className="app-container app-stack-lg px-0 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="flex justify-center">
          <div className="group flex justify-center">
            <div className="w-full max-w-[240px] md:max-w-[280px]">
              <img
                src="/eve-frontier-logo.png"
                alt="EVE Frontier Logo"
                className="mt-8 block h-auto w-full object-contain md:mt-12"
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
            <h1 className="text-5xl font-mono font-bold uppercase tracking-wider text-white sm:text-6xl md:text-7xl">
              {currentLang === "en" ? "Blood Contract" : "血狩契约"}
            </h1>
            <p className="font-mono text-base font-light tracking-widest text-white/70">
              {currentLang === "en" ? "Star Hunter" : "星际猎杀"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-light uppercase tracking-wider text-white/50">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FF0000]/30 to-[#FF0000]/50" />
            <span className="px-4 whitespace-nowrap">{t("appSubtitle")}</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#FF0000]/30 to-[#FF0000]/50" />
          </div>
        </div>

        <div className="flex flex-col gap-6 pt-8 pb-6 sm:flex-row sm:items-center sm:justify-between md:pt-10 md:pb-8">
          <button
            className="btn-primary flex items-center justify-center gap-4 px-10 py-4 text-lg font-bold sm:justify-start"
            disabled={isCreateBountyPending}
            onClick={onCreateBounty}
            type="button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
            </svg>
            <span className="font-bold tracking-widest">{t("createBounty.button")}</span>
          </button>

          <div className="app-cluster sm:justify-end">
            <LanguageToggle currentLang={currentLang} onToggle={onLanguageToggle} />
          </div>
        </div>
      </div>
    </nav>
  );
}
