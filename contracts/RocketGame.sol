// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RocketGame
 * @dev Smart contract for Cosmic Runner game that logs actions and mints score NFTs
 */
contract RocketGame is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;
    
    // Event emitted when a player action is logged
    event ActionLogged(address indexed sender, string action, uint256 timestamp);
    
    // Event emitted when a score NFT is minted
    event ScoreMinted(address indexed recipient, uint256 tokenId, string tokenURI);
    
    // Mapping to track player high scores
    mapping(address => uint256) public highScores;
    
    /**
     * @dev Initialize the contract
     */
    constructor() ERC721("CosmicRunnerNFT", "COSMIC") {
        tokenCounter = 0;
    }
    
    /**
     * @dev Log user actions during gameplay
     * @param action The action to log
     */
    function logAction(string memory action) public {
        emit ActionLogged(msg.sender, action, block.timestamp);
    }
    
    /**
     * @dev Extract score from a GAME_OVER_SCORE action
     * @param action The action string
     * @return The score as a uint256
     */
    function extractScore(string memory action) internal pure returns (uint256) {
        // Expected format: GAME_OVER_SCORE_1234
        bytes memory actionBytes = bytes(action);
        bytes memory scoreBytes = new bytes(bytes(action).length - 16); // Remove "GAME_OVER_SCORE_"
        
        for (uint i = 16; i < actionBytes.length; i++) {
            scoreBytes[i - 16] = actionBytes[i];
        }
        
        return parseStringToUint(string(scoreBytes));
    }
    
    /**
     * @dev Parse a string to a uint256
     * @param s The string to parse
     * @return The parsed uint256
     */
    function parseStringToUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result = 0;
        for (uint i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
        return result;
    }
    
    /**
     * @dev Log game over with score and update high score if needed
     * @param action The action containing the score
     */
    function logGameOver(string memory action) public {
        require(bytes(action).length > 16, "Invalid game over action");
        
        // Extract score from action
        uint256 score = extractScore(action);
        
        // Update high score if higher
        if (score > highScores[msg.sender]) {
            highScores[msg.sender] = score;
        }
        
        // Log the action
        emit ActionLogged(msg.sender, action, block.timestamp);
    }
    
    /**
     * @dev Mint an NFT representing the player's score
     * @param recipient The recipient of the NFT
     * @param tokenURI The URI containing the NFT metadata
     * @return tokenId The ID of the minted token
     */
    function mintScoreNFT(address recipient, string memory tokenURI) public returns (uint256) {
        uint256 newTokenId = tokenCounter;
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        emit ScoreMinted(recipient, newTokenId, tokenURI);
        
        tokenCounter++;
        return newTokenId;
    }
    
    /**
     * @dev Get a player's high score
     * @param player The player's address
     * @return The player's high score
     */
    function getHighScore(address player) public view returns (uint256) {
        return highScores[player];
    }
    
    /**
     * @dev Get total number of minted NFTs
     * @return The total number of minted NFTs
     */
    function getTotalMinted() public view returns (uint256) {
        return tokenCounter;
    }
} 