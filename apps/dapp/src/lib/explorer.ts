export function getExplorerTransactionUrl(transactionDigest: string, network: string = "testnet") {
  return `https://suiscan.xyz/${network}/tx/${transactionDigest}`;
}
