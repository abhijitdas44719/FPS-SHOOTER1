/**
 * UI class that handles game interface
 */
class UI {
    constructor(game) {
        this.game = game;
        
        // Get UI elements
        this.healthBar = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.ammoText = document.getElementById('ammo-text');
        this.playersCountText = document.getElementById('players-count');
        this.killFeed = document.getElementById('kill-feed');
        this.weaponSelectors = [
            document.getElementById('weapon-1'),
            document.getElementById('weapon-2'),
            document.getElementById('weapon-3')
        ];
        this.grenadeCounter = document.querySelector('#grenade span');
        this.medkitCounter = document.querySelector('#medkit span');
        this.crosshair = document.getElementById('crosshair');
        this.minimap = document.getElementById('minimap');
        
        // Game over screen elements
        this.gameOverScreen = document.getElementById('game-over');
        this.rankText = document.getElementById('rank');
        this.eliminationsText = document.getElementById('eliminations');
        this.accuracyText = document.getElementById('accuracy');
        
        // Initialize minimap
        this.initializeMinimap();
    }
    
    /**
     * Update all UI elements
     */
    update() {
        const player = this.game.player;
        
        // Update health
        this.updatePlayerHealth(player.health);
        
        // Update ammo
        this.updateAmmo(player.currentWeapon);
        
        // Update equipment
        this.updateEquipment(player);
        
        // Update weapon selection
        this.updateWeaponSelection(player.currentWeaponIndex);
        
        // Update minimap
        this.updateMinimap(player, this.game.aiManager.opponents);
    }
    
    /**
     * Update player health display
     */
    updatePlayerHealth(health) {
        const healthPercent = Math.max(0, health) / 100 * 100;
        this.healthBar.style.width = `${healthPercent}%`;
        this.healthText.textContent = Math.max(0, Math.ceil(health));
        
        // Change color based on health
        if (healthPercent > 60) {
            this.healthBar.style.backgroundColor = '#f22';
        } else if (healthPercent > 30) {
            this.healthBar.style.backgroundColor = '#fa2';
        } else {
            this.healthBar.style.backgroundColor = '#f55';
        }
    }
    
    /**
     * Update ammo counter
     */
    updateAmmo(weapon) {
        this.ammoText.textContent = `${weapon.currentMag}/${weapon.reserveAmmo}`;
        
        // Highlight low ammo
        if (weapon.currentMag === 0) {
            this.ammoText.style.color = '#f55';
        } else if (weapon.currentMag < weapon.magSize * 0.25) {
            this.ammoText.style.color = '#fa2';
        } else {
            this.ammoText.style.color = '#fff';
        }
    }
    
    /**
     * Update equipment counters
     */
    updateEquipment(player) {
        this.grenadeCounter.textContent = player.grenades;
        this.medkitCounter.textContent = player.medkits;
    }
    
    /**
     * Update weapon selection highlighting
     */
    updateWeaponSelection(index) {
        // Remove active class from all
        this.weaponSelectors.forEach(selector => {
            selector.classList.remove('active');
        });
        
        // Add active class to current weapon
        this.weaponSelectors[index].classList.add('active');
    }
    
    /**
     * Update players alive counter
     */
    updatePlayersAlive(count) {
        this.playersCountText.textContent = count;
    }
    
    /**
     * Add a kill message to the kill feed
     */
    addKillFeed(message) {
        const killMessage = document.createElement('div');
        killMessage.className = 'kill-message';
        killMessage.textContent = message;
        
        // Add to top of kill feed
        this.killFeed.insertBefore(killMessage, this.killFeed.firstChild);
        
        // Remove after animation completes
        setTimeout(() => {
            killMessage.remove();
        }, 4000);
    }
    
    /**
     * Initialize minimap
     */
    initializeMinimap() {
        // Create minimap context if needed
        // In this simple version, we'll just use divs for players
    }
    
    /**
     * Update minimap with player and AI positions
     */
    updateMinimap(player, opponents) {
        // Clear existing dots
        while (this.minimap.firstChild) {
            this.minimap.removeChild(this.minimap.firstChild);
        }
        
        // World size for scaling
        const worldSize = 500;
        const minimapSize = 150; // Minimap size in pixels
        
        // Create player dot (centered in minimap)
        const playerDot = document.createElement('div');
        playerDot.style.position = 'absolute';
        playerDot.style.width = '6px';
        playerDot.style.height = '6px';
        playerDot.style.borderRadius = '50%';
        playerDot.style.backgroundColor = '#fff';
        playerDot.style.left = '50%';
        playerDot.style.top = '50%';
        playerDot.style.transform = 'translate(-50%, -50%)';
        playerDot.style.zIndex = '10';
        this.minimap.appendChild(playerDot);
        
        // Create direction indicator
        const dirIndicator = document.createElement('div');
        dirIndicator.style.position = 'absolute';
        dirIndicator.style.width = '0';
        dirIndicator.style.height = '0';
        dirIndicator.style.borderLeft = '3px solid transparent';
        dirIndicator.style.borderRight = '3px solid transparent';
        dirIndicator.style.borderBottom = '6px solid #fff';
        dirIndicator.style.left = '50%';
        dirIndicator.style.top = '50%';
        dirIndicator.style.transform = `translate(-50%, -50%) rotate(${-player.camera.rotation.y * (180 / Math.PI)}deg)`;
        dirIndicator.style.transformOrigin = 'center bottom';
        dirIndicator.style.zIndex = '11';
        this.minimap.appendChild(dirIndicator);
        
        // Player position
        const playerPos = player.getPosition();
        
        // Create dots for opponents
        opponents.forEach(opponent => {
            if (!opponent.isAlive) return;
            
            const oppPos = opponent.getPosition();
            
            // Calculate relative position
            const relX = oppPos.x - playerPos.x;
            const relZ = oppPos.z - playerPos.z;
            
            // Don't show if too far
            const distance = Math.sqrt(relX * relX + relZ * relZ);
            if (distance > 100) return; // Don't show enemies too far away
            
            // Scale to minimap
            const minimapX = (relX / 100) * (minimapSize / 2) + minimapSize / 2;
            const minimapY = (relZ / 100) * (minimapSize / 2) + minimapSize / 2;
            
            // Skip if outside minimap bounds
            if (minimapX < 0 || minimapX > minimapSize || minimapY < 0 || minimapY > minimapSize) {
                return;
            }
            
            // Create dot
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.width = '4px';
            dot.style.height = '4px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = '#f00';
            dot.style.left = `${minimapX}px`;
            dot.style.top = `${minimapY}px`;
            dot.style.transform = 'translate(-50%, -50%)';
            this.minimap.appendChild(dot);
        });
    }
    
    /**
     * Show game over screen
     */
    showGameOver(rank, eliminations, accuracy) {
        this.gameOverScreen.classList.remove('hidden');
        this.rankText.textContent = rank;
        this.eliminationsText.textContent = eliminations;
        this.accuracyText.textContent = accuracy;
    }
}
