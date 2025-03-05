/**
 * Rocket.js
 * Handles the player's rocket, controls, and missile shooting
 */
class Rocket {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.object = null;
        this.missiles = [];
        this.exhaustParticles = [];
        this.lastMissileTime = 0;
        
        // Track inputs
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            shoot: false
        };
        
        // Create the rocket
        this.createRocket();
        this.createExhaustParticles();
        this.setupEventListeners();
    }
    
    /**
     * Create rocket mesh
     */
    createRocket() {
        // Rocket body
        const bodyGeometry = new THREE.CylinderGeometry(0, 2, 10, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x00aaaa,
            emissiveIntensity: 0.2
        });
        
        // Rocket cockpit
        const cockpitGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ffff,
            metalness: 0.2,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        
        // Wings
        const wingGeometry = new THREE.BoxGeometry(6, 0.5, 3);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xff00ff,
            metalness: 0.5,
            roughness: 0.5,
            emissive: 0x990099,
            emissiveIntensity: 0.2
        });
        
        // Create meshes
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        
        // Position parts
        body.rotation.x = -Math.PI / 2;
        cockpit.position.set(0, 0, -2);
        leftWing.position.set(-3, -1, 0);
        rightWing.position.set(3, -1, 0);
        
        // Create group for the rocket
        this.object = new THREE.Group();
        this.object.add(body);
        this.object.add(cockpit);
        this.object.add(leftWing);
        this.object.add(rightWing);
        
        // Add engine lights
        this.addEngineLights();
        
        // Set initial position
        this.object.position.copy(CONFIG.ROCKET_START_POS);
        
        // Add to scene
        this.scene.add(this.object);
    }
    
    /**
     * Create exhaust particles for rocket
     */
    createExhaustParticles() {
        // Create a much more impressive particle system for exhaust
        const particleCount = CONFIG.EXHAUST_PARTICLE_COUNT;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        const particleColors = new Float32Array(particleCount * 3);
        
        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            // All particles start at origin (will be positioned in update)
            particlePositions[i * 3] = 0;
            particlePositions[i * 3 + 1] = 0;
            particlePositions[i * 3 + 2] = 0;
            
            // Randomize sizes for more natural look
            particleSizes[i] = CONFIG.EXHAUST_PARTICLE_SIZE * (0.5 + Math.random());
            
            // Create color gradient from white/yellow core to blue/cyan edge
            if (i < particleCount * 0.3) {
                // Inner core particles - white/yellow
                particleColors[i * 3] = 1.0;        // Red
                particleColors[i * 3 + 1] = 1.0;    // Green
                particleColors[i * 3 + 2] = 0.7;    // Blue (slightly less for yellow tint)
            } else if (i < particleCount * 0.7) {
                // Mid particles - cyan
                particleColors[i * 3] = 0.0;        // Red
                particleColors[i * 3 + 1] = 0.9;    // Green
                particleColors[i * 3 + 2] = 1.0;    // Blue
            } else {
                // Outer particles - deep blue
                particleColors[i * 3] = 0.0;        // Red
                particleColors[i * 3 + 1] = 0.4;    // Green
                particleColors[i * 3 + 2] = 1.0;    // Blue
            }
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        
        // Create a custom shader material for more control over particles
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0);
                    gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        
        this.exhaustParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.exhaustParticleSystem);
        
        // Store particle data for animation
        this.exhaustParticles = [];
        for (let i = 0; i < particleCount; i++) {
            this.exhaustParticles.push({
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,           // X velocity (slight spread)
                    (Math.random() - 0.5) * 0.2,           // Y velocity (slight spread)
                    -(0.5 + Math.random() * 2.0)           // Z velocity (backwards from rocket)
                ),
                size: particleSizes[i],
                life: 0,
                maxLife: 0.5 + Math.random() * 1.0,        // Shorter lifetime for faster refresh
                color: new THREE.Vector3(
                    particleColors[i * 3],
                    particleColors[i * 3 + 1],
                    particleColors[i * 3 + 2]
                )
            });
        }
        
        // Add engine glow lights
        this.addEngineLights();
    }
    
    /**
     * Add engine lights to create a glow effect
     */
    addEngineLights() {
        // Create light groups for the engines
        const engineLightGroup = new THREE.Group();
        this.object.add(engineLightGroup);
        
        // Position at the back of the rocket
        engineLightGroup.position.z = 5;  // Back of rocket
        
        // Main engine glow
        const mainEngineLight = new THREE.PointLight(0x00ffff, 2, 15);
        mainEngineLight.position.set(0, 0, 0);
        engineLightGroup.add(mainEngineLight);
        
        // Secondary lights for more visual interest
        const yellowLight = new THREE.PointLight(0xffff00, 1, 8);
        yellowLight.position.set(0, 0, 1);
        engineLightGroup.add(yellowLight);
        
        // Store for future reference
        this.engineLights = engineLightGroup;
    }
    
    /**
     * Create a circular particle texture
     */
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(0, 255, 255, 1)');
        gradient.addColorStop(0.7, 'rgba(0, 100, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 128, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    /**
     * Set up keyboard and touch event listeners
     */
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Touch events for mobile
        if (CONFIG.IS_TOUCH_DEVICE) {
            // Shooting
            document.addEventListener('touchstart', (event) => {
                this.shootMissile();
                // Log the action to blockchain
                window.logAction && window.logAction('SHOOT_MISSILE');
            });
            
            // Movement controls for touch - to be implemented with virtual joystick
            // For simplicity, using a basic implementation here
            document.addEventListener('touchmove', (event) => {
                const touch = event.touches[0];
                const gameContainer = document.getElementById('game-container');
                const containerRect = gameContainer.getBoundingClientRect();
                
                const centerX = containerRect.width / 2;
                const centerY = containerRect.height / 2;
                
                this.keys.left = touch.clientX < centerX - 50;
                this.keys.right = touch.clientX > centerX + 50;
                this.keys.up = touch.clientY < centerY - 50;
                this.keys.down = touch.clientY > centerY + 50;
            });
            
            document.addEventListener('touchend', (event) => {
                this.keys.left = false;
                this.keys.right = false;
                this.keys.up = false;
                this.keys.down = false;
            });
        }
    }
    
    /**
     * Handle key down events
     */
    handleKeyDown(event) {
        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                // Log the action to blockchain
                window.logAction && window.logAction('MOVE_LEFT');
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                // Log the action to blockchain
                window.logAction && window.logAction('MOVE_RIGHT');
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                // Log the action to blockchain
                window.logAction && window.logAction('MOVE_UP');
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                // Log the action to blockchain
                window.logAction && window.logAction('MOVE_DOWN');
                break;
            case 'Space':
                this.keys.shoot = true;
                this.shootMissile();
                // Log the action to blockchain
                window.logAction && window.logAction('SHOOT_MISSILE');
                break;
        }
    }
    
    /**
     * Handle key up events
     */
    handleKeyUp(event) {
        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'Space':
                this.keys.shoot = false;
                break;
        }
    }
    
    /**
     * Shoot missile from rocket
     */
    shootMissile() {
        const currentTime = Date.now();
        if (currentTime - this.lastMissileTime < CONFIG.MISSILE_COOLDOWN) {
            return; // Still on cooldown
        }
        
        this.lastMissileTime = currentTime;
        
        // Create a more realistic missile
        const missileGroup = new THREE.Group();
        
        // Missile body (longer and sleeker)
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ccff,
            emissive: 0x00ccff,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const missileBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        missileBody.rotation.x = Math.PI / 2; // Align with Z-axis
        missileGroup.add(missileBody);
        
        // Add fins at the back
        const finGeometry = new THREE.BoxGeometry(0.1, 1, 0.6);
        const finMaterial = new THREE.MeshStandardMaterial({
            color: 0x00aadd,
            emissive: 0x003366,
            emissiveIntensity: 0.3
        });
        
        // Create 4 fins
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.set(0, -2, 0); // Position at the back of the missile
            fin.rotation.z = (Math.PI / 2) * i; // Rotate around to create 4 fins
            missileBody.add(fin);
        }
        
        // Add engine glow at the back
        const glowGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.9
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, -2.5, 0); // Position at the very back
        glow.scale.set(1, 0.6, 1); // Flatten it to look more like engine exhaust
        missileBody.add(glow);
        
        // Add bright point light for the engine glow
        const engineLight = new THREE.PointLight(0xff3300, 2, 6);
        engineLight.position.set(0, -2.5, 0);
        missileBody.add(engineLight);
        
        // Add a general glow to the entire missile
        const missileLight = new THREE.PointLight(0x00aaff, 1, 10);
        missileGroup.add(missileLight);
        
        // Position missile at rocket's tip
        missileGroup.position.copy(this.object.position);
        missileGroup.position.z += 5; // Position in front of the rocket
        
        // Add to scene
        this.scene.add(missileGroup);
        
        // Add particles for missile trail
        const trailParticles = this.createMissileTrail(missileGroup);
        
        // Create a straight-line velocity vector for the missile
        // No random components to ensure straight flight
        const missileVelocity = new THREE.Vector3(0, 0, 1).normalize();
        
        // Store missile data
        this.missiles.push({
            mesh: missileGroup,
            velocity: missileVelocity,
            speed: CONFIG.MISSILE_SPEED,
            trail: trailParticles,
            createdAt: currentTime
        });
    }
    
    /**
     * Create particles for missile trail
     */
    createMissileTrail(missileGroup) {
        // Create particle geometry
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Initialize positions
        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3 + 0] = 0;
            particlePositions[i * 3 + 1] = 0;
            particlePositions[i * 3 + 2] = 0;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.8,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        missileGroup.add(particles);
        
        // Store particle data for animation
        const particleData = [];
        for (let i = 0; i < particleCount; i++) {
            particleData.push({
                life: Math.random(),
                speed: 0.1 + Math.random() * 0.2
            });
        }
        
        return {
            system: particles,
            data: particleData
        };
    }
    
    /**
     * Update rocket position based on input
     */
    updatePosition(deltaTime) {
        // Forward movement (automatic)
        this.object.position.z += CONFIG.GAME_SPEED * deltaTime;
        
        // Lateral movement (left/right)
        if (this.keys.left && this.object.position.x > -CONFIG.ROCKET_BOUNDS_X) {
            this.object.position.x -= CONFIG.ROCKET_LATERAL_SPEED * deltaTime;
            this.object.rotation.z = Math.min(this.object.rotation.z + 0.05, 0.3); // Tilt while turning
        } else if (this.keys.right && this.object.position.x < CONFIG.ROCKET_BOUNDS_X) {
            this.object.position.x += CONFIG.ROCKET_LATERAL_SPEED * deltaTime;
            this.object.rotation.z = Math.max(this.object.rotation.z - 0.05, -0.3); // Tilt while turning
        } else {
            // Return to neutral rotation
            if (this.object.rotation.z > 0.01) {
                this.object.rotation.z -= 0.05;
            } else if (this.object.rotation.z < -0.01) {
                this.object.rotation.z += 0.05;
            } else {
                this.object.rotation.z = 0;
            }
        }
        
        // Vertical movement (up/down)
        if (this.keys.up && this.object.position.y < CONFIG.ROCKET_BOUNDS_Y) {
            this.object.position.y += CONFIG.ROCKET_VERTICAL_SPEED * deltaTime;
            this.object.rotation.x = Math.min(this.object.rotation.x + 0.03, 0.2); // Tilt while climbing
        } else if (this.keys.down && this.object.position.y > 1) {
            this.object.position.y -= CONFIG.ROCKET_VERTICAL_SPEED * deltaTime;
            this.object.rotation.x = Math.max(this.object.rotation.x - 0.03, -0.2); // Tilt while diving
        } else {
            // Return to neutral rotation
            if (this.object.rotation.x > 0.01) {
                this.object.rotation.x -= 0.03;
            } else if (this.object.rotation.x < -0.01) {
                this.object.rotation.x += 0.03;
            } else {
                this.object.rotation.x = 0;
            }
        }
    }
    
    /**
     * Update missiles
     */
    updateMissiles(deltaTime) {
        const currentTime = Date.now();
        
        for (let i = 0; i < this.missiles.length; i++) {
            const missile = this.missiles[i];
            
            // Move missile forward along its velocity vector
            missile.mesh.position.z += missile.speed * deltaTime;
            
            // Apply constant rotation to the missile body for straight-line effect
            // This makes it look like it's stabilized, not rolling
            missile.mesh.children[0].rotation.z += 0.1;
            
            // Update missile trail particles
            this.updateMissileTrail(missile, deltaTime);
            
            // Check if missile has expired
            if (currentTime - missile.createdAt > CONFIG.MISSILE_LIFETIME) {
                // Remove the missile mesh and its trail
                this.scene.remove(missile.mesh);
                this.missiles.splice(i, 1);
                i--;
            }
        }
    }
    
    /**
     * Update missile trail particles
     */
    updateMissileTrail(missile, deltaTime) {
        const trail = missile.trail;
        const particles = trail.system.geometry.attributes.position.array;
        
        // Update each particle in the trail
        for (let i = 0; i < trail.data.length; i++) {
            const particle = trail.data[i];
            
            // Decrease life of particle
            particle.life -= particle.speed * deltaTime;
            
            // Reset dead particles
            if (particle.life <= 0) {
                particle.life = 1;
                
                // Position at the back of the missile
                particles[i * 3 + 0] = 0;
                particles[i * 3 + 1] = -2.5 + (Math.random() - 0.5) * 0.3;
                particles[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            } else {
                // Move particles back for trail effect
                particles[i * 3 + 1] -= (particle.speed * 5) * deltaTime;
                
                // Add some random motion for more natural trail
                particles[i * 3 + 0] += (Math.random() - 0.5) * 0.05;
                particles[i * 3 + 2] += (Math.random() - 0.5) * 0.05;
            }
        }
        
        // Update the geometry
        trail.system.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Update exhaust particles
     */
    updateExhaustParticles(deltaTime) {
        const positions = this.exhaustParticleSystem.geometry.attributes.position.array;
        
        // Get rocket's engine position (back of the rocket)
        const enginePosition = this.object.position.clone();
        enginePosition.z += 5;  // Move to back of rocket
        
        // Make engine lights flicker for more dynamic effect
        if (this.engineLights) {
            // Random flickering intensity
            const flickerIntensity = 1.5 + Math.random() * 1.0;
            this.engineLights.children[0].intensity = flickerIntensity;
            
            // Random color shift
            const colorShift = Math.random();
            this.engineLights.children[1].color.setHSL(0.5 + colorShift * 0.1, 1.0, 0.5);
        }
        
        for (let i = 0; i < this.exhaustParticles.length; i++) {
            const particle = this.exhaustParticles[i];
            
            // Update particle life
            particle.life += deltaTime * 2;  // Faster life cycle
            
            // Regenerate expired particles
            if (particle.life >= particle.maxLife) {
                // Reset particle at rocket's engine position with small random offset
                particle.position.copy(enginePosition);
                particle.position.x += (Math.random() - 0.5) * 0.6;
                particle.position.y += (Math.random() - 0.5) * 0.6;
                
                // Reset velocity - mainly backward (negative Z) with some spread
                const spread = 0.4;
                particle.velocity.set(
                    (Math.random() - 0.5) * spread,
                    (Math.random() - 0.5) * spread,
                    -(1.0 + Math.random() * 3.0)  // Faster backward velocity
                );
                
                // Reset life
                particle.life = 0;
                particle.maxLife = 0.3 + Math.random() * 0.7;  // Shorter for faster refresh
            }
            
            // Scale velocity based on game speed for more dramatic effect at high speeds
            const speedFactor = 0.5 + CONFIG.GAME_SPEED * 0.3;
            
            // Update position based on velocity
            particle.position.x += particle.velocity.x * deltaTime * speedFactor;
            particle.position.y += particle.velocity.y * deltaTime * speedFactor;
            particle.position.z += particle.velocity.z * deltaTime * speedFactor;
            
            // Add some turbulence for more chaotic motion
            particle.position.x += (Math.random() - 0.5) * 0.1 * deltaTime;
            particle.position.y += (Math.random() - 0.5) * 0.1 * deltaTime;
            
            // Update positions in geometry
            const i3 = i * 3;
            positions[i3] = particle.position.x;
            positions[i3 + 1] = particle.position.y;
            positions[i3 + 2] = particle.position.z;
        }
        
        this.exhaustParticleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Get rocket position
     */
    getPosition() {
        return this.object.position.clone();
    }
    
    /**
     * Get collision box for rocket
     */
    getCollisionBox() {
        const box = new THREE.Box3().setFromObject(this.object);
        // Shrink box slightly for more lenient collisions
        box.min.add(new THREE.Vector3(1, 1, 1));
        box.max.sub(new THREE.Vector3(1, 1, 1));
        return box;
    }
    
    /**
     * Get missiles for collision detection
     */
    getMissiles() {
        return this.missiles.map(missile => ({
            position: missile.mesh.position,
            mesh: missile.mesh
        }));
    }
    
    /**
     * Remove a missile from the scene
     */
    removeMissile(missile) {
        const index = this.missiles.findIndex(m => m.mesh === missile);
        if (index !== -1) {
            this.scene.remove(missile);
            this.missiles.splice(index, 1);
        }
    }
    
    /**
     * Update rocket state
     */
    update(deltaTime) {
        this.updatePosition(deltaTime);
        this.updateMissiles(deltaTime);
        this.updateExhaustParticles(deltaTime);
    }
} 