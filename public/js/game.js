/**
 * Main game class for the Medieval Combat Survival Game
 */

class Game {
    constructor() {
        // Game state
        this.isInitialized = false;
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Three.js components
        this.scene = null;
        this.renderer = null;
        
        // Game components
        this.world = null;
        this.player = null;
        this.ui = null;
        this.socket = null;
        
        // Settings
        this.settings = {
            multiplayer: true,
            shadows: true,
            quality: 'high',
            sound: true
        };
        
        // Initialize the game
        this.initialize();
    }
    
    // Initialize the game
    async initialize() {
        // Create loading screen (already in HTML)
        
        // Initialize Three.js
        this.initializeThreeJS();
        
        // Initialize socket connection if multiplayer is enabled
        if (this.settings.multiplayer) {
            this.initializeSocket();
        }
        
        // Create world
        this.world = new World(this.scene);
        await this.world.initialize();
        
        // Create player
        this.player = new Player(this.scene, this.world, this.socket);
        
        // Create UI
        this.ui = new UI(this.player, this.world);
        this.ui.addStyles();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the game loop
        this.isInitialized = true;
        this.start();
        
        // Show welcome message
        this.ui.showMessage('Welcome to Medieval Combat Survival Game!', 5000);
    }
    
    // Initialize Three.js
    initializeThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Enable shadows if settings allow
        if (this.settings.shadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Set up lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    // Set up lighting
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = this.settings.shadows;
        
        // Configure shadow properties
        if (this.settings.shadows) {
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;
        }
        
        this.scene.add(directionalLight);
        
        // Hemisphere light (sky and ground)
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3D8C40, 0.6);
        this.scene.add(hemisphereLight);
    }
    
    // Initialize socket connection
    initializeSocket() {
        try {
            this.socket = io();
            
            // Set up socket event handlers
            this.setupSocketEvents();
        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.settings.multiplayer = false;
            this.ui.showMessage('Failed to connect to server. Playing in offline mode.', 5000);
        }
    }
    
    // Set up socket event handlers
    setupSocketEvents() {
        if (!this.socket) return;
        
        // Handle connection
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.ui.showMessage('Connected to server', 3000);
        });
        
        // Handle disconnection
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.ui.showMessage('Disconnected from server. Playing in offline mode.', 5000);
            this.settings.multiplayer = false;
        });
        
        // Handle current players
        this.socket.on('currentPlayers', (players) => {
            // Add other players to the game
            for (const id in players) {
                if (id !== this.socket.id) {
                    this.addOtherPlayer(players[id]);
                }
            }
        });
        
        // Handle new player
        this.socket.on('newPlayer', (player) => {
            this.addOtherPlayer(player);
            this.ui.showMessage(`Player ${player.id} joined the game`, 3000);
        });
        
        // Handle player disconnection
        this.socket.on('playerDisconnected', (playerId) => {
            this.removeOtherPlayer(playerId);
            this.ui.showMessage(`Player ${playerId} left the game`, 3000);
        });
        
        // Handle player movement
        this.socket.on('playerMoved', (player) => {
            this.updateOtherPlayer(player);
        });
        
        // Handle player attack
        this.socket.on('playerAttacked', (data) => {
            // Find the target character
            const target = this.world.characters.find(c => c.id === data.target);
            
            if (target) {
                // Apply damage
                const killed = this.world.damageCharacter(target.id, data.damage);
                
                // Show damage number
                this.ui.showDamageNumber(data.damage, target.position);
            }
        });
        
        // Handle player equipment change
        this.socket.on('playerEquipmentChanged', (data) => {
            // Find the player
            const player = this.world.characters.find(c => c.id === data.playerId);
            
            if (player) {
                // Update equipment
                for (const slot in data.equipment) {
                    player.equipItem(slot, data.equipment[slot]);
                }
            }
        });
        
        // Handle item pickup
        this.socket.on('itemPickedUp', (data) => {
            // Remove item from world
            this.world.pickupItem(data.itemId);
        });
        
        // Handle building damage
        this.socket.on('buildingDamaged', (data) => {
            // Apply damage to building
            this.world.damageBuilding(data.buildingId, data.damage);
        });
        
        // Handle player damage
        this.socket.on('playerDamaged', (data) => {
            // Find the player
            const player = this.world.characters.find(c => c.id === data.playerId);
            
            if (player) {
                // Update health
                player.health = data.health;
                
                // Update appearance
                player.updateAppearance();
            }
        });
        
        // Handle player death
        this.socket.on('playerDied', (data) => {
            // Find the player
            const player = this.world.characters.find(c => c.id === data.playerId);
            
            if (player) {
                // Kill the player
                player.die();
            }
        });
        
        // Handle player respawn
        this.socket.on('playerRespawned', (player) => {
            // Find the player
            const existingPlayer = this.world.characters.find(c => c.id === player.id);
            
            if (existingPlayer) {
                // Update player
                existingPlayer.health = player.health;
                existingPlayer.position = player.position;
                existingPlayer.isDead = false;
                
                // Update appearance
                existingPlayer.updateAppearance();
                existingPlayer.updateMeshPosition();
            }
        });
    }
    
    // Add another player to the game
    addOtherPlayer(playerData) {
        // Create a new character for the other player
        const otherPlayer = new Character(
            gameModels.CHARACTER_TYPES.PLAYER,
            playerData.position,
            this.scene
        );
        
        // Set player ID
        otherPlayer.id = playerData.id;
        
        // Set player rotation
        otherPlayer.rotation = playerData.rotation;
        
        // Set player equipment
        if (playerData.equipment) {
            for (const slot in playerData.equipment) {
                otherPlayer.equipItem(slot, playerData.equipment[slot]);
            }
        }
        
        // Add to world characters
        this.world.characters.push(otherPlayer);
    }
    
    // Remove another player from the game
    removeOtherPlayer(playerId) {
        // Find the player
        const playerIndex = this.world.characters.findIndex(c => c.id === playerId);
        
        if (playerIndex !== -1) {
            const player = this.world.characters[playerIndex];
            
            // Remove from scene
            this.scene.remove(player.mesh);
            
            // Remove from world characters
            this.world.characters.splice(playerIndex, 1);
        }
    }
    
    // Update another player's position and rotation
    updateOtherPlayer(playerData) {
        // Find the player
        const player = this.world.characters.find(c => c.id === playerData.id);
        
        if (player) {
            // Update position and rotation
            player.position = playerData.position;
            player.rotation = playerData.rotation;
            
            // Update mesh position
            player.updateMeshPosition();
            
            // Update mesh rotation
            player.mesh.rotation.y = player.rotation.y;
        }
    }
    
    // Set up event listeners
    setupEventListeners() {
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Toggle settings panel with Escape key
            if (event.code === 'Escape') {
                this.toggleSettings();
            }
        });
    }
    
    // Toggle settings panel
    toggleSettings() {
        // Create settings panel if it doesn't exist
        let settingsPanel = document.getElementById('settings-panel');
        
        if (!settingsPanel) {
            settingsPanel = document.createElement('div');
            settingsPanel.id = 'settings-panel';
            settingsPanel.className = 'panel';
            settingsPanel.innerHTML = `
                <div class="panel-header">
                    <h2>Settings</h2>
                    <button id="close-settings">X</button>
                </div>
                <div class="panel-content">
                    <div class="setting">
                        <label for="setting-multiplayer">Multiplayer</label>
                        <input type="checkbox" id="setting-multiplayer" ${this.settings.multiplayer ? 'checked' : ''}>
                    </div>
                    <div class="setting">
                        <label for="setting-shadows">Shadows</label>
                        <input type="checkbox" id="setting-shadows" ${this.settings.shadows ? 'checked' : ''}>
                    </div>
                    <div class="setting">
                        <label for="setting-quality">Quality</label>
                        <select id="setting-quality">
                            <option value="low" ${this.settings.quality === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${this.settings.quality === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${this.settings.quality === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                    <div class="setting">
                        <label for="setting-sound">Sound</label>
                        <input type="checkbox" id="setting-sound" ${this.settings.sound ? 'checked' : ''}>
                    </div>
                    <button id="apply-settings">Apply</button>
                </div>
            `;
            document.body.appendChild(settingsPanel);
            
            // Add event listeners
            document.getElementById('close-settings').addEventListener('click', () => {
                settingsPanel.classList.add('hidden');
            });
            
            document.getElementById('apply-settings').addEventListener('click', () => {
                this.applySettings();
                settingsPanel.classList.add('hidden');
            });
        }
        
        // Toggle visibility
        settingsPanel.classList.toggle('hidden');
    }
    
    // Apply settings
    applySettings() {
        // Get settings from form
        const multiplayer = document.getElementById('setting-multiplayer').checked;
        const shadows = document.getElementById('setting-shadows').checked;
        const quality = document.getElementById('setting-quality').value;
        const sound = document.getElementById('setting-sound').checked;
        
        // Update settings
        this.settings.multiplayer = multiplayer;
        this.settings.shadows = shadows;
        this.settings.quality = quality;
        this.settings.sound = sound;
        
        // Apply settings
        
        // Shadows
        this.renderer.shadowMap.enabled = shadows;
        
        // Quality
        switch (quality) {
            case 'low':
                this.renderer.setPixelRatio(1);
                break;
            case 'medium':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                break;
            case 'high':
                this.renderer.setPixelRatio(window.devicePixelRatio);
                break;
        }
        
        // Multiplayer
        if (multiplayer && !this.socket) {
            this.initializeSocket();
        }
        
        // Show message
        this.ui.showMessage('Settings applied', 2000);
    }
    
    // Handle window resize
    handleResize() {
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update player camera aspect ratio
        if (this.player && this.player.camera) {
            this.player.camera.aspect = window.innerWidth / window.innerHeight;
            this.player.camera.updateProjectionMatrix();
        }
    }
    
    // Start the game loop
    start() {
        if (!this.isInitialized) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // Stop the game loop
    stop() {
        this.isRunning = false;
    }
    
    // Game loop
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time in seconds
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Limit delta time to prevent large jumps
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;
        
        // Update game state
        this.update();
        
        // Render the scene
        this.render();
        
        // Request next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // Update game state
    update() {
        // Update world
        if (this.world) {
            this.world.update(this.deltaTime);
        }
        
        // Update player
        if (this.player) {
            this.player.update(this.deltaTime);
        }
        
        // Update UI
        if (this.ui) {
            this.ui.updateUI();
        }
    }
    
    // Render the scene
    render() {
        if (this.scene && this.player && this.player.camera) {
            this.renderer.render(this.scene, this.player.camera);
        }
    }
}

// Create and start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create game instance
    window.game = new Game();
});