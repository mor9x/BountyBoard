export type SupportedToken = {
  symbol: "EVE" | "FUEL" | "SUI" | "USDT" | "USDC";
  coinType: string;
  decimals: number;
};

export const supportedTokens: SupportedToken[] = [
  {
    symbol: "EVE",
    coinType: "0xbaf6e123698cc170c7d656f1606ae1e050bb3d4e5db1460af1c9af284122a8b1::EVE::EVE",
    decimals: 9
  },
  {
    symbol: "FUEL",
    coinType: "0xffeca0a98bd75145a10e597cc5a02614cc651f3c1b8d79134bec40ff1fcefc91::fuel::FUEL",
    decimals: 9
  },
  {
    symbol: "SUI",
    coinType: "0x2::sui::SUI",
    decimals: 9
  },
  {
    symbol: "USDT",
    coinType: "0x700de8dea1aac1de7531e9d20fc2568b12d74369f91b7fad3abc1c4f40396e52::usdt::USDT",
    decimals: 6
  },
  {
    symbol: "USDC",
    coinType: "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC",
    decimals: 6
  }
];

function decimalFactor(decimals: number) {
  return 10n ** BigInt(decimals);
}

function trimFraction(value: string) {
  if (!value.includes(".")) {
    return value;
  }

  return value.replace(/\.?0+$/, "");
}

export function getSupportedTokenByCoinType(coinType: string) {
  return supportedTokens.find((token) => token.coinType === coinType) ?? null;
}

export function getSupportedTokenBySymbol(symbol: SupportedToken["symbol"]) {
  return supportedTokens.find((token) => token.symbol === symbol) ?? null;
}

export function parseDisplayAmountToAtomicUnits(value: string, token: SupportedToken) {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Reward amount is invalid for ${token.symbol}`);
  }

  const [wholePart, fractionPart = ""] = normalized.split(".");
  if (fractionPart.length > token.decimals) {
    throw new Error(`${token.symbol} supports up to ${token.decimals} decimal places`);
  }

  const factor = decimalFactor(token.decimals);
  const wholeUnits = BigInt(wholePart) * factor;
  const fractionUnits = BigInt((fractionPart + "0".repeat(token.decimals)).slice(0, token.decimals));
  const amount = wholeUnits + fractionUnits;

  if (amount <= 0n) {
    throw new Error("Reward must be greater than zero");
  }

  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Reward amount is too large");
  }

  return Number(amount);
}

export function formatAtomicAmount(amount: number, token: SupportedToken, maximumFractionDigits = 6) {
  const factor = 10 ** token.decimals;
  const displayAmount = amount / factor;

  return trimFraction(
    displayAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(token.decimals, maximumFractionDigits)
    })
  );
}
