import { GAME_CONFIG } from '../utils/Config.js';

export class ScalingSystem {
    constructor() {
        this.gameScale = 1;
        this.scaledConstants = {};
        this.baseFruitSizes = null;
    }
    
    /**
     * Calculate the game scale factor based on screen dimensions
     */
    calculateScale(screenWidth, screenHeight) {
        // Simple logic: ALWAYS use full height, only clamp width on desktop
        let gameWidth, gameHeight;
        const screenAspectRatio = screenWidth / screenHeight;
        const minAspectRatio = 1.5; // Minimum width:height ratio (640:960 = 0.667)
        
        // Wait, the min aspect ratio should be width/height of base game (640/960 = 0.667)
        const minWidthHeightRatio = 640 / 960; // 0.667 - minimum game width to height ratio
        
        
        // ALWAYS use full screen height
        gameHeight = screenHeight;
        
        // Calculate width based on minimum ratio, but clamp to screen width if needed
        const minRequiredWidth = gameHeight * minWidthHeightRatio;
        
        if (screenAspectRatio >= minWidthHeightRatio) {
            // Desktop/landscape: screen is wider than minimum required
            // Use minimum required width (maintains game proportions)
            gameWidth = minRequiredWidth;
            console.log('ScalingSystem - Desktop mode: using min required width:', gameWidth); // Debug log
        } else {
            // Mobile/portrait: screen is narrower than ideal
            // Use full screen width (game will be narrower but taller)
            gameWidth = screenWidth;
            console.log('ScalingSystem - Mobile mode: using full screen width:', gameWidth); // Debug log
        }
        
        console.log('ScalingSystem - Final dimensions:', gameWidth.toFixed(0), 'x', gameHeight.toFixed(0)); // Debug log
        
        return { gameWidth, gameHeight };
    }
    
    /**
     * Update all scaling based on current game dimensions
     */
    updateScaling(gameWidth, gameHeight) {
        const { BASE_DIMENSIONS, PHYSICS, UI, MENU, GAMEPLAY } = GAME_CONFIG;
        
        // Calculate unified scale factor
        this.gameScale = gameWidth / BASE_DIMENSIONS.width;
        
        // Scale physics constants
        this.scaledConstants.wallPad = PHYSICS.wallPad * this.gameScale;
        
        // Scale UI constants
        this.scaledConstants.statusBarHeight = UI.statusBarHeight * this.gameScale;
        
        // Scale gameplay constants
        this.scaledConstants.previewBallHeight = GAMEPLAY.previewBallHeight * this.gameScale;
        this.scaledConstants.loseHeight = GAMEPLAY.loseHeight * this.gameScale;
        
        // Scale menu constants
        this.scaledConstants.menuBgSize = MENU.backgroundSize * this.gameScale;
        this.scaledConstants.menuFruitRadius = MENU.fruitRadius * this.gameScale;
        this.scaledConstants.menuCircleRadius = MENU.circleRadius * this.gameScale;
        this.scaledConstants.startButtonWidth = MENU.startButtonWidth * this.gameScale;
        this.scaledConstants.startButtonHeight = MENU.startButtonHeight * this.gameScale;
        
        return this.scaledConstants;
    }
    
    /**
     * Scale fruit sizes proportionally
     */
    scaleFruits(fruits, forceReset = false) {
        // Reset cache if forced or if the fruit count has changed (indicating theme change)
        if (!this.baseFruitSizes || forceReset || this.baseFruitSizes.length !== fruits.length) {
            this.baseFruitSizes = fruits.map(fruit => ({ ...fruit }));
        }
        
        // Always use the provided fruits for image data, but preserve cached sizes
        return fruits.map((fruit, index) => ({
            ...fruit,
            radius: fruit.radius * this.gameScale,
            scale: (fruit.radius * this.gameScale * 2) / fruit.imgSize,
            sizeIndex: index
        }));
    }
    
    
    /**
     * Apply CSS scaling to UI elements
     */
    scaleUIElements() {
        const { fontSize, spacing, sizes } = GAME_CONFIG.UI;
        
        // Scale score element
        const scoreElement = document.getElementById('game-score');
        if (scoreElement) {
            scoreElement.style.fontSize = `${fontSize.score * this.gameScale}px`;
            scoreElement.style.paddingLeft = `${spacing.scorePadding * this.gameScale}px`;
        }
        
        // Scale end title
        const endTitleElement = document.getElementById('game-end-title');
        if (endTitleElement) {
            endTitleElement.style.fontSize = `${fontSize.endTitle * this.gameScale}px`;
        }
        
        // Scale status value
        const statusValueElement = document.getElementById('game-highscore-value');
        if (statusValueElement) {
            statusValueElement.style.fontSize = `${fontSize.statusValue * this.gameScale}px`;
        }
        
        // Scale status bar items
        const statusLabels = document.querySelectorAll('.game-status-label');
        statusLabels.forEach(label => {
            label.style.fontSize = `${fontSize.statusLabel * this.gameScale}px`;
            label.style.marginLeft = `${spacing.statusMarginLeft * this.gameScale}px`;
            label.style.marginRight = `${spacing.statusMarginRight * this.gameScale}px`;
        });
        
        const statusItems = document.querySelectorAll('.game-status-item');
        statusItems.forEach(item => {
            item.style.marginRight = `${spacing.statusItemMarginRight * this.gameScale}px`;
        });
        
        // Scale status bar height
        const statusBar = document.getElementById('game-status');
        if (statusBar) {
            statusBar.style.height = `${this.scaledConstants.statusBarHeight}px`;
        }
        
        // Scale next fruit image
        const nextFruitImg = document.getElementById('game-next-fruit');
        if (nextFruitImg) {
            nextFruitImg.style.width = `${sizes.nextFruitIcon * this.gameScale}px`;
            nextFruitImg.style.height = `${sizes.nextFruitIcon * this.gameScale}px`;
        }
        
        // Scale game end modal elements
        const gameEnd = document.getElementById('game-end');
        if (gameEnd) {
            gameEnd.style.padding = `${spacing.endModalPadding * this.gameScale}px ${spacing.endModalPaddingHorizontal * this.gameScale}px`;
            gameEnd.style.borderRadius = `${sizes.endModalBorderRadius * this.gameScale}px`;
            gameEnd.style.borderWidth = `${sizes.endModalBorderWidth * this.gameScale}px`;
        }
        
        const gameEndLink = document.getElementById('game-end-link');
        if (gameEndLink) {
            gameEndLink.style.fontSize = `${fontSize.endLink * this.gameScale}px`;
            gameEndLink.style.marginTop = `${spacing.endModalMarginTop * this.gameScale}px`;
            gameEndLink.style.padding = `${spacing.endModalPadding2 * this.gameScale}px`;
            gameEndLink.style.borderRadius = `${sizes.endLinkBorderRadius * this.gameScale}px`;
        }
    }
    
    /**
     * Get the current scale factor
     */
    getScale() {
        return this.gameScale;
    }
    
    /**
     * Get scaled constant by name
     */
    getScaledConstant(name) {
        return this.scaledConstants[name];
    }
}