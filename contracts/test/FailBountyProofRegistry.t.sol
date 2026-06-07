// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {FailBountyProofRegistry} from "../src/FailBountyProofRegistry.sol";

contract FailBountyProofRegistryTest is Test {
    FailBountyProofRegistry registry;

    address verifier = address(0xBEEF);
    address researcher = address(0xCAFE);
    bytes32 reportHash = bytes32(uint256(1));
    bytes32 evidenceHash = bytes32(uint256(2));

    function setUp() public {
        registry = new FailBountyProofRegistry(address(this), verifier);
        registry.createProgram{value: 1 ether}("prog-refund-demo");
    }

    function testVerifierCanSubmitProofForResearcher() public {
        vm.prank(verifier);
        uint256 findingId = registry.submitFindingFor(0, reportHash, evidenceHash, "sub-123", researcher);

        (
            uint256 programIndex,
            address storedResearcher,
            bytes32 storedReportHash,
            bytes32 storedEvidenceHash,
            string memory storedSubmissionId,
            bool approved,
            uint8 severity,
            uint256 payoutWei
        ) = registry.findings(findingId);

        assertEq(programIndex, 0);
        assertEq(storedResearcher, researcher);
        assertEq(storedReportHash, reportHash);
        assertEq(storedEvidenceHash, evidenceHash);
        assertEq(storedSubmissionId, "sub-123");
        assertEq(approved, false);
        assertEq(severity, 0);
        assertEq(payoutWei, 0);
    }

    function testRejectsDuplicateReportHash() public {
        vm.prank(verifier);
        registry.submitFindingFor(0, reportHash, evidenceHash, "sub-123", researcher);

        vm.expectRevert("Already submitted");
        vm.prank(verifier);
        registry.submitFindingFor(0, reportHash, evidenceHash, "sub-456", researcher);
    }

    function testRejectsNonVerifierProofSubmission() public {
        vm.expectRevert("Not verifier");
        registry.submitFindingFor(0, reportHash, evidenceHash, "sub-123", researcher);
    }

    function testApprovalPaysStoredResearcherWallet() public {
        uint256 payout = 0.01 ether;
        uint256 researcherStart = researcher.balance;

        vm.prank(verifier);
        uint256 findingId = registry.submitFindingFor(0, reportHash, evidenceHash, "sub-123", researcher);

        vm.prank(verifier);
        registry.approveFinding(findingId, 2, payout);

        assertEq(researcher.balance, researcherStart + payout);
    }
}
