import { getTranslation } from "../lib/language";

type LanguageToggleProps = {
  currentLang: "en" | "zh";
  onToggle: () => void;
};

export function LanguageToggle({ currentLang, onToggle }: LanguageToggleProps) {
  const t = (key: string) => getTranslation(currentLang, key);

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 border border-white/20 bg-[#2A2A2A] px-5 py-3 text-base text-white transition-all duration-300 hover:border-[#FF0000] hover:shadow-[0_0_10px_rgba(255,0,0,0.3)]"
      aria-label={t("language.switch")}
      type="button"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
        />
      </svg>
      <span className="font-light tracking-wider">{currentLang === "en" ? "EN" : "中文"}</span>
    </button>
  );
}
