/**
 * Base Weapon class for all weapons
 */
class Weapon {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Weapon properties
        this.name = "Base Weapon";
        this.damage = 10;
        this.fireRate = 1; // shots per second
        this.reloadTime = 2; // seconds
        this.range = 100;
        this.spread = 0; // accuracy (lower is better)
        this.projectileSpeed = 100;
        this.automatic = false; // automatic fire when holding trigger
        this.zoomFOV = 65; // field of view when aiming
        
        // Ammo
        this.magSize = 10;
        this.currentMag = 10;
        this.reserveAmmo = 30;
        this.infiniteAmmo = false;
        
        // State
        this.isEquipped = false;
        this.isReloading = false;
        this.lastFireTime = 0;
        
        // Weapon model (will be set by child classes)
        this.model = null;
    }
    
    /**
     * Equip the weapon (show model, etc)
     */
    equip() {
        this.isEquipped = true;
        if (this.model) {
            this.model.visible = true;
        }
    }
    
    /**
     * Unequip the weapon (hide model, etc)
     */
    unequip() {
        this.isEquipped = false;
        if (this.model) {
            this.model.visible = false;
        }
    }
    
    /**
     * Attempt to fire the weapon
     * @returns {Projectile|null} The projectile if fired, null otherwise
     */
    shoot() {
        // Check if equipped
        if (!this.isEquipped) return null;
        
        // Check if reloading
        if (this.isReloading) return null;
        
        // Check fire rate cooldown
        const now = performance.now();
        if (now - this.lastFireTime < (1000 / this.fireRate)) return null;
        
        // Check ammo
        if (this.currentMag <= 0) {
            this.reload();
            return null;
        }
        
        // Update fire time
        this.lastFireTime = now;
        
        // Use ammo
        this.currentMag--;
        
        // Create projectile
        const projectile = this.createProjectile();
        
        // Play sound
        this.playSound();
        
        // Apply recoil
        this.applyRecoil();
        
        return projectile;
    }
    
    /**
     * Reload the weapon
     */
    reload() {
        // Check if already reloading
        if (this.isReloading) return;
        
        // Check if magazine is full
        if (this.currentMag === this.magSize) return;
        
        // Check if there's reserve ammo
        if (this.reserveAmmo <= 0 && !this.infiniteAmmo) return;
        
        // Start reloading
        this.isReloading = true;
        
        // Play reload sound
        // this.playReloadSound();
        
        // Complete reload after reload time
        setTimeout(() => {
            this.completeReload();
        }, this.reloadTime * 1000);
    }
    
    /**
     * Complete the reload process
     */
    completeReload() {
        // Calculate how many rounds to add
        const ammoNeeded = this.magSize - this.currentMag;
        
        if (this.infiniteAmmo) {
            // Infinite ammo just fills the magazine
            this.currentMag = this.magSize;
        } else {
            // Calculate ammo to add based on reserve
            const ammoToAdd = Math.min(ammoNeeded, this.reserveAmmo);
            
            // Update ammo counts
            this.currentMag += ammoToAdd;
            this.reserveAmmo -= ammoToAdd;
        }
        
        // End reloading state
        this.isReloading = false;
    }
    
    /**
     * Reset weapon ammo to default
     */
    resetAmmo() {
        this.currentMag = this.magSize;
        this.reserveAmmo = this.magSize * 3;
        this.isReloading = false;
    }
    
    /**
     * Create a projectile for this weapon
     */
    createProjectile() {
        // Calculate projectile direction with spread
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Apply spread if any
        if (this.spread > 0) {
            // Random angle within spread cone
            const spreadRadians = THREE.MathUtils.degToRad(this.spread);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * spreadRadians;
            
            // Calculate deviation
            const spreadX = Math.sin(phi) * Math.cos(theta);
            const spreadY = Math.sin(phi) * Math.sin(theta);
            const spreadZ = Math.cos(phi);
            
            // Apply to direction
            direction.x += spreadX * 0.1;
            direction.y += spreadY * 0.1;
            direction.z += spreadZ * 0.1;
            direction.normalize();
        }
        
        // Create projectile
        return new Projectile(
            this.scene,
            this.camera.position.clone(),
            direction,
            this.damage,
            this.range,
            this.projectileSpeed
        );
    }
    
    /**
     * Play weapon fire sound
     */
    playSound() {
        // To be implemented by child classes
    }
    
    /**
     * Apply recoil effect to camera
     */
    applyRecoil() {
        // To be implemented by child classes
    }
    
    /**
     * Update weapon state
     */
    update(deltaTime) {
        // Update weapon logic
    }
}

/**
 * Pistol weapon class
 */
class Pistol extends Weapon {
    constructor(scene, camera) {
        super(scene, camera);
        
        // Set pistol properties
        this.name = "Pistol";
        this.damage = 20;
        this.fireRate = 2; // shots per second
        this.reloadTime = 1.5; // seconds
        this.range = 50;
        this.spread = 2; // degrees
        this.projectileSpeed = 100;
        this.automatic = false;
        this.zoomFOV = 65;
        
        // Ammo
        this.magSize = 15;
        this.currentMag = 15;
        this.reserveAmmo = 45;
        
        // Create weapon model (simple placeholder)
        this.createModel();
    }
    
    createModel() {
        // Create a simple pistol model using primitives
        const group = new THREE.Group();
        
        // Barrel
        const barrelGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.2);
        const barrelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.z = -0.15;
        group.add(barrel);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.2);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.05;
        group.add(body);
        
        // Handle
        const handleGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
        const handleMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.15;
        group.add(handle);
        
        // Position the whole model in view
        group.position.set(0.2, -0.15, -0.3);
        
        // Save reference and add to scene
        this.model = group;
        this.scene.add(this.model);
        this.model.visible = false; // Hide initially
    }
    
    applyRecoil() {
        // Simple recoil effect (implemented in player camera controls)
    }
}

/**
 * Rifle weapon class
 */
class Rifle extends Weapon {
    constructor(scene, camera) {
        super(scene, camera);
        
        // Set rifle properties
        this.name = "Assault Rifle";
        this.damage = 15;
        this.fireRate = 8; // shots per second
        this.reloadTime = 2.5; // seconds
        this.range = 100;
        this.spread = 3; // degrees
        this.projectileSpeed = 120;
        this.automatic = true;
        this.zoomFOV = 55;
        
        // Ammo
        this.magSize = 30;
        this.currentMag = 30;
        this.reserveAmmo = 90;
        
        // Create weapon model
        this.createModel();
    }
    
    createModel() {
        // Create a simple rifle model using primitives
        const group = new THREE.Group();
        
        // Barrel
        const barrelGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.5);
        const barrelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.z = -0.3;
        group.add(barrel);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.3);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.05;
        group.add(body);
        
        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.2);
        const stockMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.z = 0.15;
        group.add(stock);
        
        // Handle
        const handleGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
        const handleMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.15;
        handle.position.z = -0.05;
        group.add(handle);
        
        // Magazine
        const magGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.05);
        const magMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const mag = new THREE.Mesh(magGeometry, magMaterial);
        mag.position.y = -0.15;
        mag.position.z = -0.05;
        group.add(mag);
        
        // Position the whole model in view
        group.position.set(0.2, -0.15, -0.3);
        
        // Save reference and add to scene
        this.model = group;
        this.scene.add(this.model);
        this.model.visible = false; // Hide initially
    }
    
    applyRecoil() {
        // More significant recoil effect for automatic rifle
    }
}

/**
 * Sniper weapon class
 */
class Sniper extends Weapon {
    constructor(scene, camera) {
        super(scene, camera);
        
        // Set sniper properties
        this.name = "Sniper Rifle";
        this.damage = 80;
        this.fireRate = 0.7; // shots per second
        this.reloadTime = 3.0; // seconds
        this.range = 200;
        this.spread = 0.5; // very accurate
        this.projectileSpeed = 200;
        this.automatic = false;
        this.zoomFOV = 20; // high zoom
        
        // Ammo
        this.magSize = 5;
        this.currentMag = 5;
        this.reserveAmmo = 15;
        
        // Create weapon model
        this.createModel();
    }
    
    createModel() {
        // Create a simple sniper rifle model using primitives
        const group = new THREE.Group();
        
        // Long barrel
        const barrelGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.7);
        const barrelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.z = -0.4;
        group.add(barrel);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.3);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.05;
        group.add(body);
        
        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.25);
        const stockMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.z = 0.2;
        group.add(stock);
        
        // Scope
        const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.1, 16);
        const scopeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
        scope.rotation.x = Math.PI / 2; // Rotate to align with barrel
        scope.position.y = 0.1;
        scope.position.z = -0.2;
        group.add(scope);
        
        // Handle
        const handleGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
        const handleMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.15;
        handle.position.z = -0.05;
        group.add(handle);
        
        // Position the whole model in view
        group.position.set(0.2, -0.15, -0.3);
        
        // Save reference and add to scene
        this.model = group;
        this.scene.add(this.model);
        this.model.visible = false; // Hide initially
    }
    
    applyRecoil() {
        // Significant recoil for sniper rifle
    }
}

/**
 * Projectile class for bullets and other projectiles
 */
class Projectile {
    constructor(scene, position, direction, damage, range, speed) {
        this.scene = scene;
        
        // Create projectile mesh
        const geometry = new THREE.SphereGeometry(0.03, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Set initial position and direction
        this.mesh.position.copy(position);
        this.direction = direction.normalize();
        
        // Set properties
        this.damage = damage;
        this.range = range;
        this.speed = speed;
        this.lifetime = range / speed; // Calculate lifetime based on range and speed
        this.distance = 0;
        
        // Add tracer effect (simple line)
        const tracerGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -0.3)
        ]);
        const tracerMaterial = new THREE.LineBasicMaterial({ color: 0xffffaa, opacity: 0.5, transparent: true });
        this.tracer = new THREE.Line(tracerGeometry, tracerMaterial);
        this.tracer.position.copy(position);
        
        // Align tracer with direction
        this.alignWithDirection(this.tracer, direction);
        
        // Add to scene
        scene.add(this.mesh);
        scene.add(this.tracer);
    }
    
    /**
     * Update projectile position
     */
    update(deltaTime) {
        // Calculate movement this frame
        const moveDistance = this.speed * deltaTime;
        
        // Update position
        this.mesh.position.add(this.direction.clone().multiplyScalar(moveDistance));
        this.tracer.position.copy(this.mesh.position);
        
        // Update distance traveled and lifetime
        this.distance += moveDistance;
        this.lifetime -= deltaTime;
        
        // Return false if projectile has reached its range
        return this.lifetime > 0;
    }
    
    /**
     * Get current position
     */
    getPosition() {
        return this.mesh.position.clone();
    }
    
    /**
     * Remove projectile from scene
     */
    removeFromScene(scene) {
        scene.remove(this.mesh);
        scene.remove(this.tracer);
    }
    
    /**
     * Align object with direction
     */
    alignWithDirection(obj, direction) {
        // Create a quaternion from the direction vector
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
        obj.quaternion.copy(quaternion);
    }
}
