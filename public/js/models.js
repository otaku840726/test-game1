/**
 * Models and assets management for the game
 */

// Model types
const MODEL_TYPES = {
    PLAYER: 'player',
    BUILDING: 'building',
    MONSTER: 'monster',
    ITEM: 'item',
    WEAPON: 'weapon',
    ARMOR: 'armor',
    ENVIRONMENT: 'environment'
};

// Character types
const CHARACTER_TYPES = {
    PLAYER: 'player',
    BEAST: 'beast',
    OGRE: 'ogre',
    GOBLIN: 'goblin',
    BOAR_MAN: 'boarMan',
    SOLDIER: 'soldier',
    NATIVE: 'native',
    KNIGHT: 'knight',
    GIANT: 'giant'
};

// Building types
const BUILDING_TYPES = {
    HOUSE: 'house',
    SHOP: 'shop',
    TAVERN: 'tavern',
    BLACKSMITH: 'blacksmith',
    CHURCH: 'church',
    TOWER: 'tower',
    CASTLE: 'castle',
    WALL: 'wall',
    GATE: 'gate'
};

// Item types
const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    SHIELD: 'shield',
    HELMET: 'helmet',
    POTION: 'potion',
    FOOD: 'food',
    TREASURE: 'treasure'
};

// Weapon types
const WEAPON_TYPES = {
    SWORD: 'sword',
    AXE: 'axe',
    MACE: 'mace',
    SPEAR: 'spear',
    BOW: 'bow',
    DAGGER: 'dagger'
};

// Armor types
const ARMOR_TYPES = {
    LIGHT: 'light',
    MEDIUM: 'medium',
    HEAVY: 'heavy'
};

// Environment types
const ENVIRONMENT_TYPES = {
    TREE: 'tree',
    ROCK: 'rock',
    BUSH: 'bush',
    GRASS: 'grass',
    WATER: 'water'
};

// Model definitions with paths to assets
const MODELS = {
    // Characters
    [CHARACTER_TYPES.PLAYER]: {
        model: 'assets/models/characters/player.glb',
        texture: 'assets/textures/characters/player.png',
        scale: 1.0,
        animations: {
            idle: 'idle',
            walk: 'walk',
            run: 'run',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    [CHARACTER_TYPES.BEAST]: {
        model: 'assets/models/characters/beast.glb',
        texture: 'assets/textures/characters/beast.png',
        scale: 1.2,
        animations: {
            idle: 'idle',
            walk: 'walk',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    [CHARACTER_TYPES.OGRE]: {
        model: 'assets/models/characters/ogre.glb',
        texture: 'assets/textures/characters/ogre.png',
        scale: 1.8,
        animations: {
            idle: 'idle',
            walk: 'walk',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    [CHARACTER_TYPES.GOBLIN]: {
        model: 'assets/models/characters/goblin.glb',
        texture: 'assets/textures/characters/goblin.png',
        scale: 0.8,
        animations: {
            idle: 'idle',
            walk: 'walk',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    [CHARACTER_TYPES.BOAR_MAN]: {
        model: 'assets/models/characters/boarman.glb',
        texture: 'assets/textures/characters/boarman.png',
        scale: 1.3,
        animations: {
            idle: 'idle',
            walk: 'walk',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    [CHARACTER_TYPES.SOLDIER]: {
        model: 'assets/models/characters/soldier.glb',
        texture: 'assets/textures/characters/soldier.png',
        scale: 1.0,
        animations: {
            idle: 'idle',
            walk: 'walk',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    [CHARACTER_TYPES.NATIVE]: {
        model: 'assets/models/characters/native.glb',
        texture: 'assets/textures/characters/native.png',
        scale: 1.0,
        animations: {
            idle: 'idle',
            walk: 'walk',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    [CHARACTER_TYPES.KNIGHT]: {
        model: 'assets/models/characters/knight.glb',
        texture: 'assets/textures/characters/knight.png',
        scale: 1.1,
        animations: {
            idle: 'idle',
            walk: 'walk',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    [CHARACTER_TYPES.GIANT]: {
        model: 'assets/models/characters/giant.glb',
        texture: 'assets/textures/characters/giant.png',
        scale: 2.5,
        animations: {
            idle: 'idle',
            walk: 'walk',
            attack: 'attack',
            damage: 'damage',
            death: 'death'
        }
    },
    
    // Buildings
    [BUILDING_TYPES.HOUSE]: {
        model: 'assets/models/buildings/house.glb',
        texture: 'assets/textures/buildings/house.png',
        scale: 1.0,
        destructible: true,
        stages: [
            { health: 100, model: 'assets/models/buildings/house.glb' },
            { health: 70, model: 'assets/models/buildings/house_damaged_1.glb' },
            { health: 30, model: 'assets/models/buildings/house_damaged_2.glb' },
            { health: 0, model: 'assets/models/buildings/house_destroyed.glb' }
        ]
    },
    [BUILDING_TYPES.SHOP]: {
        model: 'assets/models/buildings/shop.glb',
        texture: 'assets/textures/buildings/shop.png',
        scale: 1.0,
        destructible: true,
        stages: [
            { health: 100, model: 'assets/models/buildings/shop.glb' },
            { health: 70, model: 'assets/models/buildings/shop_damaged_1.glb' },
            { health: 30, model: 'assets/models/buildings/shop_damaged_2.glb' },
            { health: 0, model: 'assets/models/buildings/shop_destroyed.glb' }
        ]
    },
    
    // Items
    [ITEM_TYPES.WEAPON]: {
        model: 'assets/models/items/weapon.glb',
        texture: 'assets/textures/items/weapon.png',
        scale: 0.5
    },
    [ITEM_TYPES.ARMOR]: {
        model: 'assets/models/items/armor.glb',
        texture: 'assets/textures/items/armor.png',
        scale: 0.5
    },
    [ITEM_TYPES.SHIELD]: {
        model: 'assets/models/items/shield.glb',
        texture: 'assets/textures/items/shield.png',
        scale: 0.5
    },
    [ITEM_TYPES.HELMET]: {
        model: 'assets/models/items/helmet.glb',
        texture: 'assets/textures/items/helmet.png',
        scale: 0.5
    },
    
    // Environment
    [ENVIRONMENT_TYPES.TREE]: {
        model: 'assets/models/environment/tree.glb',
        texture: 'assets/textures/environment/tree.png',
        scale: 1.0,
        destructible: true
    },
    [ENVIRONMENT_TYPES.ROCK]: {
        model: 'assets/models/environment/rock.glb',
        texture: 'assets/textures/environment/rock.png',
        scale: 1.0,
        destructible: true
    }
};

// Equipment definitions
const EQUIPMENT = {
    // Weapons
    'iron_sword': {
        type: ITEM_TYPES.WEAPON,
        subtype: WEAPON_TYPES.SWORD,
        name: 'Iron Sword',
        damage: 10,
        model: 'assets/models/items/weapons/iron_sword.glb',
        icon: 'assets/ui/icons/iron_sword.png',
        rarity: 'common'
    },
    'steel_sword': {
        type: ITEM_TYPES.WEAPON,
        subtype: WEAPON_TYPES.SWORD,
        name: 'Steel Sword',
        damage: 15,
        model: 'assets/models/items/weapons/steel_sword.glb',
        icon: 'assets/ui/icons/steel_sword.png',
        rarity: 'uncommon'
    },
    
    // Armor
    'leather_armor': {
        type: ITEM_TYPES.ARMOR,
        subtype: ARMOR_TYPES.LIGHT,
        name: 'Leather Armor',
        defense: 5,
        model: 'assets/models/items/armor/leather_armor.glb',
        icon: 'assets/ui/icons/leather_armor.png',
        rarity: 'common'
    },
    'chain_mail': {
        type: ITEM_TYPES.ARMOR,
        subtype: ARMOR_TYPES.MEDIUM,
        name: 'Chain Mail',
        defense: 10,
        model: 'assets/models/items/armor/chain_mail.glb',
        icon: 'assets/ui/icons/chain_mail.png',
        rarity: 'uncommon'
    },
    
    // Helmets
    'leather_helmet': {
        type: ITEM_TYPES.HELMET,
        name: 'Leather Helmet',
        defense: 3,
        model: 'assets/models/items/helmets/leather_helmet.glb',
        icon: 'assets/ui/icons/leather_helmet.png',
        rarity: 'common'
    },
    'iron_helmet': {
        type: ITEM_TYPES.HELMET,
        name: 'Iron Helmet',
        defense: 5,
        model: 'assets/models/items/helmets/iron_helmet.glb',
        icon: 'assets/ui/icons/iron_helmet.png',
        rarity: 'uncommon'
    },
    
    // Shields
    'wooden_shield': {
        type: ITEM_TYPES.SHIELD,
        name: 'Wooden Shield',
        defense: 5,
        model: 'assets/models/items/shields/wooden_shield.glb',
        icon: 'assets/ui/icons/wooden_shield.png',
        rarity: 'common'
    },
    'iron_shield': {
        type: ITEM_TYPES.SHIELD,
        name: 'Iron Shield',
        defense: 8,
        model: 'assets/models/items/shields/iron_shield.glb',
        icon: 'assets/ui/icons/iron_shield.png',
        rarity: 'uncommon'
    }
};

// Asset loader
class AssetLoader {
    constructor() {
        this.loadedModels = {};
        this.loadedTextures = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }
    
    // Load all necessary assets
    async loadAssets(callback) {
        // Count total assets to load
        this.totalAssets = Object.keys(MODELS).length * 2; // Models and textures
        
        // Load all models and textures
        const promises = [];
        
        for (const key in MODELS) {
            const model = MODELS[key];
            promises.push(this.loadModel(key, model.model));
            promises.push(this.loadTexture(key, model.texture));
        }
        
        try {
            await Promise.all(promises);
            if (callback) callback();
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }
    
    // Load a model
    async loadModel(key, path) {
        try {
            const gltf = await utils.loadModel(path);
            this.loadedModels[key] = gltf;
            this.updateProgress();
            return gltf;
        } catch (error) {
            console.error(`Error loading model ${path}:`, error);
            throw error;
        }
    }
    
    // Load a texture
    async loadTexture(key, path) {
        try {
            const texture = await utils.loadTexture(path);
            this.loadedTextures[key] = texture;
            this.updateProgress();
            return texture;
        } catch (error) {
            console.error(`Error loading texture ${path}:`, error);
            throw error;
        }
    }
    
    // Update loading progress
    updateProgress() {
        this.loadedAssets++;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        
        // Update loading bar
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingBar) {
            loadingBar.style.width = `${progress}%`;
        }
        
        if (loadingText) {
            loadingText.textContent = `載入中... ${Math.floor(progress)}%`;
        }
        
        // Hide loading screen when complete
        if (progress >= 100) {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 500);
            }
        }
    }
    
    // Get a loaded model
    getModel(key) {
        return this.loadedModels[key];
    }
    
    // Get a loaded texture
    getTexture(key) {
        return this.loadedTextures[key];
    }
}

// Export models and asset loader
window.gameModels = {
    MODEL_TYPES,
    CHARACTER_TYPES,
    BUILDING_TYPES,
    ITEM_TYPES,
    WEAPON_TYPES,
    ARMOR_TYPES,
    ENVIRONMENT_TYPES,
    MODELS,
    EQUIPMENT,
    AssetLoader
};