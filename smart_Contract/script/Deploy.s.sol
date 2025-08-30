// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/WandryFi.sol";

contract DeployWandryFi is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address verifierAddress = vm.envAddress("VERIFIER_ADDRESS");
        address treasuryAddress = vm.envAddress("TREASURY_ADDRESS");
        uint256 platformFeePercent = vm.envUint("PLATFORM_FEE_PERCENT");

        vm.startBroadcast(deployerPrivateKey);

        WandryFi wandryFi = new WandryFi(
            verifierAddress,
            treasuryAddress,
            platformFeePercent
        );

        console.log("==========================================");
        console.log("WandryFi Contract Deployed Successfully!");
        console.log("==========================================");
        console.log("Contract Address:", address(wandryFi));
        console.log("Verifier Address:", verifierAddress);
        console.log("Treasury Address:", treasuryAddress);
        console.log("Platform Fee:", platformFeePercent, "%");
        console.log("Base Reward:", wandryFi.BASE_REWARD(), "wei (0.002 TMON)");
        console.log("==========================================");

        vm.stopBroadcast();
    }
}
