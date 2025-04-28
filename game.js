/**
 * Main game class that orchestrates the entire game
 */
class Game {
    constructor() {
        // Game state
        this.gameActive = false;
        this.gameOver = false;
        this.paused = false;
        this.playerDead = false;
        
        // Game stats
        this.playersAlive = 200; // Total players in match (including player)
        this.playerEliminations = 0;
        this.shotsHit = 0;
        this.shotsFired = 0;
        
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 0, 1000);
        
        // Initialize clock for delta time
        this.clock = new THREE.Clock();
        
        // Configure camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.y = 1.7; // Player eye height
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-canvas').appendChild(this.renderer.domElement);
        
        // Add lighting
        this.setupLighting();
        
        // Create world
        this.world = new World(this.scene);
        
        // Create player
        this.player = new Player(this.camera, this.scene);
        
        // Initialize controls
        this.controls = new Controls(this.camera, this.renderer.domElement);
        
        // Create AI opponents
        this.aiManager = new AiManager(this.scene, this.world, this.player);
        
        // Initialize UI
        this.ui = new UI(this);
        
        // Initialize event handlers
        this.setupEventListeners();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Start animation loop immediately (even if game not started)
        this.animate();
    }
    
    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    setupEventListeners() {
        // Start game button
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        
        // Restart game button
        document.getElementById('restart-button').addEventListener('click', () => this.restartGame());
        
        // Pause game when ESC is pressed
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.gameActive && !this.gameOver) {
                this.togglePause();
            }
        });
    }
    
    startGame() {
        // Hide menu and start game
        document.getElementById('menu-overlay').classList.remove('active');
        this.gameActive = true;
        this.gameOver = false;
        this.paused = false;
        
        // Lock pointer for FPS controls
        this.controls.lock();
        
        // Reset player position and stats
        this.player.reset();
        
        // Initialize AI opponents
        this.aiManager.initializeOpponents(199); // 199 AI players + 1 human player = 200 total
        
        // Reset game stats
        this.playersAlive = 200;
        this.playerEliminations = 0;
        this.shotsHit = 0;
        this.shotsFired = 0;
        
        // Update UI elements
        this.ui.updatePlayersAlive(this.playersAlive);
        this.ui.updatePlayerHealth(this.player.health);
        this.ui.updateAmmo(this.player.currentWeapon);
    }
    
    restartGame() {
        document.getElementById('game-over').classList.add('hidden');
        this.startGame();
    }
    
    togglePause() {
        this.paused = !this.paused;
        
        if (this.paused) {
            // Show menu when paused
            document.getElementById('menu-overlay').classList.add('active');
            this.controls.unlock();
        } else {
            // Hide menu when unpaused
            document.getElementById('menu-overlay').classList.remove('active');
            this.controls.lock();
        }
    }
    
    onWindowResize() {
        // Update camera and renderer when window is resized
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    playerEliminated(shooterName) {
        if (!this.playerDead) {
            this.playerDead = true;
            
            // Calculate final rank based on players alive
            const playerRank = this.playersAlive;
            
            // Calculate accuracy
            const accuracy = this.shotsFired > 0 
                ? Math.round((this.shotsHit / this.shotsFired) * 100) 
                : 0;
            
            // Display game over screen with stats
            this.ui.showGameOver(playerRank, this.playerEliminations, accuracy);
            
            // Play death sound or animation
            // ...
            
            // End game
            this.gameOver = true;
            this.controls.unlock();
        }
    }
    
    playerEliminatedAI(aiId) {
        // Player killed an AI opponent
        this.playerEliminations++;
        this.playersAlive--;
        this.ui.addKillFeed(`You eliminated Player${aiId}`);
        this.ui.updatePlayersAlive(this.playersAlive);
        
        // Check if player won (last player standing)
        if (this.playersAlive === 1) {
            this.playerWon();
        }
    }
    
    aiEliminatedAI(attackerId, victimId) {
        // AI eliminated another AI
        this.playersAlive--;
        this.ui.addKillFeed(`Player${attackerId} eliminated Player${victimId}`);
        this.ui.updatePlayersAlive(this.playersAlive);
    }
    
    playerWon() {
        // Calculate accuracy
        const accuracy = this.shotsFired > 0 
            ? Math.round((this.shotsHit / this.shotsFired) * 100) 
            : 0;
        
        // Display victory screen
        this.ui.showGameOver(1, this.playerEliminations, accuracy);
        
        // End game
        this.gameOver = true;
        this.controls.unlock();
    }
    
    update(deltaTime) {
        if (this.gameActive && !this.paused && !this.gameOver) {
            // Update player
            this.player.update(deltaTime, this.controls, this.world);
            
            // Update AI manager
            this.aiManager.update(deltaTime, this.world, this.playersAlive);
            
            // Check collisions
            this.checkCollisions();
            
            // Update UI
            this.ui.update();
        }
    }
    
    checkCollisions() {
        // Process player projectiles hitting AI
        this.player.projectiles.forEach((projectile, index) => {
            const hit = this.aiManager.checkProjectileHit(projectile);
            if (hit) {
                // Remove projectile
                this.player.projectiles.splice(index, 1);
                projectile.removeFromScene(this.scene);
                
                // Track hit for accuracy
                this.shotsHit++;
            }
        });
        
        // Process AI projectiles hitting player
        this.aiManager.checkProjectileHitPlayer(this.player);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Only update game if active and not paused
        this.update(deltaTime);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    const game = new Game();
});
