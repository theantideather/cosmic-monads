/**
 * Obstacles.js
 * Handles alien ships, asteroids, and other obstacles
 */
class ObstacleManager {
    constructor(scene, rocket) {
        this.scene = scene;
        this.rocket = rocket;
        this.obstacles = [];
        this.explosions = [];
        this.lastObstacleZ = 0;
        this.obstaclePool = {
            alienShips: [],
            asteroids: []
        };
    }
    
    /**
     * Initialize obstacle manager
     */
    init() {
        // Pre-create some obstacles for object pooling
        this.preCreateObstacles();
    }
    
    /**
     * Pre-create obstacles for object pooling
     */
    preCreateObstacles() {
        // Create some alien ships
        for (let i = 0; i < 10; i++) {
            const alienShip = this.createAlienShip();
            alienShip.mesh.visible = false;
            this.obstaclePool.alienShips.push(alienShip);
        }
        
        // Create some asteroids
        for (let i = 0; i < 15; i++) {
            const asteroid = this.createAsteroid();
            asteroid.mesh.visible = false;
            this.obstaclePool.asteroids.push(asteroid);
        }
    }
    
    /**
     * Create a new alien ship
     */
    createAlienShip() {
        // Create alien ship body
        const bodyGeometry = new THREE.SphereGeometry(3, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x003300,
            emissiveIntensity: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Create cockpit
        const cockpitGeometry = new THREE.SphereGeometry(1.5, 16, 8);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ff88,
            metalness: 0.3,
            roughness: 0.2,
            transparent: true,
            opacity: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.y = 1;
        
        // Create wings
        const wingGeometry = new THREE.BoxGeometry(6, 0.5, 2);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x00aa00,
            metalness: 0.5,
            roughness: 0.5
        });
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-3, 0, 0);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(3, 0, 0);
        
        // Create ship group
        const alienShip = new THREE.Group();
        alienShip.add(body);
        alienShip.add(cockpit);
        alienShip.add(leftWing);
        alienShip.add(rightWing);
        
        // Add glowing lights
        const light = new THREE.PointLight(0x00ff00, 1, 10);
        light.position.set(0, 0, 0);
        alienShip.add(light);
        
        // Add to scene
        this.scene.add(alienShip);
        
        // Return object with metadata
        return {
            type: 'alienShip',
            mesh: alienShip,
            health: CONFIG.ALIEN_SHIP_HEALTH,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.2,
                CONFIG.ALIEN_SHIP_SPEED
            ),
            rotation: new THREE.Vector3(
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01
            ),
            lastShootTime: 0,
            active: false
        };
    }
    
    /**
     * Create a new asteroid
     */
    createAsteroid() {
        // Create asteroid geometry with random radius
        const radius = 2 + Math.random() * 4;
        const segments = 8 + Math.floor(Math.random() * 4);
        const asteroidGeometry = new THREE.IcosahedronGeometry(radius, segments);
        
        // Make it more irregular by displacing vertices
        const positions = asteroidGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positions, i);
            
            // Displace vertex by a small random amount
            vertex.x += (Math.random() - 0.5) * 0.8;
            vertex.y += (Math.random() - 0.5) * 0.8;
            vertex.z += (Math.random() - 0.5) * 0.8;
            
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        // Create asteroid material with some variation in color
        const colorVariation = Math.random() * 0.2;
        const asteroidMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.4 + colorVariation, 0.4 + colorVariation, 0.4 + colorVariation),
            roughness: 0.9,
            metalness: 0.2,
            flatShading: true
        });
        
        // Create mesh
        const asteroidMesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        // Add to scene
        this.scene.add(asteroidMesh);
        
        // Randomize rotation and velocity
        const rotationSpeed = {
            x: (Math.random() - 0.5) * CONFIG.ASTEROID_ROTATION_SPEED * 2,
            y: (Math.random() - 0.5) * CONFIG.ASTEROID_ROTATION_SPEED * 2,
            z: (Math.random() - 0.5) * CONFIG.ASTEROID_ROTATION_SPEED * 2
        };
        
        // Set velocity direction toward the player with randomness
        // Negative Z is toward the player - faster Z velocity gives more sense of rushing towards player
        const velocityZ = -CONFIG.ASTEROID_SPEED * (0.9 + Math.random() * 0.8); 
        
        return {
            mesh: asteroidMesh,
            type: 'asteroid',
            active: true,
            velocity: {
                x: (Math.random() - 0.5) * 0.5, // Less X movement, more direct Z approach
                y: (Math.random() - 0.5) * 0.3, // Less Y movement, more direct Z approach
                z: velocityZ
            },
            rotation: rotationSpeed
        };
    }
    
    /**
     * Get an obstacle from the pool
     */
    getFromPool(type) {
        let obstacle;
        
        if (type === 'alienShip') {
            if (this.obstaclePool.alienShips.length > 0) {
                obstacle = this.obstaclePool.alienShips.pop();
            } else {
                obstacle = this.createAlienShip();
            }
        } else if (type === 'asteroid') {
            if (this.obstaclePool.asteroids.length > 0) {
                obstacle = this.obstaclePool.asteroids.pop();
            } else {
                obstacle = this.createAsteroid();
            }
        }
        
        if (obstacle) {
            obstacle.active = true;
            obstacle.mesh.visible = true;
        }
        
        return obstacle;
    }
    
    /**
     * Return an obstacle to the pool
     */
    returnToPool(obstacle) {
        obstacle.active = false;
        obstacle.mesh.visible = false;
        
        if (obstacle.type === 'alienShip') {
            // Reset alien ship health
            obstacle.health = CONFIG.ALIEN_SHIP_HEALTH;
            this.obstaclePool.alienShips.push(obstacle);
        } else if (obstacle.type === 'asteroid') {
            this.obstaclePool.asteroids.push(obstacle);
        }
    }
    
    /**
     * Spawn new obstacles ahead of the player
     */
    spawnObstacles(playerPosition) {
        // Check if we should spawn an obstacle based on probability
        if (Math.random() < CONFIG.OBSTACLE_SPAWN_RATE) {
            // Determine spawn position
            const spawnDistance = CONFIG.MIN_OBSTACLE_DISTANCE + 
                                 Math.random() * (CONFIG.MAX_OBSTACLE_DISTANCE - CONFIG.MIN_OBSTACLE_DISTANCE);
            const spawnZ = playerPosition.z + CONFIG.RENDER_DISTANCE;
            
            // Random position within wider bounds for more varied spawning
            const spawnX = (Math.random() - 0.5) * CONFIG.ROCKET_BOUNDS_X * 2.5;
            const spawnY = 5 + Math.random() * CONFIG.ROCKET_BOUNDS_Y * 1.5;
            
            // Decide what type of obstacle to spawn
            const obstacleType = Math.random() < 0.3 ? 'alienShip' : 'asteroid';
            
            // Get obstacle from pool
            const obstacle = this.getFromPool(obstacleType);
            
            if (obstacle) {
                // Position the obstacle
                obstacle.mesh.position.set(spawnX, spawnY, spawnZ);
                
                // Record this as the latest obstacle
                this.lastObstacleZ = spawnZ;
                
                // For asteroids, occasionally spawn a cluster
                if (obstacleType === 'asteroid' && Math.random() < 0.4) {
                    // Spawn 2-4 additional asteroids in a cluster
                    const clusterSize = 2 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < clusterSize; i++) {
                        const offset = 15;
                        const clusterX = spawnX + (Math.random() - 0.5) * offset;
                        const clusterY = spawnY + (Math.random() - 0.5) * offset;
                        const clusterZ = spawnZ + (Math.random() - 0.5) * offset;
                        
                        const clusterAsteroid = this.getFromPool('asteroid');
                        if (clusterAsteroid) {
                            clusterAsteroid.mesh.position.set(clusterX, clusterY, clusterZ);
                            this.obstacles.push(clusterAsteroid);
                        }
                    }
                }
                
                // Add to active obstacles
                this.obstacles.push(obstacle);
            }
        }
    }
    
    /**
     * Create an explosion effect at the given position
     */
    createExplosion(position, color = 0xffaa00) {
        // Create particle system for explosion
        const particleCount = CONFIG.EXPLOSION_PARTICLE_COUNT;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Set initial positions at center
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // Randomize colors slightly
            const r = (color >> 16 & 255) / 255;
            const g = (color >> 8 & 255) / 255;
            const b = (color & 255) / 255;
            
            colors[i3] = r * (0.8 + Math.random() * 0.2);
            colors[i3 + 1] = g * (0.8 + Math.random() * 0.2);
            colors[i3 + 2] = b * (0.8 + Math.random() * 0.2);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create material for particles
        const material = new THREE.PointsMaterial({
            size: CONFIG.EXPLOSION_PARTICLE_SIZE,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false
        });
        
        // Create particle system
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);
        
        // Store explosion data
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            // Random velocity in all directions
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            velocity.normalize().multiplyScalar(0.2 + Math.random() * 0.8);
            velocities.push(velocity);
        }
        
        // Add to explosions array
        this.explosions.push({
            particleSystem: particleSystem,
            velocities: velocities,
            createdAt: Date.now()
        });
        
        // Add point light for explosion glow
        const light = new THREE.PointLight(color, 2, 20);
        light.position.copy(position);
        this.scene.add(light);
        
        // Remove light after explosion duration
        setTimeout(() => {
            this.scene.remove(light);
        }, CONFIG.EXPLOSION_DURATION);
    }
    
    /**
     * Update all active obstacles
     */
    update(deltaTime, playerPosition) {
        // First spawn new obstacles
        this.spawnObstacles(playerPosition);
        
        // Get player collision box
        const rocketBox = this.rocket.getCollisionBox();
        const missiles = this.rocket.getMissiles();
        
        // Update existing obstacles
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            
            // Move obstacle
            obstacle.mesh.position.x += obstacle.velocity.x * deltaTime;
            obstacle.mesh.position.y += obstacle.velocity.y * deltaTime;
            obstacle.mesh.position.z += obstacle.velocity.z * deltaTime;
            
            // Update rotation
            obstacle.mesh.rotation.x += obstacle.rotation.x * deltaTime;
            obstacle.mesh.rotation.y += obstacle.rotation.y * deltaTime;
            obstacle.mesh.rotation.z += obstacle.rotation.z * deltaTime;
            
            // For alien ships, make them move toward the player
            if (obstacle.type === 'alienShip') {
                // Calculate direction to player
                const directionX = playerPosition.x - obstacle.mesh.position.x;
                const directionY = playerPosition.y - obstacle.mesh.position.y;
                
                // Adjust velocity to move toward player more aggressively
                obstacle.velocity.x += directionX * 0.0005 * deltaTime;
                obstacle.velocity.y += directionY * 0.0005 * deltaTime;
                
                // Ensure velocity doesn't get too extreme
                obstacle.velocity.x = THREE.MathUtils.clamp(obstacle.velocity.x, -0.5, 0.5);
                obstacle.velocity.y = THREE.MathUtils.clamp(obstacle.velocity.y, -0.5, 0.5);
                
                // Alien ships can shoot at the player
                this.alienShipShoot(obstacle, playerPosition, deltaTime);
            }
            
            // Check for collision with player
            const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
            if (obstacleBox.intersectsBox(rocketBox)) {
                // Create explosion at collision point
                this.createExplosion(obstacle.mesh.position, 0xff0000);
                
                // Game over
                window.gameOver && window.gameOver();
                
                // Log collision to blockchain
                window.logAction && window.logAction('COLLISION_WITH_OBSTACLE');
                
                break;
            }
            
            // Check for collision with missiles
            for (let j = 0; j < missiles.length; j++) {
                const missile = missiles[j];
                const missileBox = new THREE.Box3().setFromObject(missile.mesh);
                
                if (obstacleBox.intersectsBox(missileBox)) {
                    // Create explosion at collision point
                    this.createExplosion(missile.mesh.position);
                    
                    // Remove missile
                    this.rocket.removeMissile(missile.mesh);
                    
                    // For alien ships, reduce health
                    if (obstacle.type === 'alienShip') {
                        obstacle.health--;
                        
                        // If health is 0, destroy the alien ship
                        if (obstacle.health <= 0) {
                            this.createExplosion(obstacle.mesh.position, 0x00ff00);
                            
                            // Add to score
                            window.addScore && window.addScore(CONFIG.OBSTACLE_SCORE);
                            
                            // Return to pool
                            this.returnToPool(obstacle);
                            this.obstacles.splice(i, 1);
                            i--;
                            
                            // Log destruction to blockchain
                            window.logAction && window.logAction('DESTROYED_ALIEN_SHIP');
                        }
                    } else {
                        // For asteroids, destroy immediately
                        this.createExplosion(obstacle.mesh.position, 0xaaaaaa);
                        
                        // Add to score
                        window.addScore && window.addScore(CONFIG.OBSTACLE_SCORE / 2);
                        
                        // Return to pool
                        this.returnToPool(obstacle);
                        this.obstacles.splice(i, 1);
                        i--;
                        
                        // Log destruction to blockchain
                        window.logAction && window.logAction('DESTROYED_ASTEROID');
                    }
                    
                    break;
                }
            }
            
            // Remove obstacles that are too far behind the player
            if (obstacle.mesh.position.z < playerPosition.z - CONFIG.CLEANUP_DISTANCE) {
                this.returnToPool(obstacle);
                this.obstacles.splice(i, 1);
                i--;
            }
        }
        
        // Update explosions
        this.updateExplosions();
    }
    
    /**
     * Update explosion particle effects
     */
    updateExplosions() {
        const currentTime = Date.now();
        
        for (let i = 0; i < this.explosions.length; i++) {
            const explosion = this.explosions[i];
            
            // Check if explosion should be removed
            if (currentTime - explosion.createdAt > CONFIG.EXPLOSION_DURATION) {
                this.scene.remove(explosion.particleSystem);
                explosion.particleSystem.geometry.dispose();
                explosion.particleSystem.material.dispose();
                this.explosions.splice(i, 1);
                i--;
                continue;
            }
            
            // Update explosion particles
            const positions = explosion.particleSystem.geometry.attributes.position.array;
            
            for (let j = 0; j < positions.length / 3; j++) {
                const j3 = j * 3;
                const velocity = explosion.velocities[j];
                
                // Update position based on velocity
                positions[j3] += velocity.x;
                positions[j3 + 1] += velocity.y;
                positions[j3 + 2] += velocity.z;
                
                // Slow down particles over time
                velocity.multiplyScalar(0.98);
            }
            
            explosion.particleSystem.geometry.attributes.position.needsUpdate = true;
            
            // Fade out explosion
            const progress = (currentTime - explosion.createdAt) / CONFIG.EXPLOSION_DURATION;
            explosion.particleSystem.material.opacity = 1 - progress;
        }
    }
    
    /**
     * Make alien ships shoot at player
     */
    alienShipShoot(alienShip, playerPosition, deltaTime) {
        const currentTime = Date.now();
        
        // Only shoot every few seconds
        if (currentTime - alienShip.lastShootTime > 2000 + Math.random() * 3000) {
            alienShip.lastShootTime = currentTime;
            
            // Create projectile geometry and material
            const projectileGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const projectileMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 1
            });
            
            // Create projectile mesh
            const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
            
            // Position at alien ship
            projectile.position.copy(alienShip.mesh.position);
            
            // Calculate direction to player
            const direction = new THREE.Vector3().subVectors(playerPosition, alienShip.mesh.position).normalize();
            
            // Add to scene
            this.scene.add(projectile);
            
            // Add light to projectile
            const projectileLight = new THREE.PointLight(0x00ff00, 1, 5);
            projectile.add(projectileLight);
            
            // Add to obstacles as a special type
            this.obstacles.push({
                type: 'alienProjectile',
                mesh: projectile,
                velocity: direction.multiplyScalar(0.7),
                rotation: new THREE.Vector3(0, 0, 0),
                active: true
            });
        }
    }
    
    /**
     * Get obstacles that are near the player's position
     * Used for camera shake effects
     */
    getNearbyObstacles(playerPosition, maxDistance) {
        const nearby = [];
        
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            const distance = obstacle.mesh.position.distanceTo(playerPosition);
            
            // Only include obstacles that are within the max distance
            if (distance < maxDistance) {
                nearby.push({
                    mesh: obstacle.mesh,
                    type: obstacle.type,
                    distance: distance
                });
            }
        }
        
        return nearby;
    }
} 