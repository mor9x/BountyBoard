import { getTranslation } from "../lib/language";

type SortOptionsProps = {
  currentSort: "totalReward" | "perKillReward" | "timeRemaining";
  onSortChange: (value: "totalReward" | "perKillReward" | "timeRemaining") => void;
  currentLang: "en" | "zh";
};

export function SortOptions({ currentSort, onSortChange, currentLang }: SortOptionsProps) {
  const t = (key: string) => getTranslation(currentLang, key);
  const sortOptions = [
    { value: "totalReward", label: t("sort.totalReward") },
    { value: "perKillReward", label: t("sort.perKillReward") },
    { value: "timeRemaining", label: t("sort.timeRemaining") }
  ] as const;

  return (
    <div className="flex flex-col gap-3 border border-white/25 bg-[#2A2A2A] p-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 border-b border-white/15 px-3 pb-3 sm:border-r sm:border-b-0 sm:pb-0 sm:pr-5">
        <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.35}
          />
        </svg>
        <span className="text-sm font-medium uppercase tracking-[0.16em] text-white/75">{t("sort.title")}</span>
      </div>

      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            type="button"
            className={`flex-1 border px-4 py-3 text-sm font-medium tracking-wide transition-all duration-300 ${
              currentSort === option.value
                ? "border-[#FF0000] bg-[#FF0000] text-black shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                : "border-white/10 bg-transparent text-white/70 hover:border-[#FF0000] hover:text-white hover:shadow-[0_0_5px_rgba(255,0,0,0.3)]"
            }`}
          >
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
