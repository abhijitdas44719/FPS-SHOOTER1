/**
 * Controls class that handles user input
 */
class Controls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Pointer lock controls for first-person camera
        this.pointerLock = new THREE.PointerLockControls(camera, domElement);
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        
        // Mouse state
        this.isMouseDown = false;
        this.isRightMouseDown = false;
        
        // Setup event listeners
        this.setupMouseEvents();
        this.setupKeyboardEvents();
    }
    
    /**
     * Setup mouse event listeners
     */
    setupMouseEvents() {
        // Mouse movement (handled by PointerLockControls)
        
        // Mouse buttons
        document.addEventListener('mousedown', (event) => {
            if (!this.pointerLock.isLocked) return;
            
            if (event.button === 0) { // Left mouse button
                this.isMouseDown = true;
                
                // If game is active, forward to player
                if (game.gameActive && !game.paused && !game.gameOver) {
                    game.player.shoot();
                    
                    // If weapon is automatic, continue shooting
                    this.autoShootInterval = setInterval(() => {
                        if (this.isMouseDown && game.player.currentWeapon.automatic) {
                            game.player.shoot();
                        }
                    }, 1000 / game.player.currentWeapon.fireRate);
                }
            } else if (event.button === 2) { // Right mouse button
                this.isRightMouseDown = true;
                
                // If game is active, toggle aim
                if (game.gameActive && !game.paused && !game.gameOver) {
                    game.player.toggleAim(true);
                }
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) { // Left mouse button
                this.isMouseDown = false;
                clearInterval(this.autoShootInterval);
            } else if (event.button === 2) { // Right mouse button
                this.isRightMouseDown = false;
                
                // If game is active, toggle aim off
                if (game.gameActive && !game.paused && !game.gameOver) {
                    game.player.toggleAim(false);
                }
            }
        });
        
        // Disable context menu on right-click
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            // Only process if game is active and not paused
            const gameRunning = game.gameActive && !game.paused && !game.gameOver;
            
            switch (event.code) {
                // Movement
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    this.jump = true;
                    break;
                
                // Weapon switching
                case 'Digit1':
                    if (gameRunning) game.player.switchWeapon(0);
                    break;
                case 'Digit2':
                    if (gameRunning) game.player.switchWeapon(1);
                    break;
                case 'Digit3':
                    if (gameRunning) game.player.switchWeapon(2);
                    break;
                
                // Equipment
                case 'KeyG':
                    if (gameRunning) game.player.throwGrenade();
                    break;
                case 'KeyH':
                    if (gameRunning) game.player.useMedkit();
                    break;
                
                // Reload
                case 'KeyR':
                    if (gameRunning) game.player.currentWeapon.reload();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'Space':
                    this.jump = false;
                    break;
            }
        });
    }
    
    /**
     * Lock pointer for first-person controls
     */
    lock() {
        this.pointerLock.lock();
    }
    
    /**
     * Unlock pointer
     */
    unlock() {
        this.pointerLock.unlock();
    }
    
    /**
     * Get current movement direction
     */
    getMoveDirection() {
        const direction = new THREE.Vector3(0, 0, 0);
        
        // Calculate normalized direction vector
        if (this.moveForward) direction.z -= 1;
        if (this.moveBackward) direction.z += 1;
        if (this.moveLeft) direction.x -= 1;
        if (this.moveRight) direction.x += 1;
        
        // Normalize for consistent speed in all directions
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Convert to camera-relative direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        const cameraRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
        
        // Apply camera rotation to movement direction
        const dirX = direction.x;
        const dirZ = direction.z;
        direction.x = dirX * Math.cos(cameraRotation) - dirZ * Math.sin(cameraRotation);
        direction.z = dirX * Math.sin(cameraRotation) + dirZ * Math.cos(cameraRotation);
        
        return direction;
    }
}
