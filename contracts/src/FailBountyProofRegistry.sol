// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

/// @notice Monad testnet proof registry for verifier-approved FailBounty findings.
/// @dev Stores hashes and payout metadata only. Raw traces and replay bundles stay offchain.
contract FailBountyProofRegistry is Ownable, ReentrancyGuard {
    struct Program {
        string programId;
        uint256 escrow;
        bool active;
    }

    struct Finding {
        uint256 programIndex;
        address researcher;
        bytes32 reportHash;
        bytes32 evidenceHash;
        string submissionId;
        bool approved;
        uint8 severity;
        uint256 payoutWei;
    }

    Program[] public programs;
    Finding[] public findings;

    mapping(address => bool) public verifiers;
    mapping(bytes32 => bool) public reportHashSubmitted;

    event VerifierSet(address indexed verifier, bool allowed);
    event ProgramCreated(uint256 indexed programIndex, string programId, uint256 escrow);
    event ProgramFunded(uint256 indexed programIndex, uint256 amount, uint256 newEscrow);
    event ProofSubmitted(
        uint256 indexed findingId,
        uint256 indexed programIndex,
        address indexed researcher,
        bytes32 reportHash,
        bytes32 evidenceHash,
        string submissionId
    );
    event FindingApproved(
        uint256 indexed findingId,
        address indexed researcher,
        uint8 severity,
        uint256 payoutWei,
        bytes32 reportHash
    );

    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Not verifier");
        _;
    }

    constructor(address initialOwner, address initialVerifier) Ownable(initialOwner) {
        require(initialVerifier != address(0), "Invalid verifier");
        verifiers[initialVerifier] = true;
        emit VerifierSet(initialVerifier, true);
    }

    receive() external payable {}

    function setVerifier(address verifier, bool allowed) external onlyOwner {
        require(verifier != address(0), "Invalid verifier");
        verifiers[verifier] = allowed;
        emit VerifierSet(verifier, allowed);
    }

    function createProgram(string calldata programId) external payable onlyOwner returns (uint256 programIndex) {
        require(bytes(programId).length > 0, "Invalid program");

        programIndex = programs.length;
        programs.push(Program({programId: programId, escrow: msg.value, active: true}));

        emit ProgramCreated(programIndex, programId, msg.value);
    }

    function fundProgram(uint256 programIndex) external payable onlyOwner {
        require(programIndex < programs.length, "Program not found");
        require(msg.value > 0, "No funding");

        Program storage program = programs[programIndex];
        program.escrow += msg.value;

        emit ProgramFunded(programIndex, msg.value, program.escrow);
    }

    function submitFindingFor(
        uint256 programIndex,
        bytes32 reportHash,
        bytes32 evidenceHash,
        string calldata submissionId,
        address researcher
    ) external onlyVerifier returns (uint256 findingId) {
        require(programIndex < programs.length, "Program not found");
        require(programs[programIndex].active, "Program inactive");
        require(researcher != address(0), "Invalid researcher");
        require(reportHash != bytes32(0), "Invalid report hash");
        require(evidenceHash != bytes32(0), "Invalid evidence hash");
        require(bytes(submissionId).length > 0, "Invalid submission");
        require(!reportHashSubmitted[reportHash], "Already submitted");

        findingId = findings.length;
        findings.push(
            Finding({
                programIndex: programIndex,
                researcher: researcher,
                reportHash: reportHash,
                evidenceHash: evidenceHash,
                submissionId: submissionId,
                approved: false,
                severity: 0,
                payoutWei: 0
            })
        );
        reportHashSubmitted[reportHash] = true;

        emit ProofSubmitted(findingId, programIndex, researcher, reportHash, evidenceHash, submissionId);
    }

    function approveFinding(uint256 findingId, uint8 severity, uint256 payoutWei) external onlyVerifier nonReentrant {
        require(findingId < findings.length, "Finding not found");
        require(severity >= 1 && severity <= 4, "Invalid severity");
        require(payoutWei > 0, "Invalid payout");

        Finding storage finding = findings[findingId];
        require(!finding.approved, "Already approved");

        Program storage program = programs[finding.programIndex];
        require(program.escrow >= payoutWei, "Insufficient escrow");

        finding.approved = true;
        finding.severity = severity;
        finding.payoutWei = payoutWei;
        program.escrow -= payoutWei;

        (bool sent,) = finding.researcher.call{value: payoutWei}("");
        require(sent, "Payout failed");

        emit FindingApproved(findingId, finding.researcher, severity, payoutWei, finding.reportHash);
    }

    function programCount() external view returns (uint256) {
        return programs.length;
    }

    function findingCount() external view returns (uint256) {
        return findings.length;
    }
}
