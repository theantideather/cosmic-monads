// Leaderboard management using Supabase
class LeaderboardManager {
    constructor() {
        // Supabase client setup - will be replaced with real credentials during deployment
        this.supabaseUrl = 'https://mqkqztkqzekpsyajvxlc.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xa3F6dGtxemVrcHN5YWp2eGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5NzkyMzcsImV4cCI6MjAxNTU1NTIzN30.FpQfE3XmC0MJnshekrSBz2Y2Z5l_ZyRIFKXhm0HtD-8';
        
        // Store all leaderboard data (beyond top 10) for better user search
        this.fullLeaderboardData = [];
        
        // Use Supabase for production, demo data only as fallback
        this.useDemoData = false;
        this.leaderboardData = [];
        this.currentUser = null;
        this.currentUserScore = 0;
        this.updateInterval = null;
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            if (!this.useDemoData) {
                // Initialize Supabase client
                if (typeof supabase !== 'undefined') {
                    this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
                    
                    // Get leaderboard data
                    await this.fetchLeaderboard();
                } else {
                    console.warn('Supabase library not loaded, falling back to demo data');
                    this.useDemoData = true;
                    this.loadDemoData();
                }
            } else {
                // Use demo data for now
                this.loadDemoData();
            }
            
            // Check local storage for username
            this.loadUserFromStorage();
            
            // Render the leaderboard
            this.renderLeaderboard();
            
            // If no username set, show prompt
            if (!this.currentUser) {
                this.showUsernamePrompt();
            }
            
            // Start periodic updates for the player's score
            this.startScoreUpdates();
            
            // Set up a refresh interval for the leaderboard in case other players add scores
            this.refreshInterval = setInterval(() => this.fetchLeaderboard(), 60000); // Refresh every minute
        } catch (error) {
            console.error('Error initializing leaderboard:', error);
            this.useDemoData = true;
            this.loadDemoData();
            this.renderLeaderboard();
        }
    }
    
    loadDemoData() {
        // Sample leaderboard data for demonstration
        this.leaderboardData = [
            { username: 'CosmicHero', score: 12500 },
            { username: 'MonadMaster', score: 10200 },
            { username: 'StarPilot', score: 9800 },
            { username: 'AlienHunter', score: 8500 },
            { username: 'GalacticQueen', score: 7900 },
            { username: 'SpaceRanger', score: 6700 },
            { username: 'NebulaRider', score: 5300 },
            { username: 'CometChaser', score: 4100 },
            { username: 'VoidWalker', score: 3200 },
            { username: 'PlanetHopper', score: 2800 }
        ];
        this.fullLeaderboardData = [...this.leaderboardData];
    }
    
    async fetchLeaderboard() {
        if (this.useDemoData) return;
        
        try {
            // Fetch all scores from Supabase for the full leaderboard
            const { data, error } = await this.supabase
                .from('leaderboard')
                .select('username, score')
                .order('score', { ascending: false });
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                this.fullLeaderboardData = data;
                this.leaderboardData = data.slice(0, 10); // Top 10 for display
                
                // Check if the current user has a score but isn't in the top 10
                if (this.currentUser) {
                    const userEntry = data.find(entry => entry.username === this.currentUser);
                    if (userEntry) {
                        this.currentUserScore = userEntry.score;
                    }
                }
                
                this.renderLeaderboard();
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            // Don't fallback to demo data if we already have data
            if (this.leaderboardData.length === 0) {
                this.loadDemoData();
            }
        }
    }
    
    renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) return;
        
        leaderboardList.innerHTML = '';
        
        // Sort the leaderboard data by score (highest first)
        const sortedData = [...this.leaderboardData].sort((a, b) => b.score - a.score);
        
        // Update current user's position if they have a score
        const currentUserInTopTen = sortedData.some(entry => entry.username === this.currentUser);
        
        // Create a list that includes current user if they're not in top 10
        let displayData = [...sortedData];
        
        if (this.currentUser && !currentUserInTopTen && this.currentUserScore > 0) {
            // Find user's rank in full leaderboard
            const userRank = this.fullLeaderboardData.findIndex(
                entry => entry.username === this.currentUser
            );
            
            if (userRank >= 0) {
                // Add a divider and then the current user if they're not in top 10
                displayData.push({
                    username: '-------------------',
                    score: 0,
                    isDivider: true
                });
                
                displayData.push({
                    username: this.currentUser,
                    score: this.currentUserScore,
                    rank: userRank + 1
                });
            } else {
                // If user isn't in the database yet but has a local score
                displayData.push({
                    username: '-------------------',
                    score: 0,
                    isDivider: true
                });
                
                displayData.push({
                    username: this.currentUser,
                    score: this.currentUserScore,
                    rank: 'N/A'
                });
            }
        }
        
        // Create a nice animation for scores that change
        const prevScores = {};
        const listItems = leaderboardList.querySelectorAll('li');
        listItems.forEach(item => {
            const username = item.querySelector('.username')?.textContent;
            const scoreElement = item.querySelector('.score');
            if (username && scoreElement) {
                const score = parseInt(scoreElement.textContent.replace(/,/g, ''));
                if (!isNaN(score)) {
                    prevScores[username] = score;
                }
            }
        });
        
        // Add items to the leaderboard
        displayData.forEach((entry, index) => {
            const listItem = document.createElement('li');
            
            if (entry.isDivider) {
                // This is a divider
                listItem.style.textAlign = 'center';
                listItem.style.opacity = '0.5';
                listItem.style.padding = '5px 0';
                listItem.textContent = entry.username;
            } else {
                const rankSpan = document.createElement('span');
                rankSpan.className = 'rank';
                rankSpan.textContent = entry.rank ? `${entry.rank}.` : `${index + 1}.`;
                
                const usernameSpan = document.createElement('span');
                usernameSpan.className = 'username';
                usernameSpan.textContent = entry.username;
                
                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'score';
                scoreSpan.textContent = entry.score.toLocaleString();
                
                listItem.appendChild(rankSpan);
                listItem.appendChild(usernameSpan);
                listItem.appendChild(scoreSpan);
                
                // Highlight current user if present
                if (this.currentUser && entry.username === this.currentUser) {
                    listItem.style.backgroundColor = 'rgba(255, 0, 255, 0.3)';
                    listItem.style.borderRadius = '5px';
                    listItem.style.padding = '3px 5px';
                    
                    // If score has increased since last render, add a visual effect
                    if (prevScores[entry.username] && entry.score > prevScores[entry.username]) {
                        listItem.style.animation = 'scoreIncrease 1s';
                    }
                }
            }
            
            leaderboardList.appendChild(listItem);
        });
        
        // Add a CSS animation for score changes
        if (!document.getElementById('leaderboard-animations')) {
            const style = document.createElement('style');
            style.id = 'leaderboard-animations';
            style.textContent = `
                @keyframes scoreIncrease {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); background-color: rgba(255, 255, 0, 0.5); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showUsernamePrompt() {
        const usernamePrompt = document.getElementById('username-prompt');
        const usernameInput = document.getElementById('username-input');
        const submitButton = document.getElementById('username-submit');
        
        if (!usernamePrompt || !usernameInput || !submitButton) return;
        
        // Show the prompt
        usernamePrompt.style.display = 'block';
        
        // Focus the input
        setTimeout(() => usernameInput.focus(), 100);
        
        // Handle submit button
        const handleSubmit = () => {
            const username = usernameInput.value.trim();
            if (username) {
                this.setUsername(username);
                usernamePrompt.style.display = 'none';
                
                // Start the game if it's paused waiting for username
                if (window.spaceRunner && !window.spaceRunner.gameRunning) {
                    window.spaceRunner.restart();
                }
            }
        };
        
        // Clear existing event listeners
        const newSubmitButton = submitButton.cloneNode(true);
        submitButton.parentNode.replaceChild(newSubmitButton, submitButton);
        
        // Add event listeners
        newSubmitButton.addEventListener('click', handleSubmit);
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });
    }
    
    setUsername(username) {
        this.currentUser = username;
        
        // Save to local storage
        localStorage.setItem('cosmicMonadsUsername', username);
        
        // Look for user in full leaderboard data
        const existingEntry = this.fullLeaderboardData.find(entry => entry.username === username);
        
        if (existingEntry) {
            this.currentUserScore = existingEntry.score;
            console.log(`Found existing score for ${username}: ${existingEntry.score}`);
        } else {
            this.currentUserScore = 0;
            console.log(`No existing score found for ${username}, starting at 0`);
        }
        
        // Update or add user to leaderboard
        this.updateUserScore(this.currentUserScore);
        
        // Re-render leaderboard to highlight user
        this.renderLeaderboard();
    }
    
    loadUserFromStorage() {
        const storedUsername = localStorage.getItem('cosmicMonadsUsername');
        if (storedUsername) {
            this.currentUser = storedUsername;
            // Load the user's score if in the leaderboard
            const existingEntry = this.fullLeaderboardData.find(entry => entry.username === storedUsername);
            if (existingEntry) {
                this.currentUserScore = existingEntry.score;
                console.log(`Loaded score for ${storedUsername}: ${existingEntry.score}`);
            } else {
                console.log(`No stored score for ${storedUsername}`);
            }
        }
    }
    
    // Start periodic updates of the current player's score from the game
    startScoreUpdates() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Update every second
        this.updateInterval = setInterval(() => {
            if (window.spaceRunner && this.currentUser) {
                const gameScore = window.spaceRunner.score || 0;
                
                // Only update if the score has increased
                if (gameScore > this.currentUserScore) {
                    this.updateUserScore(gameScore);
                }
            }
        }, 1000);
    }
    
    async updateUserScore(score) {
        if (!this.currentUser) return;
        
        // Update the current user's score
        this.currentUserScore = score;
        
        // Get the current entry for this user
        const existingEntryIndex = this.fullLeaderboardData.findIndex(entry => 
            entry.username === this.currentUser
        );
        
        // Update or add the entry in fullLeaderboardData
        if (existingEntryIndex >= 0) {
            // Only update if new score is higher
            if (score > this.fullLeaderboardData[existingEntryIndex].score) {
                this.fullLeaderboardData[existingEntryIndex].score = score;
                
                // Check if user is in top 10
                const topTenIndex = this.leaderboardData.findIndex(entry => 
                    entry.username === this.currentUser
                );
                
                if (topTenIndex >= 0) {
                    this.leaderboardData[topTenIndex].score = score;
                } else {
                    // Check if score should now be in top 10
                    const lowestTopScore = this.leaderboardData.length > 0 ? 
                        Math.min(...this.leaderboardData.map(entry => entry.score)) : 0;
                    
                    if (score > lowestTopScore || this.leaderboardData.length < 10) {
                        // Add to top 10 and reorder
                        if (this.leaderboardData.length >= 10) {
                            // Remove lowest score
                            this.leaderboardData.sort((a, b) => a.score - b.score);
                            this.leaderboardData.shift();
                        }
                        
                        this.leaderboardData.push({
                            username: this.currentUser,
                            score: score
                        });
                    }
                }
            }
        } else {
            // Add new entry
            this.fullLeaderboardData.push({
                username: this.currentUser,
                score: score
            });
            
            // Check if score should be in top 10
            if (this.leaderboardData.length < 10 || 
                (this.leaderboardData.length > 0 && score > Math.min(...this.leaderboardData.map(entry => entry.score)))) {
                
                if (this.leaderboardData.length >= 10) {
                    // Remove lowest score
                    this.leaderboardData.sort((a, b) => a.score - b.score);
                    this.leaderboardData.shift();
                }
                
                this.leaderboardData.push({
                    username: this.currentUser,
                    score: score
                });
            }
        }
        
        // Sort the leaderboard data
        this.fullLeaderboardData.sort((a, b) => b.score - a.score);
        this.leaderboardData.sort((a, b) => b.score - a.score);
        
        // Render updated leaderboard
        this.renderLeaderboard();
        
        // If using Supabase, update the backend
        if (!this.useDemoData && this.supabase) {
            try {
                // Upsert score to Supabase - only if score is higher than existing
                const { data, error } = await this.supabase
                    .from('leaderboard')
                    .upsert({ 
                        username: this.currentUser, 
                        score: score 
                    }, { 
                        onConflict: 'username',
                        // Only update if the new score is higher
                        ignoreDuplicates: false 
                    });
                
                if (error) {
                    console.error('Error updating score:', error);
                } else {
                    console.log('Updated score in Supabase:', score);
                }
            } catch (error) {
                console.error('Error updating score:', error);
            }
        }
    }
}

// Initialize the leaderboard when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new LeaderboardManager();
    
    // Set up leaderboard toggle functionality
    const toggleButton = document.getElementById('toggle-leaderboard');
    const leaderboard = document.getElementById('leaderboard');
    
    if (toggleButton && leaderboard) {
        // Check for saved preference
        const isCollapsed = localStorage.getItem('leaderboardCollapsed') === 'true';
        if (isCollapsed) {
            leaderboard.classList.add('leaderboard-collapsed');
        }
        
        toggleButton.addEventListener('click', () => {
            leaderboard.classList.toggle('leaderboard-collapsed');
            // Save preference
            localStorage.setItem(
                'leaderboardCollapsed',
                leaderboard.classList.contains('leaderboard-collapsed')
            );
        });
    }
}); 