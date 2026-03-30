import {
  buildClaimMultiBountyTx,
  buildClaimSingleBountyTx,
  buildCreateInsuranceOrderTx,
  buildCreateMultiBountyTx,
  buildCreateSingleBountyTx,
  parseDisplayAmountToAtomicUnits,
  buildRefundInsuranceTx,
  buildRefundMultiBountyTx,
  buildRefundSingleBountyTx,
  getCharacterByItemId,
  LOSS_FILTER,
  SPAWN_MODE,
  supportedTokens,
  type MirrorCharacterLookup,
  type WalletCharacter
} from "@bounty-board/frontier-client";
import { useQueryClient } from "@tanstack/react-query";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { useEffect, useMemo, useState } from "react";
import { ClaimSuccessModal } from "../components/ClaimSuccessModal";
import { CreateBountyModal, type CreateBountyFormValue } from "../components/CreateBountyModal";
import { Navbar } from "../components/Navbar";
import { TaskList } from "../components/TaskList";
import { KillmailFeed } from "../features/killmail/KillmailFeed";
import { useBoardBounties } from "../hooks/useBoardBounties";
import { useEnvironment } from "../hooks/useEnvironment";
import { useAppConnection } from "../hooks/useAppConnection";
import { useWalletCharacters } from "../hooks/useWalletCharacters";
import type { BountyCardModel } from "../lib/bounty-view";
import { readClient } from "../lib/frontier";
import { getTranslation, loadLanguagePreference, saveLanguagePreference, toggleLanguage } from "../lib/language";

const emptyCharacters: WalletCharacter[] = [];

type ClaimSuccessState = {
  amount: number;
  coinType: string;
  tokenSymbol: string;
  transactionDigest: string;
};

function sortCards(cards: BountyCardModel[], sortType: "totalReward" | "perKillReward" | "timeRemaining") {
  const next = [...cards];
  if (sortType === "perKillReward") return next.sort((left, right) => right.perKillReward - left.perKillReward);
  if (sortType === "timeRemaining") return next.sort((left, right) => left.deadline - right.deadline);
  return next.sort((left, right) => right.rewardAmount - left.rewardAmount);
}

function extractTransactionDigest(result: unknown) {
  if (!result || typeof result !== "object") {
    return null;
  }

  if ("digest" in result && typeof result.digest === "string" && result.digest.length > 0) {
    return result.digest;
  }

  if ("transactionDigest" in result && typeof result.transactionDigest === "string" && result.transactionDigest.length > 0) {
    return result.transactionDigest;
  }

  return null;
}

export function HomePage() {
  const environment = useEnvironment();
  const { isConnected, isConnecting, connectionError, walletAddress, handleConnect, handleDisconnect } = useAppConnection();
  const dAppKit = useDAppKit();
  const queryClient = useQueryClient();
  const [currentLang, setCurrentLang] = useState<"en" | "zh">("en");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOperatorPanelOpen, setIsOperatorPanelOpen] = useState(false);
  const [sortType, setSortType] = useState<"totalReward" | "perKillReward" | "timeRemaining">("totalReward");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [shouldOpenModalAfterConnect, setShouldOpenModalAfterConnect] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<ClaimSuccessState | null>(null);
  const t = (key: string) => getTranslation(currentLang, key);

  const walletCharactersQuery = useWalletCharacters();
  const walletCharacters = walletCharactersQuery.data ?? emptyCharacters;
  const walletCharactersError =
    walletCharactersQuery.error instanceof Error ? walletCharactersQuery.error.message : null;

  useEffect(() => {
    setCurrentLang(loadLanguagePreference());
  }, []);

  useEffect(() => {
    if (walletCharacters.length === 0) {
      setSelectedCharacterId(null);
      return;
    }

    setSelectedCharacterId((current) => {
      if (current && walletCharacters.some((character) => character.objectId === current)) return current;
      return walletCharacters[0]?.objectId ?? null;
    });
  }, [walletCharacters]);

  const selectedIdentityCharacter = useMemo<WalletCharacter | null>(
    () => walletCharacters.find((character) => character.objectId === selectedCharacterId) ?? null,
    [selectedCharacterId, walletCharacters]
  );
  const selectedWorldCharacter = useMemo<MirrorCharacterLookup | null>(
    () => (selectedIdentityCharacter ? { ...selectedIdentityCharacter, exists: true } : null),
    [selectedIdentityCharacter]
  );
  const boardBountiesQuery = useBoardBounties(selectedWorldCharacter);
  const sortedCards = useMemo(
    () => sortCards(boardBountiesQuery.data?.cards ?? [], sortType),
    [boardBountiesQuery.data?.cards, sortType]
  );
  const hasExpandedControlPanel = isOperatorPanelOpen;

  useEffect(() => {
    if (!isConnected) {
      setIsModalOpen(false);
      return;
    }

    if (shouldOpenModalAfterConnect) {
      setIsModalOpen(true);
      setShouldOpenModalAfterConnect(false);
    }
  }, [isConnected, shouldOpenModalAfterConnect]);

  async function handleOpenCreateBounty() {
    if (isConnecting) {
      return;
    }

    if (isConnected) {
      setIsModalOpen(true);
      return;
    }

    setShouldOpenModalAfterConnect(true);
    const didConnect = await handleConnect();
    if (!didConnect) {
      setShouldOpenModalAfterConnect(false);
    }
  }

  async function handleWalletDisconnect() {
    const shouldDisconnect =
      typeof window === "undefined"
        ? true
        : window.confirm(currentLang === "en" ? "Disconnect EVE Vault?" : "确认断开 EVE Vault 吗？");

    if (!shouldDisconnect) {
      return;
    }

    await handleDisconnect();
  }

  function invalidateAll() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallet-characters"] }),
      queryClient.invalidateQueries({ queryKey: ["board-snapshot"] }),
      queryClient.invalidateQueries({ queryKey: ["killmail-events"] })
    ]);
  }

  async function executeTransaction(
    actionId: string,
    factory: () => Promise<Awaited<ReturnType<typeof buildClaimSingleBountyTx>>>
  ) {
    setPendingActionId(actionId);
    try {
      const transaction = await factory();
      const result = await dAppKit.signAndExecuteTransaction({ transaction });
      await invalidateAll();
      return result;
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleCreateBounty(form: CreateBountyFormValue) {
    if (!walletAddress) throw new Error("Connect EVE Vault first");
    if (!selectedWorldCharacter) throw new Error("Connected world character is required");

    const token =
      form.token === "CUSTOM"
        ? {
            symbol: "CUSTOM",
            coinType: form.customCoinType.trim(),
            decimals: form.customTokenDecimals ?? 0
          }
        : supportedTokens.find((entry) => entry.symbol === form.token);
    if (!token) throw new Error(`Unsupported token ${form.token}`);
    const selectedLossFilter = form.lossType === "building" ? LOSS_FILTER.structure : LOSS_FILTER.ship;

    const rewardAmount = parseDisplayAmountToAtomicUnits(form.rewardAmount, token);

    if (form.isFutureKiller) {
      await executeTransaction("create-insurance", async () =>
        buildCreateInsuranceOrderTx(readClient, {
          owner: walletAddress,
          packageId: environment.bountyBoardPackageId,
          boardId: environment.boardId,
          clockObjectId: environment.clockObjectId,
          coinType: token.coinType,
          amount: rewardAmount,
          posterCharacterObjectId: selectedWorldCharacter.objectId,
          durationDays: form.timeframeDays,
          lossFilter: selectedLossFilter,
          note: form.remarks,
          spawnMode: form.killCount > 1 ? SPAWN_MODE.multi : SPAWN_MODE.single,
          spawnTargetKills: form.killCount > 1 ? form.killCount : 0
        })
      );
      return;
    }

    const targetItemId = Number(form.targetUID);
    if (!Number.isFinite(targetItemId) || targetItemId <= 0) throw new Error("Target character UID is invalid");

    const resolvedTarget = await getCharacterByItemId(readClient, {
      worldPackageId: environment.worldPackageId,
      worldObjectRegistryId: environment.worldObjectRegistryId,
      itemId: targetItemId,
      tenant: "utopia"
    });

    if (!resolvedTarget) throw new Error("Target world character was not found for this UID");

    if (form.killCount > 1) {
      await executeTransaction("create-multi", async () =>
        buildCreateMultiBountyTx(readClient, {
          owner: walletAddress,
          packageId: environment.bountyBoardPackageId,
          boardId: environment.boardId,
          clockObjectId: environment.clockObjectId,
          coinType: token.coinType,
          amount: rewardAmount,
          posterCharacterObjectId: selectedWorldCharacter.objectId,
          targetCharacterObjectId: resolvedTarget.objectId,
          durationDays: form.timeframeDays,
          lossFilter: selectedLossFilter,
          note: form.remarks,
          targetKills: form.killCount
        })
      );
      return;
    }

    await executeTransaction("create-single", async () =>
      buildCreateSingleBountyTx(readClient, {
        owner: walletAddress,
        packageId: environment.bountyBoardPackageId,
        boardId: environment.boardId,
        clockObjectId: environment.clockObjectId,
        coinType: token.coinType,
        amount: rewardAmount,
        posterCharacterObjectId: selectedWorldCharacter.objectId,
        targetCharacterObjectId: resolvedTarget.objectId,
        durationDays: form.timeframeDays,
        lossFilter: selectedLossFilter,
        note: form.remarks
      })
    );
  }

  async function handleClaim(bounty: BountyCardModel) {
    if (!selectedWorldCharacter) throw new Error("Connected world character is required");

    const result = await executeTransaction(bounty.id, async () =>
      bounty.kind === "multi"
        ? buildClaimMultiBountyTx({
            packageId: environment.bountyBoardPackageId,
            boardId: environment.boardId,
            coinType: bounty.coinType,
            poolObjectId: bounty.id,
            hunterCharacterObjectId: selectedWorldCharacter.objectId
          })
        : buildClaimSingleBountyTx({
            packageId: environment.bountyBoardPackageId,
            boardId: environment.boardId,
            coinType: bounty.coinType,
            poolObjectId: bounty.id,
            hunterCharacterObjectId: selectedWorldCharacter.objectId
          })
    );
    const transactionDigest = extractTransactionDigest(result);

    if (!transactionDigest) {
      return;
    }

    setClaimSuccess({
      amount: bounty.claimableAmount,
      coinType: bounty.coinType,
      tokenSymbol: bounty.tokenSymbol,
      transactionDigest
    });
  }

  async function handleRefund(bounty: BountyCardModel) {
    if (!selectedWorldCharacter) throw new Error("Connected world character is required");

    await executeTransaction(bounty.id, async () => {
      if (bounty.kind === "insurance") {
        return buildRefundInsuranceTx({
          packageId: environment.bountyBoardPackageId,
          boardId: environment.boardId,
          clockObjectId: environment.clockObjectId,
          coinType: bounty.coinType,
          orderObjectId: bounty.id,
          insuredCharacterObjectId: selectedWorldCharacter.objectId
        });
      }

      if (bounty.kind === "multi") {
        return buildRefundMultiBountyTx({
          packageId: environment.bountyBoardPackageId,
          boardId: environment.boardId,
          clockObjectId: environment.clockObjectId,
          coinType: bounty.coinType,
          poolObjectId: bounty.id,
          posterCharacterObjectId: selectedWorldCharacter.objectId
        });
      }

      return buildRefundSingleBountyTx({
        packageId: environment.bountyBoardPackageId,
        boardId: environment.boardId,
        clockObjectId: environment.clockObjectId,
        coinType: bounty.coinType,
        poolObjectId: bounty.id,
        posterCharacterObjectId: selectedWorldCharacter.objectId
      });
    });
  }

  return (
    <div className="app-shell overflow-x-hidden bg-black pt-16">
      <div
        className="pointer-events-none fixed inset-x-0 top-6 bottom-0 opacity-20 md:top-8"
        style={{
          backgroundImage: "url(/evebg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />

      <div className="relative z-10">
        <Navbar
          currentLang={currentLang}
          isCreateBountyPending={isConnecting}
          isWalletConnecting={isConnecting}
          isWalletConnected={isConnected}
          onConnectWallet={() => void handleConnect()}
          onCreateBounty={handleOpenCreateBounty}
          onDisconnectWallet={() => void handleWalletDisconnect()}
          onLanguageToggle={() => {
            const next = toggleLanguage(currentLang);
            setCurrentLang(next);
            saveLanguagePreference(next);
          }}
          walletAddress={walletAddress}
        />

        <main className="app-main relative mt-16 md:mt-24">
          {connectionError ? (
            <section className="app-container pb-8">
              <div className="border border-[#FF0000]/50 bg-[#FF0000]/10 px-6 py-4 font-mono text-sm text-[#ffb0b0]">
                {connectionError}
              </div>
            </section>
          ) : null}

          <TaskList
            bounties={sortedCards}
            currentLang={currentLang}
            isLoading={walletCharactersQuery.isLoading || boardBountiesQuery.isLoading}
            onClaim={handleClaim}
            onRefund={handleRefund}
            onSortChange={setSortType}
            pendingId={pendingActionId}
            sortType={sortType}
          />

          <section className="app-container app-stack-md pt-4 pb-12 md:pt-8">
            <div className="flex justify-end pt-4">
              <div className="app-cluster">
                <button
                  aria-expanded={isOperatorPanelOpen}
                  aria-label="Toggle Operator Console"
                  className={`flex h-12 w-12 items-center justify-center border text-white transition-all duration-300 md:h-[52px] md:w-[52px] ${
                    isOperatorPanelOpen
                      ? "border-[#FF0000] bg-[#FF0000]/15 shadow-[0_0_12px_rgba(255,0,0,0.28)]"
                      : "border-white/20 bg-[#2A2A2A] hover:border-[#FF0000]/60"
                  }`}
                  onClick={() => setIsOperatorPanelOpen((current) => !current)}
                  title="Operator Console"
                  type="button"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 5h16M4 12h16M4 19h16M8 5v14m8-14v14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                    />
                  </svg>
                </button>
              </div>
            </div>

            {hasExpandedControlPanel ? (
              <div className="app-stack-md">
                {isOperatorPanelOpen ? (
                  <section className="app-panel app-stack-md">
                    <div className="text-xs uppercase tracking-widest text-white/50">Operator Console</div>

                    <div className="app-cluster">
                      {isConnected ? (
                        <button className="btn-secondary px-4 py-2 text-sm" onClick={() => void handleDisconnect()} type="button">
                          {t("wallet.disconnect")}
                        </button>
                      ) : (
                        <span className="border border-white/20 px-3 py-2 text-xs text-white/60">
                          {t("wallet.connectViaPublish")}
                        </span>
                      )}
                    </div>

                    <div className="app-grid-metrics">
                      <section className="app-panel-inset app-stack-xs">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Identity World</div>
                        <div className="break-all font-mono text-xs text-white">{environment.identityWorldPackageId}</div>
                      </section>
                      <section className="app-panel-inset app-stack-xs">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Blood Contract</div>
                        <div className="break-all font-mono text-xs text-white">{environment.bountyBoardPackageId}</div>
                      </section>
                    </div>

                    <div className="app-grid-form">
                      <div>
                        <label className="mb-2 block text-sm text-white/70">Wallet Address</label>
                        <div className="border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-white">
                          {walletAddress ?? "--"}
                        </div>
                        <div className="mt-2 font-mono text-[11px] text-white/40">Origin: {typeof window !== "undefined" ? window.location.origin : "--"}</div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-white/70">Role Selector</label>
                        <select
                          className="w-full px-4 py-3 font-mono text-sm"
                          disabled={walletCharacters.length === 0}
                          onChange={(event) => setSelectedCharacterId(event.target.value)}
                          value={selectedCharacterId ?? ""}
                        >
                          {walletCharacters.map((character) => (
                            <option key={character.objectId} value={character.objectId}>
                              {character.metadata.name ?? "Unnamed"} / {character.itemId}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {walletAddress && walletCharactersError ? (
                      <p className="font-mono text-xs text-[#FF0000]">Identity-world query failed: {walletCharactersError}</p>
                    ) : null}
                    {walletAddress &&
                    !walletCharactersError &&
                    !walletCharactersQuery.isLoading &&
                    walletCharacters.length === 0 ? (
                      <p className="font-mono text-xs text-[#FF0000]">No identity-world character found for this wallet.</p>
                    ) : null}
                  </section>
                ) : null}

              </div>
            ) : null}

            {hasExpandedControlPanel ? (
              <KillmailFeed currentLang={currentLang} />
            ) : null}
          </section>
        </main>

        <button
          aria-label={currentLang === "en" ? "Publish Bounty" : "发布悬赏"}
          className="btn-primary group fixed bottom-8 right-8 z-30 flex h-16 w-16 items-center justify-center shadow-lg transition-all duration-300 hover:shadow-2xl"
          disabled={isConnecting}
          onClick={handleOpenCreateBounty}
          type="button"
        >
          <svg className="h-8 w-8 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          </svg>
        </button>

        <CreateBountyModal
          availableTokens={supportedTokens}
          currentLang={currentLang}
          isOpen={isModalOpen}
          isSubmitting={pendingActionId?.startsWith("create-") ?? false}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateBounty}
          selectedCharacter={selectedIdentityCharacter}
          walletAddress={walletAddress ?? null}
        />

        <ClaimSuccessModal
          amount={claimSuccess?.amount ?? 0}
          coinType={claimSuccess?.coinType ?? ""}
          currentLang={currentLang}
          isOpen={claimSuccess !== null}
          onClose={() => setClaimSuccess(null)}
          tokenSymbol={claimSuccess?.tokenSymbol ?? ""}
          transactionDigest={claimSuccess?.transactionDigest ?? ""}
        />
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF0000] to-transparent opacity-30" />
    </div>
  );
}
