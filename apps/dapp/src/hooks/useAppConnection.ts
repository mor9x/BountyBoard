import { useCurrentAccount, useDAppKit, useWalletConnection, useWallets } from "@mysten/dapp-kit-react";
import { useMemo, useState } from "react";

const PREFERRED_WALLET_NAMES = ["EVE Frontier Client Wallet", "Eve Vault"];

export function useAppConnection() {
  const currentAccount = useCurrentAccount();
  const connection = useWalletConnection();
  const wallets = useWallets();
  const dAppKit = useDAppKit();
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const preferredWallet = useMemo(
    () => wallets.find((wallet) => PREFERRED_WALLET_NAMES.some((name) => wallet.name.includes(name))) ?? null,
    [wallets]
  );

  async function handleConnect() {
    if (connection.isConnecting) {
      return false;
    }

    if (!preferredWallet) {
      setConnectionError("EVE Vault was not detected in this browser.");
      return false;
    }

    try {
      await dAppKit.connectWallet({ wallet: preferredWallet });
      setConnectionError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to connect wallet.";
      setConnectionError(
        message.includes("Origin not allowed")
          ? `EVE Vault rejected this site origin (${window.location.origin}). Open the dapp from http://localhost:5173 and retry.`
          : message
      );
      console.error("[BountyBoard] Failed to connect wallet:", error);
      return false;
    }
  }

  async function handleDisconnect() {
    await dAppKit.disconnectWallet();
    setConnectionError(null);
  }

  return {
    currentAccount,
    walletAddress: currentAccount?.address,
    hasEveVault: wallets.some((wallet) => PREFERRED_WALLET_NAMES.some((name) => wallet.name.includes(name))),
    isConnected: connection.isConnected,
    isConnecting: connection.isConnecting,
    connectionStatus: connection.status,
    connectionError,
    handleConnect,
    handleDisconnect
  };
}
