/**
 * InputController - Manages all input handling
 * 
 * Handles mouse, touch, and click events for menus and gameplay.
 * Routes input to appropriate handlers based on game state.
 */
export class InputController {
    constructor(game) {
        this.game = game;
        this.menuEventHandlers = null;
        this.gameEventHandlers = null;
        this.lastActionTime = 0;
        this.actionDebounceMs = 200; // 200ms debounce
    }
    
    /**
     * Check if enough time has passed since last action to prevent double-firing
     */
    canPerformAction() {
        const now = Date.now();
        if (now - this.lastActionTime < this.actionDebounceMs) {
            return false;
        }
        this.lastActionTime = now;
        return true;
    }
    
    /**
     * Setup menu interaction handlers
     */
    setupMenuInteraction() {
        const handleClick = (event) => {
            const rect = this.game.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.game.gameWidth / rect.width;
            const scaleY = this.game.gameHeight / rect.height;
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;
            
            if (this.game.stateMachine.isInState('MENU')) {
                const action = this.game.menu.handleClick(x, y);
                
                if (action === 'startGame') {
                    this.game.playSound('click');
                    this.game.stateMachine.transition('READY', { fromMenu: true });
                } else if (action === 'openSettings') {
                    if (!this.canPerformAction()) return;
                    this.game.playSound('click');
                    this.game.stateMachine.transition('SETTINGS');
                } else if (action === 'toggleMute') {
                    // Toggle mute state through audio system
                    this.game.audioSystem.toggleMute();
                    
                    // Force re-render to update mute button state
                    const canvas = this.game.physics.render.canvas;
                    const ctx = canvas.getContext('2d');
                    this.game.menu.render(ctx, this.game.gameWidth, this.game.gameHeight);
                }
            } else if (this.game.stateMachine.isInState('SETTINGS')) {
                const action = this.game.settingsMenu.handleClick(x, y);
                
                if (action === 'back_to_menu') {
                    this.game.playSound('click');
                    this.game.stateMachine.transition('MENU');
                } else if (action === 'theme_changed') {
                    this.game.playSound('click');
                    this.game.applyThemeChanges();
                } else if (action === 'physics_changed') {
                    this.game.playSound('click');
                    this.game.applyPhysicsChanges();
                } else if (action === 'refresh') {
                    // Just re-render settings menu
                    const canvas = this.game.physics.render.canvas;
                    const ctx = canvas.getContext('2d');
                    this.game.settingsMenu.render(ctx, this.game.gameWidth, this.game.gameHeight);
                }
            }
        };
        
        const handleWheel = (event) => {
            if (this.game.stateMachine.isInState('SETTINGS')) {
                event.preventDefault();
                this.game.settingsMenu.handleScroll(event.deltaY * 0.5);
                
                // Re-render
                const canvas = this.game.physics.render.canvas;
                const ctx = canvas.getContext('2d');
                this.game.settingsMenu.render(ctx, this.game.gameWidth, this.game.gameHeight);
            }
        };
        
        const handleTouchStart = (event) => {
            if (this.game.stateMachine.isInState('SETTINGS') && event.touches.length > 0) {
                const rect = this.game.physics.render.canvas.getBoundingClientRect();
                const scaleX = this.game.gameWidth / rect.width;
                const scaleY = this.game.gameHeight / rect.height;
                const touch = event.touches[0];
                const y = (touch.clientY - rect.top) * scaleY;
                
                this.game.settingsMenu.handleDragStart(y);
            }
        };
        
        const handleTouchMove = (event) => {
            if (this.game.stateMachine.isInState('SETTINGS') && event.touches.length > 0) {
                event.preventDefault();
                const rect = this.game.physics.render.canvas.getBoundingClientRect();
                const scaleX = this.game.gameWidth / rect.width;
                const scaleY = this.game.gameHeight / rect.height;
                const touch = event.touches[0];
                const y = (touch.clientY - rect.top) * scaleY;
                
                this.game.settingsMenu.handleDragMove(y);
                
                // Re-render
                const canvas = this.game.physics.render.canvas;
                const ctx = canvas.getContext('2d');
                this.game.settingsMenu.render(ctx, this.game.gameWidth, this.game.gameHeight);
            }
        };
        
        const handleTouchEnd = (event) => {
            event.preventDefault();
            
            if (this.game.stateMachine.isInState('SETTINGS')) {
                this.game.settingsMenu.handleDragEnd();
            }
            
            if (event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                const clickEvent = new MouseEvent('click', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                handleClick(clickEvent);
            }
        };
        
        // Remove existing handlers first to prevent stacking
        this.removeMenuEventListeners();
        
        const canvas = this.game.physics.render.canvas;
        if (canvas) {
            canvas.addEventListener('click', handleClick);
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
            
            this.menuEventHandlers = {
                click: handleClick,
                wheel: handleWheel,
                touchstart: handleTouchStart,
                touchmove: handleTouchMove,
                touchend: handleTouchEnd
            };
        }
    }
    
    /**
     * Setup game interaction handlers
     */
    setupGameInteraction() {
        if (!this.game.mouseConstraint) return;
        
        // Mouse/touch movement for preview ball
        const handleMouseMove = (event) => {
            if (!this.game.stateMachine.isInState('READY')) return;
            if (!this.game.elements.previewBall) return;
            
            const rect = this.game.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.game.gameWidth / rect.width;
            const x = (event.clientX - rect.left) * scaleX;
            
            this.game.elements.previewBall.position.x = x;
            
            // Update score opacity based on ball position
            this.game.renderingController.updateScoreOpacity(x);
        };
        
        // Mouse/touch release for dropping ball or home button
        const handleMouseUp = (event) => {
            const rect = this.game.physics.render.canvas.getBoundingClientRect();
            // Use logical canvas dimensions (not scaled by devicePixelRatio)
            const scaleX = this.game.gameWidth / rect.width;
            const scaleY = this.game.gameHeight / rect.height;
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;
            
            // Check home button click
            const homeButtonBounds = this.game.renderingController.getHomeButtonBounds();
            if (homeButtonBounds && 
                x >= homeButtonBounds.x && 
                x <= homeButtonBounds.x + homeButtonBounds.width &&
                y >= homeButtonBounds.y && 
                y <= homeButtonBounds.y + homeButtonBounds.height) {
                if (!this.canPerformAction()) return;
                this.game.goToMenu();
                return;
            }
            
            // Drop ball if in ready state
            if (!this.game.stateMachine.isInState('READY')) return;
            this.game.addBall(x);
        };
        
        // Touch handling
        const handleTouchMove = (event) => {
            event.preventDefault();
            if (!this.game.stateMachine.isInState('READY')) return;
            if (!this.game.elements.previewBall) return;
            if (event.touches.length === 0) return;
            
            const touch = event.touches[0];
            const rect = this.game.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.game.gameWidth / rect.width;
            const x = (touch.clientX - rect.left) * scaleX;
            
            this.game.elements.previewBall.position.x = x;
            
            // Update score opacity based on ball position
            this.game.renderingController.updateScoreOpacity(x);
        };
        
        const handleTouchEnd = (event) => {
            event.preventDefault();
            if (event.changedTouches.length === 0) return;
            
            const touch = event.changedTouches[0];
            const rect = this.game.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.game.gameWidth / rect.width;
            const scaleY = this.game.gameHeight / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            // Check home button click
            const homeButtonBounds = this.game.renderingController.getHomeButtonBounds();
            if (homeButtonBounds && 
                x >= homeButtonBounds.x && 
                x <= homeButtonBounds.x + homeButtonBounds.width &&
                y >= homeButtonBounds.y && 
                y <= homeButtonBounds.y + homeButtonBounds.height) {
                if (!this.canPerformAction()) return;
                this.game.goToMenu();
                return;
            }
            
            // Drop ball if in ready state
            if (!this.game.stateMachine.isInState('READY')) return;
            this.game.addBall(x);
        };
        
        const canvas = this.game.physics.render.canvas;
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Setup collision detection
        this.game.physicsController.setupCollisionDetection();
        
        // Store handlers for cleanup
        this.gameEventHandlers = {
            mousemove: handleMouseMove,
            mouseup: handleMouseUp,
            touchmove: handleTouchMove,
            touchend: handleTouchEnd
        };
    }
    
    /**
     * Remove menu event listeners
     */
    removeMenuEventListeners() {
        if (this.menuEventHandlers) {
            const canvas = this.game.physics.render.canvas;
            if (canvas) {
                Object.entries(this.menuEventHandlers).forEach(([event, handler]) => {
                    canvas.removeEventListener(event, handler);
                });
            }
            this.menuEventHandlers = null;
        }
    }
    
    /**
     * Remove game event listeners
     */
    removeGameEventListeners() {
        if (this.gameEventHandlers) {
            const canvas = this.game.physics.render.canvas;
            if (canvas) {
                Object.entries(this.gameEventHandlers).forEach(([event, handler]) => {
                    canvas.removeEventListener(event, handler);
                });
            }
            this.gameEventHandlers = null;
        }
    }
    
    /**
     * Setup settings interaction (uses same as menu)
     */
    setupSettingsInteraction() {
        // Settings use the same interaction as menu
        this.setupMenuInteraction();
    }
    
    /**
     * Remove settings event listeners (uses same as menu)
     */
    removeSettingsEventListeners() {
        // Settings use the same event listeners as menu
        this.removeMenuEventListeners();
    }
    
    /**
     * Remove all event listeners
     */
    removeAllEventListeners() {
        this.removeMenuEventListeners();
        this.removeGameEventListeners();
    }
}