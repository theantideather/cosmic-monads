/**
 * Environment.js
 * Handles all environment-related elements (terrain, sky, mountains, stars, etc.)
 */
class Environment {
    constructor(scene) {
        this.scene = scene;
        this.terrainChunks = [];
        this.mountains = [];
        this.stars = [];
        this.lastChunkPosition = 0;
        
        // Setup environment elements
        this.setupFog();
        this.setupSky();
        this.setupStarfield();
        this.setupMountains();
        this.setupGround();
    }
    
    /**
     * Setup fog for atmospheric depth
     */
    setupFog() {
        this.scene.fog = new THREE.FogExp2(CONFIG.FOG_COLOR, 0.002);
        this.scene.background = new THREE.Color(0x110022); // Dark purple background
    }
    
    /**
     * Create sunset sky with gradient
     */
    setupSky() {
        // Create sky dome
        const skyGeometry = new THREE.SphereGeometry(CONFIG.WORLD_SIZE / 2, 32, 32);
        
        // Create gradient texture for sky
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#110022');   // Deep space purple at top
        gradient.addColorStop(0.4, '#330066');  // Mid purple
        gradient.addColorStop(0.7, '#ff5500');  // Orange sunset
        gradient.addColorStop(0.9, '#ffcc00');  // Yellow horizon
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        const skyTexture = new THREE.CanvasTexture(canvas);
        const skyMaterial = new THREE.MeshBasicMaterial({
            map: skyTexture,
            side: THREE.BackSide,
            fog: false
        });
        
        this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.sky);
    }
    
    /**
     * Create dynamic starfield in the sky
     */
    setupStarfield() {
        this.stars = [];
        
        // Create 300 individual stars
        for (let i = 0; i < 300; i++) {
            // Create glowing star material
            const starMaterial = new THREE.MeshBasicMaterial({
                color: this.getRandomStarColor(),
                transparent: true,
                opacity: 0.8 + Math.random() * 0.2
            });
            
            // Create star geometry (small sphere)
            const starGeometry = new THREE.SphereGeometry(0.5 + Math.random() * 1.5, 8, 8);
            const star = new THREE.Mesh(starGeometry, starMaterial);
            
            // Random position in a large sphere around the scene
            const distance = 500 + Math.random() * 1500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            star.position.x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE;
            star.position.y = 100 + Math.random() * 900;
            star.position.z = Math.random() * CONFIG.RENDER_DISTANCE * 2;
            
            // Add point light to some stars to make them glow
            if (Math.random() > 0.9) {
                const starLight = new THREE.PointLight(starMaterial.color, 0.5, 50);
                star.add(starLight);
            }
            
            this.scene.add(star);
            
            // Store star with its distance for parallax effect
            this.stars.push({
                mesh: star,
                distance: distance,
                originalY: star.position.y
            });
        }
    }
    
    /**
     * Get random star color (white, blue, yellow or red)
     */
    getRandomStarColor() {
        const colors = [
            0xffffff, // white
            0xffffaa, // yellow
            0xaaaaff, // blue
            0xffaa66  // orange-red
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Create purple mountains in background
     */
    setupMountains() {
        this.mountains = [];
        
        // Create multiple mountain ranges at different distances
        const mountainCount = 15;
        
        for (let i = 0; i < mountainCount; i++) {
            // Create mountain geometry
            const mountainGeometry = new THREE.ConeGeometry(
                80 + Math.random() * 40, // Radius
                150 + Math.random() * 100, // Height
                5 + Math.floor(Math.random() * 4), // Radial segments (for jagged look)
                1, // Height segments
                false // Open-ended
            );
            
            // Modify vertices for more irregular shape
            const positions = mountainGeometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const vertex = new THREE.Vector3();
                vertex.fromBufferAttribute(positions, j);
                
                // Only displace non-peak vertices
                if (vertex.y < mountainGeometry.parameters.height - 1) {
                    vertex.x += (Math.random() - 0.5) * 30;
                    vertex.z += (Math.random() - 0.5) * 30;
                    // Slightly vary height too
                    vertex.y += (Math.random() - 0.5) * 20;
                }
                
                positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
            }
            
            // Create purple mountain material with emissive glow
            const mountainMaterial = new THREE.MeshStandardMaterial({
                color: 0x6600aa,
                roughness: 0.9,
                metalness: 0.1,
                emissive: 0x330066,
                emissiveIntensity: 0.2,
                flatShading: true
            });
            
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            
            // Position mountains around the scene
            const angle = (i / mountainCount) * Math.PI * 2;
            mountain.position.x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 1.5;
            mountain.position.y = -50; // Base at ground level
            mountain.position.z = Math.random() * CONFIG.RENDER_DISTANCE * 2;
            
            // Randomly scale mountains
            const scaleY = 1.5 + Math.random();
            const scaleXZ = 1 + Math.random() * 0.5;
            mountain.scale.set(scaleXZ, scaleY, scaleXZ);
            
            this.scene.add(mountain);
            this.mountains.push(mountain);
        }
    }
    
    /**
     * Create ground with displacement mapping
     */
    setupGround() {
        // Create the grid material
        const gridTexture = this.createGridTexture();
        
        // Create ground chunks ahead of player
        for (let i = 0; i < 5; i++) {
            this.createTerrainChunk(this.lastChunkPosition, gridTexture);
            this.lastChunkPosition += CONFIG.RENDER_DISTANCE / 5;
        }
    }
    
    /**
     * Create grid texture for vaporwave style
     */
    createGridTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Fill background
        context.fillStyle = '#000033';
        context.fillRect(0, 0, 512, 512);
        
        // Draw grid
        context.strokeStyle = '#ff00ff';
        context.lineWidth = 2;
        
        // Horizontal lines
        const spacing = 32;
        for (let y = 0; y <= 512; y += spacing) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(512, y);
            context.stroke();
        }
        
        // Vertical lines
        for (let x = 0; x <= 512; x += spacing) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, 512);
            context.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        
        return texture;
    }
    
    /**
     * Create a single terrain chunk
     */
    createTerrainChunk(zPosition, gridTexture) {
        const chunkSize = CONFIG.RENDER_DISTANCE / 5;
        const chunkWidth = 200;
        
        // Create displacement map for uneven terrain
        const displacementMap = this.createDisplacementMap();
        
        // Create ground plane with displacement
        const terrainGeometry = new THREE.PlaneGeometry(chunkWidth, chunkSize, 32, 32);
        const terrainMaterial = new THREE.MeshStandardMaterial({
            color: 0x4400ff,
            map: gridTexture,
            displacementMap: displacementMap,
            displacementScale: 5,
            metalness: 0.2,
            roughness: 0.8,
            emissive: 0x220044,
            emissiveIntensity: 0.2
        });
        
        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        terrain.position.set(0, 0, zPosition + chunkSize / 2);
        
        this.terrainChunks.push({
            mesh: terrain,
            zPosition: zPosition
        });
        
        this.scene.add(terrain);
    }
    
    /**
     * Create displacement map for terrain
     */
    createDisplacementMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Fill with black
        context.fillStyle = 'black';
        context.fillRect(0, 0, 512, 512);
        
        // Add noise
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = 1 + Math.random() * 10;
            const brightness = Math.random() * 50;
            
            context.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        // Apply blur for smoother terrain
        context.filter = 'blur(8px)';
        context.drawImage(canvas, 0, 0);
        
        // Create three.js texture
        const displacementMap = new THREE.CanvasTexture(canvas);
        displacementMap.wrapS = THREE.RepeatWrapping;
        displacementMap.wrapT = THREE.RepeatWrapping;
        
        return displacementMap;
    }
    
    /**
     * Update environment based on player position
     */
    update(playerPosition) {
        // Update terrain chunks
        this.updateTerrain(playerPosition);
        
        // Update starfield for parallax effect
        this.updateStarfield(playerPosition);
        
        // Update mountains for parallax effect
        this.updateMountains(playerPosition);
        
        // Update sky position to follow player
        if (this.sky) {
            this.sky.position.z = playerPosition.z;
        }
    }
    
    /**
     * Update terrain chunks
     */
    updateTerrain(playerPosition) {
        // Check if we need to create new terrain chunks
        if (playerPosition.z + CONFIG.RENDER_DISTANCE > this.lastChunkPosition) {
            const gridTexture = this.terrainChunks[0].mesh.material.map;
            this.createTerrainChunk(this.lastChunkPosition, gridTexture);
            this.lastChunkPosition += CONFIG.RENDER_DISTANCE / 5;
        }
        
        // Remove terrain chunks behind player
        for (let i = 0; i < this.terrainChunks.length; i++) {
            const chunk = this.terrainChunks[i];
            if (chunk.zPosition + CONFIG.RENDER_DISTANCE / 5 < playerPosition.z - CONFIG.CLEANUP_DISTANCE) {
                this.scene.remove(chunk.mesh);
                chunk.mesh.geometry.dispose();
                chunk.mesh.material.dispose();
                this.terrainChunks.splice(i, 1);
                i--;
            }
        }
    }
    
    /**
     * Update starfield with parallax effect
     */
    updateStarfield(playerPosition) {
        // Move stars with parallax effect
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Calculate relative movement speed (stars further away move slower)
            const parallaxFactor = 0.2 + (star.distance / 2000);
            
            // Move stars in relation to player position, creating a parallax effect
            star.mesh.position.z -= CONFIG.GAME_SPEED * parallaxFactor * 2;
            
            // If star is too far behind, move it ahead again
            if (star.mesh.position.z < playerPosition.z - CONFIG.CLEANUP_DISTANCE * 2) {
                star.mesh.position.z = playerPosition.z + CONFIG.RENDER_DISTANCE + Math.random() * 500;
                star.mesh.position.x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE;
                star.mesh.position.y = 100 + Math.random() * 900;
                
                // Randomize star size
                const scale = 0.5 + Math.random() * 2;
                star.mesh.scale.set(scale, scale, scale);
            }
        }
    }
    
    /**
     * Update mountains with parallax effect
     */
    updateMountains(playerPosition) {
        // Loop through all mountains
        for (let i = 0; i < this.mountains.length; i++) {
            const mountain = this.mountains[i];
            
            // Mountains move slower than the player for parallax effect
            const parallaxFactor = 0.4; // Mountains move at 40% of player speed
            
            // Move mountains slowly in relation to player movement
            mountain.position.z -= CONFIG.GAME_SPEED * parallaxFactor;
            
            // If mountain is too far behind, move it ahead
            if (mountain.position.z < playerPosition.z - CONFIG.CLEANUP_DISTANCE * 3) {
                mountain.position.z = playerPosition.z + CONFIG.RENDER_DISTANCE + Math.random() * 200;
                mountain.position.x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 1.5;
                
                // Randomize mountain scale for variety
                const scaleY = 1.5 + Math.random();
                const scaleXZ = 1 + Math.random() * 0.5;
                mountain.scale.set(scaleXZ, scaleY, scaleXZ);
            }
        }
    }
} 