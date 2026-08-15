// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BountyMint} from "../src/BountyMint.sol";

/// @notice Deploys BountyMint. Reads EXECUTOR_ADDRESS (falls back to the deployer) and
/// deploys with the broadcaster as owner. Run against MONAD_RPC_URL — see
/// contracts/.env.example for the placeholder network parameters to replace on
/// competition day (tracked in specs/7.deploy-and-demo-readiness/tasks.md T-002).
contract DeployScript is Script {
    function run() external returns (BountyMint bounty) {
        uint256 expectedChainId = vm.envUint("MONAD_CHAIN_ID");
        require(expectedChainId != 0, "MONAD_CHAIN_ID unset - see contracts/.env.example");
        require(block.chainid == expectedChainId, "RPC chain id does not match MONAD_CHAIN_ID");

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address executor = vm.envOr("EXECUTOR_ADDRESS", deployer);

        vm.startBroadcast(deployerPrivateKey);
        bounty = new BountyMint(executor, deployer);
        vm.stopBroadcast();

        console.log("BountyMint deployed at:", address(bounty));
        console.log("Owner:", deployer);
        console.log("Executor:", executor);
    }
}
