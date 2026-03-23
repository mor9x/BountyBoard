import type { BountyCardModel } from "../lib/bounty-view";
import { getTranslation } from "../lib/language";
import { SortOptions } from "./SortOptions";
import { TaskCard } from "./TaskCard";

type TaskListProps = {
  currentLang: "en" | "zh";
  bounties: BountyCardModel[];
  sortType: "totalReward" | "perKillReward" | "timeRemaining";
  onSortChange: (value: "totalReward" | "perKillReward" | "timeRemaining") => void;
  onClaim: (bounty: BountyCardModel) => void;
  onRefund: (bounty: BountyCardModel) => void;
  pendingId?: string | null;
  isLoading?: boolean;
};

export function TaskList({
  currentLang,
  bounties,
  sortType,
  onSortChange,
  onClaim,
  onRefund,
  pendingId,
  isLoading
}: TaskListProps) {
  const t = (key: string) => getTranslation(currentLang, key);

  return (
    <section className="app-container app-stack-lg">
      <div className="app-stack-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-mono font-light uppercase tracking-wider text-white sm:text-3xl">{t("taskList.title")}</h1>
            <p className="font-mono text-xs font-light tracking-wide text-white/50">
              {t("taskList.total")}: {bounties.length}
            </p>
          </div>
        </div>
        <SortOptions currentSort={sortType} onSortChange={onSortChange} currentLang={currentLang} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[#FF0000] border-t-transparent" />
            <p className="font-mono text-sm font-light tracking-wide text-white/50">{t("taskList.loading")}</p>
          </div>
        </div>
      ) : null}

      {!isLoading && bounties.length === 0 ? (
        <div className="py-8 md:py-10">
          <div className="app-panel app-stack-md min-h-[180px] place-items-center text-center">
            <p className="font-mono text-base font-light tracking-wide text-white/75 md:text-lg">{t("taskList.noTasks")}</p>
          </div>
        </div>
      ) : null}

      {!isLoading && bounties.length > 0 ? (
        <div className="app-grid-cards">
          {bounties.map((bounty) => (
            <TaskCard
              bounty={bounty}
              currentLang={currentLang}
              isPending={pendingId === bounty.id}
              key={bounty.id}
              onClaim={onClaim}
              onRefund={onRefund}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
