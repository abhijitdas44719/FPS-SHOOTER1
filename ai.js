/**
 * AiManager class that handles all AI opponents
 */
class AiManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        
        // AI opponents array
        this.opponents = [];
        
        // AI shared properties
        this.aiMoveSpeed = 4.0;
        this.aiDetectionRange = 50;
        this.aiHealth = 100;
        
        // Projectiles from AI
        this.projectiles = [];
    }
    
    /**
     * Initialize a specified number of AI opponents
     */
    initializeOpponents(count) {
        // Clear any existing opponents
        this.clearOpponents();
        
        // Create new opponents
        for (let i = 0; i < count; i++) {
            this.createOpponent(i);
        }
    }
    
    /**
     * Clear all opponents
     */
    clearOpponents() {
        // Remove each opponent from the scene
        this.opponents.forEach(opponent => {
            opponent.removeFromScene(this.scene);
        });
        
        // Clear array
        this.opponents = [];
        
        // Clear projectiles
        this.projectiles.forEach(projectile => {
            projectile.removeFromScene(this.scene);
        });
        this.projectiles = [];
    }
    
    /**
     * Create a single AI opponent
     */
    createOpponent(id) {
        // Generate random position (within world bounds, away from player)
        const position = this.generateSpawnPosition();
        
        // Create AI opponent
        const opponent = new AiOpponent(id, this.scene, position, this.aiHealth, this.aiMoveSpeed);
        
        // Add to array
        this.opponents.push(opponent);
    }
    
    /**
     * Generate a valid spawn position for an AI opponent
     */
    generateSpawnPosition() {
        const playerPos = this.player.getPosition();
        const worldSize = this.world.worldSize;
        
        // Keep trying until a valid position is found
        for (let attempts = 0; attempts < 50; attempts++) {
            // Generate random position within world bounds
            const x = (Math.random() - 0.5) * worldSize;
            const z = (Math.random() - 0.5) * worldSize;
            const position = new THREE.Vector3(x, 1.7, z); // Eye height
            
            // Check if position is far enough from player (at least 20 units)
            if (position.distanceTo(playerPos) < 20) {
                continue;
            }
            
            // Check if position is valid (not inside obstacle)
            if (this.world.isPositionValid(position)) {
                return position;
            }
        }
        
        // If no good position found after attempts, just use a fallback
        return new THREE.Vector3(
            Math.random() > 0.5 ? 50 : -50,
            1.7,
            Math.random() > 0.5 ? 50 : -50
        );
    }
    
    /**
     * Update all AI opponents
     */
    update(deltaTime, world, playersAlive) {
        // Update each opponent
        for (let i = this.opponents.length - 1; i >= 0; i--) {
            const opponent = this.opponents[i];
            
            // Skip update if opponent is dead
            if (!opponent.isAlive) {
                continue;
            }
            
            // Update AI behavior
            opponent.update(deltaTime, this.player, this.opponents, world);
            
            // Handle shooting
            if (opponent.isShooting) {
                // Try to create a projectile
                const projectile = opponent.shoot();
                if (projectile) {
                    this.projectiles.push(projectile);
                }
            }
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime, world);
        
        // Randomly make opponents attack each other to reduce player count
        this.simulateOpponentBattles(playersAlive);
    }
    
    /**
     * Update all projectiles from AI opponents
     */
    updateProjectiles(deltaTime, world) {
        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update projectile
            projectile.update(deltaTime);
            
            // Check if projectile hit the world
            if (world.checkProjectileCollision(projectile)) {
                // Remove projectile
                this.projectiles.splice(i, 1);
                projectile.removeFromScene(this.scene);
                continue;
            }
            
            // Check if projectile lifetime is over
            if (projectile.lifetime <= 0) {
                // Remove projectile
                this.projectiles.splice(i, 1);
                projectile.removeFromScene(this.scene);
            }
        }
    }
    
    /**
     * Check if a projectile from the player hits any AI opponent
     */
    checkProjectileHit(projectile) {
        const projectilePos = projectile.getPosition();
        
        for (let i = 0; i < this.opponents.length; i++) {
            const opponent = this.opponents[i];
            
            // Skip if opponent is already dead
            if (!opponent.isAlive) continue;
            
            // Get opponent position (head height)
            const opponentPos = opponent.getPosition();
            
            // Check distance (simple sphere collision)
            const hitDistance = 1.0; // Collision radius
            const distance = projectilePos.distanceTo(opponentPos);
            
            if (distance < hitDistance) {
                // Apply damage to opponent
                const killed = opponent.takeDamage(projectile.damage);
                
                // If opponent was killed
                if (killed) {
                    // Notify game of elimination
                    game.playerEliminatedAI(opponent.id);
                }
                
                return true; // Hit detected
            }
        }
        
        return false; // No hit
    }
    
    /**
     * Check if any projectiles from AI hit the player
     */
    checkProjectileHitPlayer(player) {
        const playerPos = player.getPosition();
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const projectilePos = projectile.getPosition();
            
            // Check distance (simple sphere collision)
            const hitDistance = 0.5; // Collision radius
            const distance = projectilePos.distanceTo(playerPos);
            
            if (distance < hitDistance) {
                // Apply damage to player
                player.takeDamage(projectile.damage);
                
                // Remove projectile
                this.projectiles.splice(i, 1);
                projectile.removeFromScene(this.scene);
                
                // Check if player died
                if (player.health <= 0) {
                    // Find which AI shot the player
                    game.playerEliminated("AI Opponent");
                }
            }
        }
    }
    
    /**
     * Simulate battles between AI opponents to reduce player count over time
     */
    simulateOpponentBattles(playersAlive) {
        // Don't simulate too many battles if only a few players remain
        if (playersAlive < 20) return;
        
        // Get list of alive opponents
        const aliveOpponents = this.opponents.filter(o => o.isAlive);
        
        // Randomly eliminate some AI opponents to simulate battles
        // More frequent eliminations in early game, less in late game
        const eliminationChance = playersAlive / 1000; // 0.2 initially, decreases as players die
        
        if (Math.random() < eliminationChance && aliveOpponents.length >= 2) {
            // Choose random attacker and victim
            const attackerIndex = Math.floor(Math.random() * aliveOpponents.length);
            let victimIndex;
            do {
                victimIndex = Math.floor(Math.random() * aliveOpponents.length);
            } while (victimIndex === attackerIndex);
            
            const attacker = aliveOpponents[attackerIndex];
            const victim = aliveOpponents[victimIndex];
            
            // Kill victim
            victim.isAlive = false;
            
            // Notify game of elimination
            game.aiEliminatedAI(attacker.id, victim.id);
        }
    }
}

/**
 * Individual AI opponent
 */
class AiOpponent {
    constructor(id, scene, position, health, moveSpeed) {
        this.id = id;
        this.scene = scene;
        
        // Stats
        this.health = health;
        this.maxHealth = health;
        this.isAlive = true;
        this.moveSpeed = moveSpeed;
        
        // Position and direction
        this.position = position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, 1); // Forward direction
        
        // Physics collider
        this.collider = {
            radius: 0.5,
            height: 1.7 * 2
        };
        
        // AI state
        this.state = 'patrolling'; // patrolling, chasing, attacking
        this.targetPosition = null;
        this.targetEntity = null;
        this.patrolTimer = 0;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.isShooting = false;
        
        // Create visual representation
        this.createVisualModel();
        
        // Weapon properties
        this.damage = 10;
        this.fireRate = 2; // shots per second
        this.attackRange = 30;
        this.detectionRange = 40;
        this.lastFireTime = 0;
    }
    
    /**
     * Create visual representation of AI opponent
     */
    createVisualModel() {
        // Create a simple humanoid shape
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.3, 8);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = -0.2;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.65;
        group.add(head);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8);
        const armMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(0.4, 0.2, 0);
        leftArm.rotation.z = Math.PI / 3;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(-0.4, 0.2, 0);
        rightArm.rotation.z = -Math.PI / 3;
        group.add(rightArm);
        
        // Set position
        group.position.copy(this.position);
        
        // Add to scene
        this.model = group;
        this.scene.add(group);
    }
    
    /**
     * Update AI state and behavior
     */
    update(deltaTime, player, opponents, world) {
        if (!this.isAlive) return;
        
        // Update timers
        this.patrolTimer -= deltaTime;
        this.attackTimer -= deltaTime;
        this.attackCooldown -= deltaTime;
        
        // Check if player is visible and in range
        const playerPos = player.getPosition();
        const distanceToPlayer = this.position.distanceTo(playerPos);
        const canSeePlayer = this.canSeeTarget(playerPos, world);
        
        // Check for nearby opponents
        let nearestOpponent = null;
        let nearestDistance = Infinity;
        
        opponents.forEach(opponent => {
            if (opponent.id !== this.id && opponent.isAlive) {
                const distance = this.position.distanceTo(opponent.getPosition());
                if (distance < this.detectionRange && distance < nearestDistance) {
                    nearestOpponent = opponent;
                    nearestDistance = distance;
                }
            }
        });
        
        // Decide what to do based on situation
        if (canSeePlayer && distanceToPlayer < this.detectionRange) {
            // Player detected, switch to chasing or attacking
            if (distanceToPlayer < this.attackRange) {
                this.state = 'attacking';
                this.targetEntity = player;
            } else {
                this.state = 'chasing';
                this.targetEntity = player;
            }
        } else if (nearestOpponent && Math.random() < 0.3) {
            // Sometimes decide to attack other opponents
            if (nearestDistance < this.attackRange) {
                this.state = 'attacking';
                this.targetEntity = nearestOpponent;
            } else {
                this.state = 'chasing';
                this.targetEntity = nearestOpponent;
            }
        } else if (this.patrolTimer <= 0) {
            // Choose a new patrol point
            this.state = 'patrolling';
            this.targetPosition = this.generatePatrolPoint();
            this.patrolTimer = 5 + Math.random() * 5; // 5-10 seconds
        }
        
        // Execute behavior based on state
        switch (this.state) {
            case 'patrolling':
                this.patrol(deltaTime, world);
                break;
            case 'chasing':
                this.chase(deltaTime, world);
                break;
            case 'attacking':
                this.attack(deltaTime, world);
                break;
        }
        
        // Update position based on velocity
        this.updateMovement(deltaTime, world);
        
        // Update model position and rotation
        this.updateModel();
    }
    
    /**
     * Patrol behavior - move to random points
     */
    patrol(deltaTime, world) {
        if (!this.targetPosition) {
            this.targetPosition = this.generatePatrolPoint();
        }
        
        // Move towards patrol point
        const toTarget = this.targetPosition.clone().sub(this.position);
        toTarget.y = 0; // Keep movement on ground plane
        
        const distance = toTarget.length();
        
        // If reached target, get new target
        if (distance < 1.0) {
            this.targetPosition = this.generatePatrolPoint();
            this.patrolTimer = 5 + Math.random() * 5; // 5-10 seconds
        }
        
        // Set movement direction
        toTarget.normalize();
        this.velocity.x = toTarget.x * this.moveSpeed * 0.5; // Move slower when patrolling
        this.velocity.z = toTarget.z * this.moveSpeed * 0.5;
        
        // Update direction for model rotation
        this.direction.copy(toTarget);
    }
    
    /**
     * Chase behavior - move towards target entity
     */
    chase(deltaTime, world) {
        if (!this.targetEntity) {
            this.state = 'patrolling';
            return;
        }
        
        // Get target position
        const targetPos = this.targetEntity.getPosition();
        
        // Calculate direction to target
        const toTarget = targetPos.clone().sub(this.position);
        toTarget.y = 0; // Keep movement on ground plane
        
        const distance = toTarget.length();
        
        // If within attack range, switch to attacking
        if (distance < this.attackRange) {
            this.state = 'attacking';
            return;
        }
        
        // Set movement direction
        toTarget.normalize();
        this.velocity.x = toTarget.x * this.moveSpeed;
        this.velocity.z = toTarget.z * this.moveSpeed;
        
        // Update direction for model rotation
        this.direction.copy(toTarget);
    }
    
    /**
     * Attack behavior - shoot at target
     */
    attack(deltaTime, world) {
        if (!this.targetEntity) {
            this.state = 'patrolling';
            return;
        }
        
        // Get target position
        const targetPos = this.targetEntity.getPosition();
        
        // Calculate direction to target
        const toTarget = targetPos.clone().sub(this.position);
        toTarget.y = 0; // Keep on ground plane for rotation
        
        const distance = toTarget.length();
        
        // If target moved out of range, chase again
        if (distance > this.attackRange) {
            this.state = 'chasing';
            return;
        }
        
        // Face target
        this.direction.copy(toTarget.normalize());
        
        // Occasionally move to a better position
        if (this.attackTimer <= 0) {
            // Move to a slightly different position to avoid being static
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                0,
                (Math.random() - 0.5) * 5
            );
            this.targetPosition = this.position.clone().add(offset);
            this.attackTimer = 2 + Math.random() * 2; // 2-4 seconds
        }
        
        // Move towards that position while attacking
        if (this.targetPosition) {
            const toPosition = this.targetPosition.clone().sub(this.position);
            toPosition.y = 0;
            
            if (toPosition.length() > 1.0) {
                toPosition.normalize();
                this.velocity.x = toPosition.x * this.moveSpeed * 0.5;
                this.velocity.z = toPosition.z * this.moveSpeed * 0.5;
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
            }
        }
        
        // Shoot at target if cooled down
        if (this.attackCooldown <= 0) {
            this.isShooting = true;
            this.attackCooldown = 1 / this.fireRate; // Based on fire rate
        } else {
            this.isShooting = false;
        }
    }
    
    /**
     * Update physical movement with collision detection
     */
    updateMovement(deltaTime, world) {
        // Apply gravity
        this.velocity.y -= 9.8 * deltaTime;
        
        // Calculate movement for this frame
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        
        // Detect collisions with world
        const collision = world.checkCollision(
            this.position,
            movement,
            this.collider.radius,
            this.collider.height
        );
        
        // Update position based on collision result
        this.position.add(collision.movement);
        
        // Update velocity based on collision
        this.velocity.x = collision.blocked.x ? 0 : this.velocity.x;
        this.velocity.y = collision.blocked.y ? 0 : this.velocity.y;
        this.velocity.z = collision.blocked.z ? 0 : this.velocity.z;
    }
    
    /**
     * Update visual model position and rotation
     */
    updateModel() {
        if (!this.model) return;
        
        // Update position
        this.model.position.copy(this.position);
        
        // Update rotation (face direction of movement)
        if (this.direction.length() > 0.1) {
            this.model.rotation.y = Math.atan2(this.direction.x, this.direction.z);
        }
    }
    
    /**
     * Generate a random patrol point
     */
    generatePatrolPoint() {
        // Generate point within a certain radius of current position
        const radius = 20;
        const angle = Math.random() * Math.PI * 2;
        
        return new THREE.Vector3(
            this.position.x + Math.cos(angle) * radius,
            this.position.y,
            this.position.z + Math.sin(angle) * radius
        );
    }
    
    /**
     * Check if AI can see the target (raycasting)
     */
    canSeeTarget(targetPosition, world) {
        const dirToTarget = targetPosition.clone().sub(this.position).normalize();
        const distToTarget = this.position.distanceTo(targetPosition);
        
        // Skip raycasting if too far
        if (distToTarget > this.detectionRange) {
            return false;
        }
        
        // Simple line of sight check - could use raycasting with Three.js in a full implementation
        return true; // Simplified - assume can always see if in range
    }
    
    /**
     * Take damage and check if killed
     * @returns {boolean} True if killed
     */
    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.die();
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle death
     */
    die() {
        this.isAlive = false;
        this.health = 0;
        
        // Change appearance to indicate death
        if (this.model) {
            // Change to gray color
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material.color.set(0x666666);
                }
            });
            
            // Rotate to indicate "fallen" state
            this.model.rotation.x = Math.PI / 2;
        }
    }
    
    /**
     * Get current position
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Remove from scene
     */
    removeFromScene(scene) {
        if (this.model) {
            scene.remove(this.model);
        }
    }
    
    /**
     * Create a projectile when shooting
     */
    shoot() {
        const now = performance.now();
        if (now - this.lastFireTime < (1000 / this.fireRate)) {
            return null;
        }
        
        // Update fire time
        this.lastFireTime = now;
        
        // Calculate direction to target with some inaccuracy
        const targetPos = this.targetEntity.getPosition();
        const direction = targetPos.clone().sub(this.position).normalize();
        
        // Add some random spread/inaccuracy
        const spread = 0.1;
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.z += (Math.random() - 0.5) * spread;
        direction.normalize();
        
        // Create projectile
        return new Projectile(
            this.scene,
            this.position.clone().add(new THREE.Vector3(0, 0.5, 0)), // Shoot from "gun" height
            direction,
            this.damage,
            30, // range
            40  // speed
        );
    }
}
