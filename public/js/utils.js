/**
 * Utility functions for the game
 */

// Generate a random number between min and max (inclusive)
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random position within the world bounds
function getRandomPosition(worldSize) {
    const halfSize = worldSize / 2;
    return {
        x: getRandomInt(-halfSize, halfSize),
        y: 0, // Ground level
        z: getRandomInt(-halfSize, halfSize)
    };
}

// Calculate distance between two points in 3D space
function calculateDistance(point1, point2) {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) +
        Math.pow(point2.y - point1.y, 2) +
        Math.pow(point2.z - point1.z, 2)
    );
}

// Check if a point is within a certain distance of another point
function isWithinRange(point1, point2, range) {
    return calculateDistance(point1, point2) <= range;
}

// Linear interpolation between two values
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Clamp a value between min and max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Convert degrees to radians
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

// Get a random element from an array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Generate a unique ID
function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Check if an object is empty
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

// Deep clone an object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Throttle function to limit how often a function can be called
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Check if the device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Load a texture and return a promise
function loadTexture(path) {
    return new Promise((resolve, reject) => {
        if (typeof THREE === 'undefined') {
            reject(new Error('THREE is not defined. Make sure three.min.js is loaded correctly.'));
            return;
        }

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            path,
            texture => resolve(texture),
            undefined,
            error => reject(error)
        );
    });
}

// Load a 3D model and return a promise
function loadModel(path) {
    return new Promise((resolve, reject) => {
        if (typeof THREE === 'undefined') {
            reject(new Error('THREE is not defined. Make sure three.min.js is loaded correctly.'));
            return;
        }

        const loader = new THREE.GLTFLoader();
        loader.load(
            path,
            gltf => resolve(gltf),
            undefined,
            error => reject(error)
        );
    });
}

// Export all utility functions
window.utils = {
    getRandomInt,
    getRandomPosition,
    calculateDistance,
    isWithinRange,
    lerp,
    clamp,
    degToRad,
    radToDeg,
    getRandomElement,
    shuffleArray,
    generateUniqueId,
    isEmptyObject,
    deepClone,
    formatNumber,
    debounce,
    throttle,
    isMobileDevice,
    loadTexture,
    loadModel
};
