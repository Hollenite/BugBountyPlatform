# Monad Testnet Integration

FailBounty uses Monad testnet as an optional proof anchor for verifier-approved findings. The chain path starts only after the off-chain review is accepted with `replayResult = "reproduced_exact"`.

Do not put raw prompts, traces, replay bundles, verifier notes, or private session data onchain. The contract stores only `reportHash`, `evidenceHash`, `submissionId`, program index, researcher wallet, and optional symbolic payout metadata.

## Network

- Chain: Monad testnet
- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadscan.com`

## Environment

Add these to `.env.local` after deployment:

```env
MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
NEXT_PUBLIC_MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
NEXT_PUBLIC_FAILBOUNTY_CONTRACT_ADDRESS="0x..."
FAILBOUNTY_CONTRACT_ADDRESS="0x..."
```

For one-time program setup, pass the deployment wallet key only for the command invocation. Do not store plaintext private keys in `.env.local`.

```bash
MONAD_PRIVATE_KEY="$(cast wallet decrypt-keystore --keystore-dir ~/.monskills/keystore <KEYSTORE_FILENAME> --unsafe-password "" | awk '{print $NF}')" \
FAILBOUNTY_PROGRAM_ESCROW_WEI=0 \
npm run chain:setup-program
```

## Contract Workflow

Install Foundry and dependencies:

```bash
cd contracts
forge install --no-git OpenZeppelin/openzeppelin-contracts
forge install --no-git foundry-rs/forge-std
```

Build and test:

```bash
npm run contracts:build
npm run contracts:test
```

Deploy:

```bash
cd contracts
FAILBOUNTY_CONTRACT_OWNER=0x... \
FAILBOUNTY_CONTRACT_VERIFIER=0x... \
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast
```

Verify with the monskills verification API first. If that is unavailable, use the Monad Foundry fallback:

```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/FailBountyProofRegistry.sol:FailBountyProofRegistry \
  --chain 10143 \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org/
```

## App Workflow

1. Run the normal app flow through verifier approval.
2. Confirm `Submission.status = "accepted"` and `Submission.replayResult = "reproduced_exact"`.
3. Confirm `Program.chainProgramIndex` is set by `npm run chain:setup-program`.
4. Open the verifier submission review page.
5. Use `Record proof on Monad testnet`.
6. The app submits `submitFindingFor(...)`, waits for the receipt, verifies the emitted `ProofSubmitted` event server-side, then writes `chainFindingId` and `submitFindingTx`.

The Test Lab is not part of this integration path.
