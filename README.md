# Cosmic Monads

A blockchain-integrated space shooter game running on the Monad network. Created with love for Monad G's by theantideather.

## About

Cosmic Monads is an engaging space shooter game where players control a rocket, dodge asteroids, and attempt to destroy a mothership. Every game action (moving the rocket, firing missiles, destroying asteroids, and hitting the mothership) is logged as a transaction on the Monad blockchain.

## Features

- Beautiful 3D space environment created with Three.js
- Real-time blockchain transaction logging on the Monad Testnet
- Twitter integration for sharing scores
- Visual transaction notifications

## Local Development

To run the game locally:

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the API server with `node server.js`
4. In a separate terminal, serve the frontend with `npx serve`
5. Access the game at `http://localhost:3000`

## Deploying to Netlify

This repository is set up for easy deployment to Netlify:

1. Fork or clone this repository
2. Create a new site in Netlify and connect to your repository
3. Set the following environment variables in Netlify:
   - `CONTRACT_ADDRESS`: Your deployed contract address
   - `WALLET_ADDRESS`: Your wallet address
4. Deploy!

## Technologies Used

- Three.js for 3D graphics
- Web3.js for blockchain integration
- Monad Testnet for blockchain functionality
- Express.js for the API server
- Netlify for deployment

## Credits

Created by [@omg14doteth](https://x.com/omg14doteth?s=21) - Follow on [Telegram](https://t.me/theantideather) 