// Cosmic Monads - Simple implementation
// A game where a rocket flies through space, dodges asteroids, and shoots at a mothership

class SpaceRunner {
    constructor() {
        // Game settings
        this.settings = {
            rocketSpeed: 0.4,
            rocketFireRate: 0.15,        // Even faster firing rate
            missileSpeed: 2.5,           // Faster missiles
            asteroidSpeed: 0.7,          // Faster asteroids
            asteroidSpawnRate: 0.08,     // More asteroids
            gameSpeed: 1.0,
            maxGameSpeed: 5.0,           // Higher max speed
            gameSpeedIncrease: 0.0005    // Faster speed increase
        };

        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.lastTime = 0;
        this.lastFire = 0;
        this.shotCount = 0;            // Track number of shots
        this.keysPressed = {};
        this.asteroids = [];
        this.missiles = [];
        this.stars = [];
        this.particleGroups = [];

        // Scene setup
        this.container = document.getElementById('game-container');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.restartButton = document.getElementById('restart-button');

        // Initialize the game
        this.init();
    }

    init() {
        // Create the scene
        this.scene = new THREE.Scene();
        
        // Create a gradient background for alien sunset effect
        const bgTexture = this.createSunsetGradient();
        this.scene.background = bgTexture;

        // Create the camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 3, 10);
        this.camera.lookAt(0, 0, 0);

        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Create the rocket
        this.createRocket();

        // Create the flame effect (replaces exhaust particles)
        this.createFlameEffect();

        // Create the mothership
        this.createMothership();

        // Create stars
        this.createStars();

        // Add event listeners
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('resize', () => this.handleResize());
        this.restartButton.addEventListener('click', () => this.restart());

        // Start the game
        this.gameRunning = true;
        this.animate();
    }

    createRocket() {
        // Create a group for the rocket
        this.rocket = new THREE.Group();
        this.rocket.position.set(0, 0, 5);
        this.scene.add(this.rocket);
        
        // Create rocket body - more elongated shape
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 2.5, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x3388ff, 
            emissive: 0x112244,
            shininess: 100 
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Point forward
        body.position.set(0, 0, 0);
        body.castShadow = true;
        this.rocket.add(body);
        
        // Create rocket nose cone
        const noseGeometry = new THREE.ConeGeometry(0.4, 1.0, 16);
        const noseMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x3388ff, 
            emissive: 0x112244,
            shininess: 100 
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.rotation.x = -Math.PI / 2; // Point forward
        nose.position.set(0, 0, -1.75);
        nose.castShadow = true;
        this.rocket.add(nose);
        
        // Add main wings
        const wingGeometry = new THREE.BoxGeometry(2.2, 0.1, 0.8);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2277dd,
            emissive: 0x112233
        });
        const mainWings = new THREE.Mesh(wingGeometry, wingMaterial);
        mainWings.position.set(0, 0, 0.4);
        this.rocket.add(mainWings);
        
        // Add smaller front wings
        const frontWingGeometry = new THREE.BoxGeometry(1.4, 0.1, 0.5);
        const frontWings = new THREE.Mesh(frontWingGeometry, wingMaterial);
        frontWings.position.set(0, 0, -0.8);
        this.rocket.add(frontWings);
        
        // Add vertical stabilizer
        const stabilizerGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.6);
        const stabilizer = new THREE.Mesh(stabilizerGeometry, wingMaterial);
        stabilizer.position.set(0, 0.4, 0.6);
        this.rocket.add(stabilizer);
        
        // Create engine nozzles
        const nozzleGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 16);
        const nozzleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x555555, 
            emissive: 0x222222,
            metalness: 0.8,
            shininess: 100
        });
        
        // Left engine
        const leftNozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        leftNozzle.rotation.x = Math.PI / 2;
        leftNozzle.position.set(-0.4, 0, 1.4);
        this.rocket.add(leftNozzle);
        
        // Right engine
        const rightNozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        rightNozzle.rotation.x = Math.PI / 2;
        rightNozzle.position.set(0.4, 0, 1.4);
        this.rocket.add(rightNozzle);
        
        // Center engine
        const centerNozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        centerNozzle.rotation.x = Math.PI / 2;
        centerNozzle.position.set(0, 0, 1.4);
        centerNozzle.scale.set(1.2, 1.2, 1.2);
        this.rocket.add(centerNozzle);
        
        // Add engine glow lights
        const leftEngineLight = new THREE.PointLight(0x00ffff, 2, 2);
        leftEngineLight.position.set(-0.4, 0, 1.6);
        this.rocket.add(leftEngineLight);
        
        const rightEngineLight = new THREE.PointLight(0x00ffff, 2, 2);
        rightEngineLight.position.set(0.4, 0, 1.6);
        this.rocket.add(rightEngineLight);
        
        const centerEngineLight = new THREE.PointLight(0x00ffff, 3, 3);
        centerEngineLight.position.set(0, 0, 1.6);
        this.rocket.add(centerEngineLight);
        
        // Store references to the engine lights for effects
        this.engineLights = [leftEngineLight, rightEngineLight, centerEngineLight];
        
        // Create exhaust particles system
        this.rocketExhaust = [];
        this.lastExhaustTime = 0;
        
        // Add cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            emissive: 0x113366,
            transparent: true,
            opacity: 0.9,
            shininess: 120
        });
        
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.rotation.x = Math.PI;
        cockpit.position.set(0, 0.3, -0.4);
        this.rocket.add(cockpit);
        
        // Store the exhaust positions for particle creation
        this.exhaustPositions = [
            new THREE.Vector3(-0.4, 0, 1.4), // Left engine
            new THREE.Vector3(0.4, 0, 1.4),  // Right engine
            new THREE.Vector3(0, 0, 1.4)     // Center engine
        ];

        // Modify the exhaust system to create a more cohesive flame effect
        this.flameSystem = {
            coreParticles: [],
            outerParticles: [],
            lastUpdateTime: 0
        };
    }

    createFlameEffect() {
        // We'll use two types of flames - a bright core and outer wispy flames
        
        // Create flame core (brighter, center)
        for (let i = 0; i < 3; i++) {
            const enginePosition = this.exhaustPositions[i];
            
            // Create flame core
            const coreGeometry = new THREE.ConeGeometry(0.15, 0.8, 8);
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.9
            });
            
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            core.position.copy(enginePosition);
            core.position.z += 0.4; // Position behind engine
            core.rotation.x = Math.PI / 2;
            
            // Add variation to each engine
            core.baseScale = 0.8 + Math.random() * 0.4;
            core.pulseFactor = Math.random() * 5;
            
            this.rocket.add(core);
            this.flameSystem.coreParticles.push(core);
            
            // Create outer flame (orange/red)
            const outerGeometry = new THREE.ConeGeometry(0.25, 1.2, 8);
            const outerMaterial = new THREE.MeshBasicMaterial({
                color: 0xff5500,
                transparent: true,
                opacity: 0.7
            });
            
            const outer = new THREE.Mesh(outerGeometry, outerMaterial);
            outer.position.copy(enginePosition);
            outer.position.z += 0.5; // Position behind engine
            outer.rotation.x = Math.PI / 2;
            
            // Add variation
            outer.baseScale = 0.7 + Math.random() * 0.4;
            outer.pulseFactor = Math.random() * 5;
            
            this.rocket.add(outer);
            this.flameSystem.outerParticles.push(outer);
        }
        
        // Add a glow effect at the engine nozzles
        for (let i = 0; i < this.exhaustPositions.length; i++) {
            const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff9900,
                transparent: true,
                opacity: 0.4
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(this.exhaustPositions[i]);
            glow.position.z += 0.2;
            
            this.rocket.add(glow);
            this.flameSystem.outerParticles.push(glow);
        }
    }

    createExhaustParticle() {
        // Pick a random engine exhaust position
        const exhaustPos = this.exhaustPositions[Math.floor(Math.random() * this.exhaustPositions.length)];
        
        // Create particle with better colors and effects
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 8, 8),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(
                    0.05 + Math.random() * 0.05,    // Orange-red hue
                    0.7 + Math.random() * 0.3,      // High saturation
                    0.5 + Math.random() * 0.5       // Varying brightness
                ),
                transparent: true,
                opacity: 0.8
            })
        );
        
        // Position behind the rocket at the exhaust point
        const worldPos = new THREE.Vector3();
        this.rocket.getWorldPosition(worldPos);
        
        const rocketQuat = this.rocket.quaternion.clone();
        const exhaustOffset = exhaustPos.clone();
        exhaustOffset.applyQuaternion(rocketQuat);
        
        particle.position.copy(worldPos).add(exhaustOffset);
        
        // Add small random offset for natural look
        particle.position.x += (Math.random() - 0.5) * 0.1;
        particle.position.y += (Math.random() - 0.5) * 0.1;
        particle.position.z += (Math.random() - 0.5) * 0.1 + 0.1; // Slightly behind
        
        // Store particle data with more dynamic velocity
        const velocityDirection = new THREE.Vector3(0, 0, 1); // Base direction
        velocityDirection.applyQuaternion(rocketQuat);
        
        particle.velocity = new THREE.Vector3(
            velocityDirection.x + (Math.random() - 0.5) * 0.2,
            velocityDirection.y + (Math.random() - 0.5) * 0.2,
            velocityDirection.z + (Math.random() - 0.5) * 0.2
        ).normalize().multiplyScalar(this.settings.gameSpeed * (0.5 + Math.random() * 1.0));
        
        particle.life = 1.0;
        particle.fadeRate = 0.5 + Math.random() * 1.5; // Varying fade rates
        
        this.scene.add(particle);
        this.rocketExhaust.push(particle);
        
        return particle;
    }

    updateExhaustParticles(deltaTime) {
        // Create new particles with burst pattern
        this.lastExhaustTime += deltaTime;
        // More frequent exhaust particles
        if (this.lastExhaustTime > 0.01) {
            this.lastExhaustTime = 0;
            // Create more particles per burst
            const particlesPerBurst = 4 + Math.floor(this.settings.gameSpeed * 2);
            for (let i = 0; i < particlesPerBurst; i++) {
                this.createExhaustParticle();
            }
        }
        
        // Pulse the engine lights for effect
        const time = performance.now() * 0.003;
        this.engineLights.forEach((light, i) => {
            light.intensity = 1 + Math.sin(time * 5 + i) * 0.5 + Math.random() * 0.5;
        });
        
        // Update existing particles
        for (let i = this.rocketExhaust.length - 1; i >= 0; i--) {
            const particle = this.rocketExhaust[i];
            
            // Update position with improved physics
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 8));
            
            // Add slight expansion and turbulence
            particle.position.x += (Math.random() - 0.5) * 0.03;
            particle.position.y += (Math.random() - 0.5) * 0.03;
            
            // Update life with variable fade rate
            particle.life -= deltaTime * particle.fadeRate;
            
            // Update size and opacity with more dynamic scaling
            const scale = particle.life * 0.5 + Math.sin(particle.life * Math.PI) * 0.3;
            particle.scale.set(scale, scale, scale);
            particle.material.opacity = particle.life * 0.7;
            
            // Color transition from bright to fade
            if (particle.life < 0.5) {
                particle.material.color.setHSL(
                    0.05 + (0.5 - particle.life) * 0.1, // Shift toward red as it fades
                    0.7,
                    0.3 + particle.life * 0.4
                );
            }
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.scene.remove(particle);
                this.rocketExhaust.splice(i, 1);
            }
        }
    }

    createMothership() {
        // Store possible colors for the mothership
        this.mothershipColors = [
            { color: 0x990099, emissive: 0x330033, specular: 0x8800ff }, // Purple (default)
            { color: 0x009999, emissive: 0x003333, specular: 0x00aaff }, // Teal
            { color: 0x996600, emissive: 0x332200, specular: 0xffaa00 }, // Gold
            { color: 0x660066, emissive: 0x220022, specular: 0xff00ff }, // Deep magenta
            { color: 0x006666, emissive: 0x002222, specular: 0x00ffff }, // Cyan
            { color: 0x990000, emissive: 0x330000, specular: 0xff0000 }, // Red
            { color: 0x009900, emissive: 0x003300, specular: 0x00ff00 }  // Green
        ];
        
        // Get a random color index that's not the current one
        this.currentMothershipColorIndex = 0;
        
        // Create main body
        const bodyGeometry = new THREE.SphereGeometry(4, 32, 32);
        const colorScheme = this.mothershipColors[this.currentMothershipColorIndex];
        
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: colorScheme.color,
            emissive: colorScheme.emissive,
            shininess: 50,
            specular: colorScheme.specular
        });
        
        this.mothership = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mothership.position.set(0, 0, -40); // Centered and closer
        this.mothership.castShadow = true;
        this.mothership.receiveShadow = true;
        this.mothership.health = 100;
        this.mothership.maxHealth = 100;
        this.scene.add(this.mothership);
        
        // Create health indicator
        const healthBarGeometry = new THREE.BoxGeometry(8, 0.4, 0.1);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mothershipHealthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.mothershipHealthBar.position.set(0, 6, 0);
        this.mothership.add(this.mothershipHealthBar);
        
        // Add rings around the mothership - make them larger and more impressive
        const ringGeometry = new THREE.TorusGeometry(7, 0.5, 16, 100);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: colorScheme.color, 
            emissive: colorScheme.emissive,
            transparent: true,
            opacity: 0.7
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        this.mothership.add(ring);
        
        // Add another ring at a different angle
        const ring2 = new THREE.Mesh(ringGeometry, ringMaterial);
        ring2.rotation.x = Math.PI / 4;
        this.mothership.add(ring2);
        
        // Third ring for more visual interest
        const ring3 = new THREE.Mesh(ringGeometry, ringMaterial);
        ring3.rotation.x = -Math.PI / 4;
        this.mothership.add(ring3);
        
        // Add pulsing light
        const pulsingLight = new THREE.PointLight(colorScheme.color, 2, 30);
        this.mothership.add(pulsingLight);
        this.mothershipLight = pulsingLight;
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(4.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: colorScheme.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mothership.add(glowMesh);
        
        // Store references to materials for color changes
        this.mothershipBodyMaterial = bodyMaterial;
        this.mothershipRingMaterial = ringMaterial;
        this.mothershipGlowMaterial = glowMaterial;
        
        // Create defense turrets
        this.createMothershipTurrets();
        
        // Store damage visual effects
        this.damageEffects = [];
    }

    // Change mothership color
    changeMothershipColor() {
        // Select a new random color index that's different from the current one
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.mothershipColors.length);
        } while (newIndex === this.currentMothershipColorIndex && this.mothershipColors.length > 1);
        
        this.currentMothershipColorIndex = newIndex;
        const colorScheme = this.mothershipColors[newIndex];
        
        // Update body material
        this.mothershipBodyMaterial.color.setHex(colorScheme.color);
        this.mothershipBodyMaterial.emissive.setHex(colorScheme.emissive);
        this.mothershipBodyMaterial.specular.setHex(colorScheme.specular);
        
        // Update ring material
        this.mothershipRingMaterial.color.setHex(colorScheme.color);
        this.mothershipRingMaterial.emissive.setHex(colorScheme.emissive);
        
        // Update glow material
        this.mothershipGlowMaterial.color.setHex(colorScheme.color);
        
        // Update light color
        this.mothershipLight.color.setHex(colorScheme.color);
    }

    createMothershipTurrets() {
        this.turrets = [];
        
        // Create 4 turrets around the mothership
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            
            // Create turret base
            const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.8, 8);
            const baseMaterial = new THREE.MeshPhongMaterial({
                color: 0x770077,
                emissive: 0x330033
            });
            
            const turretBase = new THREE.Mesh(baseGeometry, baseMaterial);
            turretBase.position.set(
                Math.sin(angle) * 4.5,  // Position on the mothership surface
                Math.cos(angle) * 4.5,
                0
            );
            
            // Rotate to point outward from the mothership
            turretBase.lookAt(
                this.mothership.position.x + Math.sin(angle) * 10,
                this.mothership.position.y + Math.cos(angle) * 10,
                this.mothership.position.z
            );
            
            this.mothership.add(turretBase);
            
            // Create turret cannon
            const cannonGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
            const cannonMaterial = new THREE.MeshPhongMaterial({
                color: 0xaa00aa,
                emissive: 0x550055
            });
            
            const turretCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
            turretCannon.position.set(0, 0, 0.8); // Position on top of base
            turretCannon.rotation.x = Math.PI / 2; // Point outward
            
            turretBase.add(turretCannon);
            
            // Add to turret array for animation/shooting
            this.turrets.push({
                base: turretBase,
                cannon: turretCannon,
                lastFire: 0,
                fireRate: 3000 + Math.random() * 2000, // Random fire rate for variation
                health: 20 // Turrets can be destroyed
            });
        }
    }

    createStars() {
        // Create star particles
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        
        for (let i = 0; i < 2000; i++) {
            const x = THREE.MathUtils.randFloatSpread(1000);
            const y = THREE.MathUtils.randFloatSpread(1000);
            const z = THREE.MathUtils.randFloatSpread(1000) - 500; // Mostly behind the camera
            
            starVertices.push(x, y, z);
            
            // Store star data for animation
            this.stars.push({
                x: x,
                y: y,
                z: z,
                speed: Math.random() * 0.5 + 0.5
            });
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.7,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starField);
    }

    updateStars(deltaTime) {
        const positions = this.starField.geometry.attributes.position.array;
        const gameSpeed = this.settings.gameSpeed;
        
        for (let i = 0; i < this.stars.length; i++) {
            const index = i * 3;
            const star = this.stars[i];
            
            // Move star forward (towards camera)
            positions[index + 2] += deltaTime * 40 * gameSpeed * star.speed;
            
            // If star goes past camera, reset it far away
            if (positions[index + 2] > 50) {
                positions[index] = THREE.MathUtils.randFloatSpread(1000);
                positions[index + 1] = THREE.MathUtils.randFloatSpread(1000);
                positions[index + 2] = -500;
            }
        }
        
        this.starField.geometry.attributes.position.needsUpdate = true;
    }

    createAsteroid() {
        // Create irregular asteroid
        const asteroidGeometry = new THREE.IcosahedronGeometry(Math.random() * 0.5 + 0.5, 1);
        
        // Deform the geometry
        const positionAttribute = asteroidGeometry.getAttribute('position');
        for (let i = 0; i < positionAttribute.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positionAttribute, i);
            
            const offset = Math.random() * 0.2;
            vertex.normalize().multiplyScalar(vertex.length() + offset);
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        asteroidGeometry.computeVertexNormals();
        
        // Create material with slight color variation
        const hue = Math.random() * 0.1 + 0.6; // Purple-ish
        const asteroidMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(hue, 0.5, 0.3),
            roughness: 0.8,
            metalness: 0.2
        });
        
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        // Random position ahead of player
        asteroid.position.set(
            Math.random() * 30 - 15,  // X: -15 to 15
            Math.random() * 20 - 10,  // Y: -10 to 10
            Math.random() * -20 - 20  // Z: -20 to -40 (in front of player)
        );
        
        // Random rotation
        asteroid.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Random scale
        const scale = Math.random() * 1 + 0.5;
        asteroid.scale.set(scale, scale, scale);
        
        // Physics properties
        asteroid.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            this.settings.asteroidSpeed * (1 + Math.random() * 0.5)
        );
        
        asteroid.rotationSpeed = new THREE.Vector3(
            Math.random() * 0.02 - 0.01,
            Math.random() * 0.02 - 0.01,
            Math.random() * 0.02 - 0.01
        );
        
        asteroid.castShadow = true;
        this.scene.add(asteroid);
        this.asteroids.push(asteroid);
        
        return asteroid;
    }

    fireMissile() {
        const now = performance.now();
        if (now - this.lastFire < this.settings.rocketFireRate * 1000) return;
        this.lastFire = now;
        
        // Increment shot counter
        this.shotCount = (this.shotCount + 1) % 4;
        
        // Check if this is a special shot (every 4th shot)
        const isSpecialShot = this.shotCount === 0;
        
        // Log special missile to blockchain
        if (isSpecialShot) {
            if (window.blockchainManager) {
                window.blockchainManager.logAction('FireSpecialMissile');
            }
        } else {
            if (window.blockchainManager) {
                window.blockchainManager.logAction('FireMissile');
            }
        }
        
        // Create missile group for better organization
        const missileGroup = new THREE.Group();
        
        // Position at rocket tip
        const rocketWorldPos = new THREE.Vector3();
        this.rocket.getWorldPosition(rocketWorldPos);
        const rocketDir = new THREE.Vector3(0, 0, -1);
        rocketDir.applyQuaternion(this.rocket.quaternion);
        
        missileGroup.position.copy(rocketWorldPos).add(rocketDir.multiplyScalar(1.5));
        missileGroup.quaternion.copy(this.rocket.quaternion);
        
        // Create basic or special missile depending on the shot count
        if (isSpecialShot) {
            // Create special missile
            this.createSpecialMissile(missileGroup);
        } else {
            // Create regular missile
            this.createRegularMissile(missileGroup);
        }
        
        // Set velocity (consistent direction)
        missileGroup.velocity = rocketDir.normalize().multiplyScalar(this.settings.missileSpeed);
        
        // Special missiles move slightly faster
        if (isSpecialShot) {
            missileGroup.velocity.multiplyScalar(1.3);
        }
        
        // Add to scene and missiles array - pre-add so we don't have lag when firing
        this.scene.add(missileGroup);
        this.missiles.push(missileGroup);
        
        // Create missile trail right away
        this.createParticleTrail(missileGroup.position.clone(), isSpecialShot ? 0xff00ff : 0x00ffff);
    }

    createRegularMissile(missileGroup) {
        // Create the missile body
        const missileGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const missileMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00aaaa
        });
        
        const missileBody = new THREE.Mesh(missileGeometry, missileMaterial);
        missileBody.rotation.x = Math.PI / 2;
        missileGroup.add(missileBody);
        
        // Add fins
        const finGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.15);
        const finMaterial = new THREE.MeshPhongMaterial({
            color: 0x00cccc
        });
        
        // Add 4 fins around the missile
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.y = -0.2;
            fin.rotation.z = (Math.PI / 2) * i;
            missileBody.add(fin);
        }
        
        // Add missile light
        const missileLight = new THREE.PointLight(0x00ffff, 1, 2);
        missileLight.position.y = 0.3;
        missileGroup.add(missileLight);
        
        // Add missile type for collision detection
        missileGroup.missileType = 'regular';
        
        return missileGroup;
    }

    createSpecialMissile(missileGroup) {
        // Create a larger, more powerful-looking missile
        const missileGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
        const missileMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0xaa00aa
        });
        
        const missileBody = new THREE.Mesh(missileGeometry, missileMaterial);
        missileBody.rotation.x = Math.PI / 2;
        missileGroup.add(missileBody);
        
        // Add special missile head (cone shape)
        const headGeometry = new THREE.ConeGeometry(0.12, 0.25, 8);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0xaa00aa,
            metalness: 0.5
        });
        
        const missileHead = new THREE.Mesh(headGeometry, headMaterial);
        missileHead.rotation.x = -Math.PI / 2;
        missileHead.position.y = 0.45;
        missileBody.add(missileHead);
        
        // Add larger fins
        const finGeometry = new THREE.BoxGeometry(0.25, 0.02, 0.2);
        const finMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff
        });
        
        // Add 4 fins around the missile
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.y = -0.3;
            fin.rotation.z = (Math.PI / 2) * i;
            missileBody.add(fin);
        }
        
        // Add more powerful light
        const missileLight = new THREE.PointLight(0xff00ff, 2, 4);
        missileLight.position.y = 0.3;
        missileGroup.add(missileLight);
        
        // Add pulse effect for special missile
        const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.4
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        missileGroup.add(glow);
        
        // Store glow for animation
        missileGroup.glow = glow;
        missileGroup.glowTime = 0;
        
        // Add missile type for collision detection and damage calculation
        missileGroup.missileType = 'special';
        
        return missileGroup;
    }

    createParticleTrail(position, color) {
        const particles = [];
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.2;
            particle.position.y += (Math.random() - 0.5) * 0.2;
            particle.position.z += (Math.random() - 0.5) * 0.2;
            
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            particle.life = 1.0;
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        this.particleGroups.push({
            particles: particles,
            color: color
        });
    }

    createExplosion(position, color = 0xff8800, count = 30) {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.9
                })
            );
            
            particle.position.copy(position);
            
            // Random velocity in all directions
            const speed = 0.5 + Math.random() * 1.5;
            const direction = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize();
            
            particle.velocity = direction.multiplyScalar(speed);
            particle.life = 1.0;
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Create explosion light
        const light = new THREE.PointLight(color, 2, 10);
        light.position.copy(position);
        this.scene.add(light);
        
        // Fade out and remove light
        const lightData = {
            light: light,
            life: 1.0
        };
        
        particles.push(lightData);
        
        this.particleGroups.push({
            particles: particles,
            color: color
        });

        // If explosion is close to the mothership and the mothership has health,
        // create a damage effect on the mothership surface
        if (this.mothership && this.mothership.health > 0 && 
            position.distanceTo(this.mothership.position) < 5) {
            
            // Direction from mothership center to explosion
            const direction = new THREE.Vector3().subVectors(position, this.mothership.position).normalize();
            
            // Create a damage mark on the mothership
            const damageGeometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 8, 8);
            const damageMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            });
            
            const damageMark = new THREE.Mesh(damageGeometry, damageMaterial);
            
            // Position on mothership surface in the direction of the explosion
            damageMark.position.copy(direction.multiplyScalar(4));
            
            // Randomly rotate for variety
            damageMark.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            // Add to mothership
            this.mothership.add(damageMark);
            
            // Store for fading out
            this.damageEffects.push({
                mesh: damageMark,
                life: 10.0 // Damage marks stay for a while
            });
        }
    }

    updateParticles(deltaTime) {
        // Update particle groups
        for (let g = this.particleGroups.length - 1; g >= 0; g--) {
            const group = this.particleGroups[g];
            let allDead = true;
            
            for (let i = group.particles.length - 1; i >= 0; i--) {
                const particle = group.particles[i];
                
                // If it's a light (has no geometry)
                if (particle.light) {
                    particle.life -= deltaTime * 2;
                    particle.light.intensity = particle.life * 2;
                    
                    if (particle.life <= 0) {
                        this.scene.remove(particle.light);
                        group.particles.splice(i, 1);
                    } else {
                        allDead = false;
                    }
                    continue;
                }
                
                // Regular particle
                if (particle.velocity) {
                    particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 10));
                }
                
                particle.life -= deltaTime * 2;
                
                // Update size and opacity
                const scale = particle.life * 0.5 + 0.5;
                particle.scale.set(scale, scale, scale);
                particle.material.opacity = particle.life;
                
                if (particle.life <= 0) {
                    this.scene.remove(particle);
                    group.particles.splice(i, 1);
                } else {
                    allDead = false;
                }
            }
            
            // Remove empty groups
            if (allDead) {
                this.particleGroups.splice(g, 1);
            }
        }
    }

    updateMissiles(deltaTime) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            
            // Move missile in a straight line
            missile.position.add(missile.velocity.clone().multiplyScalar(deltaTime * 20));
            
            // Update special missile glow effect
            if (missile.missileType === 'special' && missile.glow) {
                missile.glowTime += deltaTime * 5;
                const pulseFactor = 0.8 + Math.sin(missile.glowTime) * 0.2;
                missile.glow.scale.set(pulseFactor, pulseFactor, pulseFactor);
                missile.glow.material.opacity = 0.3 + Math.sin(missile.glowTime * 2) * 0.1;
                
                // Create additional trail particles for special missiles
                if (Math.random() < 0.4) {
                    this.createParticleTrail(missile.position.clone(), 0xff00ff);
                }
            }
            
            // Check if missile is out of bounds
            if (missile.position.z < -60) {
                this.scene.remove(missile);
                this.missiles.splice(i, 1);
                continue;
            }
            
            // Check for collision with mothership
            if (this.mothership && this.mothership.health > 0 &&
                missile.position.distanceTo(this.mothership.position) < 5) {
                
                // Remove the missile
                if (missile.missileType === 'special') {
                    // Create larger explosion for special missiles
                    this.createExplosion(missile.position.clone(), 0xff00ff, 50);
                } else {
                    // Create regular explosion
                    this.createExplosion(missile.position.clone(), 0xff8800, 30);
                }
                
                // Calculate damage based on missile type
                const damage = missile.missileType === 'special' ? 25 : 10;
                
                // Flash the mothership red when hit
                if (this.mothership.material) {
                    this.mothership.material.emissive.setHex(0xff0000);
                    setTimeout(() => {
                        if (this.mothership && this.mothership.material) {
                            const colorScheme = this.mothershipColors[this.currentMothershipColorIndex];
                            this.mothership.material.emissive.setHex(colorScheme.emissive);
                        }
                    }, 100);
                }
                
                // Mothership takes damage
                this.mothership.health -= damage;
                
                // Update health bar
                const healthPercent = this.mothership.health / this.mothership.maxHealth;
                this.mothershipHealthBar.scale.x = Math.max(0.1, healthPercent);
                this.mothershipHealthBar.material.color.setHex(
                    healthPercent > 0.6 ? 0x00ff00 : (healthPercent > 0.3 ? 0xffff00 : 0xff0000)
                );
                
                // Create damage particle effect
                const damagePos = new THREE.Vector3().copy(missile.position);
                this.createExplosion(damagePos, 0xff00ff, 15);
                
                // Show damage visually on the mothership
                if (this.mothership.health <= 75 && this.mothership.health > 50) {
                    this.showDamageOnMothership(1);
                } else if (this.mothership.health <= 50 && this.mothership.health > 25) {
                    this.showDamageOnMothership(2);
                } else if (this.mothership.health <= 25 && this.mothership.health > 0) {
                    this.showDamageOnMothership(3);
                }
                
                if (this.mothership.health <= 0) {
                    // Call our mothership destroyed handler
                    this.handleMothershipDestroyed();
                }
                
                // Log transaction to blockchain for significant events
                if (missile.missileType === 'special' || this.mothership.health <= 0 || 
                    (this.mothership.health / this.mothership.maxHealth) <= 0.5) {
                    // Only log significant damage to reduce transaction volume
                    if (window.blockchainManager) {
                        window.blockchainManager.logAction(`DamagedMothership_Health_${Math.round(this.mothership.health)}`);
                    }
                }
                
                // Add score - more for special missiles
                this.addScore(missile.missileType === 'special' ? 30 : 10);
                
                // Remove the missile
                this.scene.remove(missile);
                this.missiles.splice(i, 1);
                i--;
                continue;
            }
            
            // Check for collision with asteroids
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                const hitDistance = missile.missileType === 'special' ? 2.5 : 1.5;
                
                if (missile.position.distanceTo(asteroid.position) < hitDistance) {
                    // Explosion at collision point
                    const explosionColor = missile.missileType === 'special' ? 0xff00ff : 0xff8800;
                    const explosionSize = missile.missileType === 'special' ? 40 : 20;
                    this.createExplosion(asteroid.position.clone(), explosionColor, explosionSize);
                    
                    // Remove missile and asteroid
                    this.scene.remove(missile);
                    this.missiles.splice(i, 1);
                    
                    this.scene.remove(asteroid);
                    this.asteroids.splice(j, 1);
                    
                    // Log asteroid destruction to blockchain
                    if (window.blockchainManager) {
                        window.blockchainManager.logAction(missile.missileType === 'special' 
                            ? 'DestroyAsteroid_Special' 
                            : 'DestroyAsteroid');
                    }
                    
                    // Add score - more for special missiles
                    this.addScore(missile.missileType === 'special' ? 15 : 5);
                    break;
                }
            }
        }
    }

    updateAsteroids(deltaTime) {
        // Maybe spawn new asteroid
        if (Math.random() < this.settings.asteroidSpawnRate) {
            this.createAsteroid();
        }
        
        // Update existing asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            // Move asteroid
            asteroid.position.add(asteroid.velocity.clone().multiplyScalar(deltaTime * 20));
            
            // Rotate asteroid
            asteroid.rotation.x += asteroid.rotationSpeed.x;
            asteroid.rotation.y += asteroid.rotationSpeed.y;
            asteroid.rotation.z += asteroid.rotationSpeed.z;
            
            // Check if asteroid is behind the camera
            if (asteroid.position.z > 15) {
                this.scene.remove(asteroid);
                this.asteroids.splice(i, 1);
                continue;
            }
            
            // Check for collision with rocket
            if (asteroid.position.distanceTo(this.rocket.position) < 1.5) {
                // Game over
                this.gameOver();
                break;
            }
        }
    }

    updateMothership(deltaTime) {
        const time = performance.now() * 0.001;
        
        // Make mothership pulse
        this.mothershipLight.intensity = 1.5 + Math.sin(time * 3) * 0.5;
        
        // Slow rotation
        this.mothership.rotation.y += deltaTime * 0.1;
        
        // Subtle motion
        this.mothership.position.y = Math.sin(time * 0.5) * 1.5;
        
        // Update health bar
        const healthPercent = this.mothership.health / this.mothership.maxHealth;
        this.mothershipHealthBar.scale.x = healthPercent;
        
        // Change health bar color based on remaining health
        if (healthPercent > 0.6) {
            this.mothershipHealthBar.material.color.setHex(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
            this.mothershipHealthBar.material.color.setHex(0xffff00); // Yellow
        } else {
            this.mothershipHealthBar.material.color.setHex(0xff0000); // Red
        }
        
        // Update damage effects
        for (let i = this.damageEffects.length - 1; i >= 0; i--) {
            const effect = this.damageEffects[i];
            effect.life -= deltaTime;
            
            if (effect.life <= 0) {
                this.mothership.remove(effect.mesh);
                this.damageEffects.splice(i, 1);
            }
        }
        
        // Fire turrets
        this.updateTurrets(deltaTime);
    }

    updateTurrets(deltaTime) {
        const now = performance.now();
        const rocketPosition = this.rocket.position.clone();
        
        this.turrets.forEach(turret => {
            if (turret.health <= 0) return; // Skip destroyed turrets
            
            // Make turrets track the rocket
            turret.base.lookAt(rocketPosition);
            
            // Randomly fire at the player
            if (now - turret.lastFire > turret.fireRate) {
                turret.lastFire = now;
                
                // Create turret laser
                this.fireTurretLaser(turret);
            }
        });
    }

    fireTurretLaser(turret) {
        // Get the position and direction of the turret cannon
        const position = new THREE.Vector3();
        turret.cannon.getWorldPosition(position);
        
        const direction = new THREE.Vector3();
        const cannonQuaternion = new THREE.Quaternion();
        turret.cannon.getWorldQuaternion(cannonQuaternion);
        direction.set(0, 0, -1).applyQuaternion(cannonQuaternion);
        
        // Create laser beam
        const laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 10, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.7
        });
        
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.position.copy(position);
        laser.position.add(direction.multiplyScalar(5)); // Position in front of cannon
        
        // Point in the direction of fire
        laser.quaternion.copy(cannonQuaternion);
        laser.rotation.x += Math.PI / 2; // Adjust to align with direction
        
        // Add laser light
        const laserLight = new THREE.PointLight(0xff00ff, 1, 5);
        laser.add(laserLight);
        
        // Add to scene
        this.scene.add(laser);
        
        // Set velocity
        laser.velocity = direction.normalize().multiplyScalar(1.5);
        laser.life = 2.0; // Seconds to live
        
        // Store for update
        if (!this.turretLasers) this.turretLasers = [];
        this.turretLasers.push(laser);
    }

    updateTurretLasers(deltaTime) {
        if (!this.turretLasers) return;
        
        for (let i = this.turretLasers.length - 1; i >= 0; i--) {
            const laser = this.turretLasers[i];
            
            // Move laser
            laser.position.add(laser.velocity.clone().multiplyScalar(deltaTime * 20));
            
            // Update life
            laser.life -= deltaTime;
            
            // Check if laser hits rocket
            if (laser.position.distanceTo(this.rocket.position) < 1.5) {
                this.createExplosion(laser.position.clone(), 0xff00ff, 20);
                this.scene.remove(laser);
                this.turretLasers.splice(i, 1);
                
                // Game over if hit by laser
                this.gameOver();
                continue;
            }
            
            // Remove expired lasers
            if (laser.life <= 0) {
                this.scene.remove(laser);
                this.turretLasers.splice(i, 1);
            }
        }
    }

    handleKeyDown(event) {
        this.keysPressed[event.key] = true;
        
        // Log movement to blockchain (will be throttled by the blockchain manager)
        if (window.blockchainManager) {
            if (['a', 'A', 'ArrowLeft'].includes(event.key)) {
                window.blockchainManager.logAction('MoveLeft');
            } else if (['d', 'D', 'ArrowRight'].includes(event.key)) {
                window.blockchainManager.logAction('MoveRight');
            } else if (['w', 'W', 'ArrowUp'].includes(event.key)) {
                window.blockchainManager.logAction('MoveUp');
            } else if (['s', 'S', 'ArrowDown'].includes(event.key)) {
                window.blockchainManager.logAction('MoveDown');
            } else if (event.key === ' ') {
                window.blockchainManager.logAction('FireMissile');
                this.fireMissile(); // Actually fire the missile
            }
        }
    }

    handleKeyUp(event) {
        this.keysPressed[event.key] = false;
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }

    updateRocketPosition(deltaTime) {
        const speed = this.settings.rocketSpeed * 15 * deltaTime;
        let moved = false;
        let thrusterPower = 1.0; // Base thruster power when not moving
        
        // Move up
        if (this.keysPressed['w'] || this.keysPressed['W'] || this.keysPressed['ArrowUp']) {
            this.rocket.position.y += speed;
            moved = true;
            thrusterPower = 1.5; // More thrust when moving
        }
        
        // Move down
        if (this.keysPressed['s'] || this.keysPressed['S'] || this.keysPressed['ArrowDown']) {
            this.rocket.position.y -= speed;
            moved = true;
            thrusterPower = 1.5;
        }
        
        // Move left
        if (this.keysPressed['a'] || this.keysPressed['A'] || this.keysPressed['ArrowLeft']) {
            this.rocket.position.x -= speed;
            moved = true;
            // Tilt rocket slightly when moving
            this.rocket.rotation.z = Math.min(this.rocket.rotation.z + 0.1, 0.3);
            thrusterPower = 1.5;
        } else if (this.rocket.rotation.z > 0) {
            this.rocket.rotation.z = Math.max(this.rocket.rotation.z - 0.1, 0);
        }
        
        // Move right
        if (this.keysPressed['d'] || this.keysPressed['D'] || this.keysPressed['ArrowRight']) {
            this.rocket.position.x += speed;
            moved = true;
            // Tilt rocket slightly when moving
            this.rocket.rotation.z = Math.max(this.rocket.rotation.z - 0.1, -0.3);
            thrusterPower = 1.5;
        } else if (this.rocket.rotation.z < 0) {
            this.rocket.rotation.z = Math.min(this.rocket.rotation.z + 0.1, 0);
        }
        
        // Clamp position within bounds but allow more movement
        this.rocket.position.x = THREE.MathUtils.clamp(this.rocket.position.x, -25, 25);
        this.rocket.position.y = THREE.MathUtils.clamp(this.rocket.position.y, -15, 15);
        
        // Update flame effect with appropriate thruster power
        this.updateFlameEffect(deltaTime, thrusterPower);
        
        return moved;
    }

    updateFlameEffect(deltaTime, thrusterPower = 1.0) {
        const time = performance.now() * 0.003;
        
        // Animate core flames
        this.flameSystem.coreParticles.forEach((core, i) => {
            // Pulse size based on time and individual factor
            const pulseScale = core.baseScale * (0.8 + 0.4 * Math.sin(time * 15 + core.pulseFactor) * Math.random());
            const lengthScale = thrusterPower * (1.0 + 0.3 * Math.sin(time * 10));
            
            core.scale.set(pulseScale, lengthScale, pulseScale);
            
            // Color shift from white to yellow
            const hue = 0.12 - 0.03 * Math.sin(time * 20 + i);
            const saturation = 0.8 + 0.2 * Math.sin(time * 15);
            core.material.color.setHSL(hue, saturation, 0.8);
        });
        
        // Animate outer flames
        this.flameSystem.outerParticles.forEach((outer, i) => {
            if (outer.geometry.type === 'ConeGeometry') {
                // For the cone flames
                const pulseScale = outer.baseScale * (0.7 + 0.5 * Math.sin(time * 10 + outer.pulseFactor) * Math.random());
                const lengthScale = thrusterPower * (1.0 + 0.5 * Math.sin(time * 8 + i));
                
                outer.scale.set(pulseScale, lengthScale, pulseScale);
                
                // Color shift between orange and red
                const hue = 0.05 - 0.05 * Math.sin(time * 12 + i);
                const saturation = 0.9;
                const lightness = 0.5 + 0.2 * Math.sin(time * 8);
                outer.material.color.setHSL(hue, saturation, lightness);
            } else {
                // For the glow spheres
                const glowScale = 0.8 + 0.4 * Math.sin(time * 20 + i);
                outer.scale.set(glowScale, glowScale, glowScale);
                
                // Pulse opacity
                outer.material.opacity = 0.3 + 0.2 * Math.sin(time * 15 + i);
            }
        });
        
        // Pulse the engine lights for stronger effect
        this.engineLights.forEach((light, i) => {
            light.intensity = thrusterPower * (1.5 + Math.sin(time * 30 + i * 2) * 0.5 + Math.random() * 0.5);
            
            // Change colors slightly
            const hue = (time * 0.1 + i * 0.1) % 1.0;
            light.color.setHSL(hue, 0.5, 0.5);
        });
    }

    updateCamera(deltaTime) {
        // Set up a better third-person view that shows the rocket and some space ahead
        const rocketPosition = this.rocket.position.clone();
        
        // Calculate camera position behind and slightly above the rocket
        const cameraOffset = new THREE.Vector3(0, 4, 12); // Higher up and further back
        
        // Target position should be ahead of the rocket to see what's coming
        const lookAheadDistance = 20;
        const targetPosition = new THREE.Vector3(
            rocketPosition.x * 0.5, // Look somewhat toward center to see mothership
            rocketPosition.y * 0.5,
            rocketPosition.z - lookAheadDistance
        );
        
        // Smooth camera movement
        this.camera.position.lerp(
            new THREE.Vector3(
                rocketPosition.x + cameraOffset.x,
                rocketPosition.y + cameraOffset.y,
                rocketPosition.z + cameraOffset.z
            ),
            deltaTime * 3
        );
        
        // Look at target position
        this.camera.lookAt(targetPosition);
        
        // Slightly tilt the camera based on rocket movement for dynamic feel
        const tiltFactor = 0.02;
        
        if (this.keysPressed['a'] || this.keysPressed['A'] || this.keysPressed['ArrowLeft']) {
            this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, tiltFactor, deltaTime * 3);
        } else if (this.keysPressed['d'] || this.keysPressed['D'] || this.keysPressed['ArrowRight']) {
            this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, -tiltFactor, deltaTime * 3);
        } else {
            this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, 0, deltaTime * 3);
        }
    }

    addScore(points) {
        this.score += points;
        this.updateScore();
    }
    
    updateScore() {
        // Update the score display
        this.scoreElement.textContent = `Score: ${this.score}`;
        
        // Update the leaderboard if available
        if (window.leaderboardManager && window.leaderboardManager.currentUser) {
            window.leaderboardManager.updateUserScore(this.score);
        }
    }

    gameOver() {
        this.gameRunning = false;
        
        // Display game over screen
        this.gameOverElement.style.display = 'block';
        this.finalScoreElement.textContent = this.score;
        
        // Update leaderboard with final score if username exists
        if (window.leaderboardManager && window.leaderboardManager.currentUser) {
            window.leaderboardManager.updateUserScore(this.score);
        } else if (window.leaderboardManager) {
            // If no username, prompt for one now
            window.leaderboardManager.showUsernamePrompt();
        }
        
        // Log game over to blockchain with score
        if (window.blockchainManager) {
            window.blockchainManager.logAction(`GameOver_Score_${this.score}`);
        }
        
        // Add a share on Twitter button if using blockchain
        if (window.blockchainManager) {
            // Check if the button already exists
            if (!document.getElementById('share-button')) {
                const shareButton = document.createElement('button');
                shareButton.id = 'share-button';
                shareButton.textContent = 'Share on Twitter';
                shareButton.style.marginTop = '10px';
                shareButton.style.backgroundColor = '#1DA1F2';  // Twitter blue
                shareButton.addEventListener('click', () => {
                    const finalScore = this.score;
                    window.blockchainManager.shareOnTwitter(finalScore);
                });
                
                this.gameOverElement.appendChild(shareButton);
            }
        }
    }

    restart() {
        // Check if we have a username before restarting
        if (window.leaderboardManager && !window.leaderboardManager.currentUser) {
            window.leaderboardManager.showUsernamePrompt();
            return; // Don't restart until we have a username
        }
        
        // Reset game state
        this.score = 0;
        this.scoreElement.textContent = 'Score: 0';
        this.gameOverElement.style.display = 'none';
        
        // Reset rocket position
        this.rocket.position.set(0, 0, 5);
        this.rocket.rotation.set(Math.PI / 2, 0, 0);
        
        // Clear asteroids
        for (const asteroid of this.asteroids) {
            this.scene.remove(asteroid);
        }
        this.asteroids = [];
        
        // Clear missiles
        for (const missile of this.missiles) {
            this.scene.remove(missile);
        }
        this.missiles = [];
        
        // Clear particles
        for (const group of this.particleGroups) {
            for (const particle of group.particles) {
                if (particle.light) {
                    this.scene.remove(particle.light);
                } else {
                    this.scene.remove(particle);
                }
            }
        }
        this.particleGroups = [];
        
        // Reset mothership
        this.mothership.health = 100;
        this.mothership.position.set(0, 0, -40);
        
        // Change the mothership color
        this.changeMothershipColor();
        
        // Restart game
        this.gameRunning = true;
        this.animate();
    }

    animate(time) {
        if (!this.gameRunning) return;
        
        requestAnimationFrame((t) => this.animate(t));
        
        if (!this.lastTime) {
            this.lastTime = time;
            return;
        }
        
        // Calculate delta time
        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        
        // Update game speed - increase faster over time
        this.settings.gameSpeed = Math.min(
            this.settings.gameSpeed + this.settings.gameSpeedIncrease * deltaTime * 60, 
            this.settings.maxGameSpeed
        );
        
        // Update asteroid spawn rate based on game speed
        this.settings.asteroidSpawnRate = 0.08 + (this.settings.gameSpeed - 1) * 0.08;
        
        // Increase asteroid speed with game speed
        this.settings.asteroidSpeed = 0.7 + (this.settings.gameSpeed - 1) * 0.5;
        
        // Check for spacebar (missile firing)
        if (this.keysPressed[' ']) {
            this.fireMissile();
        }
        
        // Update rocket position
        this.updateRocketPosition(deltaTime);
        
        // Update stars
        this.updateStars(deltaTime);
        
        // Update missiles
        this.updateMissiles(deltaTime);
        
        // Update turret lasers
        this.updateTurretLasers(deltaTime);
        
        // Update asteroids
        this.updateAsteroids(deltaTime);
        
        // Update mothership
        this.updateMothership(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update camera
        this.updateCamera(deltaTime);
        
        // Add score based on time and game speed
        if (Math.random() < 0.1 * this.settings.gameSpeed) {
            this.addScore(1);
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }

    // Create sunset gradient background
    createSunsetGradient() {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        
        const context = canvas.getContext('2d');
        
        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#120036'); // Deep space purple
        gradient.addColorStop(0.3, '#3b0f6b'); // Mid purple
        gradient.addColorStop(0.6, '#cf3476'); // Pinkish-purple
        gradient.addColorStop(0.8, '#ff6b95'); // Sunset pink
        gradient.addColorStop(1, '#3b0f6b'); // Back to purple at the bottom
        
        // Fill with gradient
        context.fillStyle = gradient;
        context.fillRect(0, 0, 2, 512);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }

    // When mothership is destroyed
    handleMothershipDestroyed() {
        // Add a big score boost
        this.score += 5000;
        this.updateScore();
        
        // Create a massive explosion effect
        this.createExplosion(this.mothership.position.clone(), 0xff00ff, 150);
        
        // Add additional explosion effects in a sequence for dramatic effect
        setTimeout(() => {
            if (this.gameRunning) {
                const offset1 = new THREE.Vector3(this.mothership.position.x + 2, this.mothership.position.y - 1, this.mothership.position.z);
                this.createExplosion(offset1, 0xff6600, 60);
            }
        }, 200);
        
        setTimeout(() => {
            if (this.gameRunning) {
                const offset2 = new THREE.Vector3(this.mothership.position.x - 3, this.mothership.position.y + 2, this.mothership.position.z + 1);
                this.createExplosion(offset2, 0xffff00, 80);
            }
        }, 400);
        
        setTimeout(() => {
            if (this.gameRunning) {
                const offset3 = new THREE.Vector3(this.mothership.position.x, this.mothership.position.y, this.mothership.position.z - 2);
                this.createExplosion(offset3, 0x00ffff, 100);
            }
        }, 600);
        
        // Create a shockwave effect
        this.createShockwave(this.mothership.position.clone());
        
        // Show a large on-screen message
        this.showMothershipDestroyedMessage();
        
        // Log action to blockchain
        if (window.blockchainManager) {
            window.blockchainManager.logAction(`DestroyedMothership_Score_${this.score}`);
        }
        
        // Hide the mothership briefly
        this.mothership.visible = false;
        
        // Remove all damage effects
        for (const effect of this.damageEffects) {
            this.mothership.remove(effect.mesh);
        }
        this.damageEffects = [];
        
        // Wait a moment then respawn the mothership
        setTimeout(() => {
            if (this.gameRunning) {
                // Reset mothership health and position
                this.mothership.health = this.mothership.maxHealth;
                const z = Math.random() * -30 - 30; // Random position between -30 and -60
                this.mothership.position.set(0, 0, z);
                
                // Reset health bar
                this.mothershipHealthBar.scale.x = 1;
                this.mothershipHealthBar.material.color.setHex(0x00ff00);
                
                // Make visible again
                this.mothership.visible = true;
                
                // Change mothership color
                this.changeMothershipColor();
            }
        }, 2000);
    }

    // Create a shockwave effect
    createShockwave(position) {
        const geometry = new THREE.RingGeometry(0.1, 0.5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2; // Align with the horizontal plane
        this.scene.add(ring);
        
        // Animation parameters
        const duration = 1.5; // seconds
        const maxScale = 30;
        const startTime = Date.now() / 1000;
        
        // Add to particle groups for animation
        this.particleGroups.push({
            particles: [ring],
            update: (deltaTime) => {
                const elapsedTime = Date.now() / 1000 - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                const scale = progress * maxScale;
                ring.scale.set(scale, scale, scale);
                
                // Fade out as it expands
                material.opacity = 0.7 * (1 - progress);
                
                // Remove when animation completes
                if (progress >= 1) {
                    this.scene.remove(ring);
                    return true; // Signal to remove this group
                }
                
                return false;
            }
        });
    }
    
    // Show a message when mothership is destroyed
    showMothershipDestroyedMessage() {
        const message = document.createElement('div');
        message.style.position = 'absolute';
        message.style.top = '40%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = '#ff00ff';
        message.style.fontSize = '50px';
        message.style.fontWeight = 'bold';
        message.style.textShadow = '0 0 10px #ff00ff, 0 0 20px #ff00ff';
        message.style.zIndex = '1000';
        message.style.transition = 'opacity 0.5s';
        message.style.textAlign = 'center';
        message.style.pointerEvents = 'none'; // Don't interfere with gameplay
        message.innerText = 'MOTHERSHIP DESTROYED!';
        message.id = 'mothership-destroyed-message';
        
        // Add points message
        const pointsMessage = document.createElement('div');
        pointsMessage.style.fontSize = '30px';
        pointsMessage.style.color = '#ffcc00';
        pointsMessage.style.marginTop = '10px';
        pointsMessage.innerText = '+5000 POINTS';
        
        message.appendChild(pointsMessage);
        document.getElementById('game-container').appendChild(message);
        
        // Fade out and remove after a few seconds
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                const existingMessage = document.getElementById('mothership-destroyed-message');
                if (existingMessage) {
                    existingMessage.remove();
                }
            }, 500);
        }, 2500);
    }

    // Show visible damage on the mothership
    showDamageOnMothership(damageLevel) {
        // Check if we've already added damage effects for this level
        if (this.damageEffects.some(effect => effect.level === damageLevel)) {
            return;
        }
        
        // Create damage geometries based on damage level
        const damageCount = damageLevel * 2;
        
        for (let i = 0; i < damageCount; i++) {
            // Create random position on mothership surface
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            const x = 4 * Math.sin(theta) * Math.cos(phi);
            const y = 4 * Math.sin(theta) * Math.sin(phi);
            const z = 4 * Math.cos(theta);
            
            // Create a "damage crater" geometry
            const craterSize = 0.5 + Math.random() * 0.7;
            const craterGeometry = new THREE.SphereGeometry(craterSize, 8, 8);
            const craterMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const crater = new THREE.Mesh(craterGeometry, craterMaterial);
            crater.position.set(x, y, z);
            
            // Rotate to face outward from sphere center
            crater.lookAt(0, 0, 0);
            
            // Push slightly inward
            crater.position.multiplyScalar(0.9);
            
            this.mothership.add(crater);
            
            // Add to damage effects
            this.damageEffects.push({
                mesh: crater,
                level: damageLevel
            });
            
            // Add glow effect at damage site
            const glowGeometry = new THREE.SphereGeometry(craterSize * 1.2, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.4,
                side: THREE.FrontSide
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(crater.position);
            glow.position.multiplyScalar(1.05);
            this.mothership.add(glow);
            
            this.damageEffects.push({
                mesh: glow,
                level: damageLevel
            });
        }
    }
}

// Start the game when the page is loaded
window.addEventListener('load', () => {
    // Create the game instance and make it globally accessible
    window.spaceRunner = new SpaceRunner();
    
    // Wait briefly to ensure leaderboard manager is initialized
    setTimeout(() => {
        // If leaderboard is enabled and no username is set, pause the game and show username prompt
        if (window.leaderboardManager && !window.leaderboardManager.currentUser) {
            if (window.spaceRunner.gameRunning) {
                window.spaceRunner.gameRunning = false;
                window.leaderboardManager.showUsernamePrompt();
            }
        }
    }, 500);
}); 