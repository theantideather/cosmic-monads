# Cosmic Runner Smart Contracts

This directory contains the smart contracts for the Cosmic Runner game, which are deployed on the Monad Testnet.

## Main Contract: RocketGame.sol

`RocketGame.sol` is the main contract that:
- Logs player actions during gameplay
- Mints NFTs representing player scores
- Tracks player high scores

## Features

- **Action Logging**: Every player action (movement, shooting, score updates) is recorded on the blockchain
- **Score NFTs**: Players can mint their final scores as NFTs
- **High Score Tracking**: The contract keeps track of each player's highest score

## Contract Structure

The contract inherits from two OpenZeppelin contracts:
- `ERC721URIStorage`: For NFT functionality
- `Ownable`: For owner-specific functions

### Main Functions

- `logAction(string memory action)`: Records a player action
- `mintScoreNFT(address recipient, string memory tokenURI)`: Mints an NFT for a player's score
- `logGameOver(string memory action)`: Extracts the score from a game over action and updates high scores
- `getHighScore(address player)`: Returns a player's high score
- `getTotalMinted()`: Returns the total number of NFTs minted

## Deployment

To deploy the contract to Monad Testnet:

1. Install the required dependencies:
   ```
   npm install @openzeppelin/contracts
   ```

2. Deploy using Remix IDE:
   - Open Remix IDE (https://remix.ethereum.org/)
   - Create a new file and paste the contract code
   - Compile the contract
   - Connect Metamask to Monad Testnet
   - Deploy the contract

3. Deploy using Hardhat (alternative):
   ```
   npx hardhat run scripts/deploy.js --network monad-testnet
   ```

4. Update the contract address in `js/config.js`:
   ```javascript
   CONTRACT_ADDRESS: "your-deployed-contract-address"
   ```

## Testing

You can test the contract using Hardhat:

```
npx hardhat test
```

## Security Considerations

- The contract uses OpenZeppelin's battle-tested ERC721 implementation
- Functions that modify state are properly secured
- String parsing for scores is done safely

## License

These contracts are licensed under the MIT License. 