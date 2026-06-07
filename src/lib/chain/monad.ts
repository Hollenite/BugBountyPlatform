export const MONAD_TESTNET_CHAIN_ID = 10143
export const MONAD_TESTNET_RPC_URL =
  process.env.MONAD_RPC_URL ?? process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz"
export const MONAD_TESTNET_EXPLORER_URL = "https://testnet.monadscan.com"

export function getProofRegistryAddress() {
  return process.env.NEXT_PUBLIC_FAILBOUNTY_CONTRACT_ADDRESS ?? process.env.FAILBOUNTY_CONTRACT_ADDRESS ?? null
}

export function monadTxUrl(txHash: string) {
  return `${MONAD_TESTNET_EXPLORER_URL}/tx/${txHash}`
}

export function monadAddressUrl(address: string) {
  return `${MONAD_TESTNET_EXPLORER_URL}/address/${address}`
}
