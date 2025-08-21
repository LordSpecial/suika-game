#!/usr/bin/env node

/**
 * Ball Density Calculator
 * Calculates realistic densities for reversed weight physics
 * where smaller balls are denser and larger balls are less dense
 */

// Ball radii from Config.js (theme: realFruits)
const ballRadii = [24, 32, 40, 56, 64, 72, 84, 96, 128, 160, 192];

// Physics constants
const DEFAULT_DENSITY = 0.001; // Matter.js default

/**
 * Calculate volume of a sphere
 */
function calculateVolume(radius) {
    return (4/3) * Math.PI * Math.pow(radius, 3);
}

/**
 * Calculate realistic reversed densities
 * Uses inverse relationship to radius with realistic material bounds
 */
function calculateReversedDensities() {
    const results = [];
    
    // Realistic density range (water = 1000 kg/m³ = 0.001 in Matter.js units)
    // Dense materials like lead ~11x water, light materials like cork ~0.24x water
    const maxDensity = DEFAULT_DENSITY * 8;  // Very dense (like lead)
    const minDensity = DEFAULT_DENSITY * 0.2; // Very light (like cork)
    
    const minRadius = Math.min(...ballRadii);
    const maxRadius = Math.max(...ballRadii);
    
    ballRadii.forEach((radius, index) => {
        // Inverse relationship: smaller radius = higher density
        const radiusRatio = (maxRadius - radius) / (maxRadius - minRadius);
        const density = minDensity + (radiusRatio * (maxDensity - minDensity));
        
        const volume = calculateVolume(radius);
        const mass = density * volume;
        
        results.push({
            index,
            radius,
            density: density,
            volume: volume.toFixed(2),
            mass: mass.toFixed(6),
            densityRatio: (density / DEFAULT_DENSITY).toFixed(2)
        });
    });
    
    return results;
}

/**
 * Calculate simple exponential decay densities
 */
function calculateExponentialDensities() {
    const results = [];
    
    ballRadii.forEach((radius, index) => {
        // Exponential decay: density decreases exponentially with size
        const density = DEFAULT_DENSITY * Math.pow(0.85, index) * 4;
        
        const volume = calculateVolume(radius);
        const mass = density * volume;
        
        results.push({
            index,
            radius,
            density: density,
            volume: volume.toFixed(2),
            mass: mass.toFixed(6),
            densityRatio: (density / DEFAULT_DENSITY).toFixed(2)
        });
    });
    
    return results;
}

/**
 * Calculate balanced symmetric densities
 * Both ends change proportionally from the default center
 */
function calculateBalancedDensities() {
    const results = [];
    
    // Symmetric multiplier: 4x at extremes, 1x in middle
    const maxMultiplier = 4.0;
    const numBalls = ballRadii.length;
    
    ballRadii.forEach((radius, index) => {
        // Create symmetric curve: high at start, 1x in middle, low at end
        const normalizedIndex = index / (numBalls - 1); // 0 to 1
        const distanceFromCenter = Math.abs(normalizedIndex - 0.5) * 2; // 0 to 1
        
        let density;
        if (index <= numBalls / 2) {
            // First half: heavy to normal
            const multiplier = 1 + (distanceFromCenter * (maxMultiplier - 1));
            density = DEFAULT_DENSITY * multiplier;
        } else {
            // Second half: normal to light
            const multiplier = 1 - (distanceFromCenter * (1 - 1/maxMultiplier));
            density = DEFAULT_DENSITY * multiplier;
        }
        
        const volume = calculateVolume(radius);
        const mass = density * volume;
        
        results.push({
            index,
            radius,
            density: density,
            volume: volume.toFixed(2),
            mass: mass.toFixed(6),
            densityRatio: (density / DEFAULT_DENSITY).toFixed(2)
        });
    });
    
    return results;
}

/**
 * Generate JavaScript array for BallFactory
 */
function generateJavaScriptArray(densities) {
    const values = densities.map(d => d.density.toFixed(6));
    return `[${values.join(', ')}]`;
}

console.log('=== BALL DENSITY CALCULATOR ===\n');

console.log('Ball Configuration:');
console.log(`Number of ball types: ${ballRadii.length}`);
console.log(`Radius range: ${Math.min(...ballRadii)} - ${Math.max(...ballRadii)}`);
console.log(`Default density: ${DEFAULT_DENSITY}\n`);

// Calculate realistic reversed densities
console.log('--- REALISTIC REVERSED DENSITIES ---');
const realisticDensities = calculateReversedDensities();

console.log('Type | Radius | Density   | Volume    | Mass      | vs Default');
console.log('-----|--------|-----------|-----------|-----------|----------');
realisticDensities.forEach(ball => {
    console.log(`  ${ball.index.toString().padStart(2)}  |   ${ball.radius.toString().padStart(3)}  | ${ball.density.toFixed(6)} | ${ball.volume.padStart(9)} | ${ball.mass.padStart(9)} |   ${ball.densityRatio}x`);
});

console.log('\nJavaScript array for realistic densities:');
console.log(generateJavaScriptArray(realisticDensities));

// Calculate exponential decay densities
console.log('\n--- EXPONENTIAL DECAY DENSITIES ---');
const expDensities = calculateExponentialDensities();

console.log('Type | Radius | Density   | Volume    | Mass      | vs Default');
console.log('-----|--------|-----------|-----------|-----------|----------');
expDensities.forEach(ball => {
    console.log(`  ${ball.index.toString().padStart(2)}  |   ${ball.radius.toString().padStart(3)}  | ${ball.density.toFixed(6)} | ${ball.volume.padStart(9)} | ${ball.mass.padStart(9)} |   ${ball.densityRatio}x`);
});

console.log('\nJavaScript array for exponential densities:');
console.log(generateJavaScriptArray(expDensities));

// Calculate balanced symmetric densities
console.log('\n--- BALANCED SYMMETRIC DENSITIES ---');
const balancedDensities = calculateBalancedDensities();

console.log('Type | Radius | Density   | Volume    | Mass      | vs Default');
console.log('-----|--------|-----------|-----------|-----------|----------');
balancedDensities.forEach(ball => {
    console.log(`  ${ball.index.toString().padStart(2)}  |   ${ball.radius.toString().padStart(3)}  | ${ball.density.toFixed(6)} | ${ball.volume.padStart(9)} | ${ball.mass.padStart(9)} |   ${ball.densityRatio}x`);
});

console.log('\nJavaScript array for balanced densities:');
console.log(generateJavaScriptArray(balancedDensities));

console.log('\n--- PHYSICS EXPLANATION ---');
console.log('• Higher density = heavier balls that fall faster and have more impact');
console.log('• Lower density = lighter balls that are more affected by collisions');
console.log('• Mass = Density × Volume (larger balls have more volume)');
console.log('• Realistic approach uses material-based density differences');
console.log('• Exponential approach creates more dramatic differences');
console.log('• Balanced approach creates symmetric changes around default (1.0x)');