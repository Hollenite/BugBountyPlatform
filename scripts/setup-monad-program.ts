import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { Contract, Interface, JsonRpcProvider, Wallet, type LogDescription } from "ethers"
import { PrismaClient } from "@prisma/client"
import { FAILBOUNTY_PROOF_REGISTRY_ABI } from "../src/lib/chain/abi"
import { MONAD_TESTNET_CHAIN_ID, MONAD_TESTNET_RPC_URL } from "../src/lib/chain/monad"

const envPath = resolve(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  const contents = readFileSync(envPath, "utf8")
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const separator = trimmed.indexOf("=")
    if (separator === -1) continue
    const key = trimmed.slice(0, separator)
    const raw = trimmed.slice(separator + 1)
    const value = raw.replace(/^"|"$/g, "")
    if (!process.env[key]) process.env[key] = value
  }
}

const prisma = new PrismaClient()
const iface = new Interface(FAILBOUNTY_PROOF_REGISTRY_ABI)

async function main() {
  const programId = process.env.FAILBOUNTY_MONAD_PROGRAM_ID ?? "prog-refund-demo"
  const privateKey = process.env.MONAD_PRIVATE_KEY
  const contractAddress = process.env.FAILBOUNTY_CONTRACT_ADDRESS ?? process.env.NEXT_PUBLIC_FAILBOUNTY_CONTRACT_ADDRESS
  const escrowWei = BigInt(process.env.FAILBOUNTY_PROGRAM_ESCROW_WEI ?? "0")

  if (!privateKey) throw new Error("MONAD_PRIVATE_KEY is required. Decrypt the monskills keystore for this command only.")
  if (!contractAddress) throw new Error("FAILBOUNTY_CONTRACT_ADDRESS or NEXT_PUBLIC_FAILBOUNTY_CONTRACT_ADDRESS is required.")

  const program = await prisma.program.findUnique({ where: { id: programId } })
  if (!program) throw new Error(`Program ${programId} does not exist. Run npm run db:seed first.`)
  if (program.chainProgramIndex !== null) {
    console.log(JSON.stringify({
      status: "already_configured",
      programId,
      chainProgramIndex: program.chainProgramIndex,
      escrowTx: program.escrowTx,
    }))
    return
  }

  const provider = new JsonRpcProvider(MONAD_TESTNET_RPC_URL, MONAD_TESTNET_CHAIN_ID)
  const signer = new Wallet(privateKey, provider)
  const contract = new Contract(contractAddress, FAILBOUNTY_PROOF_REGISTRY_ABI, signer)
  const gasEstimate = await contract.createProgram.estimateGas(programId, { value: escrowWei })
  const tx = await contract.createProgram(programId, {
    value: escrowWei,
    gasLimit: gasEstimate + gasEstimate / 10n,
  })
  const receipt = await tx.wait()
  if (!receipt || receipt.status !== 1) throw new Error("createProgram transaction failed")

  const event = receipt.logs
    .filter((log: { address: string }) => log.address.toLowerCase() === contractAddress.toLowerCase())
    .map((log: { topics: string[]; data: string }) => {
      try {
        return iface.parseLog({ topics: log.topics, data: log.data })
      } catch {
        return null
      }
    })
    .find((parsed: LogDescription | null) => parsed?.name === "ProgramCreated")

  if (!event) throw new Error("ProgramCreated event not found in receipt")

  const chainProgramIndex = Number(event.args.programIndex)
  if (!Number.isSafeInteger(chainProgramIndex)) throw new Error("ProgramCreated index is not a safe integer")

  await prisma.program.update({
    where: { id: programId },
    data: {
      chainProgramIndex,
      escrowTx: receipt.hash,
      poolBalanceWei: escrowWei.toString(),
    },
  })

  console.log(JSON.stringify({
    status: "configured",
    programId,
    chainProgramIndex,
    escrowTx: receipt.hash,
    contractAddress,
  }))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
