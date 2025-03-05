/**
 * Game.js
 * Main game controller that initializes and coordinates all game components
 */
class Game {
    constructor() {
        // Game state
        this.isRunning = false;
        this.score = 0;
        this.lastFrameTime = 0;
        this.difficulty = 1;
        
        // DOM elements
        this.gameContainer = document.getElementById('game-container');
        this.scoreElement = document.getElementById('score');
        this.loadingScreen = document.getElementById('loading-screen');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        
        // Button event listeners
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
        document.getElementById('mint-nft-button').addEventListener('click', () => this.mintScoreNFT());
        document.getElementById('share-twitter').addEventListener('click', () => this.shareOnTwitter());
        
        // Hide loading screen immediately
        this.loadingScreen.style.display = 'none';
        
        // Initialize game
        this.init();
    }
    
    /**
     * Initialize game components
     */
    async init() {
        try {
            // Set up Three.js scene
            this.setupScene();
            
            // Initialize renderer
            this.setupRenderer();
            
            // Set up camera
            this.setupCamera();
            
            // Set up lighting
            this.setupLighting();
            
            // Initialize environment
            this.environment = new Environment(this.scene);
            
            // Initialize player's rocket
            this.rocket = new Rocket(this.scene, this.camera);
            
            // Initialize obstacle manager
            this.obstacleManager = new ObstacleManager(this.scene, this.rocket);
            this.obstacleManager.init();
            
            // Initialize particle manager
            this.particleManager = new ParticleManager(this.scene);
            this.particleManager.createStarfieldParticles();
            this.particleManager.createDustParticles();
            
            // Set up post-processing
            this.setupPostProcessing();
            
            // Set up blockchain manager
            this.blockchainManager = new BlockchainManager();
            
            // Expose game over function to window for access from other classes
            window.gameOver = this.gameOver.bind(this);
            window.addScore = this.addScore.bind(this);
            
            // Start the game immediately
            this.start();
        } catch (error) {
            console.error("Game initialization error:", error);
            alert("There was an error starting the game. Please check the console for details.");
        }
    }
    
    /**
     * Setup Three.js scene
     */
    setupScene() {
        this.scene = new THREE.Scene();
    }
    
    /**
     * Setup WebGL renderer
     */
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.gameContainer.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Setup camera
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA_FOV,
            window.innerWidth / window.innerHeight,
            CONFIG.CAMERA_NEAR,
            CONFIG.CAMERA_FAR
        );
        this.camera.position.copy(CONFIG.ROCKET_START_POS);
        this.camera.position.add(CONFIG.CAMERA_OFFSET);
        this.camera.lookAt(
            CONFIG.ROCKET_START_POS.x + CONFIG.CAMERA_LOOK_OFFSET.x,
            CONFIG.ROCKET_START_POS.y + CONFIG.CAMERA_LOOK_OFFSET.y,
            CONFIG.ROCKET_START_POS.z + CONFIG.CAMERA_LOOK_OFFSET.z
        );
    }
    
    /**
     * Setup scene lighting
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x333366, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xff9966, 1);
        sunLight.position.set(-100, 100, -100);
        sunLight.castShadow = true;
        
        // Configure shadow properties
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
        
        // Point light to follow player
        this.playerLight = new THREE.PointLight(0x6666ff, 1, 50);
        this.scene.add(this.playerLight);
    }
    
    /**
     * Set up post-processing effects
     */
    setupPostProcessing() {
        try {
            // Create effect composer
            this.composer = new THREE.EffectComposer(this.renderer);
            
            // Add render pass
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Add bloom pass for glow effect
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                CONFIG.BLOOM_STRENGTH || 1.5,
                CONFIG.BLOOM_RADIUS || 0.7,
                CONFIG.BLOOM_THRESHOLD || 0.3
            );
            this.composer.addPass(bloomPass);
        } catch (error) {
            console.error("Post-processing setup error:", error);
            // Fall back to regular rendering without post-processing
            this.composer = null;
        }
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        // Update camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Start the game
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.score = 0;
            this.difficulty = 1;
            this.updateScoreDisplay();
            this.hideGameOverScreen();
            
            // Start animation loop
            this.lastFrameTime = Date.now();
            requestAnimationFrame(() => this.gameLoop());
            
            // Log game start to blockchain
            window.logAction && window.logAction('GAME_START');
        }
    }
    
    /**
     * Game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
        
        // Calculate delta time
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Cap delta time to prevent weird physics on lag
        const cappedDelta = Math.min(deltaTime, 0.1);
        
        // Update score
        this.score += CONFIG.SCORE_INCREMENT * (1 + CONFIG.GAME_SPEED * 0.5);
        this.updateScoreDisplay();
        
        // Update game components with the capped delta
        this.rocket.update(cappedDelta);
        this.obstacleManager.update(cappedDelta, this.rocket.getPosition());
        this.particleManager.update(cappedDelta, this.rocket.getPosition());
        this.environment.update(this.rocket.getPosition());
        
        // Update camera with enhanced motion effects
        this.updateCamera(this.rocket.getPosition(), cappedDelta);
        
        // Apply camera shake based on speed and obstacle proximity
        this.applyCameraShake(cappedDelta);
        
        // Increase game speed over time, faster acceleration
        CONFIG.GAME_SPEED = Math.min(
            CONFIG.MAX_GAME_SPEED, 
            CONFIG.GAME_SPEED + (CONFIG.GAME_SPEED_INCREMENT * cappedDelta * 60)
        );
        
        // Update difficulty
        this.updateDifficulty();
        
        // Process blockchain actions
        this.blockchainManager.processActionQueue();
        
        // Render scene with post-processing if available
        if (this.composer && this.composer.render) {
            try {
                this.composer.render();
            } catch (error) {
                console.error("Composer render error, falling back to standard renderer:", error);
                this.renderer.render(this.scene, this.camera);
            }
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Update camera to follow rocket with dynamic motion
     */
    updateCamera(rocketPosition, deltaTime) {
        // Calculate target camera position with dynamic offset based on speed
        // As speed increases, move camera back slightly for better field of view
        const speedFactor = CONFIG.GAME_SPEED / CONFIG.MAX_GAME_SPEED;
        const dynamicOffset = {
            x: CONFIG.CAMERA_OFFSET.x,
            y: CONFIG.CAMERA_OFFSET.y + speedFactor * 5, // Move up slightly at higher speeds
            z: CONFIG.CAMERA_OFFSET.z - speedFactor * 20 // Move back at higher speeds
        };
        
        const targetPosition = new THREE.Vector3(
            rocketPosition.x + dynamicOffset.x,
            rocketPosition.y + dynamicOffset.y,
            rocketPosition.z + dynamicOffset.z
        );
        
        // Smoother camera movement with adaptive lerp
        // Less smoothing (faster response) at high speeds
        const adaptiveLerp = 0.05 + speedFactor * 0.1;
        this.camera.position.lerp(targetPosition, adaptiveLerp);
        
        // Dynamic look-ahead distance based on speed
        // Look further ahead at higher speeds
        const lookAheadDistance = CONFIG.CAMERA_LOOK_OFFSET.z + (speedFactor * 100);
        
        const lookTarget = new THREE.Vector3(
            rocketPosition.x,
            rocketPosition.y,
            rocketPosition.z + lookAheadDistance
        );
        
        this.camera.lookAt(lookTarget);
        
        // Add slight roll to camera based on rocket's lateral movement
        const lateralVelocity = (rocketPosition.x - this.camera.position.x) * 0.1;
        this.camera.rotation.z = -lateralVelocity * 0.2;
    }
    
    /**
     * Update score display
     */
    updateScoreDisplay() {
        if (this.scoreElement) {
            this.scoreElement.textContent = Math.floor(this.score);
        }
    }
    
    /**
     * Game over
     */
    gameOver() {
        if (this.isRunning) {
            this.isRunning = false;
            
            // Show game over screen
            this.showGameOverScreen();
            
            // Log game over to blockchain
            window.logAction && window.logAction(`GAME_OVER_SCORE_${Math.floor(this.score)}`);
        }
    }
    
    /**
     * Show game over screen
     */
    showGameOverScreen() {
        // Update final score
        this.finalScoreElement.textContent = Math.floor(this.score);
        
        // Show game over screen
        this.gameOverScreen.classList.remove('hidden');
    }
    
    /**
     * Hide game over screen
     */
    hideGameOverScreen() {
        this.gameOverScreen.classList.add('hidden');
    }
    
    /**
     * Restart the game
     */
    restart() {
        // Reset rocket position
        this.rocket.object.position.copy(CONFIG.ROCKET_START_POS);
        
        // Reset game speed
        CONFIG.GAME_SPEED = 0.5;
        
        // Remove all obstacles
        while (this.obstacleManager.obstacles.length > 0) {
            const obstacle = this.obstacleManager.obstacles.pop();
            this.obstacleManager.returnToPool(obstacle);
        }
        
        // Clear all explosions
        this.obstacleManager.explosions.forEach(explosion => {
            this.scene.remove(explosion.particleSystem);
        });
        this.obstacleManager.explosions = [];
        
        // Reset camera
        this.camera.position.copy(CONFIG.ROCKET_START_POS);
        this.camera.position.add(CONFIG.CAMERA_OFFSET);
        
        // Start the game
        this.start();
    }
    
    /**
     * Add to score (called from obstacles)
     */
    addScore(points) {
        this.score += points;
        this.updateScoreDisplay();
    }
    
    /**
     * Mint NFT of the final score
     */
    mintScoreNFT() {
        const score = Math.floor(this.score);
        window.mintScoreNFT && window.mintScoreNFT(score);
    }
    
    /**
     * Share score on Twitter
     */
    shareOnTwitter() {
        const score = Math.floor(this.score);
        const twitterLink = this.blockchainManager.generateTwitterShareLink(score);
        window.open(twitterLink, '_blank');
    }
    
    /**
     * Update difficulty based on score
     */
    updateDifficulty() {
        // Calculate difficulty level based on score
        const newDifficulty = 1 + Math.floor(this.score / 1000);
        
        // If difficulty has increased
        if (newDifficulty > this.difficulty) {
            this.difficulty = newDifficulty;
            
            // Increase obstacle spawn rate with each difficulty level
            CONFIG.OBSTACLE_SPAWN_RATE = Math.min(0.3, 0.15 + (this.difficulty - 1) * 0.03);
            
            // Increase asteroid speed with difficulty
            CONFIG.ASTEROID_SPEED = Math.min(6.0, 3.0 + (this.difficulty - 1) * 0.5);
            
            // Flash the screen to indicate difficulty increase
            this.flashScreen();
            
            // Log difficulty increase to blockchain
            window.logAction && window.logAction(`DIFFICULTY_INCREASED_${this.difficulty}`);
        }
    }
    
    /**
     * Apply camera shake based on game events
     */
    applyCameraShake(deltaTime) {
        // Base shake on game speed
        const speedShake = (CONFIG.GAME_SPEED / CONFIG.MAX_GAME_SPEED) * 0.2;
        
        // Get obstacles that are close to the player
        const playerPosition = this.rocket.getPosition();
        const nearbyObstacles = this.obstacleManager.getNearbyObstacles(playerPosition, 30);
        
        // Calculate proximity factor (more shake when obstacles are nearby)
        let proximityFactor = 0;
        nearbyObstacles.forEach(obstacle => {
            const distance = obstacle.mesh.position.distanceTo(playerPosition);
            if (distance < 30) {
                proximityFactor += (1 - distance / 30) * 0.5; // More shake for closer obstacles
            }
        });
        
        // Combine factors and add random variation
        const shakeAmount = (speedShake + proximityFactor) * (0.8 + Math.random() * 0.4);
        
        // Apply shake
        this.camera.position.x += (Math.random() - 0.5) * shakeAmount * deltaTime * 10;
        this.camera.position.y += (Math.random() - 0.5) * shakeAmount * deltaTime * 8;
    }
    
    /**
     * Flash screen for difficulty increase
     */
    flashScreen() {
        // Create a full-screen flash effect
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = 'rgba(255, 0, 255, 0.3)';
        flash.style.zIndex = '100';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.5s ease-out';
        
        this.gameContainer.appendChild(flash);
        
        // Fade out and remove
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => {
                this.gameContainer.removeChild(flash);
            }, 500);
        }, 100);
    }
}

// Initialize the game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and start the game
    const game = new Game();
}); 