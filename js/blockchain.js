/**
 * Blockchain.js
 * Handles Monad blockchain integration for the game
 */
class BlockchainManager {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.connected = false;
        this.pendingActions = [];
        this.actionQueue = [];
        this.walletAddress = CONFIG.WALLET_ADDRESS;
        this.processingAction = false;
        this.txCount = 0;
        
        // Initialize blockchain connection
        this.init();
    }
    
    /**
     * Initialize Web3 and connect to Monad Testnet
     */
    async init() {
        try {
            // Check if Web3 is injected by metamask or other wallet
            if (window.ethereum) {
                console.log('Using injected Web3 provider');
                this.web3 = new Web3(window.ethereum);
                
                try {
                    // Request account access
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    
                    // Connect to Monad Testnet
                    await this.connectToMonadTestnet();
                    
                    // Set up contract
                    await this.setupContract();
                    
                    // Expose logAction method to window for access from other classes
                    window.logAction = this.logAction.bind(this);
                    window.mintScoreNFT = this.mintScoreNFT.bind(this);
                    
                    // Set up action queue processor
                    this.processActionQueue();
                    
                } catch (error) {
                    console.error('Error requesting account access:', error);
                    this.setupWithoutWallet();
                }
            } else {
                console.log('No ethereum wallet detected');
                this.setupWithoutWallet();
            }
        } catch (error) {
            console.error('Error initializing blockchain:', error);
            this.setupWithoutWallet();
        }
    }
    
    /**
     * Setup without wallet connection (fallback mode)
     */
    setupWithoutWallet() {
        console.log('Running in local mode without blockchain connection');
        
        // Create dummy logAction function for use without blockchain
        window.logAction = (action) => {
            console.log(`Action logged (local only): ${action}`);
        };
        
        window.mintScoreNFT = (score) => {
            console.log(`NFT would be minted for score: ${score} (local only)`);
            return Promise.resolve();
        };
    }
    
    /**
     * Connect to Monad Testnet network
     */
    async connectToMonadTestnet() {
        try {
            // Monad Testnet configuration
            const monadTestnetConfig = {
                chainId: '0x4A7', // 1191 in hex
                chainName: 'Monad Testnet',
                nativeCurrency: {
                    name: 'Monad',
                    symbol: 'MONAD',
                    decimals: 18
                },
                rpcUrls: ['https://rpc.testnet.monad.xyz/'],
                blockExplorerUrls: ['https://testnet.monadexplorer.com/']
            };
            
            // Request network switch
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: monadTestnetConfig.chainId }]
                });
            } catch (switchError) {
                // If network doesn't exist, add it
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [monadTestnetConfig]
                        });
                    } catch (addError) {
                        console.error('Error adding Monad Testnet:', addError);
                        throw addError;
                    }
                } else {
                    console.error('Error switching to Monad Testnet:', switchError);
                    throw switchError;
                }
            }
            
            console.log('Connected to Monad Testnet');
            this.connected = true;
        } catch (error) {
            console.error('Failed to connect to Monad Testnet:', error);
            this.connected = false;
            throw error;
        }
    }
    
    /**
     * Set up connection to deployed smart contract
     */
    async setupContract() {
        try {
            // Contract ABI for RocketGame
            const abi = [
                {
                    "inputs": [{ "internalType": "string", "name": "action", "type": "string" }],
                    "name": "logAction",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [
                        { "internalType": "address", "name": "recipient", "type": "address" },
                        { "internalType": "string", "name": "tokenURI", "type": "string" }
                    ],
                    "name": "mintScoreNFT",
                    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];
            
            // Set up contract with ABI and address
            this.contract = new this.web3.eth.Contract(abi, CONFIG.CONTRACT_ADDRESS);
            console.log('Smart contract connected');
        } catch (error) {
            console.error('Error setting up contract:', error);
            this.contract = null;
        }
    }
    
    /**
     * Log player action to blockchain
     */
    logAction(action) {
        // Add action to queue - we'll process it async
        this.actionQueue.push(action);
        
        // Log locally for debugging
        console.log(`Action queued: ${action}`);
    }
    
    /**
     * Process action queue at regular intervals
     */
    processActionQueue() {
        // Process every 5 seconds to batch actions and reduce transaction count
        setInterval(async () => {
            if (!this.processingAction && this.actionQueue.length > 0) {
                // Mark as processing to prevent overlapping processing
                this.processingAction = true;
                
                try {
                    // Take latest action from queue
                    const action = this.actionQueue.shift();
                    
                    // If we're connected to blockchain, send to contract
                    if (this.connected && this.contract) {
                        await this.sendActionToBlockchain(action);
                    }
                } catch (error) {
                    console.error('Error processing action:', error);
                } finally {
                    this.processingAction = false;
                }
            }
        }, 5000); // Process every 5 seconds
    }
    
    /**
     * Send action to blockchain
     */
    async sendActionToBlockchain(action) {
        try {
            const accounts = await this.web3.eth.getAccounts();
            const userAccount = accounts[0] || this.walletAddress;
            
            console.log(`Sending action to blockchain: ${action} from ${userAccount}`);
            
            // Call contract method
            const receipt = await this.contract.methods.logAction(action).send({
                from: userAccount,
                gas: 200000 // Gas limit
            });
            
            console.log('Transaction receipt:', receipt);
            this.txCount++;
            
            // Update UI with transaction count
            this.updateTransactionUI();
            
            return receipt;
        } catch (error) {
            console.error('Error sending action to blockchain:', error);
            
            // Return the action to the queue if it failed
            this.actionQueue.unshift(action);
            
            throw error;
        }
    }
    
    /**
     * Update transaction UI
     */
    updateTransactionUI() {
        const txCountElement = document.getElementById('tx-count');
        if (txCountElement) {
            txCountElement.textContent = this.txCount;
        }
    }
    
    /**
     * Mint NFT for final score
     */
    async mintScoreNFT(score) {
        if (!this.connected || !this.contract) {
            console.log('Cannot mint NFT - no blockchain connection');
            return;
        }
        
        try {
            const accounts = await this.web3.eth.getAccounts();
            const userAccount = accounts[0] || this.walletAddress;
            
            // Create token URI with score metadata
            const tokenURI = `https://api.example.com/metadata/${score}`;
            
            console.log(`Minting NFT for score ${score} to ${userAccount}`);
            
            // Call mintScoreNFT function on contract
            const receipt = await this.contract.methods.mintScoreNFT(userAccount, tokenURI).send({
                from: userAccount,
                gas: 300000 // Gas limit
            });
            
            console.log('NFT minted successfully:', receipt);
            
            // Show success message to user
            this.showMintSuccessMessage(receipt.events?.Transfer?.returnValues?.tokenId);
            
            return receipt;
            
        } catch (error) {
            console.error('Error minting NFT:', error);
            
            // Show error message to user
            this.showMintErrorMessage();
            
            throw error;
        }
    }
    
    /**
     * Show success message after minting NFT
     */
    showMintSuccessMessage(tokenId) {
        const messageElement = document.createElement('div');
        messageElement.className = 'mint-success-message';
        messageElement.innerHTML = `
            <h3>NFT Minted Successfully!</h3>
            <p>Your score has been immortalized on the Monad blockchain.</p>
            <p>Token ID: ${tokenId || 'Unknown'}</p>
            <p>View on <a href="https://testnet.monadexplorer.com/token/${CONFIG.CONTRACT_ADDRESS}" target="_blank">Monad Explorer</a></p>
        `;
        
        document.body.appendChild(messageElement);
        
        // Remove after a few seconds
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 10000);
    }
    
    /**
     * Show error message if NFT minting fails
     */
    showMintErrorMessage() {
        const messageElement = document.createElement('div');
        messageElement.className = 'mint-error-message';
        messageElement.innerHTML = `
            <h3>NFT Minting Failed</h3>
            <p>There was an error while minting your NFT. Please try again later.</p>
        `;
        
        document.body.appendChild(messageElement);
        
        // Remove after a few seconds
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 5000);
    }
    
    /**
     * Generate Twitter share link for score
     */
    generateTwitterShareLink(score) {
        const text = `🚀 I just scored ${score} in Cosmic Runner! Minted my score as an NFT on Monad Testnet! Check it out! #CosmicRunner #MonadTestnet`;
        const url = window.location.href;
        
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    }
} 