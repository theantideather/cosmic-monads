/**
 * Game Configuration
 * Contains all the constants and settings for the game
 */
const CONFIG = {
    // Game settings
    GAME_SPEED: 3.0,                       // Significantly increased base game speed
    MAX_GAME_SPEED: 6.0,                   // Significantly increased maximum game speed
    GAME_SPEED_INCREMENT: 0.0003,          // Faster speed increase over time
    SCORE_INCREMENT: 2,                    // More points per frame
    OBSTACLE_SCORE: 200,                   // More points for destroying obstacles
    
    // World settings
    WORLD_SIZE: 2000,                      // Size of the world boundary
    RENDER_DISTANCE: 1500,                 // Increased render distance
    CLEANUP_DISTANCE: 500,                 // Increased cleanup distance
    FOG_NEAR: 10,                          // Fog near distance
    FOG_FAR: 1200,                         // Increased fog far distance
    FOG_COLOR: 0x7700aa,                   // Purple fog color
    
    // Player/Rocket settings
    ROCKET_SPEED: 1.0,                     // Increased rocket movement speed
    ROCKET_LATERAL_SPEED: 1.5,             // Increased side-to-side movement speed
    ROCKET_VERTICAL_SPEED: 1.2,            // Increased up/down movement speed
    ROCKET_BOUNDS_X: 50,                   // Increased bounds for left/right movement
    ROCKET_BOUNDS_Y: 40,                   // Increased bounds for up/down movement
    ROCKET_START_POS: { x: 0, y: 10, z: 0 },   // Starting position of rocket
    
    // Missile settings
    MISSILE_SPEED: 15.0,                   // Drastically increased missile speed
    MISSILE_COOLDOWN: 150,                 // Reduced cooldown between missile shots (ms)
    MISSILE_LIFETIME: 2000,                // Reduced lifetime to match faster game speed
    
    // Obstacles settings
    MIN_OBSTACLE_DISTANCE: 20,             // Reduced minimum distance between obstacles
    MAX_OBSTACLE_DISTANCE: 80,             // Reduced maximum distance between obstacles
    OBSTACLE_SPAWN_RATE: 0.15,             // Drastically increased spawn rate
    ALIEN_SHIP_HEALTH: 4,                  // Health points for alien ships
    ASTEROID_ROTATION_SPEED: 0.03,         // Increased rotation speed for asteroids
    ALIEN_SHIP_SPEED: 2.0,                 // Increased movement speed for alien ships
    ASTEROID_SPEED: 3.0,                   // Increased movement speed for asteroids
    
    // Particle effects
    EXHAUST_PARTICLE_COUNT: 200,           // Significantly more exhaust particles
    EXHAUST_PARTICLE_SIZE: 1.0,            // Larger exhaust particles
    EXPLOSION_PARTICLE_COUNT: 200,         // More explosion particles
    EXPLOSION_PARTICLE_SIZE: 1.5,          // Larger explosion particles
    EXPLOSION_DURATION: 800,               // Shorter explosion duration for faster game
    
    // Camera settings
    CAMERA_OFFSET: { x: 0, y: 15, z: -50 }, // Moved camera further back
    CAMERA_LOOK_OFFSET: { x: 0, y: 0, z: 150 }, // Look further ahead
    CAMERA_FOV: 80,                        // Wider field of view
    CAMERA_NEAR: 0.1,                      // Near clipping plane
    CAMERA_FAR: 3000,                      // Increased far clipping plane
    
    // Post-processing
    BLOOM_STRENGTH: 2.0,                   // Increased bloom strength
    BLOOM_RADIUS: 1.0,                     // Increased bloom radius
    BLOOM_THRESHOLD: 0.2,                  // Lower bloom threshold
    
    // Blockchain settings
    // Update this with the deployed contract address after running:
    // npx hardhat run scripts/deploy.js --network monad-testnet
    CONTRACT_ADDRESS: "YOUR_CONTRACT_ADDRESS", // Update with deployed contract address
    WALLET_ADDRESS: "0x5f8cD364Eae5F793C5DF8E4545C2a8fA4f55b23a", // Your wallet address
    
    // Mobile settings
    IS_TOUCH_DEVICE: ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0) || 
                     (navigator.msMaxTouchPoints > 0)
}; 