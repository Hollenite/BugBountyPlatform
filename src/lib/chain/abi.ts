export const FAILBOUNTY_PROOF_REGISTRY_ABI = [
  {
    type: "function",
    name: "createProgram",
    stateMutability: "payable",
    inputs: [{ name: "programId", type: "string" }],
    outputs: [{ name: "programIndex", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitFindingFor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "programIndex", type: "uint256" },
      { name: "reportHash", type: "bytes32" },
      { name: "evidenceHash", type: "bytes32" },
      { name: "submissionId", type: "string" },
      { name: "researcher", type: "address" },
    ],
    outputs: [{ name: "findingId", type: "uint256" }],
  },
  {
    type: "function",
    name: "approveFinding",
    stateMutability: "nonpayable",
    inputs: [
      { name: "findingId", type: "uint256" },
      { name: "severity", type: "uint8" },
      { name: "payoutWei", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "ProgramCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "programIndex", type: "uint256" },
      { indexed: false, name: "programId", type: "string" },
      { indexed: false, name: "escrow", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ProofSubmitted",
    anonymous: false,
    inputs: [
      { indexed: true, name: "findingId", type: "uint256" },
      { indexed: true, name: "programIndex", type: "uint256" },
      { indexed: true, name: "researcher", type: "address" },
      { indexed: false, name: "reportHash", type: "bytes32" },
      { indexed: false, name: "evidenceHash", type: "bytes32" },
      { indexed: false, name: "submissionId", type: "string" },
    ],
  },
  {
    type: "event",
    name: "FindingApproved",
    anonymous: false,
    inputs: [
      { indexed: true, name: "findingId", type: "uint256" },
      { indexed: true, name: "researcher", type: "address" },
      { indexed: false, name: "severity", type: "uint8" },
      { indexed: false, name: "payoutWei", type: "uint256" },
      { indexed: false, name: "reportHash", type: "bytes32" },
    ],
  },
] as const
