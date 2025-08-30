// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/WandryFi.sol";

contract SeedPools is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        WandryFi wandryFi = WandryFi(contractAddress);

        console.log("Starting Pool Seeding Process...");

        // Seed pools with direct wei amounts
        wandryFi.seedPool{value: 400000000000000000}(1);  // 0.4 TMON
        wandryFi.seedPool{value: 350000000000000000}(2);  // 0.35 TMON
        wandryFi.seedPool{value: 300000000000000000}(3);  // 0.3 TMON
        wandryFi.seedPool{value: 250000000000000000}(4);  // 0.25 TMON
        wandryFi.seedPool{value: 200000000000000000}(5);  // 0.2 TMON
        wandryFi.seedPool{value: 150000000000000000}(6);  // 0.15 TMON
        wandryFi.seedPool{value: 50000000000000000}(7);   // 0.05 TMON
        wandryFi.seedPool{value: 50000000000000000}(8);   // 0.05 TMON

        console.log("All pools seeded successfully!");
        console.log("Total seeded: 1.75 TMON");

        vm.stopBroadcast();
    }
}
