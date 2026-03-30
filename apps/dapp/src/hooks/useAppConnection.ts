import { useCurrentAccount, useDAppKit, useWalletConnection, useWallets } from "@mysten/dapp-kit-react";
import { useEffect, useMemo, useRef, useState } from "react";

const PREFERRED_WALLET_NAMES = ["EVE Frontier Client Wallet", "Eve Vault"];

export function useAppConnection() {
  const currentAccount = useCurrentAccount();
  const connection = useWalletConnection();
  const wallets = useWallets();
  const dAppKit = useDAppKit();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectInFlightRef = useRef(false);

  const preferredWallet = useMemo(
    () => wallets.find((wallet) => PREFERRED_WALLET_NAMES.some((name) => wallet.name.includes(name))) ?? null,
    [wallets]
  );

  useEffect(() => {
    if (!connection.isConnecting) {
      connectInFlightRef.current = false;
    }
  }, [connection.isConnecting]);

  async function handleConnect() {
    if (connectInFlightRef.current || connection.isConnecting) {
      return false;
    }

    if (!preferredWallet) {
      setConnectionError("EVE Vault was not detected in this browser.");
      return false;
    }

    try {
      connectInFlightRef.current = true;
      await dAppKit.connectWallet({ wallet: preferredWallet });
      setConnectionError(null);
      return true;
    } catch (error) {
      connectInFlightRef.current = false;
      const message = error instanceof Error ? error.message : "Failed to connect wallet.";
      setConnectionError(
        message.includes("Origin not allowed")
          ? `EVE Vault rejected this site origin (${window.location.origin}). Open the dapp from http://localhost:5173 and retry.`
          : message
      );
      console.error("[BloodContract] Failed to connect wallet:", error);
      return false;
    }
  }

  async function handleDisconnect() {
    connectInFlightRef.current = false;
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
