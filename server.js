require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Web3 = require('web3');
const path = require('path');

// Create express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('./'));

// Configure Web3
const web3 = new Web3(process.env.MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz/');
const privateKey = process.env.PRIVATE_KEY;
const walletAddress = process.env.WALLET_ADDRESS || '0x5f8cD364Eae5F793C5DF8E4545C2a8fA4f55b23a';

// Set up the account if private key is provided
if (privateKey) {
  try {
    // Add 0x prefix if not present
    const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = web3.eth.accounts.privateKeyToAccount(privateKeyWithPrefix);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    console.log(`Server configured with account: ${account.address}`);
    
    // Verify it matches the expected wallet address
    if (account.address.toLowerCase() !== walletAddress.toLowerCase()) {
      console.warn(`WARNING: The account derived from private key (${account.address}) doesn't match WALLET_ADDRESS (${walletAddress})`);
    }
  } catch (error) {
    console.error(`ERROR: Invalid private key: ${error.message}`);
    process.exit(1);
  }
} else {
  console.error('ERROR: No private key provided. Set PRIVATE_KEY in .env file');
  process.exit(1);
}

// Configure rate limiting
const MAX_TX_PER_MINUTE = parseInt(process.env.MAX_TX_PER_MINUTE || '10');
const THROTTLE_INTERVAL = parseInt(process.env.THROTTLE_INTERVAL || '5000');
const txQueue = [];
let processingQueue = false;
let txCount = 0;
let lastMinuteTxCount = 0;
let lastMinuteReset = Date.now();

// Load ABI
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "action",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ActionLogged",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "action",
        "type": "string"
      }
    ],
    "name": "logAction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Create contract instance
const contractAddress = process.env.CONTRACT_ADDRESS;
let contract = null;

if (contractAddress) {
  try {
    contract = new web3.eth.Contract(contractABI, contractAddress);
    console.log(`Contract configured at address: ${contractAddress}`);
  } catch (error) {
    console.error(`ERROR: Failed to initialize contract: ${error.message}`);
  }
} else {
  console.error('ERROR: No contract address provided. Set CONTRACT_ADDRESS in .env file');
}

// Check account balance
async function checkBalance() {
  try {
    const balance = await web3.eth.getBalance(web3.eth.defaultAccount);
    const balanceEth = web3.utils.fromWei(balance, 'ether');
    console.log(`Account balance: ${balanceEth} MONAD`);
    
    if (parseFloat(balanceEth) < 0.01) {
      console.warn('WARNING: Account balance is low. You may need to get testnet tokens.');
    }
    
    return balance;
  } catch (error) {
    console.error(`Error checking balance: ${error.message}`);
    return '0';
  }
}

// Process the transaction queue
async function processQueue() {
  if (processingQueue || txQueue.length === 0) return;
  
  processingQueue = true;
  
  // Reset tx counter if a minute has passed
  const now = Date.now();
  if (now - lastMinuteReset > 60000) {
    lastMinuteTxCount = 0;
    lastMinuteReset = now;
  }
  
  // Check if we've hit the rate limit
  if (lastMinuteTxCount >= MAX_TX_PER_MINUTE) {
    console.log(`Rate limit reached (${MAX_TX_PER_MINUTE} per minute). Waiting...`);
    processingQueue = false;
    setTimeout(processQueue, 10000);
    return;
  }
  
  try {
    const action = txQueue.shift();
    
    if (contract) {
      // Send transaction to the blockchain
      console.log(`Logging action to blockchain: ${action}`);
      
      try {
        const tx = contract.methods.logAction(action);
        const gas = await tx.estimateGas({ from: web3.eth.defaultAccount })
          .catch(err => {
            console.error(`Gas estimation failed: ${err.message}`);
            return 150000; // Default gas limit
          });
        
        const gasPrice = await web3.eth.getGasPrice()
          .catch(err => {
            console.error(`Gas price fetch failed: ${err.message}`);
            return web3.utils.toWei('1', 'gwei'); // Default gas price
          });
        
        const receipt = await tx.send({
          from: web3.eth.defaultAccount,
          gas: Math.round(gas * 1.2), // Add 20% buffer
          gasPrice
        });
        
        const explorerUrl = `https://testnet.monadexplorer.com/tx/${receipt.transactionHash}`;
        console.log(`Transaction confirmed: ${receipt.transactionHash}`);
        console.log(`Explorer URL: ${explorerUrl}`);
        
        txCount++;
        lastMinuteTxCount++;
      } catch (error) {
        console.error(`Transaction failed: ${error.message}`);
        
        // If this was a gas error, we might want to retry with different parameters
        if (error.message.includes('gas') || error.message.includes('underpriced')) {
          console.log('Retrying transaction with higher gas...');
          txQueue.unshift(action);
        }
      }
    } else {
      // Just log to console if no contract
      console.log(`[MOCK] Action logged: ${action}`);
      console.error('Cannot send transaction: Contract not initialized');
      txCount++;
      lastMinuteTxCount++;
    }
  } catch (error) {
    console.error('Error processing transaction:', error.message);
  }
  
  processingQueue = false;
  
  // Process next item after throttle interval
  if (txQueue.length > 0) {
    setTimeout(processQueue, THROTTLE_INTERVAL);
  }
}

// API endpoint to log an action
app.post('/api/log-action', async (req, res) => {
  try {
    const { action } = req.body;
    
    if (!action) {
      return res.status(400).json({ success: false, message: 'Action is required' });
    }
    
    // Add to queue
    txQueue.push(action);
    console.log(`Action queued: ${action}`);
    
    // Start processing queue if not already
    if (!processingQueue) {
      processQueue();
    }
    
    return res.json({ 
      success: true, 
      message: 'Action queued for processing',
      queueLength: txQueue.length,
      txCount
    });
  } catch (error) {
    console.error('API error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to get status
app.get('/api/status', (req, res) => {
  res.json({
    connected: !!web3.eth.defaultAccount,
    contractConfigured: !!contract,
    walletAddress: web3.eth.defaultAccount,
    transactionCount: txCount,
    queueLength: txQueue.length,
    maxTxPerMinute: MAX_TX_PER_MINUTE,
    throttleInterval: THROTTLE_INTERVAL
  });
});

// API endpoint to check balance
app.get('/api/balance', async (req, res) => {
  try {
    const balance = await checkBalance();
    res.json({
      success: true,
      address: web3.eth.defaultAccount,
      balance: web3.utils.fromWei(balance, 'ether'),
      unit: 'MONAD'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  
  // Check balance at startup
  await checkBalance();
}); 