// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/WandryFi.sol";

contract SetupWandryFi is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        WandryFi wandryFi = WandryFi(contractAddress);

        // Set destination names
        wandryFi.setDestinationName(1, "Everest Base Camp, Sagarmatha");
        wandryFi.setDestinationName(2, "Chadar Trek, Zanskar Valley");
        wandryFi.setDestinationName(3, "Hemkund Sahib & Valley of Flowers");
        wandryFi.setDestinationName(4, "Key Monastery, Spiti Valley");
        wandryFi.setDestinationName(5, "Havelock Island Circuit");
        wandryFi.setDestinationName(6, "Jaisalmer Fort & Sam Dunes");
        wandryFi.setDestinationName(7, "IIIT Dharwad Campus");
        wandryFi.setDestinationName(8, "LNMIIT Jaipur Campus");

        // Set place values (difficulty multipliers)
        wandryFi.setPlaceValue(1, 15); // Everest - 1.75x
        wandryFi.setPlaceValue(2, 14); // Chadar - 1.7x
        wandryFi.setPlaceValue(3, 12); // Hemkund - 1.6x
        wandryFi.setPlaceValue(4, 11); // Spiti - 1.55x
        wandryFi.setPlaceValue(5, 9);  // Havelock - 1.45x
        wandryFi.setPlaceValue(6, 7);  // Jaisalmer - 1.35x
        wandryFi.setPlaceValue(7, 2);  // IIIT - 1.1x (testing)
        wandryFi.setPlaceValue(8, 2);  // LNMIIT - 1.1x (testing)

        console.log("==========================================");
        console.log("Wanderify Setup Completed Successfully!");
        console.log("==========================================");
        console.log("8 Destinations configured with place values");
        console.log("Contract ready for pool seeding");
        console.log("==========================================");

        vm.stopBroadcast();
    }
}
