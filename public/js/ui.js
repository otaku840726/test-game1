/**
 * User interface management for the game
 */

class UI {
    constructor(player, world) {
        this.player = player;
        this.world = world;
        this.joystick = null;
        this.joystickContainer = document.getElementById('joystick-container');
        this.inventoryButton = document.getElementById('inventory-button');
        this.inventoryPanel = document.getElementById('inventory-panel');
        this.closeInventoryButton = document.getElementById('close-inventory');
        this.healthBar = document.getElementById('health-bar');
        this.itemActionsContainer = null;
        
        // Initialize UI
        this.initialize();
    }
    
    // Initialize UI elements
    initialize() {
        // Create item actions container if it doesn't exist
        if (!document.getElementById('item-actions-container')) {
            this.itemActionsContainer = document.createElement('div');
            this.itemActionsContainer.id = 'item-actions-container';
            this.inventoryPanel.querySelector('.panel-content').appendChild(this.itemActionsContainer);
        } else {
            this.itemActionsContainer = document.getElementById('item-actions-container');
        }
        
        // Set up joystick
        this.setupJoystick();
        
        // Set up inventory panel
        this.setupInventoryPanel();
        
        // Set up health bar
        this.setupHealthBar();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial UI update
        this.updateUI();
    }
    
    // Set up the virtual joystick
    setupJoystick() {
        // Create joystick using nipplejs
        this.joystick = nipplejs.create({
            zone: this.joystickContainer,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white',
            size: 120
        });
        
        // Set up joystick events
        this.joystick.on('move', (event, data) => {
            // Calculate direction vector from joystick data
            const angle = data.angle.radian;
            const force = Math.min(data.force, 1);
            
            const direction = {
                x: Math.cos(angle) * force,
                z: -Math.sin(angle) * force
            };
            
            // Set player movement direction
            this.player.controls.moveForward = direction.z < -0.1;
            this.player.controls.moveBackward = direction.z > 0.1;
            this.player.controls.moveLeft = direction.x < -0.1;
            this.player.controls.moveRight = direction.x > 0.1;
            
            // Set running based on force
            this.player.controls.run = force > 0.7;
        });
        
        this.joystick.on('end', () => {
            // Stop all movement when joystick is released
            this.player.controls.moveForward = false;
            this.player.controls.moveBackward = false;
            this.player.controls.moveLeft = false;
            this.player.controls.moveRight = false;
            this.player.controls.run = false;
        });
    }
    
    // Set up the inventory panel
    setupInventoryPanel() {
        // Create inventory slots
        const inventorySlots = document.getElementById('inventory-slots');
        
        if (inventorySlots) {
            // Clear existing slots
            inventorySlots.innerHTML = '';
            
            // Create empty slots
            for (let i = 0; i < this.player.maxInventorySlots; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot empty';
                slot.dataset.index = i;
                inventorySlots.appendChild(slot);
            }
        }
        
        // Create equipment slots
        const equipmentSlots = document.getElementById('equipment-slots');
        
        if (equipmentSlots) {
            // Make sure equipment slots have the correct data attributes
            const slots = equipmentSlots.querySelectorAll('.equipment-slot');
            
            slots.forEach(slot => {
                // Add click handler to unequip items
                slot.addEventListener('click', () => {
                    const slotType = slot.dataset.slot;
                    
                    if (this.player.equipmentSlots[slotType]) {
                        const itemId = this.player.unequipItem(slotType);
                        
                        if (itemId) {
                            // Add to inventory
                            this.player.inventory.push(itemId);
                            
                            // Update UI
                            this.player.updateInventoryUI();
                            this.player.updateEquipmentUI();
                        }
                    }
                });
            });
        }
    }
    
    // Set up the health bar
    setupHealthBar() {
        // Initial health bar update
        this.updateHealthBar();
    }
    
    // Set up event listeners
    setupEventListeners() {
        // Inventory button
        if (this.inventoryButton) {
            this.inventoryButton.addEventListener('click', () => {
                this.toggleInventory();
            });
        }
        
        // Close inventory button
        if (this.closeInventoryButton) {
            this.closeInventoryButton.addEventListener('click', () => {
                this.closeInventory();
            });
        }
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    // Toggle inventory panel
    toggleInventory() {
        if (this.inventoryPanel) {
            this.inventoryPanel.classList.toggle('hidden');
            
            // Update inventory UI when opened
            if (!this.inventoryPanel.classList.contains('hidden')) {
                this.player.updateInventoryUI();
                this.player.updateEquipmentUI();
            }
        }
    }
    
    // Close inventory panel
    closeInventory() {
        if (this.inventoryPanel) {
            this.inventoryPanel.classList.add('hidden');
        }
    }
    
    // Handle window resize
    handleResize() {
        // Update camera aspect ratio
        if (this.player.camera) {
            this.player.camera.aspect = window.innerWidth / window.innerHeight;
            this.player.camera.updateProjectionMatrix();
        }
    }
    
    // Update health bar
    updateHealthBar() {
        if (this.healthBar) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            this.healthBar.style.width = `${healthPercent}%`;
            
            // Change color based on health
            if (healthPercent > 60) {
                this.healthBar.style.backgroundColor = '#e74c3c'; // Red
            } else if (healthPercent > 30) {
                this.healthBar.style.backgroundColor = '#f39c12'; // Orange
            } else {
                this.healthBar.style.backgroundColor = '#c0392b'; // Dark red
            }
        }
    }
    
    // Show a message to the player
    showMessage(message, duration = 3000) {
        // Create message element if it doesn't exist
        let messageContainer = document.getElementById('message-container');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            document.body.appendChild(messageContainer);
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        // Add to container
        messageContainer.appendChild(messageElement);
        
        // Fade in
        setTimeout(() => {
            messageElement.style.opacity = '1';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            messageElement.style.opacity = '0';
            
            // Remove from DOM after fade out
            setTimeout(() => {
                messageContainer.removeChild(messageElement);
            }, 500);
        }, duration);
    }
    
    // Show damage number
    showDamageNumber(amount, position, isCritical = false) {
        // Create damage number element
        const damageElement = document.createElement('div');
        damageElement.className = 'damage-number';
        
        if (isCritical) {
            damageElement.classList.add('critical');
        }
        
        damageElement.textContent = amount;
        
        // Position in 3D space
        const screenPosition = this.worldToScreen(position);
        
        damageElement.style.left = `${screenPosition.x}px`;
        damageElement.style.top = `${screenPosition.y}px`;
        
        // Add to DOM
        document.body.appendChild(damageElement);
        
        // Animate
        setTimeout(() => {
            damageElement.style.transform = 'translateY(-50px)';
            damageElement.style.opacity = '0';
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            document.body.removeChild(damageElement);
        }, 1000);
    }
    
    // Convert world position to screen position
    worldToScreen(position) {
        // Create a vector from the 3D position
        const vector = new THREE.Vector3(position.x, position.y + 2, position.z);
        
        // Project to screen space
        vector.project(this.player.camera);
        
        // Convert to screen coordinates
        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: (-vector.y * 0.5 + 0.5) * window.innerHeight
        };
    }
    
    // Show interaction prompt
    showInteractionPrompt(text, position) {
        // Create prompt element if it doesn't exist
        let promptElement = document.getElementById('interaction-prompt');
        
        if (!promptElement) {
            promptElement = document.createElement('div');
            promptElement.id = 'interaction-prompt';
            document.body.appendChild(promptElement);
        }
        
        // Set text
        promptElement.textContent = text;
        
        // Position in 3D space
        const screenPosition = this.worldToScreen(position);
        
        promptElement.style.left = `${screenPosition.x}px`;
        promptElement.style.top = `${screenPosition.y}px`;
        
        // Show prompt
        promptElement.style.display = 'block';
    }
    
    // Hide interaction prompt
    hideInteractionPrompt() {
        const promptElement = document.getElementById('interaction-prompt');
        
        if (promptElement) {
            promptElement.style.display = 'none';
        }
    }
    
    // Show death screen
    showDeathScreen() {
        // Create death screen if it doesn't exist
        let deathScreen = document.getElementById('death-screen');
        
        if (!deathScreen) {
            deathScreen = document.createElement('div');
            deathScreen.id = 'death-screen';
            deathScreen.innerHTML = `
                <div class="death-content">
                    <h2>You Died</h2>
                    <p>Respawning in town...</p>
                </div>
            `;
            document.body.appendChild(deathScreen);
        }
        
        // Show death screen
        deathScreen.style.display = 'flex';
        
        // Hide after respawn delay
        setTimeout(() => {
            deathScreen.style.display = 'none';
        }, 3000);
    }
    
    // Update UI elements
    updateUI() {
        // Update health bar
        this.updateHealthBar();
        
        // Update nearest interactable
        this.updateNearestInteractable();
    }
    
    // Update nearest interactable object
    updateNearestInteractable() {
        // Find nearest interactable object
        let nearestEntity = null;
        let nearestDistance = Infinity;
        
        // Check characters
        this.world.characters.forEach(character => {
            if (character.id !== this.player.id) {
                const distance = utils.calculateDistance(this.player.position, character.position);
                
                if (distance <= this.player.interactionRange && distance < nearestDistance) {
                    nearestEntity = character;
                    nearestDistance = distance;
                }
            }
        });
        
        // Check buildings
        this.world.buildings.forEach(building => {
            const distance = utils.calculateDistance(this.player.position, building.position);
            
            if (distance <= this.player.interactionRange && distance < nearestDistance) {
                nearestEntity = building;
                nearestDistance = distance;
            }
        });
        
        // Check items
        this.world.items.forEach(item => {
            const distance = utils.calculateDistance(this.player.position, item.position);
            
            if (distance <= this.player.interactionRange && distance < nearestDistance) {
                nearestEntity = item;
                nearestDistance = distance;
            }
        });
        
        // Show interaction prompt for nearest entity
        if (nearestEntity) {
            let promptText = '';
            
            if (nearestEntity.type) {
                // It's a character
                if (nearestEntity.type in gameModels.CHARACTER_TYPES) {
                    promptText = `Attack ${nearestEntity.type}`;
                }
                // It's a building
                else if (nearestEntity.type in gameModels.BUILDING_TYPES) {
                    promptText = `Damage ${nearestEntity.type}`;
                }
            }
            // It's an item
            else if (nearestEntity.itemId) {
                promptText = `Pick up ${gameModels.EQUIPMENT[nearestEntity.itemId].name}`;
            }
            
            if (promptText) {
                this.showInteractionPrompt(promptText, nearestEntity.position);
            }
        } else {
            this.hideInteractionPrompt();
        }
    }
    
    // Add CSS styles for UI elements
    addStyles() {
        // Create style element if it doesn't exist
        let styleElement = document.getElementById('ui-styles');
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'ui-styles';
            document.head.appendChild(styleElement);
            
            // Add styles
            styleElement.textContent = `
                #message-container {
                    position: fixed;
                    top: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    pointer-events: none;
                }
                
                .game-message {
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    text-align: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .damage-number {
                    position: fixed;
                    color: white;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px black;
                    pointer-events: none;
                    transition: transform 1s ease, opacity 1s ease;
                    z-index: 1000;
                }
                
                .damage-number.critical {
                    color: #e74c3c;
                    font-size: 1.5em;
                }
                
                #interaction-prompt {
                    position: fixed;
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    pointer-events: none;
                    z-index: 1000;
                    display: none;
                    transform: translate(-50%, -100%);
                    margin-top: -10px;
                }
                
                #death-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(136, 0, 0, 0.5);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                }
                
                .death-content {
                    text-align: center;
                    color: white;
                }
                
                .death-content h2 {
                    font-size: 3em;
                    margin-bottom: 20px;
                }
                
                .item-actions {
                    display: flex;
                    justify-content: space-around;
                    margin-top: 10px;
                }
                
                .item-actions button {
                    background-color: rgba(52, 152, 219, 0.7);
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                }
                
                .item-actions button:hover {
                    background-color: rgba(52, 152, 219, 0.9);
                }
                
                .inventory-slot.selected {
                    border: 2px solid #3498db;
                }
            `;
        }
    }
}

// Export UI class
window.UI = UI;