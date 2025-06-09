/**
 * World generation and management for the game
 */

// Check if THREE is defined before defining the World class
if (typeof THREE === 'undefined') {
    console.error('THREE is not defined. Make sure three.min.js is loaded correctly.');
    // Define a dummy THREE object to prevent errors
    window.THREE = {
        PlaneGeometry: function() {},
        MeshStandardMaterial: function() {},
        Mesh: function() { return { rotation: {}, position: { set: function() {} } }; },
        BoxGeometry: function() {},
        MeshBasicMaterial: function() {},
        BackSide: {},
        Group: function() { return { add: function() {} }; },
        BufferGeometry: function() { return { setAttribute: function() {} }; },
        BufferAttribute: function() {},
        PointsMaterial: function() {},
        Points: function() { return { position: { set: function() {} } }; },
        Object3D: function() {},
        Vector3: function() {},
        Color: function() { return { lerp: function() {}, clone: function() {} }; },
        CylinderGeometry: function() {},
        SphereGeometry: function() {},
        DodecahedronGeometry: function() {},
        CircleGeometry: function() {},
        ConeGeometry: function() {},
        CanvasTexture: function() {},
        SpriteMaterial: function() {},
        Sprite: function() { return { position: { set: function() {} }, scale: { set: function() {} } }; },
        AnimationMixer: function() { return { update: function() {} }; }
    };
}

class World {
    constructor(scene, size = 1000) {
        this.scene = scene;
        this.size = size;
        this.buildings = [];
        this.environmentObjects = [];
        this.items = [];
        this.characters = [];
        this.townCenter = { x: 0, y: 0, z: 0 };
        this.assetLoader = new gameModels.AssetLoader();
    }

    // Initialize the world
    async initialize() {
        // Create ground
        this.createGround();

        // Create skybox
        this.createSkybox();

        // Load assets
        await this.loadAssets();

        // Generate town
        this.generateTown();

        // Generate environment
        this.generateEnvironment();

        // Generate characters
        this.generateCharacters();
    }

    // Create the ground
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(this.size, this.size);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3d8c40,
            roughness: 0.8,
            metalness: 0.2
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add some ground texture variation
        this.addGroundDetails();
    }

    // Add details to the ground (grass, dirt patches, etc.)
    addGroundDetails() {
        // Add grass patches
        for (let i = 0; i < 100; i++) {
            const size = utils.getRandomInt(5, 20);
            const position = utils.getRandomPosition(this.size * 0.9);

            const grassGeometry = new THREE.PlaneGeometry(size, size);
            const grassMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x2d7a30,
                roughness: 0.9,
                metalness: 0.1
            });

            const grassPatch = new THREE.Mesh(grassGeometry, grassMaterial);
            grassPatch.rotation.x = -Math.PI / 2;
            grassPatch.position.set(position.x, 0.01, position.z); // Slightly above ground to prevent z-fighting
            this.scene.add(grassPatch);
        }

        // Add dirt patches
        for (let i = 0; i < 50; i++) {
            const size = utils.getRandomInt(5, 15);
            const position = utils.getRandomPosition(this.size * 0.9);

            const dirtGeometry = new THREE.PlaneGeometry(size, size);
            const dirtMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8b4513,
                roughness: 0.9,
                metalness: 0.1
            });

            const dirtPatch = new THREE.Mesh(dirtGeometry, dirtMaterial);
            dirtPatch.rotation.x = -Math.PI / 2;
            dirtPatch.position.set(position.x, 0.02, position.z); // Slightly above ground to prevent z-fighting
            this.scene.add(dirtPatch);
        }
    }

    // Create the skybox
    createSkybox() {
        const skyboxGeometry = new THREE.BoxGeometry(this.size * 2, this.size * 2, this.size * 2);
        const skyboxMaterials = [
            new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide }), // Right
            new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide }), // Left
            new THREE.MeshBasicMaterial({ color: 0x4ca3dd, side: THREE.BackSide }), // Top
            new THREE.MeshBasicMaterial({ color: 0x8b4513, side: THREE.BackSide }), // Bottom
            new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide }), // Front
            new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide })  // Back
        ];

        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
        this.scene.add(skybox);
    }

    // Load all necessary assets
    async loadAssets() {
        return new Promise((resolve) => {
            this.assetLoader.loadAssets(() => {
                resolve();
            });
        });
    }

    // Generate the town
    generateTown() {
        // Town center is at (0,0,0)
        this.townCenter = { x: 0, y: 0, z: 0 };

        // Create town square
        this.createTownSquare();

        // Create buildings around the town square
        this.createTownBuildings();

        // Create town walls
        this.createTownWalls();
    }

    // Create the town square
    createTownSquare() {
        // Create a central plaza
        const plazaGeometry = new THREE.PlaneGeometry(50, 50);
        const plazaMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x999999,
            roughness: 0.8,
            metalness: 0.2
        });

        const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
        plaza.rotation.x = -Math.PI / 2;
        plaza.position.set(0, 0.05, 0); // Slightly above ground
        this.scene.add(plaza);

        // Add a central fountain or statue
        const fountainGeometry = new THREE.CylinderGeometry(5, 5, 2, 16);
        const fountainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.6,
            metalness: 0.4
        });

        const fountain = new THREE.Mesh(fountainGeometry, fountainMaterial);
        fountain.position.set(0, 1, 0);
        this.scene.add(fountain);

        // Add a water surface to the fountain
        const waterGeometry = new THREE.CircleGeometry(4.5, 16);
        const waterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4ca3dd,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
        });

        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.set(0, 2, 0);
        this.scene.add(water);
    }

    // Create buildings around the town square
    createTownBuildings() {
        // Define building positions around the town square
        const buildingPositions = [
            { x: -30, z: -30, type: gameModels.BUILDING_TYPES.HOUSE, rotation: 0 },
            { x: -30, z: 0, type: gameModels.BUILDING_TYPES.SHOP, rotation: Math.PI / 2 },
            { x: -30, z: 30, type: gameModels.BUILDING_TYPES.HOUSE, rotation: 0 },
            { x: 0, z: -30, type: gameModels.BUILDING_TYPES.TAVERN, rotation: Math.PI },
            { x: 0, z: 30, type: gameModels.BUILDING_TYPES.BLACKSMITH, rotation: 0 },
            { x: 30, z: -30, type: gameModels.BUILDING_TYPES.HOUSE, rotation: Math.PI / 2 },
            { x: 30, z: 0, type: gameModels.BUILDING_TYPES.CHURCH, rotation: -Math.PI / 2 },
            { x: 30, z: 30, type: gameModels.BUILDING_TYPES.HOUSE, rotation: Math.PI }
        ];

        // Create each building
        buildingPositions.forEach(pos => {
            this.createBuilding(pos.x, pos.z, pos.type, pos.rotation);
        });
    }

    // Create a building at the specified position
    createBuilding(x, z, type, rotation = 0) {
        // Get building definition
        const buildingDef = gameModels.MODELS[type];

        if (buildingDef) {
            // Try to load the 3D model
            this.loadBuildingModel(x, z, type, rotation, buildingDef);
        } else {
            // Fallback to simple placeholder if model definition not found
            this.createPlaceholderBuilding(x, z, type, rotation);
        }
    }

    // Load the building 3D model
    async loadBuildingModel(x, z, type, rotation, buildingDef) {
        try {
            // Check if the model is already loaded in the asset loader
            let gltf = this.assetLoader.getModel(type);

            // If not loaded yet, load it now
            if (!gltf) {
                gltf = await utils.loadModel(buildingDef.model);
            }

            // Clone the model to avoid conflicts with other instances
            const buildingMesh = gltf.scene.clone();

            // Apply scale
            if (buildingDef.scale) {
                buildingMesh.scale.set(buildingDef.scale, buildingDef.scale, buildingDef.scale);
            }

            // Position and rotate
            buildingMesh.position.set(x, 0, z);
            buildingMesh.rotation.y = rotation;

            // Enable shadows
            buildingMesh.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Add to scene
            this.scene.add(buildingMesh);

            // Add to buildings array
            this.buildings.push({
                id: utils.generateUniqueId(),
                type,
                position: { x, y: 0, z },
                rotation,
                health: 100,
                mesh: buildingMesh,
                modelDef: buildingDef,
                currentStage: 0 // For damage stages
            });

        } catch (error) {
            console.error(`Failed to load model for building ${type}:`, error);
            // Fallback to placeholder if model loading fails
            this.createPlaceholderBuilding(x, z, type, rotation);
        }
    }

    // Create a simple placeholder building if model loading fails
    createPlaceholderBuilding(x, z, type, rotation = 0) {
        const width = 15;
        const depth = 15;
        const height = 10;

        // Create building body
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xd2b48c,
            roughness: 0.8,
            metalness: 0.2
        });

        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, height / 2, z);
        building.rotation.y = rotation;
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);

        // Create roof
        const roofGeometry = new THREE.ConeGeometry(width * 0.7, height * 0.5, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        });

        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, height + (height * 0.25), z);
        roof.rotation.y = rotation + Math.PI / 4;
        roof.castShadow = true;
        roof.receiveShadow = true;
        this.scene.add(roof);

        // Add to buildings array
        this.buildings.push({
            id: utils.generateUniqueId(),
            type,
            position: { x, y: 0, z },
            rotation,
            health: 100,
            mesh: building,
            roof: roof,
            isPlaceholder: true
        });
    }

    // Create town walls
    createTownWalls() {
        const wallHeight = 15;
        const wallThickness = 3;
        const wallLength = 100;
        const wallDistance = 70;

        // Create walls
        const wallGeometry = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.8,
            metalness: 0.2
        });

        // North wall
        const northWall = new THREE.Mesh(wallGeometry, wallMaterial);
        northWall.position.set(0, wallHeight / 2, -wallDistance);
        this.scene.add(northWall);

        // South wall
        const southWall = new THREE.Mesh(wallGeometry, wallMaterial);
        southWall.position.set(0, wallHeight / 2, wallDistance);
        this.scene.add(southWall);

        // East wall
        const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
        const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(wallDistance, wallHeight / 2, 0);
        this.scene.add(eastWall);

        // West wall
        const westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        westWall.position.set(-wallDistance, wallHeight / 2, 0);
        this.scene.add(westWall);

        // Create towers at corners
        const towerGeometry = new THREE.CylinderGeometry(5, 5, wallHeight * 1.5, 8);
        const towerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777,
            roughness: 0.8,
            metalness: 0.3
        });

        // Northwest tower
        const nwTower = new THREE.Mesh(towerGeometry, towerMaterial);
        nwTower.position.set(-wallDistance, wallHeight * 0.75, -wallDistance);
        this.scene.add(nwTower);

        // Northeast tower
        const neTower = new THREE.Mesh(towerGeometry, towerMaterial);
        neTower.position.set(wallDistance, wallHeight * 0.75, -wallDistance);
        this.scene.add(neTower);

        // Southwest tower
        const swTower = new THREE.Mesh(towerGeometry, towerMaterial);
        swTower.position.set(-wallDistance, wallHeight * 0.75, wallDistance);
        this.scene.add(swTower);

        // Southeast tower
        const seTower = new THREE.Mesh(towerGeometry, towerMaterial);
        seTower.position.set(wallDistance, wallHeight * 0.75, wallDistance);
        this.scene.add(seTower);

        // Create gates
        const gateWidth = 15;
        const gateHeight = 10;

        // Create openings in walls for gates
        // North gate
        const northGateWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry((wallLength - gateWidth) / 2, wallHeight, wallThickness),
            wallMaterial
        );
        northGateWallLeft.position.set(-(wallLength + gateWidth) / 4, wallHeight / 2, -wallDistance);
        this.scene.add(northGateWallLeft);

        const northGateWallRight = new THREE.Mesh(
            new THREE.BoxGeometry((wallLength - gateWidth) / 2, wallHeight, wallThickness),
            wallMaterial
        );
        northGateWallRight.position.set((wallLength + gateWidth) / 4, wallHeight / 2, -wallDistance);
        this.scene.add(northGateWallRight);

        // Add gate arch
        const northGateArchGeometry = new THREE.BoxGeometry(gateWidth, wallHeight - gateHeight, wallThickness);
        const northGateArch = new THREE.Mesh(northGateArchGeometry, wallMaterial);
        northGateArch.position.set(0, gateHeight + (wallHeight - gateHeight) / 2, -wallDistance);
        this.scene.add(northGateArch);
    }

    // Generate environment objects (trees, rocks, etc.)
    generateEnvironment() {
        // Generate trees
        this.generateTrees();

        // Generate rocks
        this.generateRocks();
    }

    // Generate trees around the world
    generateTrees() {
        const treeCount = 100;
        const minDistance = 100; // Minimum distance from town center

        for (let i = 0; i < treeCount; i++) {
            const position = utils.getRandomPosition(this.size * 0.9);

            // Ensure trees are not too close to town center
            if (utils.calculateDistance(position, this.townCenter) < minDistance) {
                i--; // Try again
                continue;
            }

            this.createTree(position.x, position.z);
        }
    }

    // Create a tree at the specified position
    createTree(x, z) {
        // Create tree trunk
        const trunkHeight = utils.getRandomInt(5, 10);
        const trunkRadius = utils.getRandomInt(1, 2);

        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        });

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, trunkHeight / 2, z);
        this.scene.add(trunk);

        // Create tree foliage
        const foliageRadius = trunkRadius * 3;
        const foliageHeight = trunkHeight * 1.5;

        const foliageGeometry = new THREE.ConeGeometry(foliageRadius, foliageHeight, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2d7a30,
            roughness: 0.8,
            metalness: 0.1
        });

        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, trunkHeight + (foliageHeight / 2), z);
        this.scene.add(foliage);

        // Add to environment objects array
        this.environmentObjects.push({
            id: utils.generateUniqueId(),
            type: gameModels.ENVIRONMENT_TYPES.TREE,
            position: { x, y: 0, z },
            health: 100,
            trunk: trunk,
            foliage: foliage
        });
    }

    // Generate rocks around the world
    generateRocks() {
        const rockCount = 50;
        const minDistance = 80; // Minimum distance from town center

        for (let i = 0; i < rockCount; i++) {
            const position = utils.getRandomPosition(this.size * 0.9);

            // Ensure rocks are not too close to town center
            if (utils.calculateDistance(position, this.townCenter) < minDistance) {
                i--; // Try again
                continue;
            }

            this.createRock(position.x, position.z);
        }
    }

    // Create a rock at the specified position
    createRock(x, z) {
        const rockSize = utils.getRandomInt(2, 5);

        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.2
        });

        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(x, rockSize / 2, z);
        rock.rotation.set(
            utils.getRandomInt(0, 100) / 100 * Math.PI,
            utils.getRandomInt(0, 100) / 100 * Math.PI,
            utils.getRandomInt(0, 100) / 100 * Math.PI
        );
        this.scene.add(rock);

        // Add to environment objects array
        this.environmentObjects.push({
            id: utils.generateUniqueId(),
            type: gameModels.ENVIRONMENT_TYPES.ROCK,
            position: { x, y: 0, z },
            health: 100,
            mesh: rock
        });
    }

    // Generate characters around the world
    generateCharacters() {
        // Generate monsters in the wilderness
        this.generateMonsters();

        // Generate NPCs in the town
        this.generateTownNPCs();
    }

    // Generate monsters in the wilderness
    generateMonsters() {
        const monsterTypes = [
            gameModels.CHARACTER_TYPES.BEAST,
            gameModels.CHARACTER_TYPES.OGRE,
            gameModels.CHARACTER_TYPES.GOBLIN,
            gameModels.CHARACTER_TYPES.BOAR_MAN,
            gameModels.CHARACTER_TYPES.GIANT
        ];

        const monsterCount = 50;
        const minDistance = 150; // Minimum distance from town center

        for (let i = 0; i < monsterCount; i++) {
            const position = utils.getRandomPosition(this.size * 0.8);

            // Ensure monsters are not too close to town center
            if (utils.calculateDistance(position, this.townCenter) < minDistance) {
                i--; // Try again
                continue;
            }

            const monsterType = utils.getRandomElement(monsterTypes);
            this.createCharacter(position.x, position.z, monsterType);
        }
    }

    // Generate NPCs in the town
    generateTownNPCs() {
        const npcTypes = [
            gameModels.CHARACTER_TYPES.SOLDIER,
            gameModels.CHARACTER_TYPES.NATIVE,
            gameModels.CHARACTER_TYPES.KNIGHT
        ];

        const npcCount = 20;
        const maxDistance = 60; // Maximum distance from town center

        for (let i = 0; i < npcCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * maxDistance;

            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            const npcType = utils.getRandomElement(npcTypes);
            this.createCharacter(x, z, npcType);
        }
    }

    // Create a character at the specified position
    createCharacter(x, z, type) {
        // For now, create simple character placeholders
        // In a real implementation, we would load the 3D models

        const characterHeight = type === gameModels.CHARACTER_TYPES.GIANT ? 5 : 2;
        const characterRadius = type === gameModels.CHARACTER_TYPES.GIANT ? 1.5 : 0.5;

        // Create character body
        const bodyGeometry = new THREE.CylinderGeometry(characterRadius, characterRadius, characterHeight, 8);

        // Determine color based on character type
        let color;
        switch (type) {
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

        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });

        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(x, characterHeight / 2, z);
        this.scene.add(body);

        // Create character head
        const headGeometry = new THREE.SphereGeometry(characterRadius * 0.8, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });

        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(x, characterHeight + (characterRadius * 0.8), z);
        this.scene.add(head);

        // Randomly decide if character has equipment
        const hasEquipment = Math.random() < 0.5;
        let equipment = [];

        if (hasEquipment) {
            // Add random equipment
            const equipmentKeys = Object.keys(gameModels.EQUIPMENT);
            const randomEquipment = utils.getRandomElement(equipmentKeys);
            equipment.push(randomEquipment);
        }

        // Add to characters array
        this.characters.push({
            id: utils.generateUniqueId(),
            type,
            position: { x, y: 0, z },
            rotation: Math.random() * Math.PI * 2,
            health: 100,
            equipment: equipment,
            body: body,
            head: head
        });
    }

    // Handle damage to a building
    damageBuilding(buildingId, amount) {
        const building = this.buildings.find(b => b.id === buildingId);

        if (building) {
            // Apply damage
            building.health -= amount;

            // Clamp health to 0-100
            building.health = Math.max(0, Math.min(100, building.health));

            if (building.health <= 0) {
                // Building is destroyed
                this.destroyBuilding(building);
            } else {
                // Update building appearance based on damage
                this.updateBuildingAppearance(building);
            }

            // Add damage effect (particles, sound, etc.)
            this.addBuildingDamageEffect(building);

            return true;
        }

        return false;
    }

    // Destroy a building
    destroyBuilding(building) {
        if (building.isPlaceholder) {
            // For placeholder buildings, just change the color
            building.mesh.material.color.set(0x333333);
            if (building.roof) {
                building.roof.material.color.set(0x333333);
            }
        } else if (building.modelDef && building.modelDef.stages) {
            // For 3D models with damage stages, load the destroyed model
            const destroyedStage = building.modelDef.stages.find(stage => stage.health === 0);

            if (destroyedStage && destroyedStage.model) {
                // Remove current model
                this.scene.remove(building.mesh);

                // Load destroyed model
                utils.loadModel(destroyedStage.model).then(gltf => {
                    // Clone the model
                    const destroyedMesh = gltf.scene.clone();

                    // Apply scale
                    if (building.modelDef.scale) {
                        destroyedMesh.scale.set(
                            building.modelDef.scale, 
                            building.modelDef.scale, 
                            building.modelDef.scale
                        );
                    }

                    // Position and rotate
                    destroyedMesh.position.copy(building.mesh.position);
                    destroyedMesh.rotation.copy(building.mesh.rotation);

                    // Enable shadows
                    destroyedMesh.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Add to scene
                    this.scene.add(destroyedMesh);

                    // Update building reference
                    building.mesh = destroyedMesh;
                    building.currentStage = building.modelDef.stages.length - 1;

                }).catch(error => {
                    console.error(`Failed to load destroyed model for building ${building.type}:`, error);

                    // Fallback: change material color
                    building.mesh.traverse(child => {
                        if (child.isMesh && child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    mat.color.set(0x333333);
                                });
                            } else {
                                child.material.color.set(0x333333);
                            }
                        }
                    });
                });
            } else {
                // Fallback: change material color
                building.mesh.traverse(child => {
                    if (child.isMesh && child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.color.set(0x333333);
                            });
                        } else {
                            child.material.color.set(0x333333);
                        }
                    }
                });
            }
        }

        // Add destruction effect (particles, sound, etc.)
        this.addBuildingDestructionEffect(building);
    }

    // Update building appearance based on damage
    updateBuildingAppearance(building) {
        if (building.isPlaceholder) {
            // For placeholder buildings, just change the color
            const damageRatio = 1 - (building.health / 100);
            const color = new THREE.Color(0xd2b48c).lerp(new THREE.Color(0x333333), damageRatio);
            building.mesh.material.color.set(color);
        } else if (building.modelDef && building.modelDef.stages) {
            // For 3D models with damage stages, determine which stage to show
            const stages = building.modelDef.stages;
            let newStage = 0;

            // Find the appropriate damage stage based on health
            for (let i = 0; i < stages.length; i++) {
                if (building.health <= stages[i].health) {
                    newStage = i;
                    break;
                }
            }

            // If stage has changed, update the model
            if (newStage !== building.currentStage) {
                const stageModel = stages[newStage].model;

                if (stageModel) {
                    // Remove current model
                    this.scene.remove(building.mesh);

                    // Load new model
                    utils.loadModel(stageModel).then(gltf => {
                        // Clone the model
                        const newMesh = gltf.scene.clone();

                        // Apply scale
                        if (building.modelDef.scale) {
                            newMesh.scale.set(
                                building.modelDef.scale, 
                                building.modelDef.scale, 
                                building.modelDef.scale
                            );
                        }

                        // Position and rotate
                        newMesh.position.copy(building.mesh.position);
                        newMesh.rotation.copy(building.mesh.rotation);

                        // Enable shadows
                        newMesh.traverse(child => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });

                        // Add to scene
                        this.scene.add(newMesh);

                        // Update building reference
                        building.mesh = newMesh;
                        building.currentStage = newStage;

                    }).catch(error => {
                        console.error(`Failed to load damage stage model for building ${building.type}:`, error);
                    });
                }
            }
        } else {
            // For 3D models without damage stages, adjust material color
            const damageRatio = 1 - (building.health / 100);

            building.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            // Darken and add red tint as damage increases
                            const originalColor = mat.userData.originalColor || mat.color.clone();
                            mat.userData.originalColor = originalColor;

                            const damagedColor = originalColor.clone()
                                .lerp(new THREE.Color(0x330000), damageRatio);
                            mat.color.copy(damagedColor);
                        });
                    } else {
                        // Darken and add red tint as damage increases
                        const originalColor = child.material.userData.originalColor || child.material.color.clone();
                        child.material.userData.originalColor = originalColor;

                        const damagedColor = originalColor.clone()
                            .lerp(new THREE.Color(0x330000), damageRatio);
                        child.material.color.copy(damagedColor);
                    }
                }
            });
        }
    }

    // Add visual effect when a building is damaged
    addBuildingDamageEffect(building) {
        // Create dust particles
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xCCCCCC,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });

        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Random position around the impact point
            const x = building.position.x + (Math.random() - 0.5) * 5;
            const y = Math.random() * 10 + 2;
            const z = building.position.z + (Math.random() - 0.5) * 5;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Random velocity
            velocities.push({
                x: (Math.random() - 0.5) * 2,
                y: Math.random() * 2 + 1,
                z: (Math.random() - 0.5) * 2
            });
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);

        // Animate particles
        const startTime = Date.now();
        const duration = 1000; // 1 second

        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const positions = particleGeometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x * 0.1;
                positions[i * 3 + 1] += velocities[i].y * 0.1;
                positions[i * 3 + 2] += velocities[i].z * 0.1;

                // Apply gravity
                velocities[i].y -= 0.05;
            }

            particleGeometry.attributes.position.needsUpdate = true;

            // Fade out
            particleMaterial.opacity = 0.8 * (1 - elapsed / duration);

            if (elapsed < duration) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        };

        animateParticles();
    }

    // Add visual effect when a building is destroyed
    addBuildingDestructionEffect(building) {
        // Create more intense dust and debris particles
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xAAAAAA,
            size: 0.8,
            transparent: true,
            opacity: 1.0
        });

        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Random position around the building
            const x = building.position.x + (Math.random() - 0.5) * 10;
            const y = Math.random() * 15;
            const z = building.position.z + (Math.random() - 0.5) * 10;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Random velocity (more explosive)
            velocities.push({
                x: (Math.random() - 0.5) * 4,
                y: Math.random() * 5 + 2,
                z: (Math.random() - 0.5) * 4
            });
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);

        // Animate particles
        const startTime = Date.now();
        const duration = 2000; // 2 seconds

        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const positions = particleGeometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x * 0.1;
                positions[i * 3 + 1] += velocities[i].y * 0.1;
                positions[i * 3 + 2] += velocities[i].z * 0.1;

                // Apply gravity
                velocities[i].y -= 0.08;
            }

            particleGeometry.attributes.position.needsUpdate = true;

            // Fade out
            particleMaterial.opacity = 1.0 * (1 - elapsed / duration);

            if (elapsed < duration) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        };

        animateParticles();
    }

    // Handle damage to a character
    damageCharacter(characterId, amount) {
        const character = this.characters.find(c => c.id === characterId);

        if (character) {
            // Apply damage
            character.health -= amount;

            // Clamp health to 0-100
            character.health = Math.max(0, Math.min(100, character.health));

            if (character.health <= 0) {
                // Character is dead
                this.killCharacter(character);
                return true; // Killed
            } else {
                // Update character appearance based on damage
                character.updateAppearance();

                // Add damage effect
                this.addCharacterDamageEffect(character);

                // Play damage animation if available
                if (character.playAnimation) {
                    character.playAnimation('damage');
                }

                return false; // Not killed
            }
        }

        return false;
    }

    // Kill a character
    killCharacter(character) {
        // Set character as dead
        character.isDead = true;
        character.health = 0;

        // Play death animation if available
        if (character.playAnimation) {
            character.playAnimation('death');
        }

        // Add death effect
        this.addCharacterDeathEffect(character);

        // Drop equipment if character has any
        if (character.equipmentSlots) {
            for (const slot in character.equipmentSlots) {
                if (character.equipmentSlots[slot]) {
                    const itemId = character.equipmentSlots[slot].itemId;
                    this.dropItem(itemId, character.position.x, character.position.z);
                }
            }
        }

        // Remove character from scene after animation
        setTimeout(() => {
            if (character.mesh) {
                this.scene.remove(character.mesh);
            }

            // Remove character from array
            const index = this.characters.findIndex(c => c.id === character.id);
            if (index !== -1) {
                this.characters.splice(index, 1);
            }
        }, 2000); // Wait for death animation to finish
    }

    // Add visual effect when a character is damaged
    addCharacterDamageEffect(character) {
        // Create blood particles
        const particleCount = 15;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xAA0000,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });

        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        // Character position (center of the character)
        const characterPos = {
            x: character.position.x,
            y: character.type === gameModels.CHARACTER_TYPES.GIANT ? 2.5 : 1.0, // Adjust based on character height
            z: character.position.z
        };

        for (let i = 0; i < particleCount; i++) {
            // Random position around the character
            const x = characterPos.x + (Math.random() - 0.5) * 1;
            const y = characterPos.y + Math.random() * 2;
            const z = characterPos.z + (Math.random() - 0.5) * 1;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Random velocity
            velocities.push({
                x: (Math.random() - 0.5) * 2,
                y: Math.random() * 1 + 0.5,
                z: (Math.random() - 0.5) * 2
            });
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);

        // Animate particles
        const startTime = Date.now();
        const duration = 800; // 0.8 seconds

        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const positions = particleGeometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x * 0.05;
                positions[i * 3 + 1] += velocities[i].y * 0.05;
                positions[i * 3 + 2] += velocities[i].z * 0.05;

                // Apply gravity
                velocities[i].y -= 0.05;
            }

            particleGeometry.attributes.position.needsUpdate = true;

            // Fade out
            particleMaterial.opacity = 0.8 * (1 - elapsed / duration);

            if (elapsed < duration) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        };

        animateParticles();

        // Add damage number floating text
        this.showDamageNumber(amount, characterPos);
    }

    // Add visual effect when a character dies
    addCharacterDeathEffect(character) {
        // Create more intense blood particles
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xAA0000,
            size: 0.4,
            transparent: true,
            opacity: 1.0
        });

        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        // Character position
        const characterPos = {
            x: character.position.x,
            y: character.type === gameModels.CHARACTER_TYPES.GIANT ? 2.5 : 1.0,
            z: character.position.z
        };

        for (let i = 0; i < particleCount; i++) {
            // Random position around the character
            const x = characterPos.x + (Math.random() - 0.5) * 2;
            const y = characterPos.y + Math.random() * 2;
            const z = characterPos.z + (Math.random() - 0.5) * 2;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Random velocity (more explosive)
            velocities.push({
                x: (Math.random() - 0.5) * 3,
                y: Math.random() * 2 + 1,
                z: (Math.random() - 0.5) * 3
            });
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);

        // Animate particles
        const startTime = Date.now();
        const duration = 1500; // 1.5 seconds

        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const positions = particleGeometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x * 0.05;
                positions[i * 3 + 1] += velocities[i].y * 0.05;
                positions[i * 3 + 2] += velocities[i].z * 0.05;

                // Apply gravity
                velocities[i].y -= 0.08;
            }

            particleGeometry.attributes.position.needsUpdate = true;

            // Fade out
            particleMaterial.opacity = 1.0 * (1 - elapsed / duration);

            if (elapsed < duration) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        };

        animateParticles();
    }

    // Show damage number as floating text
    showDamageNumber(amount, position) {
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;

        // Draw text on canvas
        context.font = 'bold 48px Arial';
        context.fillStyle = 'rgba(255, 0, 0, 1.0)';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(amount.toString(), canvas.width / 2, canvas.height / 2);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);

        // Create sprite material
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

        // Create sprite
        const sprite = new THREE.Sprite(material);
        sprite.position.set(position.x, position.y + 2, position.z);
        sprite.scale.set(2, 1, 1);
        this.scene.add(sprite);

        // Animate the damage number
        const startTime = Date.now();
        const duration = 1000; // 1 second

        const animateText = () => {
            const elapsed = Date.now() - startTime;

            // Move upward
            sprite.position.y += 0.01;

            // Fade out
            sprite.material.opacity = 1.0 * (1 - elapsed / duration);

            if (elapsed < duration) {
                requestAnimationFrame(animateText);
            } else {
                this.scene.remove(sprite);
                sprite.material.map.dispose();
                sprite.material.dispose();
            }
        };

        animateText();
    }

    // Drop an item at the specified position
    dropItem(itemId, x, z) {
        const itemData = gameModels.EQUIPMENT[itemId];

        if (!itemData) return;

        // Create a simple representation of the item
        const itemGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const itemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, // Gold color for items
            roughness: 0.4,
            metalness: 0.6
        });

        const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);
        itemMesh.position.set(x, 0.25, z);
        this.scene.add(itemMesh);

        // Add to items array
        this.items.push({
            id: utils.generateUniqueId(),
            itemId: itemId,
            position: { x, y: 0.25, z },
            mesh: itemMesh
        });
    }

    // Pick up an item
    pickupItem(itemId) {
        const item = this.items.find(i => i.id === itemId);

        if (item) {
            // Remove item from scene
            this.scene.remove(item.mesh);

            // Remove item from array
            const index = this.items.findIndex(i => i.id === itemId);
            if (index !== -1) {
                this.items.splice(index, 1);
            }

            return item.itemId;
        }

        return null;
    }

    // Update the world (called every frame)
    update(deltaTime) {
        // Update characters (movement, AI, etc.)
        this.updateCharacters(deltaTime);

        // Update items (rotation, floating effect, etc.)
        this.updateItems(deltaTime);
    }

    // Update characters
    updateCharacters(deltaTime) {
        // Simple AI for characters - random movement
        this.characters.forEach(character => {
            // 1% chance to change direction each frame
            if (Math.random() < 0.01) {
                character.rotation = Math.random() * Math.PI * 2;
            }

            // Move character in current direction
            const speed = 1; // units per second
            const distance = speed * deltaTime;

            const newX = character.position.x + Math.cos(character.rotation) * distance;
            const newZ = character.position.z + Math.sin(character.rotation) * distance;

            // Check if new position is within world bounds
            if (Math.abs(newX) < this.size / 2 && Math.abs(newZ) < this.size / 2) {
                character.position.x = newX;
                character.position.z = newZ;

                // Update mesh position
                character.body.position.x = newX;
                character.body.position.z = newZ;

                character.head.position.x = newX;
                character.head.position.z = newZ;
            }
        });
    }

    // Update items
    updateItems(deltaTime) {
        // Make items rotate and float
        this.items.forEach(item => {
            // Rotate item
            item.mesh.rotation.y += deltaTime * 2;

            // Floating effect
            const floatHeight = 0.25 + Math.sin(Date.now() * 0.003) * 0.1;
            item.mesh.position.y = floatHeight;
        });
    }
}

// Export World class
window.World = World;
