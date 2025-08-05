import { GAME_CONFIG } from '../utils/Config.js';

export class Menu {
    constructor(scalingSystem) {
        this.scalingSystem = scalingSystem;
        this.menuImages = {};
        this.startButtonBounds = null;
        this.loadImages();
    }
    
    /**
     * Load all menu-related images
     */
    loadImages() {
        const { images } = GAME_CONFIG.ASSETS;
        const { FRUITS } = GAME_CONFIG;
        
        // Load menu background
        this.menuImages.background = new Image();
        this.menuImages.background.src = images.menuBackground;
        
        // Load start button
        this.menuImages.startButton = new Image();
        this.menuImages.startButton.src = images.startButton;
        
        // Load fruit images
        this.menuImages.fruits = [];
        FRUITS.forEach((fruit, index) => {
            const img = new Image();
            img.src = fruit.img;
            this.menuImages.fruits[index] = img;
        });
    }
    
    /**
     * Render the menu on canvas
     */
    render(ctx, gameWidth, gameHeight) {
        const { MENU, FRUITS } = GAME_CONFIG;
        const scale = this.scalingSystem.getScale();
        
        console.log('Menu render called with:', gameWidth, gameHeight, 'scale:', scale); // Debug log
        
        // Clear canvas
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        
        // Draw menu background - adjust position for variable aspect ratios
        const bgSize = MENU.backgroundSize * scale;
        const bgX = gameWidth / 2 - bgSize / 2;
        
        // For very tall screens, position menu higher up
        const aspectRatio = gameWidth / gameHeight;
        const bgYPercent = aspectRatio < 0.5 ? 0.3 : MENU.backgroundY; // Move up on very tall screens
        const bgY = gameHeight * bgYPercent - bgSize / 2;
        
        if (this.menuImages.background.complete) {
            ctx.drawImage(this.menuImages.background, bgX, bgY, bgSize, bgSize);
        }
        
        // Draw fruit circle
        const circleRadius = MENU.circleRadius * scale;
        const centerX = gameWidth / 2;
        const centerY = gameHeight * bgYPercent; // Use same Y position as background
        const fruitRadius = MENU.fruitRadius * scale;
        
        FRUITS.forEach((fruit, index) => {
            const angle = (Math.PI * 2 * index) / FRUITS.length;
            const x = centerX + circleRadius * Math.cos(angle);
            const y = centerY + circleRadius * Math.sin(angle);
            
            if (this.menuImages.fruits[index] && this.menuImages.fruits[index].complete) {
                const fruitSize = fruitRadius * 2;
                ctx.drawImage(
                    this.menuImages.fruits[index],
                    x - fruitRadius,
                    y - fruitRadius,
                    fruitSize,
                    fruitSize
                );
            }
        });
        
        // Draw start button - adjust position for variable aspect ratios
        const buttonWidth = MENU.startButtonWidth * scale;
        const buttonHeight = MENU.startButtonHeight * scale;
        const buttonX = gameWidth / 2 - buttonWidth / 2;
        
        // Position start button lower on tall screens, but not too close to bottom
        const buttonYPercent = aspectRatio < 0.5 ? 
            Math.min(0.8, bgYPercent + 0.35) : // On very tall screens, position relative to menu but not too low
            MENU.startButtonY; // Normal positioning
        const buttonY = gameHeight * buttonYPercent - buttonHeight / 2;
        
        // Store button bounds for click detection
        this.startButtonBounds = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        
        console.log('Start button bounds set:', this.startButtonBounds); // Debug log
        
        if (this.menuImages.startButton.complete) {
            ctx.drawImage(this.menuImages.startButton, buttonX, buttonY, buttonWidth, buttonHeight);
            console.log('Start button drawn'); // Debug log
        } else {
            console.log('Start button image not loaded yet'); // Debug log
        }
    }
    
    /**
     * Check if a point is within the start button
     */
    isPointInStartButton(x, y) {
        if (!this.startButtonBounds) {
            console.log('No start button bounds available'); // Debug log
            return false;
        }
        
        const bounds = this.startButtonBounds;
        const isInside = x >= bounds.x && 
                        x <= bounds.x + bounds.width && 
                        y >= bounds.y && 
                        y <= bounds.y + bounds.height;
        
        console.log('Button bounds:', bounds); // Debug log
        console.log('Click at:', x, y, 'isInside:', isInside); // Debug log
        
        return isInside;
    }
    
    /**
     * Handle click events on the menu
     */
    handleClick(x, y) {
        console.log('Menu handleClick called with:', x, y); // Debug log
        
        if (this.isPointInStartButton(x, y)) {
            console.log('Start button clicked!'); // Debug log
            return 'startGame';
        }
        
        // For debugging - also check if click is anywhere on the menu area
        console.log('Click not on start button'); // Debug log
        return null;
    }
    
    /**
     * Update menu (for animations in the future)
     */
    update(deltaTime) {
        // Future: menu animations, fruit rotations, etc.
    }
}