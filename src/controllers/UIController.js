/**
 * UIController - Manages UI elements and DOM interactions
 * 
 * Handles UI element references, visibility, updates, and
 * user interface state management.
 */
export class UIController {
    constructor(game) {
        this.game = game;
        this.elements = {};
    }
    
    /**
     * Initialize UI elements
     */
    initialize() {
        // Merge with existing elements from game
        this.elements = this.game.elements;
        
        // Add any missing elements
        this.elements.statusBar = document.getElementById('game-status');
        this.elements.nextBall = document.querySelector('.game-status-item:nth-child(2)');
        this.elements.tryAgain = document.getElementById('game-end-link');
        this.elements.endScore = null; // Not in current HTML
        this.elements.homeButton = null; // Not in current HTML
        
        // Setup initial UI state
        this.hideEndModal();
        this.hideGameUI();
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        // Update UI overlay to match canvas exactly
        if (this.elements.ui) {
            this.elements.ui.style.width = `${this.game.gameWidth}px`;
            this.elements.ui.style.height = `${this.game.gameHeight}px`;
            this.elements.ui.style.transform = 'none';
        }
        
        // Apply CSS scaling to UI elements
        this.game.scalingSystem.scaleUIElements();
    }
    
    /**
     * Show game UI
     */
    showGameUI() {
        if (this.elements.ui) {
            this.elements.ui.style.display = 'block';
        }
    }
    
    /**
     * Hide game UI
     */
    hideGameUI() {
        if (this.elements.ui) {
            this.elements.ui.style.display = 'none';
        }
    }
    
    /**
     * Show end modal
     */
    showEndModal() {
        if (this.elements.end) {
            this.elements.end.style.display = 'flex';
        }
    }
    
    /**
     * Hide end modal
     */
    hideEndModal() {
        if (this.elements.end) {
            this.elements.end.style.display = 'none';
        }
    }
    
    /**
     * Update score display
     */
    updateScore(score) {
        if (this.elements.score) {
            this.elements.score.innerText = score;
        }
    }
    
    /**
     * Update highscore display
     */
    updateHighscore(highscore) {
        if (this.elements.statusValue) {
            // Ensure we display 0 instead of undefined
            this.elements.statusValue.innerText = highscore !== undefined && highscore !== null ? highscore : 0;
        }
    }
    
    /**
     * Update next ball display
     */
    updateNextBall(ballData) {
        if (this.elements.nextBallImg && ballData) {
            this.elements.nextBallImg.src = ballData.img;
        }
    }
    
    /**
     * Update end score display
     */
    updateEndScore(score) {
        if (this.elements.endScore) {
            this.elements.endScore.innerText = score;
        }
    }
    
    /**
     * Update end title
     */
    updateEndTitle(title) {
        if (this.elements.endTitle) {
            this.elements.endTitle.innerText = title;
        }
    }
    
    /**
     * Reset score colors
     */
    resetScoreColors() {
        if (this.elements.score) {
            this.elements.score.style.color = 'var(--col-bg-lighter)';
            this.elements.score.style.textShadow = '3px 3px 0 var(--col-primary), -3px -3px 0 var(--col-primary), -3px 3px 0 var(--col-primary), 3px -3px 0 var(--col-primary)';
        }
    }
    
    /**
     * Setup try again button
     */
    setupTryAgainButton() {
        const tryAgainBtn = this.elements.tryAgain;
        if (!tryAgainBtn) return;
        
        // Remove any existing listeners
        const newTryAgainBtn = tryAgainBtn.cloneNode(true);
        tryAgainBtn.parentNode.replaceChild(newTryAgainBtn, tryAgainBtn);
        this.elements.tryAgain = newTryAgainBtn;
        
        // Add new listener
        newTryAgainBtn.addEventListener('click', () => {
            this.game.playSound('click');
            this.hideEndModal();
            this.game.stateMachine.transition('READY', { fromMenu: true });
        });
    }
    
    /**
     * Show highscore notification
     */
    showHighscoreNotification() {
        // Change title to indicate new highscore
        this.updateEndTitle('New Highscore!');
    }
    
    /**
     * Center game display
     */
    centerGame() {
        const container = document.getElementById('game-container');
        if (!container) return;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        const scaleX = windowWidth / this.game.gameWidth;
        const scaleY = windowHeight / this.game.gameHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = this.game.gameWidth * scale;
        const scaledHeight = this.game.gameHeight * scale;
        
        const x = (windowWidth - scaledWidth) / 2;
        const y = (windowHeight - scaledHeight) / 2;
        
        container.style.position = 'absolute';
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'top left';
    }
}