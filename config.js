// Configuration for Cosmic Monads

// Dynamically determine API URL based on environment
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const getBaseUrl = () => {
    // If running locally, use the local development API
    if (isLocalhost) {
        return 'http://localhost:3001/api';
    }
    
    // In production, use the relative API path which will be handled by Netlify redirects
    return '/api';
};

window.PRODUCTION_API_URL = isLocalhost ? null : getBaseUrl();

// Game configuration
window.GAME_CONFIG = {
    // Add any game-specific configuration here
    debugMode: false, // Set to false for production
    showFPS: false // Set to false for production
}; 

// Enable debug mode if URL has ?debug=true
if (window.location.search.includes('debug=true')) {
    window.GAME_CONFIG.debugMode = true;
    window.GAME_CONFIG.showFPS = true;
    console.log('Debug mode enabled');
} 