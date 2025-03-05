// Blockchain integration for Space Runner Game using Monad
class BlockchainManager {
    constructor() {
        // Automatically detect if we're on production Netlify or local development
        this.apiUrl = this.getApiUrl();
        this.walletAddress = '0x5f8cD364Eae5F793C5DF8E4545C2a8fA4f55b23a';
        this.initialized = false;
        this.lastActionTime = 0;
        this.actionQueue = [];
        this.processingQueue = false;
        this.throttleInterval = 5000; // 5 seconds between actions
        this.gameId = this.generateGameId();
        this.transactionCount = 0;
        
        // Initialize
        this.init();
    }
    
    // Get the appropriate API URL based on the environment
    getApiUrl() {
        // Check if we're on Netlify production
        if (window.location.hostname.includes('netlify.app') || 
            !window.location.hostname.includes('localhost')) {
            // For Netlify, use relative paths which will be handled by redirects/functions
            return '/api';
        } else {
            // For local development
            return 'http://localhost:3001/api';
        }
    }
    
    // Generate a unique game ID for this session
    generateGameId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    async init() {
        try {
            // Check if the server is available
            const response = await fetch(`${this.apiUrl}/status`);
            
            if (response.ok) {
                const data = await response.json();
                this.walletAddress = data.walletAddress;
                this.initialized = true;
                this.updateTransactionCount(data.transactionCount || 0);
                console.log('Blockchain manager initialized successfully');
            } else {
                console.error('Server returned error:', await response.text());
                this.updateTransactionCount(-1); // Error state
            }
        } catch (error) {
            console.error('Error initializing blockchain manager:', error);
            this.updateTransactionCount(-1); // Error state
        }
    }
    
    updateTransactionCount(count) {
        const countElement = document.getElementById('transaction-count');
        if (countElement) {
            if (count >= 0) {
                this.transactionCount = count;
                countElement.textContent = count;
                countElement.style.color = '#00ff00'; // Green for active
            } else {
                countElement.textContent = 'Error';
                countElement.style.color = '#ff0000'; // Red for error
            }
        }
    }
    
    showTransactionAlert(action) {
        if (window.showTransactionAlert) {
            window.showTransactionAlert(action);
        } else {
            // Fallback if the notification function is not in index.html
            const alertElement = document.getElementById('transaction-alert');
            if (alertElement) {
                alertElement.textContent = `Transaction submitted: ${action}`;
                alertElement.style.display = 'block';
                
                setTimeout(() => {
                    alertElement.style.display = 'none';
                }, 3500);
            }
        }
    }
    
    async logAction(action) {
        if (!action) {
            console.warn('No action provided. Action not logged.');
            return false;
        }
        
        // Format the action with game ID for easier tracking
        const formattedAction = `${this.gameId}:${action}`;
        
        // Add to queue and process
        this.actionQueue.push(formattedAction);
        
        // Start processing if not already
        if (!this.processingQueue) {
            this.processQueue();
        }
        
        return true;
    }
    
    async processQueue() {
        // If already processing or queue is empty, exit
        if (this.processingQueue || this.actionQueue.length === 0) {
            return;
        }
        
        this.processingQueue = true;
        
        try {
            // Get the current time
            const now = Date.now();
            
            // If sufficient time has elapsed since the last action
            if (now - this.lastActionTime >= this.throttleInterval) {
                // Get the next action
                const action = this.actionQueue.shift();
                
                // Show notification
                this.showTransactionAlert(action);
                
                try {
                    // Send the action to the server
                    const response = await fetch(`${this.apiUrl}/log-action`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: action
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`Action queued on server: ${action}`, data);
                        
                        // Update the transaction count if provided by the server
                        if (data.txCount !== undefined) {
                            this.updateTransactionCount(data.txCount);
                        } else {
                            this.updateTransactionCount(this.transactionCount + 1);
                        }
                        
                        // Update the last action time
                        this.lastActionTime = now;
                    } else {
                        console.error('Server returned error:', await response.text());
                        
                        // If the server failed, put the action back in the queue
                        // But only if it's not a server error (5xx)
                        if (response.status < 500) {
                            console.log('Client error - discarding action');
                        } else {
                            this.actionQueue.unshift(action);
                        }
                    }
                } catch (error) {
                    console.error('Network error submitting action:', error);
                    
                    // If offline, put the action back in the queue
                    this.actionQueue.unshift(action);
                    
                    // Wait longer before retrying
                    this.lastActionTime = now - this.throttleInterval + 10000;
                }
            } else {
                // If not enough time has elapsed, put the action back in the queue
                const action = this.actionQueue.shift();
                this.actionQueue.unshift(action);
                
                // Wait for the remaining throttle time
                await new Promise(resolve => 
                    setTimeout(resolve, this.throttleInterval - (now - this.lastActionTime) + 100)
                );
            }
        } catch (error) {
            console.error('Error processing action queue:', error);
        }
        
        // Allow processing to continue
        this.processingQueue = false;
        
        // If there are more actions, continue processing
        if (this.actionQueue.length > 0) {
            this.processQueue();
        }
    }
    
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/status`);
            return response.ok;
        } catch (error) {
            console.error('Error checking connection:', error);
            return false;
        }
    }
    
    getExplorerUrl(txHash) {
        return `https://testnet.monadexplorer.com/tx/${txHash}`;
    }
    
    shareOnTwitter(score) {
        const tweetText = `🚀 I just scored ${score} in Cosmic Monads on the Monad Testnet! Check out this awesome blockchain game! #CosmicMonads #MonadTestnet @omg14doteth`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterUrl, '_blank');
    }
}

// Create a singleton instance
window.blockchainManager = new BlockchainManager(); 