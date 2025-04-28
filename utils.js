/**
 * Utility functions for the game
 */

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 */
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Check if a value is between min and max (inclusive)
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between a and b by t
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Convert degrees to radians
 */
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Calculate distance between two points
 */
function distance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if two objects are colliding using simple sphere collision
 */
function sphereCollision(obj1, obj2, radius1, radius2) {
    const dist = distance(obj1, obj2);
    return dist < (radius1 + radius2);
}

/**
 * Calculate a random position on a circle with given radius
 */
function randomPointOnCircle(radius) {
    const angle = Math.random() * Math.PI * 2;
    return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius
    };
}

/**
 * Format a number with commas (for scores, etc)
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Simple easing function for smoother animations
 */
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
