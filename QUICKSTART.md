# Cosmic Monads Quickstart Guide

This guide will help you quickly run your game locally and deploy it to Netlify.

## Running Locally

I've created a script that automates the process of starting both the frontend and backend servers:

```bash
./run-local.sh
```

This script will:
1. Check for required dependencies
2. Start the blockchain backend server (via `npm start`)
3. Start the frontend server (via `npx serve`)

Your game will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

### Manual Startup

If you prefer to start the servers manually:

1. **Start the backend server**:
   ```bash
   npm start
   ```

2. **In a separate terminal, start the frontend server**:
   ```bash
   npx serve
   ```

## Deploying to Netlify

Your game is already set up on Netlify at: https://cosmicmonads.netlify.app

I've created a script to simplify the deployment process:

```bash
./deploy-netlify.sh
```

This script will:
1. Check if you're logged in to Netlify
2. Link to your existing site if not already linked
3. Deploy your latest code to production

### Manual Deployment

If you prefer to deploy manually:

1. **Make sure you're logged in to Netlify**:
   ```bash
   netlify login
   ```

2. **Link to your existing site** (if not already linked):
   ```bash
   netlify link --name cosmicmonads
   ```

3. **Deploy to production**:
   ```bash
   netlify deploy --prod
   ```

## Production Backend Setup

For your game to work in production, you need a running backend server to handle blockchain transactions.

Your current Netlify configuration is set to use:
`https://cosmic-monads-api.herokuapp.com/api`

You have two options:

### Option 1: Use the deployment script

The `deploy.sh` script will set up a complete server:

```bash
# On your server:
sudo ./deploy.sh
```

Then update `config.js` with your server's URL.

### Option 2: Deploy to Heroku

If you prefer Heroku:

1. Create a new Heroku app
2. Push your code to Heroku
3. Set the environment variables in Heroku dashboard
4. Update `config.js` with your Heroku URL

## Mock Mode vs Real Blockchain

Your server can run in two modes:

1. **Mock Mode** (default): Actions are logged to console only
   - Doesn't require a valid private key
   - No real blockchain transactions are made

2. **Blockchain Mode**: All actions are recorded on the Monad blockchain
   - Requires a valid private key and contract address in `.env`
   - Costs small amounts of MONAD for each transaction

To switch to blockchain mode, make sure you have:
- A valid `PRIVATE_KEY` in your `.env` file
- A valid `CONTRACT_ADDRESS` in your `.env` file

The server logs will show which mode it's running in when you start it.

## Need Help?

If you encounter any issues, check the detailed `DEPLOYMENT.md` guide for troubleshooting. 