# Cosmic Monads

A blockchain-integrated space shooter game built on the Monad network.

![Cosmic Monads Game](https://cosmicmonads.netlify.app/screenshot.png)

## Play Now

Play the game at [https://cosmicmonads.netlify.app](https://cosmicmonads.netlify.app)

## Overview

Cosmic Monads is a space shooter game that integrates with the Monad blockchain. Every action in the game (movement, shooting, etc.) is logged to the blockchain, creating a permanent record of your gameplay.

## Features

- Fast-paced space shooter gameplay
- Real-time blockchain integration
- Permanent record of game actions on Monad testnet
- Beautiful cosmic visuals and effects

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- A Monad testnet wallet with some test MONAD tokens

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/theantideather/cosmic-monads.git
   cd cosmic-monads
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```
   # Your private key (without 0x prefix)
   PRIVATE_KEY=your_private_key_here
   
   # Monad Testnet RPC URL
   MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz/
   
   # Contract address on Monad Testnet
   CONTRACT_ADDRESS=0x37Ea645D9CA096ecAAbf23c9Ed1b589f68198957
   
   # Server Configuration
   THROTTLE_INTERVAL=5000
   MAX_TX_PER_MINUTE=10
   WALLET_ADDRESS=your_wallet_address_here
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3001`

### Running in Mock Mode

If you don't have a Monad wallet or just want to test the game without blockchain integration:

1. Remove the `CONTRACT_ADDRESS` from your `.env` file
2. Start the server as usual

The game will run in mock mode, logging actions to the console instead of the blockchain.

## Production Deployment

For production deployment, we recommend:

1. Frontend: Deploy to Netlify (already set up at cosmicmonads.netlify.app)
2. Backend: Set up a dedicated server for blockchain transactions

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on setting up a secure production backend.

## Architecture

The project consists of:

- `server.js`: Express server that handles blockchain interactions
- `blockchain.js`: Frontend JavaScript for managing blockchain connections
- `game.js`: The main game logic using Three.js
- `index.html`: Main game page

## Smart Contract

The game uses a simple smart contract deployed on Monad testnet:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GameActionLogger {
    event ActionLogged(address indexed player, string action, uint256 timestamp);
    
    function logAction(string memory action) public {
        emit ActionLogged(msg.sender, action, block.timestamp);
    }
}
```

## License

MIT

## Contact

- Telegram: [@theantideather](https://t.me/theantideather)
- Twitter: [@omg14doteth](https://x.com/omg14doteth) 