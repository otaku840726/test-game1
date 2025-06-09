/**
 * Player character management for the game
 */

class Player extends Character {
    constructor(scene, world, socket) {
        // Create player at town center
        super(gameModels.CHARACTER_TYPES.PLAYER, { x: 0, y: 0, z: 0 }, scene);
        
        this.world = world;
        this.socket = socket;
        this.inventory = [];
        this.maxInventorySlots = 20;
        this.selectedInventorySlot = -1;
        this.interactionRange = 3; // Distance at which player can interact with objects
        this.camera = null;
        this.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            run: false
        };
        
        // Set up camera
        this.setupCamera();
        
        // Set up input handlers
        this.setupInputHandlers();
    }
    
    // Set up the camera to follow the player
    setupCamera() {
        // Create a third-person camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(this.position);
        
        // Create a container for the camera
        this.cameraContainer = new THREE.Object3D();
        this.cameraContainer.position.set(this.position.x, this.position.y + 2, this.position.z);
        this.cameraContainer.add(this.camera);
        this.scene.add(this.cameraContainer);
        
        // Set camera offset
        this.cameraOffset = {
            distance: 10,
            height: 5,
            rotation: 0
        };
        
        // Update camera position
        this.updateCameraPosition();
    }
    
    // Update camera position to follow player
    updateCameraPosition() {
        // Position camera container at player position
        this.cameraContainer.position.set(this.position.x, this.position.y + 2, this.position.z);
        
        // Rotate camera container based on player rotation
        this.cameraContainer.rotation.y = this.rotation.y;
        
        // Position camera relative to container
        this.camera.position.set(
            0,
            this.cameraOffset.height,
            this.cameraOffset.distance
        );
        
        // Look at player
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    
    // Set up input handlers for keyboard and touch controls
    setupInputHandlers() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Mouse controls for interaction
        document.addEventListener('click', (event) => {
            this.handleClick(event);
        });
        
        // Touch controls will be handled by the joystick in UI.js
    }
    
    // Handle key down events
    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.controls.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.controls.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.controls.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.controls.moveRight = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.controls.run = true;
                break;
            case 'KeyE':
                this.interact();
                break;
            case 'KeyI':
                // Toggle inventory
                document.getElementById('inventory-panel').classList.toggle('hidden');
                break;
        }
    }
    
    // Handle key up events
    handleKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.controls.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.controls.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.controls.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.controls.moveRight = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.controls.run = false;
                break;
        }
    }
    
    // Handle click events for interaction
    handleClick(event) {
        // Cast a ray from the camera to the click position
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the raycaster
        raycaster.setFromCamera(mouse, this.camera);
        
        // Find intersections with interactable objects
        const interactables = [];
        
        // Add characters to interactables
        this.world.characters.forEach(character => {
            if (character.body && character.id !== this.id) {
                interactables.push(character.body);
                interactables.push(character.head);
            }
        });
        
        // Add buildings to interactables
        this.world.buildings.forEach(building => {
            if (building.mesh) {
                interactables.push(building.mesh);
            }
        });
        
        // Add items to interactables
        this.world.items.forEach(item => {
            if (item.mesh) {
                interactables.push(item.mesh);
            }
        });
        
        // Find intersections
        const intersects = raycaster.intersectObjects(interactables, true);
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            
            // Find the parent object (character, building, or item)
            let interactedEntity = null;
            
            // Check if it's a character
            this.world.characters.forEach(character => {
                if (character.body === intersectedObject || character.head === intersectedObject) {
                    interactedEntity = character;
                }
            });
            
            // Check if it's a building
            if (!interactedEntity) {
                this.world.buildings.forEach(building => {
                    if (building.mesh === intersectedObject) {
                        interactedEntity = building;
                    }
                });
            }
            
            // Check if it's an item
            if (!interactedEntity) {
                this.world.items.forEach(item => {
                    if (item.mesh === intersectedObject) {
                        interactedEntity = item;
                    }
                });
            }
            
            // Interact with the entity if found and within range
            if (interactedEntity) {
                const distance = utils.calculateDistance(this.position, intersects[0].point);
                
                if (distance <= this.interactionRange) {
                    this.interactWithEntity(interactedEntity);
                } else {
                    console.log('Too far to interact');
                }
            }
        }
    }
    
    // Interact with an entity (character, building, or item)
    interactWithEntity(entity) {
        // Check entity type
        if (entity.type) {
            // It's a character
            if (entity.type in gameModels.CHARACTER_TYPES) {
                this.attackCharacter(entity);
            }
            // It's a building
            else if (entity.type in gameModels.BUILDING_TYPES) {
                this.damageBuilding(entity);
            }
        }
        // It's an item
        else if (entity.itemId) {
            this.pickupItem(entity);
        }
    }
    
    // Attack a character
    attackCharacter(character) {
        // Play attack animation
        this.playAnimation('attack');
        
        // Calculate damage
        const damage = Math.max(1, this.attackPower - character.defense);
        
        // Apply damage to character
        const killed = this.world.damageCharacter(character.id, damage);
        
        // Send attack to server
        if (this.socket) {
            this.socket.emit('playerAttack', {
                target: character.id,
                damage: damage
            });
        }
        
        // If character was killed, check for drops
        if (killed && character.equipment && character.equipment.length > 0) {
            character.equipment.forEach(itemId => {
                const item = this.world.dropItem(itemId, character.position.x, character.position.z);
                console.log(`${character.type} dropped ${itemId}`);
            });
        }
    }
    
    // Damage a building
    damageBuilding(building) {
        // Play attack animation
        this.playAnimation('attack');
        
        // Apply damage to building
        const damage = 10; // Fixed damage for now
        const destroyed = this.world.damageBuilding(building.id, damage);
        
        // Send damage to server
        if (this.socket) {
            this.socket.emit('buildingDamage', {
                buildingId: building.id,
                damage: damage
            });
        }
        
        console.log(`Damaged building ${building.type}, health: ${building.health}`);
    }
    
    // Pick up an item
    pickupItem(item) {
        // Check if inventory has space
        if (this.inventory.length >= this.maxInventorySlots) {
            console.log('Inventory full');
            return;
        }
        
        // Remove item from world
        const itemId = this.world.pickupItem(item.id);
        
        if (itemId) {
            // Add to inventory
            this.inventory.push(itemId);
            
            // Send to server
            if (this.socket) {
                this.socket.emit('itemPickup', {
                    itemId: item.id,
                    item: itemId
                });
            }
            
            // Update UI
            this.updateInventoryUI();
            
            console.log(`Picked up ${itemId}`);
        }
    }
    
    // Update inventory UI
    updateInventoryUI() {
        const inventorySlots = document.getElementById('inventory-slots');
        
        if (!inventorySlots) return;
        
        // Clear existing slots
        inventorySlots.innerHTML = '';
        
        // Create slots for each item
        this.inventory.forEach((itemId, index) => {
            const itemData = gameModels.EQUIPMENT[itemId];
            
            if (itemData) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.dataset.index = index;
                slot.dataset.itemId = itemId;
                
                // Add item image
                const img = document.createElement('img');
                img.src = itemData.icon || 'assets/ui/icons/default.png';
                img.alt = itemData.name;
                slot.appendChild(img);
                
                // Add click handler
                slot.addEventListener('click', () => {
                    this.selectInventorySlot(index);
                });
                
                inventorySlots.appendChild(slot);
            }
        });
        
        // Add empty slots to fill up to max
        for (let i = this.inventory.length; i < this.maxInventorySlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot empty';
            slot.dataset.index = i;
            inventorySlots.appendChild(slot);
        }
    }
    
    // Select an inventory slot
    selectInventorySlot(index) {
        // Deselect previous slot
        if (this.selectedInventorySlot !== -1) {
            const prevSlot = document.querySelector(`.inventory-slot[data-index="${this.selectedInventorySlot}"]`);
            if (prevSlot) {
                prevSlot.classList.remove('selected');
            }
        }
        
        // Select new slot
        this.selectedInventorySlot = index;
        const slot = document.querySelector(`.inventory-slot[data-index="${index}"]`);
        
        if (slot) {
            slot.classList.add('selected');
            
            // Show item actions
            this.showItemActions(index);
        }
    }
    
    // Show actions for selected item
    showItemActions(index) {
        const itemId = this.inventory[index];
        
        if (!itemId) return;
        
        const itemData = gameModels.EQUIPMENT[itemId];
        
        if (!itemData) return;
        
        // Create action buttons
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        
        // Equip button
        const equipButton = document.createElement('button');
        equipButton.textContent = 'Equip';
        equipButton.addEventListener('click', () => {
            this.equipItemFromInventory(index);
        });
        actions.appendChild(equipButton);
        
        // Drop button
        const dropButton = document.createElement('button');
        dropButton.textContent = 'Drop';
        dropButton.addEventListener('click', () => {
            this.dropItemFromInventory(index);
        });
        actions.appendChild(dropButton);
        
        // Add actions to UI
        const actionsContainer = document.getElementById('item-actions-container');
        if (actionsContainer) {
            actionsContainer.innerHTML = '';
            actionsContainer.appendChild(actions);
        }
    }
    
    // Equip an item from inventory
    equipItemFromInventory(index) {
        const itemId = this.inventory[index];
        
        if (!itemId) return;
        
        const itemData = gameModels.EQUIPMENT[itemId];
        
        if (!itemData) return;
        
        // Determine slot based on item type
        let slot;
        switch (itemData.type) {
            case gameModels.ITEM_TYPES.WEAPON:
                slot = 'weapon';
                break;
            case gameModels.ITEM_TYPES.ARMOR:
                slot = 'body';
                break;
            case gameModels.ITEM_TYPES.HELMET:
                slot = 'head';
                break;
            case gameModels.ITEM_TYPES.SHIELD:
                slot = 'shield';
                break;
            default:
                return;
        }
        
        // Remove from inventory
        this.inventory.splice(index, 1);
        
        // If there's already an item in this slot, add it to inventory
        if (this.equipmentSlots[slot]) {
            const oldItemId = this.unequipItem(slot);
            if (oldItemId) {
                this.inventory.push(oldItemId);
            }
        }
        
        // Equip the item
        this.equipItem(slot, itemId);
        
        // Send to server
        if (this.socket) {
            this.socket.emit('equipItem', {
                equipment: Object.keys(this.equipmentSlots).reduce((acc, slot) => {
                    if (this.equipmentSlots[slot]) {
                        acc[slot] = this.equipmentSlots[slot].itemId;
                    }
                    return acc;
                }, {})
            });
        }
        
        // Update UI
        this.updateInventoryUI();
        this.updateEquipmentUI();
    }
    
    // Drop an item from inventory
    dropItemFromInventory(index) {
        const itemId = this.inventory[index];
        
        if (!itemId) return;
        
        // Remove from inventory
        this.inventory.splice(index, 1);
        
        // Drop in world
        this.world.dropItem(itemId, this.position.x, this.position.z);
        
        // Update UI
        this.updateInventoryUI();
    }
    
    // Update equipment UI
    updateEquipmentUI() {
        // Update each equipment slot in UI
        for (const slot in this.equipmentSlots) {
            const slotElement = document.querySelector(`.equipment-slot[data-slot="${slot}"]`);
            
            if (slotElement) {
                // Clear existing content
                const existingImg = slotElement.querySelector('img:not([alt])');
                if (existingImg) {
                    slotElement.removeChild(existingImg);
                }
                
                // Add item image if equipped
                if (this.equipmentSlots[slot]) {
                    const itemData = gameModels.EQUIPMENT[this.equipmentSlots[slot].itemId];
                    
                    if (itemData) {
                        const img = document.createElement('img');
                        img.src = itemData.icon || 'assets/ui/icons/default.png';
                        img.alt = itemData.name;
                        slotElement.appendChild(img);
                    }
                }
            }
        }
    }
    
    // Interact with nearby objects
    interact() {
        // Find nearest interactable object
        let nearestEntity = null;
        let nearestDistance = Infinity;
        
        // Check characters
        this.world.characters.forEach(character => {
            if (character.id !== this.id) {
                const distance = utils.calculateDistance(this.position, character.position);
                
                if (distance <= this.interactionRange && distance < nearestDistance) {
                    nearestEntity = character;
                    nearestDistance = distance;
                }
            }
        });
        
        // Check buildings
        this.world.buildings.forEach(building => {
            const distance = utils.calculateDistance(this.position, building.position);
            
            if (distance <= this.interactionRange && distance < nearestDistance) {
                nearestEntity = building;
                nearestDistance = distance;
            }
        });
        
        // Check items
        this.world.items.forEach(item => {
            const distance = utils.calculateDistance(this.position, item.position);
            
            if (distance <= this.interactionRange && distance < nearestDistance) {
                nearestEntity = item;
                nearestDistance = distance;
            }
        });
        
        // Interact with nearest entity
        if (nearestEntity) {
            this.interactWithEntity(nearestEntity);
        }
    }
    
    // Override the update method to handle player controls
    update(deltaTime) {
        if (this.isDead) return;
        
        // Handle movement based on controls
        const direction = new THREE.Vector3(0, 0, 0);
        
        if (this.controls.moveForward) {
            direction.z -= 1;
        }
        
        if (this.controls.moveBackward) {
            direction.z += 1;
        }
        
        if (this.controls.moveLeft) {
            direction.x -= 1;
        }
        
        if (this.controls.moveRight) {
            direction.x += 1;
        }
        
        // Normalize direction vector
        if (direction.length() > 0) {
            direction.normalize();
            
            // Apply run multiplier if running
            const speedMultiplier = this.controls.run ? 1.5 : 1;
            
            // Move player
            this.move({
                x: direction.x,
                z: direction.z
            }, deltaTime * speedMultiplier);
            
            // Send movement to server
            if (this.socket) {
                this.socket.emit('playerMovement', {
                    position: this.position,
                    rotation: this.rotation
                });
            }
        } else {
            // Stop moving
            this.stopMoving();
        }
        
        // Update camera position
        this.updateCameraPosition();
    }
    
    // Override the die method to handle player death
    die() {
        super.die();
        
        // Show death screen
        const deathScreen = document.createElement('div');
        deathScreen.id = 'death-screen';
        deathScreen.innerHTML = `
            <div class="death-content">
                <h2>You Died</h2>
                <p>Respawning in town...</p>
            </div>
        `;
        document.body.appendChild(deathScreen);
        
        // Respawn after delay
        setTimeout(() => {
            this.respawn();
            document.body.removeChild(deathScreen);
        }, 3000);
    }
    
    // Respawn player in town
    respawn() {
        // Reset health
        this.health = this.maxHealth;
        this.isDead = false;
        
        // Move to town center
        this.position = { x: 0, y: 0, z: 0 };
        this.updateMeshPosition();
        
        // Reset equipment
        for (const slot in this.equipmentSlots) {
            if (this.equipmentSlots[slot]) {
                this.unequipItem(slot);
            }
        }
        
        // Update appearance
        this.updateAppearance();
        
        // Send respawn to server
        if (this.socket) {
            this.socket.emit('playerRespawn', {
                position: this.position,
                health: this.health
            });
        }
    }
}

// Export Player class
window.Player = Player;