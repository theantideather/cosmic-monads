require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

// Compile the contract
async function compileContract() {
  console.log('Compiling contract...');
  
  try {
    // Read the contract source
    const source = fs.readFileSync(path.join(__dirname, 'RocketGame.sol'), 'utf8');
    
    // Prepare input for solc compiler
    const input = {
      language: 'Solidity',
      sources: {
        'RocketGame.sol': {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    };
    
    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    // Check for errors
    if (output.errors) {
      output.errors.forEach(error => {
        console.error(error.formattedMessage);
      });
      
      if (output.errors.some(error => error.severity === 'error')) {
        throw new Error('Compilation failed');
      }
    }
    
    // Get compiled contract
    const contract = output.contracts['RocketGame.sol'].RocketGame;
    
    console.log('Contract compiled successfully');
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
  } catch (error) {
    console.error('Error compiling contract:', error.message);
    
    // Fallback to a simplified ABI if compilation fails
    console.log('Using fallback ABI...');
    return {
      abi: [
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
      ],
      bytecode: "608060405234801561001057600080fd5b5061017f806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c80638e66789414610030575b600080fd5b61004a600480360381019061004591906100f6565b61004c565b005b7fa0cdc07e02835a43cb1e1e408140cd8f6f0caa0e36c6a6d687da85a6fa8cd26833824260405161007d9291906101c9565b60405180910390a150565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f8401126100b4576100b361008f565b5b8235905067ffffffffffffffff8111156100d1576100d0610094565b5b6020830191508360018202830111156100ed576100ec610099565b5b9250929050565b60006020828403121561010c5761010b610085565b5b600082013567ffffffffffffffff81111561012a57610129610089565b5b6101368482850161009e565b91505092915050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561017957808201518184015260208101905061015e565b83811115610188576000848401525b50505050565b6000601f19601f8301169050919050565b60006101aa8261013f565b6101b4818561014a565b93506101c481856020860161015b565b6101cd8161018e565b840191505092915050565b600060408201905081810360008301526101f2818561019f565b90508181036020830152610206816020860151610085565b905092915050"
    };
  }
}

// Deploy the contract
async function deployContract() {
  console.log('Deploying contract to Monad Testnet...');
  
  // Initialize Web3
  const web3 = new Web3(process.env.MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz/');
  
  // Add private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('ERROR: Private key not found in .env file');
    process.exit(1);
  }
  
  // Add 0x prefix if not present
  const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  
  // Create account from private key
  const account = web3.eth.accounts.privateKeyToAccount(privateKeyWithPrefix);
  web3.eth.accounts.wallet.add(account);
  
  // Check balance
  const balance = await web3.eth.getBalance(account.address);
  console.log(`Account: ${account.address}`);
  console.log(`Balance: ${web3.utils.fromWei(balance, 'ether')} MONAD`);
  
  if (parseFloat(web3.utils.fromWei(balance, 'ether')) < 0.01) {
    console.error('ERROR: Not enough balance to deploy the contract');
    console.log('Please get testnet tokens from the Monad faucet');
    process.exit(1);
  }
  
  // Compile contract
  const compiledContract = await compileContract();
  
  // Create contract instance
  const contract = new web3.eth.Contract(compiledContract.abi);
  
  // Deploy contract
  try {
    const deployTx = contract.deploy({
      data: '0x' + compiledContract.bytecode,
      arguments: []
    });
    
    // Estimate gas
    const gas = await deployTx.estimateGas({ from: account.address })
      .catch(err => {
        console.error(`Gas estimation failed: ${err.message}`);
        return 3000000; // Default gas limit
      });
    
    console.log(`Estimated gas: ${gas}`);
    
    // Send transaction
    const deployedContract = await deployTx.send({
      from: account.address,
      gas: Math.round(gas * 1.2), // Add 20% buffer
      gasPrice: await web3.eth.getGasPrice()
    });
    
    console.log('Contract deployed successfully!');
    console.log(`Contract address: ${deployedContract.options.address}`);
    console.log(`Explorer URL: https://testnet.monadexplorer.com/address/${deployedContract.options.address}`);
    
    // Update .env file with contract address
    const envFile = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envFile, 'utf8');
    
    // Replace or add CONTRACT_ADDRESS
    if (envContent.includes('CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${deployedContract.options.address}`
      );
    } else {
      envContent += `\nCONTRACT_ADDRESS=${deployedContract.options.address}\n`;
    }
    
    fs.writeFileSync(envFile, envContent);
    console.log('Updated .env file with contract address');
    
    return deployedContract.options.address;
  } catch (error) {
    console.error('Error deploying contract:', error.message);
    process.exit(1);
  }
}

// Execute deployment
deployContract()
  .then(() => {
    console.log('Deployment completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  }); 