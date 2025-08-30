// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title Wanderify
 * @notice A travel-to-earn dApp where users stake TMON to prove on-ground arrival.
 * @dev v3.1: Optimized for Monad blockchain with 0.002 TMON BASE_REWARD
 */
contract WandryFi is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    // =============================================================
    // State Variables
    // =============================================================
    uint256 private _tokenIdCounter;
    address public verifierAddress;
    address public treasuryAddress;
    uint256 public platformFeePercent;
    uint256 public constant MIN_STAKE_DURATION = 15 days;
    uint256 public constant BASE_REWARD = 2000000000000000; // 0.002 TMON in wei
    uint256 public constant BETA = 50; // 0.5 scaled by 100

    // =============================================================
    // Custom Errors
    // =============================================================
    error VerifierCannotBeZero();
    error TreasuryCannotBeZero();
    error FeeCannotExceed5Percent();
    error StakeMustBeGreaterThanZero();
    error ActiveCommitmentExists();
    error FeeTransferFailed();
    error NoActiveCommitment();
    error CommitmentAlreadyProcessed();
    error TravelDateNotReached();
    error InvalidSignature();
    error PayoutFailed();
    error TravelDeadlineNotPassed();
    error NFTDoesNotExist();
    error SeedMustBeGreaterThanZero();
    error CannotBeZeroAddress();
    error WithdrawalFailed();
    error InvalidSignatureLength();

    // =============================================================
    // State Mappings
    // =============================================================
    mapping(uint256 => uint256) public locationPools;
    mapping(uint256 => uint256) public placeValues;
    mapping(address => Commitment) public commitments;
    mapping(address => uint256) public userProfits;
    
    // NFT-related mappings
    mapping(uint256 => JourneyNFT) public journeyNFTs;
    mapping(address => uint256[]) public userJourneyNFTs;
    mapping(uint256 => string) public destinationNames;
    mapping(uint256 => string) public destinationMetadata;
    
    // Leaderboard tracking
    address[] public userList;
    mapping(address => bool) private isUserTracked;

    // =============================================================
    // Structs & Events
    // =============================================================
    struct Commitment {
        address user;
        uint256 amountInPool;
        uint256 travelDate;
        uint256 destinationId;
        bool isProcessed;
    }

    struct JourneyNFT {
        uint256 destinationId;
        uint256 completionDate;
        uint256 stakedAmount;
        uint256 rewardEarned;
        string destinationName;
    }

    event Staked(address indexed user, uint256 destinationId, uint256 totalAmount, uint256 travelDate);
    event CheckedIn(address indexed user, uint256 destinationId, uint256 payout);
    event FailureProcessed(address indexed user, uint256 destinationId);
    event PoolSeeded(uint256 indexed destinationId, uint256 amount);
    event ProfitRecorded(address indexed user, uint256 profit);
    event JourneyNFTMinted(address indexed user, uint256 indexed tokenId, uint256 indexed destinationId);

    // =============================================================
    // Constructor
    // =============================================================
    constructor(address _verifierAddress, address _treasuryAddress, uint256 _initialFeePercent)
        ERC721("Wanderify Journey", "WJRNY")
        Ownable(msg.sender)
    {
        if (_verifierAddress == address(0)) revert VerifierCannotBeZero();
        if (_treasuryAddress == address(0)) revert TreasuryCannotBeZero();
        if (_initialFeePercent > 5) revert FeeCannotExceed5Percent();
        
        verifierAddress = _verifierAddress;
        treasuryAddress = _treasuryAddress;
        platformFeePercent = _initialFeePercent;
    }

    // =============================================================
    // Core Functions
    // =============================================================
    function stake(uint256 _destinationId, uint256 _travelDate) public payable whenNotPaused {
        if (msg.value == 0) revert StakeMustBeGreaterThanZero();
        if (!(commitments[msg.sender].isProcessed || commitments[msg.sender].user == address(0))) {
            revert ActiveCommitmentExists();
        }

        uint256 feeAmount = (msg.value * platformFeePercent) / 100;
        uint256 poolAmount = msg.value - feeAmount;

        (bool sent,) = treasuryAddress.call{value: feeAmount}("");
        if (!sent) revert FeeTransferFailed();

        locationPools[_destinationId] += poolAmount;
        commitments[msg.sender] = Commitment(msg.sender, poolAmount, _travelDate, _destinationId, false);

        emit Staked(msg.sender, _destinationId, msg.value, _travelDate);
    }

    function checkIn(bytes memory _signature) public nonReentrant whenNotPaused {
        Commitment storage commitment = commitments[msg.sender];
        if (commitment.user == address(0)) revert NoActiveCommitment();
        if (commitment.isProcessed) revert CommitmentAlreadyProcessed();
        if (block.timestamp < commitment.travelDate) revert TravelDateNotReached();

        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, commitment.destinationId));
        address signer = recoverSigner(messageHash, _signature);
        if (signer != verifierAddress) revert InvalidSignature();

        uint256 placeValueBonus = BASE_REWARD * (100 + (BETA * placeValues[commitment.destinationId])) / 100;
        uint256 poolCap = locationPools[commitment.destinationId] / 10;
        uint256 emission = (placeValueBonus < poolCap) ? placeValueBonus : poolCap;
        
        uint256 totalPayout = commitment.amountInPool + emission;

        // Profit tracking for leaderboard
        if (platformFeePercent > 0) {
            uint256 originalStake = (commitment.amountInPool * 100) / (100 - platformFeePercent);
            if (totalPayout > originalStake) {
                uint256 profit = totalPayout - originalStake;
                userProfits[msg.sender] += profit;
                emit ProfitRecorded(msg.sender, profit);
                
                if (!isUserTracked[msg.sender]) {
                    isUserTracked[msg.sender] = true;
                    userList.push(msg.sender);
                }
            }
        }

        locationPools[commitment.destinationId] -= emission;
        commitment.isProcessed = true;

        _mintJourneyNFT(msg.sender, commitment.destinationId, commitment.amountInPool, emission);

        (bool sent,) = msg.sender.call{value: totalPayout}("");
        if (!sent) revert PayoutFailed();

        emit CheckedIn(msg.sender, commitment.destinationId, totalPayout);
    }

    function processFailure() public {
        Commitment storage commitment = commitments[msg.sender];
        if (commitment.user == address(0)) revert NoActiveCommitment();
        if (commitment.isProcessed) revert CommitmentAlreadyProcessed();
        if (block.timestamp <= commitment.travelDate) revert TravelDeadlineNotPassed();

        commitment.isProcessed = true;
        emit FailureProcessed(msg.sender, commitment.destinationId);
    }

    // =============================================================
    // NFT Functions
    // =============================================================
    function _mintJourneyNFT(address to, uint256 destinationId, uint256 stakedAmount, uint256 rewardEarned) internal {
        uint256 tokenId = _tokenIdCounter;
        unchecked {
            _tokenIdCounter = tokenId + 1;
        }

        _safeMint(to, tokenId);

        journeyNFTs[tokenId] = JourneyNFT({
            destinationId: destinationId,
            completionDate: block.timestamp,
            stakedAmount: stakedAmount,
            rewardEarned: rewardEarned,
            destinationName: destinationNames[destinationId]
        });

        userJourneyNFTs[to].push(tokenId);

        if (bytes(destinationMetadata[destinationId]).length > 0) {
            _setTokenURI(tokenId, destinationMetadata[destinationId]);
        }

        emit JourneyNFTMinted(to, tokenId, destinationId);
    }

    function getUserJourneyNFTs(address user) public view returns (uint256[] memory) {
        return userJourneyNFTs[user];
    }

    function getJourneyNFTDetails(uint256 tokenId) public view returns (JourneyNFT memory) {
        if (_ownerOf(tokenId) == address(0)) revert NFTDoesNotExist();
        return journeyNFTs[tokenId];
    }

    function getUserJourneyCount(address user) public view returns (uint256) {
        return userJourneyNFTs[user].length;
    }

    // =============================================================
    // Admin Functions
    // =============================================================
    function seedPool(uint256 _destinationId) public payable onlyOwner {
        if (msg.value == 0) revert SeedMustBeGreaterThanZero();
        locationPools[_destinationId] += msg.value;
        emit PoolSeeded(_destinationId, msg.value);
    }

    function setDestinationName(uint256 _destinationId, string memory _name) public onlyOwner {
        destinationNames[_destinationId] = _name;
    }

    function setDestinationMetadata(uint256 _destinationId, string memory _metadataURI) public onlyOwner {
        destinationMetadata[_destinationId] = _metadataURI;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        (bool sent,) = treasuryAddress.call{value: balance}("");
        if (!sent) revert WithdrawalFailed();
    }

    function setVerifierAddress(address _newAddress) public onlyOwner {
        if (_newAddress == address(0)) revert CannotBeZeroAddress();
        verifierAddress = _newAddress;
    }

    function setTreasuryAddress(address _newAddress) public onlyOwner {
        if (_newAddress == address(0)) revert CannotBeZeroAddress();
        treasuryAddress = _newAddress;
    }

    function setPlatformFeePercent(uint256 _newFeePercent) public onlyOwner {
        if (_newFeePercent > 5) revert FeeCannotExceed5Percent();
        platformFeePercent = _newFeePercent;
    }

    function setPlaceValue(uint256 _destinationId, uint256 _value) public onlyOwner {
        placeValues[_destinationId] = _value;
    }

    // =============================================================
    // View Functions
    // =============================================================
    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 userCount = userList.length;
        address[] memory users = new address[](userCount);
        uint256[] memory profits = new uint256[](userCount);
        
        for (uint256 i = 0; i < userCount;) {
            address user = userList[i];
            users[i] = user;
            profits[i] = userProfits[user];
            unchecked {
                ++i;
            }
        }
        
        return (users, profits);
    }

    function getPoolBalance(uint256 _destinationId) external view returns (uint256) {
        return locationPools[_destinationId];
    }

    function getUserCommitment(address _user) external view returns (Commitment memory) {
        return commitments[_user];
    }

    function getTotalPoolValue() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 1; i <= 8; i++) {
            total += locationPools[i];
        }
        return total;
    }

    // =============================================================
    // Override Functions
    // =============================================================
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // =============================================================
    // Helper Functions
    // =============================================================
    function recoverSigner(bytes32 _messageHash, bytes memory _signature) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(_signature);
        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
        return ecrecover(prefixedHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        if (sig.length != 65) revert InvalidSignatureLength();
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
