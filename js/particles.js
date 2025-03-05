/**
 * Particles.js
 * Handles all particle effects in the game
 */
class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = [];
    }
    
    /**
     * Create a particle texture - can be reused by multiple systems
     */
    createParticleTexture(color = 0xffffff) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        
        // Convert hex color to RGB
        const r = (color >> 16 & 255);
        const g = (color >> 8 & 255);
        const b = (color & 255);
        
        gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 1)`);
        gradient.addColorStop(0.7, `rgba(${r*0.5}, ${g*0.5}, ${b*0.5}, 0.5)`);
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    /**
     * Create stars that float by for a parallax effect
     */
    createStarfieldParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Create star field in a large box
        const boxSize = 2000;
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random positions in a large cube
            positions[i3] = (Math.random() - 0.5) * boxSize;
            positions[i3 + 1] = (Math.random() - 0.5) * boxSize;
            positions[i3 + 2] = (Math.random() - 0.5) * boxSize;
            
            // Vary star colors slightly
            const shade = 0.7 + Math.random() * 0.3;
            if (Math.random() > 0.8) {
                // Blue stars
                colors[i3] = 0.5 * shade;
                colors[i3 + 1] = 0.5 * shade;
                colors[i3 + 2] = 1.0 * shade;
            } else if (Math.random() > 0.8) {
                // Yellow stars
                colors[i3] = 1.0 * shade;
                colors[i3 + 1] = 0.9 * shade;
                colors[i3 + 2] = 0.5 * shade;
            } else if (Math.random() > 0.8) {
                // Red stars
                colors[i3] = 1.0 * shade;
                colors[i3 + 1] = 0.3 * shade;
                colors[i3 + 2] = 0.2 * shade;
            } else {
                // White stars
                colors[i3] = 1.0 * shade;
                colors[i3 + 1] = 1.0 * shade;
                colors[i3 + 2] = 1.0 * shade;
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create material with custom size based on star brightness
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);
        
        // Store for updates
        this.particleSystems.push({
            system: particleSystem,
            type: 'starfield',
            positions: positions,
            created: Date.now()
        });
        
        return particleSystem;
    }
    
    /**
     * Create dust particles that flow past the player
     */
    createDustParticles() {
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Create dust box ahead of player
        const boxWidth = 200;
        const boxHeight = 100;
        const boxDepth = 500;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * boxWidth;
            positions[i3 + 1] = (Math.random() - 0.5) * boxHeight;
            positions[i3 + 2] = Math.random() * boxDepth;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create material with dust texture
        const dustTexture = this.createParticleTexture(0xaaaaff);
        const material = new THREE.PointsMaterial({
            size: 1,
            map: dustTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);
        
        // Store velocities for movement
        const velocities = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Dust mainly moves backward relative to player
            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 2] = -0.3 - Math.random() * 0.5;
        }
        
        // Store for updates
        this.particleSystems.push({
            system: particleSystem,
            type: 'dust',
            positions: positions,
            velocities: velocities,
            boxWidth: boxWidth,
            boxHeight: boxHeight,
            boxDepth: boxDepth,
            created: Date.now()
        });
        
        return particleSystem;
    }
    
    /**
     * Create energy trail effect for rocket movement
     */
    createEnergyTrail(position, color) {
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // All particles start at the same position
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create material with energy texture
        const trailTexture = this.createParticleTexture(color);
        const material = new THREE.PointsMaterial({
            size: 2,
            map: trailTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);
        
        // Store velocities for movement
        const velocities = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Trail particles spread outward slightly
            velocities[i3] = (Math.random() - 0.5) * 0.3;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.3;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
        }
        
        // Store for updates with limited lifetime
        this.particleSystems.push({
            system: particleSystem,
            type: 'trail',
            positions: positions,
            velocities: velocities,
            created: Date.now(),
            lifetime: 1000, // 1 second lifetime
            color: color
        });
        
        return particleSystem;
    }
    
    /**
     * Create a shockwave effect at a position
     */
    createShockwave(position, color = 0xffffff, size = 10, duration = 1000) {
        // Create a ring geometry
        const geometry = new THREE.RingGeometry(0.1, 1, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        
        // Orient ring to face the camera
        ring.lookAt(0, 0, -1);
        
        this.scene.add(ring);
        
        // Store for updates with ring-specific properties
        this.particleSystems.push({
            system: ring,
            type: 'shockwave',
            created: Date.now(),
            lifetime: duration,
            maxSize: size,
            color: color
        });
        
        return ring;
    }
    
    /**
     * Create energy projectile particles (for missiles, etc.)
     */
    createProjectileParticles(startPosition, direction, color = 0x00ffff, speed = 3) {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // All particles start at the same position
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = startPosition.x;
            positions[i3 + 1] = startPosition.y;
            positions[i3 + 2] = startPosition.z;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create material with projectile texture
        const projectileTexture = this.createParticleTexture(color);
        const material = new THREE.PointsMaterial({
            size: 1.5,
            map: projectileTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);
        
        // Normalize direction
        const normalizedDir = direction.clone().normalize();
        
        // Store velocities for movement
        const velocities = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Main movement in the direction
            velocities[i3] = normalizedDir.x * speed + (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = normalizedDir.y * speed + (Math.random() - 0.5) * 0.1;
            velocities[i3 + 2] = normalizedDir.z * speed + (Math.random() - 0.5) * 0.1;
        }
        
        // Store for updates with limited lifetime
        this.particleSystems.push({
            system: particleSystem,
            type: 'projectile',
            positions: positions,
            velocities: velocities,
            created: Date.now(),
            lifetime: 2000, // 2 second lifetime
            color: color
        });
        
        return particleSystem;
    }
    
    /**
     * Update all particle systems
     */
    update(deltaTime, playerPosition) {
        const currentTime = Date.now();
        
        for (let i = 0; i < this.particleSystems.length; i++) {
            const system = this.particleSystems[i];
            
            // Handle expired systems
            if (system.lifetime && currentTime - system.created > system.lifetime) {
                this.scene.remove(system.system);
                if (system.system.geometry) system.system.geometry.dispose();
                if (system.system.material) system.system.material.dispose();
                this.particleSystems.splice(i, 1);
                i--;
                continue;
            }
            
            // Update different particle types
            switch (system.type) {
                case 'starfield':
                    this.updateStarfield(system, deltaTime, playerPosition);
                    break;
                case 'dust':
                    this.updateDust(system, deltaTime, playerPosition);
                    break;
                case 'trail':
                    this.updateTrail(system, deltaTime);
                    break;
                case 'shockwave':
                    this.updateShockwave(system, deltaTime);
                    break;
                case 'projectile':
                    this.updateProjectile(system, deltaTime);
                    break;
            }
        }
    }
    
    /**
     * Update starfield particles
     */
    updateStarfield(system, deltaTime, playerPosition) {
        // Move the entire system with the player
        system.system.position.z = playerPosition.z;
        
        // Slowly rotate for visual effect
        system.system.rotation.z += 0.00005 * deltaTime;
    }
    
    /**
     * Update dust particles
     */
    updateDust(system, deltaTime, playerPosition) {
        const positions = system.positions;
        const velocities = system.velocities;
        
        // Move the system with the player for optimization
        system.system.position.z = playerPosition.z;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update dust position by velocity
            positions[i3] += velocities[i3] * deltaTime;
            positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
            positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
            
            // Reset particles that go outside the box
            const relativeZ = positions[i3 + 2];
            if (relativeZ < -system.boxDepth / 2) {
                positions[i3] = (Math.random() - 0.5) * system.boxWidth;
                positions[i3 + 1] = (Math.random() - 0.5) * system.boxHeight;
                positions[i3 + 2] = system.boxDepth / 2;
            }
        }
        
        system.system.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Update trail particles
     */
    updateTrail(system, deltaTime) {
        const positions = system.positions;
        const velocities = system.velocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update position by velocity
            positions[i3] += velocities[i3] * deltaTime;
            positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
            positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
        }
        
        system.system.geometry.attributes.position.needsUpdate = true;
        
        // Fade out over lifetime
        const progress = (Date.now() - system.created) / system.lifetime;
        system.system.material.opacity = 0.7 * (1 - progress);
    }
    
    /**
     * Update shockwave effect
     */
    updateShockwave(system, deltaTime) {
        const progress = (Date.now() - system.created) / system.lifetime;
        
        // Scale ring outward
        const scale = system.maxSize * progress;
        system.system.scale.set(scale, scale, scale);
        
        // Fade out
        system.system.material.opacity = 0.7 * (1 - progress);
    }
    
    /**
     * Update projectile particles
     */
    updateProjectile(system, deltaTime) {
        const positions = system.positions;
        const velocities = system.velocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update position by velocity
            positions[i3] += velocities[i3] * deltaTime;
            positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
            positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
        }
        
        system.system.geometry.attributes.position.needsUpdate = true;
        
        // Fade out over lifetime
        const progress = (Date.now() - system.created) / system.lifetime;
        system.system.material.opacity = 0.8 * (1 - progress * progress); // Quadratic fade for smoother look
    }
} 