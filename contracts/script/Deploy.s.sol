// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {FailBountyProofRegistry} from "../src/FailBountyProofRegistry.sol";

contract Deploy is Script {
    function run() external returns (FailBountyProofRegistry registry) {
        address owner = vm.envAddress("FAILBOUNTY_CONTRACT_OWNER");
        address verifier = vm.envAddress("FAILBOUNTY_CONTRACT_VERIFIER");

        vm.startBroadcast();
        registry = new FailBountyProofRegistry(owner, verifier);
        vm.stopBroadcast();

        console2.log("FailBountyProofRegistry deployed at", address(registry));
    }
}
