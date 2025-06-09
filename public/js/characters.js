/**
 * Character management for the game
 */

// Check if THREE is defined before defining the Character class
if (typeof THREE === 'undefined') {
    console.error('THREE is not defined. Make sure three.min.js is loaded correctly.');
    // Define a dummy THREE object to prevent errors
    window.THREE = {
        Group: function() { 
            return { 
                position: { set: function() {} },
                add: function() {},
                rotation: { y: 0 }
            }; 
        },
        CylinderGeometry: function() {},
        MeshStandardMaterial: function() {},
        Mesh: function() { 
            return { 
                position: { set: function() {}, y: 0, x: 0, z: 0 },
                rotation: { y: 0 },
                castShadow: false
            }; 
        },
        SphereGeometry: function() {},
        BoxGeometry: function() {},
        Color: function() { return { lerp: function() {}, clone: function() {} }; },
        AnimationMixer: function() { return { update: function() {} }; },
        Object3D: function() { 
            return { 
                position: { set: function() {} },
                add: function() {},
                rotation: { y: 0 }
            }; 
        },
        Vector3: function() { return { x: 0, y: 0, z: 0 }; },
        Vector2: function() { return { x: 0, y: 0 }; },
        Raycaster: function() { 
            return { 
                setFromCamera: function() {},
                intersectObjects: function() { return []; }
            }; 
        },
        PerspectiveCamera: function() { 
            return { 
                position: { set: function() {} },
                lookAt: function() {},
                aspect: 1,
                updateProjectionMatrix: function() {}
            }; 
        }
    };
}

class Character {
    constructor(type, position, scene) {
        this.id = utils.generateUniqueId();
        this.type = type;
        this.position = position || { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scene = scene;
        this.health = 100;
        this.maxHealth = 100;
        this.equipment = {};
        this.mesh = null;
        this.animations = {};
        this.currentAnimation = null;
        this.isDead = false;
        this.isMoving = false;
        this.speed = 2; // units per second

        // Stats based on character type
        this.setupStats();

        // Create the character mesh
        this.createMesh();
    }

    // Set up character stats based on type
    setupStats() {
        switch (this.type) {
            case gameModels.CHARACTER_TYPES.PLAYER:
                this.maxHealth = 100;
                this.health = this.maxHealth;
                this.attackPower = 10;
                this.defense = 5;
                this.speed = 3;
                break;
            case gameModels.CHARACTER_TYPES.BEAST:
                this.maxHealth = 80;
                this.health = this.maxHealth;
                this.attackPower = 15;
                this.defense = 3;
                this.speed = 2.5;
                break;
            case gameModels.CHARACTER_TYPES.OGRE:
                this.maxHealth = 150;
                this.health = this.maxHealth;
                this.attackPower = 20;
                this.defense = 8;
                this.speed = 1.5;
                break;
            case gameModels.CHARACTER_TYPES.GOBLIN:
                this.maxHealth = 50;
                this.health = this.maxHealth;
                this.attackPower = 8;
                this.defense = 2;
                this.speed = 3.5;
                break;
            case gameModels.CHARACTER_TYPES.BOAR_MAN:
                this.maxHealth = 100;
                this.health = this.maxHealth;
                this.attackPower = 12;
                this.defense = 6;
                this.speed = 2.8;
                break;
            case gameModels.CHARACTER_TYPES.SOLDIER:
                this.maxHealth = 90;
                this.health = this.maxHealth;
                this.attackPower = 12;
                this.defense = 7;
                this.speed = 2.2;
                break;
            case gameModels.CHARACTER_TYPES.NATIVE:
                this.maxHealth = 70;
                this.health = this.maxHealth;
                this.attackPower = 10;
                this.defense = 4;
                this.speed = 3;
                break;
            case gameModels.CHARACTER_TYPES.KNIGHT:
                this.maxHealth = 120;
                this.health = this.maxHealth;
                this.attackPower = 15;
                this.defense = 10;
                this.speed = 2;
                break;
            case gameModels.CHARACTER_TYPES.GIANT:
                this.maxHealth = 200;
                this.health = this.maxHealth;
                this.attackPower = 25;
                this.defense = 12;
                this.speed = 1;
                break;
            default:
                this.maxHealth = 100;
                this.health = this.maxHealth;
                this.attackPower = 10;
                this.defense = 5;
                this.speed = 2;
        }
    }

    // Create the character mesh
    createMesh() {
        // Create a group to hold all character parts
        this.mesh = new THREE.Group();
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);

        // Get model definition
        const modelDef = gameModels.MODELS[this.type];

        if (modelDef) {
            // Try to load the 3D model
            this.loadCharacterModel(modelDef);
        } else {
            // Fallback to simple placeholder mesh if model definition not found
            this.createPlaceholderMesh();
        }

        // Add equipment slots
        this.equipmentSlots = {
            head: null,
            body: null,
            weapon: null,
            shield: null
        };

        // Randomly add equipment for non-player characters
        if (this.type !== gameModels.CHARACTER_TYPES.PLAYER && Math.random() < 0.5) {
            this.addRandomEquipment();
        }
    }

    // Load the character 3D model
    async loadCharacterModel(modelDef) {
        try {
            // Check if the model is already loaded in the asset loader
            let gltf = window.game && window.game.world && window.game.world.assetLoader.getModel(this.type);

            // If not loaded yet, load it now
            if (!gltf) {
                gltf = await utils.loadModel(modelDef.model);
            }

            // Clone the model to avoid conflicts with other instances
            this.modelMesh = gltf.scene.clone();

            // Apply scale
            if (modelDef.scale) {
                this.modelMesh.scale.set(modelDef.scale, modelDef.scale, modelDef.scale);
            }

            // Add to mesh group
            this.mesh.add(this.modelMesh);

            // Enable shadows
            this.modelMesh.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Set up animations if available
            if (gltf.animations && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.modelMesh);
                this.animations = {};

                // Map animation clips to animation names
                gltf.animations.forEach(clip => {
                    // Check if this animation is defined in the model definition
                    for (const [name, animName] of Object.entries(modelDef.animations || {})) {
                        if (clip.name === animName || clip.name.includes(animName)) {
                            this.animations[name] = this.mixer.clipAction(clip);
                        }
                    }
                });

                // Play idle animation by default
                if (this.animations.idle) {
                    this.animations.idle.play();
                    this.currentAnimation = 'idle';
                }
            }

            // Store reference to body and head for damage effects
            // These will be the actual model parts instead of simple geometries
            this.body = this.modelMesh;
            this.head = this.modelMesh;

        } catch (error) {
            console.error(`Failed to load model for ${this.type}:`, error);
            // Fallback to placeholder if model loading fails
            this.createPlaceholderMesh();
        }
    }

    // Create a simple placeholder mesh if model loading fails
    createPlaceholderMesh() {
        const characterHeight = this.type === gameModels.CHARACTER_TYPES.GIANT ? 5 : 2;
        const characterRadius = this.type === gameModels.CHARACTER_TYPES.GIANT ? 1.5 : 0.5;

        // Determine color based on character type
        let color;
        switch (this.type) {
            case gameModels.CHARACTER_TYPES.PLAYER:
                color = 0x1E90FF; // Dodger Blue
                break;
            case gameModels.CHARACTER_TYPES.BEAST:
                color = 0x8B4513; // Brown
                break;
            case gameModels.CHARACTER_TYPES.OGRE:
                color = 0x228B22; // Forest Green
                break;
            case gameModels.CHARACTER_TYPES.GOBLIN:
                color = 0x32CD32; // Lime Green
                break;
            case gameModels.CHARACTER_TYPES.BOAR_MAN:
                color = 0xA0522D; // Sienna
                break;
            case gameModels.CHARACTER_TYPES.SOLDIER:
                color = 0x4682B4; // Steel Blue
                break;
            case gameModels.CHARACTER_TYPES.NATIVE:
                color = 0xCD853F; // Peru
                break;
            case gameModels.CHARACTER_TYPES.KNIGHT:
                color = 0xC0C0C0; // Silver
                break;
            case gameModels.CHARACTER_TYPES.GIANT:
                color = 0x808080; // Gray
                break;
            default:
                color = 0xFFFFFF; // White
        }

        // Create character body
        const bodyGeometry = new THREE.CylinderGeometry(characterRadius, characterRadius, characterHeight, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });

        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = characterHeight / 2;
        this.body.castShadow = true;
        this.mesh.add(this.body);

        // Create character head
        const headGeometry = new THREE.SphereGeometry(characterRadius * 0.8, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });

        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = characterHeight + (characterRadius * 0.8);
        this.head.castShadow = true;
        this.mesh.add(this.head);
    }

    // Add random equipment to the character
    addRandomEquipment() {
        const equipmentTypes = ['weapon', 'body', 'head', 'shield'];
        const randomType = utils.getRandomElement(equipmentTypes);

        let equipmentOptions;
        switch (randomType) {
            case 'weapon':
                equipmentOptions = Object.keys(gameModels.EQUIPMENT).filter(key => 
                    gameModels.EQUIPMENT[key].type === gameModels.ITEM_TYPES.WEAPON
                );
                break;
            case 'body':
                equipmentOptions = Object.keys(gameModels.EQUIPMENT).filter(key => 
                    gameModels.EQUIPMENT[key].type === gameModels.ITEM_TYPES.ARMOR
                );
                break;
            case 'head':
                equipmentOptions = Object.keys(gameModels.EQUIPMENT).filter(key => 
                    gameModels.EQUIPMENT[key].type === gameModels.ITEM_TYPES.HELMET
                );
                break;
            case 'shield':
                equipmentOptions = Object.keys(gameModels.EQUIPMENT).filter(key => 
                    gameModels.EQUIPMENT[key].type === gameModels.ITEM_TYPES.SHIELD
                );
                break;
        }

        if (equipmentOptions && equipmentOptions.length > 0) {
            const randomEquipment = utils.getRandomElement(equipmentOptions);
            this.equipItem(randomType, randomEquipment);
        }
    }

    // Equip an item
    equipItem(slot, itemId) {
        const itemData = gameModels.EQUIPMENT[itemId];

        if (!itemData) return false;

        // Remove current equipment in this slot if any
        if (this.equipmentSlots[slot]) {
            this.unequipItem(slot);
        }

        // Try to load the 3D model for the equipment
        this.loadEquipmentModel(slot, itemId, itemData).then(success => {
            if (success) {
                // Update stats based on equipment
                this.updateStats();
            }
        }).catch(error => {
            console.error(`Failed to load equipment model for ${itemId}:`, error);
            // Fallback to simple placeholder if model loading fails
            this.createPlaceholderEquipment(slot, itemId);
        });

        return true;
    }

    // Load the 3D model for equipment
    async loadEquipmentModel(slot, itemId, itemData) {
        try {
            // Check if the model is already loaded in the asset loader
            let gltf = window.game && window.game.world && window.game.world.assetLoader.getModel(itemId);

            // If not loaded yet, load it now
            if (!gltf && itemData.model) {
                gltf = await utils.loadModel(itemData.model);
            }

            if (gltf) {
                // Clone the model to avoid conflicts with other instances
                const equipmentMesh = gltf.scene.clone();

                // Apply scale if defined
                if (itemData.scale) {
                    equipmentMesh.scale.set(itemData.scale, itemData.scale, itemData.scale);
                }

                // Position the equipment based on slot
                switch (slot) {
                    case 'head':
                        // Position on top of head
                        if (this.modelMesh) {
                            // For 3D model characters
                            // Find the head bone if available
                            let headBone = null;
                            this.modelMesh.traverse(child => {
                                if (child.isBone && child.name.toLowerCase().includes('head')) {
                                    headBone = child;
                                }
                            });

                            if (headBone) {
                                headBone.add(equipmentMesh);
                            } else {
                                // Fallback position
                                equipmentMesh.position.y = 2.8;
                                this.mesh.add(equipmentMesh);
                            }
                        } else {
                            // For placeholder characters
                            equipmentMesh.position.y = 2.8;
                            this.mesh.add(equipmentMesh);
                        }
                        break;
                    case 'body':
                        // Position on torso
                        if (this.modelMesh) {
                            // For 3D model characters
                            // Find the torso bone if available
                            let torsoBone = null;
                            this.modelMesh.traverse(child => {
                                if (child.isBone && (child.name.toLowerCase().includes('spine') || 
                                                    child.name.toLowerCase().includes('torso') || 
                                                    child.name.toLowerCase().includes('chest'))) {
                                    torsoBone = child;
                                }
                            });

                            if (torsoBone) {
                                torsoBone.add(equipmentMesh);
                            } else {
                                // Fallback position
                                equipmentMesh.position.y = 1.5;
                                this.mesh.add(equipmentMesh);
                            }
                        } else {
                            // For placeholder characters
                            equipmentMesh.position.y = 1.5;
                            this.mesh.add(equipmentMesh);
                        }
                        break;
                    case 'weapon':
                        // Position in right hand
                        if (this.modelMesh) {
                            // For 3D model characters
                            // Find the right hand bone if available
                            let handBone = null;
                            this.modelMesh.traverse(child => {
                                if (child.isBone && (child.name.toLowerCase().includes('hand_r') || 
                                                    child.name.toLowerCase().includes('right_hand'))) {
                                    handBone = child;
                                }
                            });

                            if (handBone) {
                                handBone.add(equipmentMesh);
                            } else {
                                // Fallback position
                                equipmentMesh.position.set(0.8, 1.5, 0);
                                this.mesh.add(equipmentMesh);
                            }
                        } else {
                            // For placeholder characters
                            equipmentMesh.position.set(0.8, 1.5, 0);
                            this.mesh.add(equipmentMesh);
                        }
                        break;
                    case 'shield':
                        // Position in left hand
                        if (this.modelMesh) {
                            // For 3D model characters
                            // Find the left hand bone if available
                            let handBone = null;
                            this.modelMesh.traverse(child => {
                                if (child.isBone && (child.name.toLowerCase().includes('hand_l') || 
                                                    child.name.toLowerCase().includes('left_hand'))) {
                                    handBone = child;
                                }
                            });

                            if (handBone) {
                                handBone.add(equipmentMesh);
                            } else {
                                // Fallback position
                                equipmentMesh.position.set(-0.8, 1.5, 0);
                                this.mesh.add(equipmentMesh);
                            }
                        } else {
                            // For placeholder characters
                            equipmentMesh.position.set(-0.8, 1.5, 0);
                            this.mesh.add(equipmentMesh);
                        }
                        break;
                }

                // Enable shadows
                equipmentMesh.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Store reference to equipment
                this.equipmentSlots[slot] = {
                    itemId: itemId,
                    mesh: equipmentMesh
                };

                return true;
            }

            return false;
        } catch (error) {
            console.error(`Failed to load equipment model for ${itemId}:`, error);
            return false;
        }
    }

    // Create a simple placeholder for equipment if model loading fails
    createPlaceholderEquipment(slot, itemId) {
        let equipmentMesh;

        switch (slot) {
            case 'head':
                const helmetGeometry = new THREE.SphereGeometry(0.6, 8, 8);
                const helmetMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xC0C0C0,
                    roughness: 0.4,
                    metalness: 0.6
                });
                equipmentMesh = new THREE.Mesh(helmetGeometry, helmetMaterial);
                equipmentMesh.position.y = 2.8;
                break;
            case 'body':
                const armorGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8);
                const armorMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x808080,
                    roughness: 0.4,
                    metalness: 0.6
                });
                equipmentMesh = new THREE.Mesh(armorGeometry, armorMaterial);
                equipmentMesh.position.y = 1.5;
                break;
            case 'weapon':
                const weaponGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
                const weaponMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.6,
                    metalness: 0.4
                });
                equipmentMesh = new THREE.Mesh(weaponGeometry, weaponMaterial);
                equipmentMesh.position.set(0.8, 1.5, 0);
                break;
            case 'shield':
                const shieldGeometry = new THREE.BoxGeometry(0.2, 1, 1);
                const shieldMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x4682B4,
                    roughness: 0.5,
                    metalness: 0.5
                });
                equipmentMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
                equipmentMesh.position.set(-0.8, 1.5, 0);
                break;
        }

        if (equipmentMesh) {
            this.mesh.add(equipmentMesh);
            this.equipmentSlots[slot] = {
                itemId: itemId,
                mesh: equipmentMesh
            };

            // Update stats based on equipment
            this.updateStats();
        }
    }

    // Unequip an item
    unequipItem(slot) {
        if (this.equipmentSlots[slot]) {
            this.mesh.remove(this.equipmentSlots[slot].mesh);
            const itemId = this.equipmentSlots[slot].itemId;
            this.equipmentSlots[slot] = null;

            // Update stats based on equipment
            this.updateStats();

            return itemId;
        }

        return null;
    }

    // Update character stats based on equipment
    updateStats() {
        // Reset to base stats
        this.setupStats();

        // Add bonuses from equipment
        for (const slot in this.equipmentSlots) {
            if (this.equipmentSlots[slot]) {
                const itemData = gameModels.EQUIPMENT[this.equipmentSlots[slot].itemId];

                if (itemData) {
                    if (itemData.defense) {
                        this.defense += itemData.defense;
                    }

                    if (itemData.damage) {
                        this.attackPower += itemData.damage;
                    }
                }
            }
        }
    }

    // Move the character
    move(direction, deltaTime) {
        if (this.isDead) return;

        this.isMoving = true;

        // Calculate movement distance
        const distance = this.speed * deltaTime;

        // Update position based on direction
        this.position.x += direction.x * distance;
        this.position.z += direction.z * distance;

        // Update mesh position
        this.updateMeshPosition();

        // Update rotation to face movement direction
        if (direction.x !== 0 || direction.z !== 0) {
            const angle = Math.atan2(direction.z, direction.x);
            this.rotation.y = angle;
            this.mesh.rotation.y = angle;
        }

        // Play walking animation
        this.playAnimation('walk');
    }

    // Update mesh position to match character position
    updateMeshPosition() {
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        // Update body and head positions
        this.body.position.set(0, this.body.geometry.parameters.height / 2, 0);
        this.head.position.set(0, this.body.geometry.parameters.height + (this.head.geometry.parameters.radius), 0);
    }

    // Stop moving
    stopMoving() {
        this.isMoving = false;

        // Play idle animation
        this.playAnimation('idle');
    }

    // Attack another character
    attack(target) {
        if (this.isDead) return;

        // Play attack animation
        this.playAnimation('attack');

        // Calculate damage
        const damage = Math.max(1, this.attackPower - target.defense);

        // Apply damage to target
        return target.takeDamage(damage, this);
    }

    // Take damage
    takeDamage(amount, attacker) {
        if (this.isDead) return false;

        // Apply damage
        this.health -= amount;

        // Check if dead
        if (this.health <= 0) {
            this.health = 0;
            this.die();
            return true;
        }

        // Play damage animation
        this.playAnimation('damage');

        // Update appearance based on damage
        this.updateAppearance();

        return false;
    }

    // Die
    die() {
        this.isDead = true;
        this.health = 0;

        // Play death animation
        this.playAnimation('death');

        // Drop equipment
        this.dropAllEquipment();
    }

    // Drop all equipment
    dropAllEquipment() {
        for (const slot in this.equipmentSlots) {
            if (this.equipmentSlots[slot]) {
                // In a real implementation, we would create a physical item in the world
                // For now, just remove the equipment from the character
                this.unequipItem(slot);
            }
        }
    }

    // Update character appearance based on health
    updateAppearance() {
        // Calculate damage ratio
        const damageRatio = 1 - (this.health / this.maxHealth);

        // Update color based on damage (more red as health decreases)
        let originalColor;
        switch (this.type) {
            case gameModels.CHARACTER_TYPES.PLAYER:
                originalColor = new THREE.Color(0x1E90FF);
                break;
            case gameModels.CHARACTER_TYPES.BEAST:
                originalColor = new THREE.Color(0x8B4513);
                break;
            case gameModels.CHARACTER_TYPES.OGRE:
                originalColor = new THREE.Color(0x228B22);
                break;
            case gameModels.CHARACTER_TYPES.GOBLIN:
                originalColor = new THREE.Color(0x32CD32);
                break;
            case gameModels.CHARACTER_TYPES.BOAR_MAN:
                originalColor = new THREE.Color(0xA0522D);
                break;
            case gameModels.CHARACTER_TYPES.SOLDIER:
                originalColor = new THREE.Color(0x4682B4);
                break;
            case gameModels.CHARACTER_TYPES.NATIVE:
                originalColor = new THREE.Color(0xCD853F);
                break;
            case gameModels.CHARACTER_TYPES.KNIGHT:
                originalColor = new THREE.Color(0xC0C0C0);
                break;
            case gameModels.CHARACTER_TYPES.GIANT:
                originalColor = new THREE.Color(0x808080);
                break;
            default:
                originalColor = new THREE.Color(0xFFFFFF);
        }

        const color = originalColor.clone().lerp(new THREE.Color(0xFF0000), damageRatio);

        // Apply color to body and head
        this.body.material.color.set(color);
        this.head.material.color.set(color);
    }

    // Play an animation
    playAnimation(animationName) {
        // If we have animations set up
        if (this.animations && this.animations[animationName]) {
            // If we're already playing this animation, don't restart it
            if (this.currentAnimation === animationName) return;

            // Stop current animation if any
            if (this.currentAnimation && this.animations[this.currentAnimation]) {
                this.animations[this.currentAnimation].stop();
            }

            // Play the new animation
            this.animations[animationName].reset();
            this.animations[animationName].play();
            this.currentAnimation = animationName;
        } else {
            // Fallback if animation not available
            this.currentAnimation = animationName;
        }
    }

    // Update the character (called every frame)
    update(deltaTime) {
        // Update animation mixer if available
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // If character is moving, continue movement in current direction
        if (this.isMoving && !this.isDead) {
            // Simple AI for non-player characters
            if (this.type !== gameModels.CHARACTER_TYPES.PLAYER) {
                // 1% chance to change direction each frame
                if (Math.random() < 0.01) {
                    const angle = Math.random() * Math.PI * 2;
                    const direction = {
                        x: Math.cos(angle),
                        z: Math.sin(angle)
                    };

                    this.move(direction, deltaTime);
                }
            }
        }
    }
}

// Export Character class
window.Character = Character;
