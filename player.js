/**
 * Player class that handles player movement, shooting, and inventory
 */
class Player {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        
        // Player stats
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0;
        this.isAlive = true;
        
        // Player movement
        this.height = 1.7; // Player eye height
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3();
        this.moveSpeed = 5.0;
        this.jumpForce = 10.0;
        this.gravity = 20.0;
        this.canJump = true;
        
        // Player position
        this.position = new THREE.Vector3(0, this.height, 0);
        this.camera.position.copy(this.position);
        
        // Physics collider (for collision detection)
        this.collider = {
            radius: 0.5,
            height: this.height * 2
        };
        
        // Weapons
        this.weapons = [
            new Pistol(scene, camera),
            new Rifle(scene, camera),
            new Sniper(scene, camera)
        ];
        this.currentWeaponIndex = 1; // Start with rifle
        this.currentWeapon = this.weapons[this.currentWeaponIndex];
        
        // Equipment
        this.grenades = 3;
        this.medkits = 2;
        
        // Projectiles
        this.projectiles = [];
        
        // Cooldowns
        this.switchWeaponCooldown = 0;
        this.grenadeCooldown = 0;
        this.medkitCooldown = 0;
        
        // Aiming state
        this.isAiming = false;
        
        // Initialize weapon
        this.currentWeapon.equip();
    }
    
    /**
     * Reset player to starting state
     */
    reset() {
        this.health = 100;
        this.isAlive = true;
        
        // Reset position
        this.position.set(0, this.height, 0);
        this.camera.position.copy(this.position);
        
        // Reset velocity
        this.velocity.set(0, 0, 0);
        
        // Reset weapons
        this.weapons.forEach(weapon => {
            weapon.resetAmmo();
        });
        this.currentWeaponIndex = 1; // Start with rifle
        this.currentWeapon = this.weapons[this.currentWeaponIndex];
        this.currentWeapon.equip();
        
        // Reset equipment
        this.grenades = 3;
        this.medkits = 2;
        
        // Clear projectiles
        this.projectiles.forEach(projectile => {
            projectile.removeFromScene(this.scene);
        });
        this.projectiles = [];
    }
    
    /**
     * Take damage (from AI or environment)
     */
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        // Calculate actual damage (reduced by armor if any)
        let actualDamage = amount;
        if (this.armor > 0) {
            // Armor reduces damage by 50%
            const absorbedDamage = amount * 0.5;
            actualDamage = amount - absorbedDamage;
            
            // Reduce armor
            this.armor = Math.max(0, this.armor - absorbedDamage);
        }
        
        // Apply damage
        this.health = Math.max(0, this.health - actualDamage);
        
        // Check if player died
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Handle player death
     */
    die() {
        this.isAlive = false;
        this.health = 0;
    }
    
    /**
     * Switch to next weapon
     */
    switchWeapon(index) {
        if (this.switchWeaponCooldown > 0) return;
        
        // Unequip current weapon
        this.currentWeapon.unequip();
        
        // Set new weapon index
        if (index !== undefined) {
            // Switch to specific weapon
            this.currentWeaponIndex = index;
        } else {
            // Cycle through weapons
            this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        }
        
        // Update current weapon reference
        this.currentWeapon = this.weapons[this.currentWeaponIndex];
        
        // Equip new weapon
        this.currentWeapon.equip();
        
        // Set cooldown
        this.switchWeaponCooldown = 0.5;
    }
    
    /**
     * Use a medkit to restore health
     */
    useMedkit() {
        if (this.medkitCooldown > 0 || this.medkits <= 0 || this.health >= this.maxHealth) return;
        
        // Heal player
        this.health = Math.min(this.maxHealth, this.health + 50);
        
        // Use a medkit
        this.medkits--;
        
        // Set cooldown
        this.medkitCooldown = 3.0;
    }
    
    /**
     * Throw a grenade
     */
    throwGrenade() {
        if (this.grenadeCooldown > 0 || this.grenades <= 0) return;
        
        // Create grenade projectile
        const grenade = new Grenade(this.scene, this.camera);
        
        // Add to projectiles list
        this.projectiles.push(grenade);
        
        // Use a grenade
        this.grenades--;
        
        // Set cooldown
        this.grenadeCooldown = 1.0;
    }
    
    /**
     * Handle player shooting
     */
    shoot() {
        if (!this.isAlive) return;
        
        // Try to fire current weapon
        const projectile = this.currentWeapon.shoot();
        
        // If weapon fired, add projectile to list
        if (projectile) {
            this.projectiles.push(projectile);
        }
    }
    
    /**
     * Toggle aiming state (right-click)
     */
    toggleAim(aiming) {
        this.isAiming = aiming;
        
        if (this.isAiming) {
            // Zoom in (adjust FOV)
            const zoomFOV = this.currentWeapon.zoomFOV;
            this.camera.fov = zoomFOV;
            this.camera.updateProjectionMatrix();
            
            // Slow movement while aiming
            this.moveSpeed = 2.0;
        } else {
            // Reset FOV
            this.camera.fov = 75;
            this.camera.updateProjectionMatrix();
            
            // Reset movement speed
            this.moveSpeed = 5.0;
        }
    }
    
    /**
     * Update player state
     */
    update(deltaTime, controls, world) {
        if (!this.isAlive) return;
        
        // Update cooldowns
        this.switchWeaponCooldown = Math.max(0, this.switchWeaponCooldown - deltaTime);
        this.grenadeCooldown = Math.max(0, this.grenadeCooldown - deltaTime);
        this.medkitCooldown = Math.max(0, this.medkitCooldown - deltaTime);
        
        // Update movement based on controls
        this.updateMovement(deltaTime, controls, world);
        
        // Update current weapon
        this.currentWeapon.update(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime, world);
    }
    
    /**
     * Update player movement based on controls
     */
    updateMovement(deltaTime, controls, world) {
        // Apply gravity to velocity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Get movement direction from controls
        const moveDirection = controls.getMoveDirection();
        
        // Update velocity based on movement input
        this.velocity.x = moveDirection.x * this.moveSpeed;
        this.velocity.z = moveDirection.z * this.moveSpeed;
        
        // Check if jump requested and player is on ground
        if (controls.jump && this.canJump) {
            this.velocity.y = this.jumpForce;
            this.canJump = false;
        }
        
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
        
        // Check if player is on ground
        if (collision.onGround) {
            this.canJump = true;
        }
        
        // Update camera position to match player position
        this.camera.position.copy(this.position);
    }
    
    /**
     * Update projectiles
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
     * Get player position
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Get player forward direction
     */
    getDirection() {
        // Get direction vector from camera
        this.camera.getWorldDirection(this.direction);
        return this.direction.clone();
    }
}

/**
 * Base class for grenades
 */
class Grenade {
    constructor(scene, camera) {
        this.scene = scene;
        
        // Create grenade mesh
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Set initial position and direction
        const position = camera.position.clone();
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        // Adjust spawn position to be in front of the camera
        position.add(direction.multiplyScalar(0.5));
        this.mesh.position.copy(position);
        
        // Calculate velocity (direction + slight upward angle)
        this.velocity = direction.clone();
        this.velocity.y += 0.2; // Throw with slight upward angle
        this.velocity.normalize().multiplyScalar(15); // Throw speed
        
        // Properties
        this.damage = 100;
        this.radius = 5;
        this.lifetime = 3.0; // 3 seconds until explosion
        this.exploded = false;
        
        // Add to scene
        scene.add(this.mesh);
    }
    
    /**
     * Update grenade position and check for explosion
     */
    update(deltaTime) {
        if (this.exploded) return false;
        
        // Apply gravity
        this.velocity.y -= 9.8 * deltaTime;
        
        // Update position
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.y += this.velocity.y * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;
        
        // Update lifetime
        this.lifetime -= deltaTime;
        
        // Check if it's time to explode
        if (this.lifetime <= 0) {
            this.explode();
        }
        
        return true;
    }
    
    /**
     * Handle grenade explosion
     */
    explode() {
        if (this.exploded) return;
        
        this.exploded = true;
        
        // Create explosion effect
        const explosion = new THREE.PointLight(0xff5500, 2, this.radius * 2);
        explosion.position.copy(this.mesh.position);
        this.scene.add(explosion);
        
        // Remove explosion after short delay
        setTimeout(() => {
            this.scene.remove(explosion);
        }, 100);
        
        // Remove grenade mesh
        this.removeFromScene(this.scene);
    }
    
    /**
     * Check if point is within explosion radius
     */
    isInExplosionRadius(point) {
        if (!this.exploded) return false;
        
        const distance = point.distanceTo(this.mesh.position);
        return distance <= this.radius;
    }
    
    /**
     * Calculate damage based on distance from explosion
     */
    getDamageAt(point) {
        if (!this.exploded) return 0;
        
        const distance = point.distanceTo(this.mesh.position);
        if (distance > this.radius) return 0;
        
        // Damage falls off with distance
        return this.damage * (1 - (distance / this.radius));
    }
    
    /**
     * Get current position
     */
    getPosition() {
        return this.mesh.position.clone();
    }
    
    /**
     * Remove grenade from scene
     */
    removeFromScene(scene) {
        scene.remove(this.mesh);
    }
}
