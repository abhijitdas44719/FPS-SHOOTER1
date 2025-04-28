/**
 * World class that handles terrain and obstacles
 */
class World {
    constructor(scene) {
        this.scene = scene;
        
        // World parameters
        this.worldSize = 500; // Size of the world in units
        this.groundSize = 500; // Size of the ground plane
        
        // Store all obstacles
        this.obstacles = [];
        
        // Create the basic world
        this.createGround();
        this.createBoundary();
        this.createObstacles();
    }
    
    /**
     * Create ground plane
     */
    createGround() {
        // Create ground geometry
        const groundGeometry = new THREE.PlaneGeometry(this.groundSize, this.groundSize);
        
        // Create ground material with grass texture
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a7e1a, // Green for grass
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create ground mesh
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // Rotate to be horizontal and position at origin
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        
        // Allow ground to receive shadows
        ground.receiveShadow = true;
        
        // Add to scene
        this.scene.add(ground);
    }
    
    /**
     * Create boundary walls
     */
    createBoundary() {
        const boundarySize = this.worldSize / 2;
        const wallHeight = 10;
        const wallThickness = 2;
        
        // Create wall material
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Create four walls around the perimeter
        // North wall
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.worldSize, wallHeight, wallThickness),
            wallMaterial
        );
        northWall.position.set(0, wallHeight / 2, -boundarySize);
        northWall.castShadow = true;
        this.scene.add(northWall);
        this.obstacles.push({
            type: 'box',
            position: northWall.position.clone(),
            width: this.worldSize,
            height: wallHeight,
            depth: wallThickness
        });
        
        // South wall
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.worldSize, wallHeight, wallThickness),
            wallMaterial
        );
        southWall.position.set(0, wallHeight / 2, boundarySize);
        southWall.castShadow = true;
        this.scene.add(southWall);
        this.obstacles.push({
            type: 'box',
            position: southWall.position.clone(),
            width: this.worldSize,
            height: wallHeight,
            depth: wallThickness
        });
        
        // East wall
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, this.worldSize),
            wallMaterial
        );
        eastWall.position.set(boundarySize, wallHeight / 2, 0);
        eastWall.castShadow = true;
        this.scene.add(eastWall);
        this.obstacles.push({
            type: 'box',
            position: eastWall.position.clone(),
            width: wallThickness,
            height: wallHeight,
            depth: this.worldSize
        });
        
        // West wall
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, this.worldSize),
            wallMaterial
        );
        westWall.position.set(-boundarySize, wallHeight / 2, 0);
        westWall.castShadow = true;
        this.scene.add(westWall);
        this.obstacles.push({
            type: 'box',
            position: westWall.position.clone(),
            width: wallThickness,
            height: wallHeight,
            depth: this.worldSize
        });
    }
    
    /**
     * Create obstacles in the world (buildings, barriers, etc)
     */
    createObstacles() {
        // Materials for obstacles
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x443322,
            roughness: 0.6,
            metalness: 0.1
        });
        
        const barrierMaterial = new THREE.MeshStandardMaterial({
            color: 0xaa6633,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create a few buildings
        const numBuildings = 25;
        for (let i = 0; i < numBuildings; i++) {
            // Random size and position
            const width = 5 + Math.random() * 10;
            const height = 5 + Math.random() * 15;
            const depth = 5 + Math.random() * 10;
            
            // Position within world bounds (leaving space near center for player spawn)
            let x, z;
            do {
                x = (Math.random() - 0.5) * (this.worldSize - width);
                z = (Math.random() - 0.5) * (this.worldSize - depth);
            } while (Math.sqrt(x*x + z*z) < 20); // Keep buildings away from center
            
            // Create building
            const building = new THREE.Group();
            
            // Building body
            const buildingBody = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, depth),
                buildingMaterial
            );
            buildingBody.position.y = height / 2;
            buildingBody.castShadow = true;
            buildingBody.receiveShadow = true;
            building.add(buildingBody);
            
            // Add a roof
            const roof = new THREE.Mesh(
                new THREE.BoxGeometry(width + 0.5, 1, depth + 0.5),
                roofMaterial
            );
            roof.position.y = height + 0.5;
            roof.castShadow = true;
            building.add(roof);
            
            // Position the building
            building.position.set(x, 0, z);
            
            // Add to scene
            this.scene.add(building);
            
            // Add to obstacles array for collision detection
            this.obstacles.push({
                type: 'box',
                position: new THREE.Vector3(x, height / 2, z),
                width: width,
                height: height,
                depth: depth
            });
        }
        
        // Create some barriers and smaller obstacles
        const numBarriers = 50;
        for (let i = 0; i < numBarriers; i++) {
            // Random size
            const width = 1 + Math.random() * 3;
            const height = 1 + Math.random() * 2;
            const depth = 1 + Math.random() * 3;
            
            // Random position
            const x = (Math.random() - 0.5) * (this.worldSize - width);
            const z = (Math.random() - 0.5) * (this.worldSize - depth);
            
            // Create barrier
            const barrier = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, depth),
                barrierMaterial
            );
            barrier.position.set(x, height / 2, z);
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            
            // Add to scene
            this.scene.add(barrier);
            
            // Add to obstacles array
            this.obstacles.push({
                type: 'box',
                position: barrier.position.clone(),
                width: width,
                height: height,
                depth: depth
            });
        }
    }
    
    /**
     * Check if a position is valid (not inside any obstacle)
     */
    isPositionValid(position, radius = 0.5) {
        // Check each obstacle
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'box') {
                // Simplified box collision check
                const dx = Math.abs(position.x - obstacle.position.x) - (obstacle.width / 2 + radius);
                const dy = Math.abs(position.y - obstacle.position.y) - (obstacle.height / 2);
                const dz = Math.abs(position.z - obstacle.position.z) - (obstacle.depth / 2 + radius);
                
                if (dx < 0 && dy < 0 && dz < 0) {
                    return false; // Inside an obstacle
                }
            }
        }
        
        return true; // Not inside any obstacle
    }
    
    /**
     * Check collision between an entity and the world
     */
    checkCollision(position, movement, radius, height) {
        const result = {
            movement: movement.clone(),
            blocked: { x: false, y: false, z: false },
            onGround: false
        };
        
        // Check collision with ground
        if (position.y + movement.y - height / 2 < 0) {
            result.movement.y = -position.y + height / 2;
            result.blocked.y = true;
            result.onGround = true;
        }
        
        // Check collision with obstacles
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'box') {
                // Check X axis collision
                const testPosition = position.clone();
                testPosition.x += movement.x;
                
                const dx = Math.abs(testPosition.x - obstacle.position.x) - (obstacle.width / 2 + radius);
                const dy = Math.abs(testPosition.y - obstacle.position.y) - (obstacle.height / 2);
                const dz = Math.abs(testPosition.z - obstacle.position.z) - (obstacle.depth / 2 + radius);
                
                if (dx < 0 && dy < 0 && dz < 0) {
                    result.movement.x = 0;
                    result.blocked.x = true;
                }
                
                // Check Z axis collision
                testPosition.x = position.x;
                testPosition.z = position.z + movement.z;
                
                const dx2 = Math.abs(testPosition.x - obstacle.position.x) - (obstacle.width / 2 + radius);
                const dz2 = Math.abs(testPosition.z - obstacle.position.z) - (obstacle.depth / 2 + radius);
                
                if (dx2 < 0 && dy < 0 && dz2 < 0) {
                    result.movement.z = 0;
                    result.blocked.z = true;
                }
                
                // Check Y axis collision (only if falling)
                if (movement.y < 0) {
                    testPosition.z = position.z;
                    testPosition.y = position.y + movement.y;
                    
                    const dy2 = Math.abs(testPosition.y - obstacle.position.y) - (obstacle.height / 2 + height / 2);
                    
                    if (dx < 0 && dy2 < 0 && dz < 0) {
                        result.movement.y = obstacle.position.y + obstacle.height / 2 + height / 2 - position.y;
                        result.blocked.y = true;
                        result.onGround = true;
                    }
                }
            }
        }
        
        return result;
    }
    
    /**
     * Check if a projectile collides with any obstacle
     */
    checkProjectileCollision(projectile) {
        const position = projectile.getPosition();
        
        // Check each obstacle
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'box') {
                // Simple box collision check
                const dx = Math.abs(position.x - obstacle.position.x) - (obstacle.width / 2);
                const dy = Math.abs(position.y - obstacle.position.y) - (obstacle.height / 2);
                const dz = Math.abs(position.z - obstacle.position.z) - (obstacle.depth / 2);
                
                if (dx < 0 && dy < 0 && dz < 0) {
                    return true; // Collision detected
                }
            }
        }
        
        // Check collision with ground
        if (position.y <= 0) {
            return true;
        }
        
        return false; // No collision
    }
}
