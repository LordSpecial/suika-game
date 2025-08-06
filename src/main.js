import { Game } from './game/Game.js';

// Make Matter.js available globally (required by the physics system)
window.Matter = Matter;

// Initialize the game
let game;

function initGame() {
    game = new Game();
    game.init();
}

// Resize handler
function handleResize() {
    if (game) {
        game.resize();
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Handle window resize
window.addEventListener('resize', handleResize);

// Handle orientation change specifically for iOS
window.addEventListener('orientationchange', () => {
    // iOS needs a delay after orientation change
    setTimeout(() => {
        if (game) {
            game.resize();
        }
    }, 100);
});

// Handle page visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
    if (game) {
        // Future: pause/resume functionality
    }
});