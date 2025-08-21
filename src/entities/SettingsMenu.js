import { GAME_CONFIG } from '../utils/Config.js';
import { Renderer } from '../rendering/Renderer.js';

export class SettingsMenu {
    constructor(scalingSystem, settings) {
        this.scalingSystem = scalingSystem;
        this.settings = settings;
        this.menuImages = {};
        this.currentView = 'main'; // main, themes
        this.currentThemeCategory = null; // balls, background, sounds
        this.clickableElements = [];
        this.renderer = null; // Will be set when render is called
        
        // Scroll state
        this.scrollOffset = 0;
        this.maxScroll = 0;
        this.scrollVelocity = 0;
        this.isDragging = false;
        this.lastTouchY = 0;
        this.scrollViewport = null; // Will be set during render
    }
    
    /**
     * Render the settings menu
     */
    render(ctx, gameWidth, gameHeight) {
        // Create renderer if needed
        if (!this.renderer) {
            this.renderer = new Renderer(ctx.canvas, this.scalingSystem);
        }
        
        const scale = this.scalingSystem.getScale();
        this.clickableElements = [];
        
        // Clear canvas
        this.renderer.clear();
        
        // No background image in settings
        
        if (this.currentView === 'main') {
            this.renderMainSettings(ctx, gameWidth, gameHeight, scale);
        } else if (this.currentView === 'themes') {
            this.renderThemeSettings(ctx, gameWidth, gameHeight, scale);
        }
    }
    
    /**
     * Render main settings view
     */
    renderMainSettings(ctx, gameWidth, gameHeight, scale) {
        const centerX = gameWidth / 2;
        let currentY = gameHeight * 0.2;
        const buttonHeight = 64 * scale;
        const buttonWidth = Math.min(400 * scale, gameWidth * 0.8);  // Responsive width
        const spacing = 20 * scale;
        
        // Title with outline
        this.renderer.drawTextWithOutline('Settings', centerX, currentY, {
            font: `900 ${38 * scale}px 'Azeret Mono', monospace`,  // Increased from 32
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle',
            outlineColor: '#000000',
            outlineWidth: 3
        });
        
        currentY += 60 * scale;
        
        // Themes button
        this.drawButton(ctx, centerX - buttonWidth/2, currentY, buttonWidth, buttonHeight, 'Themes', 'themes');
        currentY += buttonHeight + spacing + (30 * scale);  // Extra spacing before Physics section
        
        // Define scrollable viewport with padding - same width as buttons
        const viewportPadding = 15 * scale;
        const viewportTop = currentY;
        const viewportBottom = gameHeight * 0.85 - buttonHeight - spacing;
        const viewportHeight = viewportBottom - viewportTop;
        const viewportLeft = centerX - buttonWidth/2; // Same as button positioning
        const viewportWidth = buttonWidth; // Same width as buttons
        
        // Calculate content height
        const physicsControlsHeight = 4 * 110 * scale + 50 * scale; // 4 settings + title
        const contentHeight = physicsControlsHeight;
        
        // Update scroll boundaries
        this.maxScroll = Math.max(0, contentHeight - viewportHeight);
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
        this.scrollViewport = { 
            top: viewportTop, 
            bottom: viewportBottom, 
            height: viewportHeight,
            left: viewportLeft,
            width: viewportWidth
        };
        
        // Draw rounded border for scroll area - match button styling
        const borderRadius = 10 * scale; // Same as button border radius
        
        // Add subtle background fill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.roundRect(viewportLeft - viewportPadding, viewportTop - viewportPadding, 
                      viewportWidth + 2 * viewportPadding, viewportHeight + 2 * viewportPadding, 
                      borderRadius);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#FF6E00'; // Same as button border color
        ctx.lineWidth = 3; // Same as button border width
        ctx.beginPath();
        ctx.roundRect(viewportLeft - viewportPadding, viewportTop - viewportPadding, 
                      viewportWidth + 2 * viewportPadding, viewportHeight + 2 * viewportPadding, 
                      borderRadius);
        ctx.stroke();
        
        // Save context state and set up clipping
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(viewportLeft - viewportPadding + 5, viewportTop - viewportPadding + 5, 
                      viewportWidth + 2 * viewportPadding - 10, viewportHeight + 2 * viewportPadding - 10, 
                      borderRadius);
        ctx.clip();
        
        // Translate for scrolling
        ctx.translate(0, -this.scrollOffset);
        
        // Physics settings title with outline (now scrollable)
        this.renderer.drawTextWithOutline('Physics', centerX, currentY + 20 * scale, {
            font: `700 ${29 * scale}px 'Azeret Mono', monospace`,
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle',
            outlineColor: '#000000',
            outlineWidth: 2
        });
        currentY += 50 * scale;
        
        // Physics controls (now scrollable)
        this.renderPhysicsControls(ctx, centerX, currentY, scale, gameWidth);
        
        // Restore context (removes clipping and translation)
        ctx.restore();
        
        // Draw scroll indicator if needed
        if (this.maxScroll > 0) {
            this.drawScrollIndicator(ctx, viewportLeft, viewportWidth, viewportTop, viewportHeight);
            
            // Draw scroll arrows
            this.drawScrollArrows(ctx, viewportLeft, viewportWidth, viewportTop, viewportHeight);
        }
        
        // Back button (outside scroll area)
        currentY = gameHeight * 0.85;
        this.drawButton(ctx, centerX - buttonWidth/2, currentY, buttonWidth, buttonHeight, 'Back to Menu', 'back');
    }
    
    /**
     * Render physics controls
     */
    renderPhysicsControls(ctx, centerX, startY, scale, gameWidth) {
        const physics = this.settings.settings.physics;
        const presetNames = this.settings.getPhysicsPresetNames();
        const controlSpacing = 110 * scale;  // Extra vertical spacing
        const buttonSize = 60 * scale;  // Increased from 40
        const buttonSpacing = Math.min(90 * scale, gameWidth / 5);  // Responsive spacing, increased
        
        let currentY = startY;
        
        ['bounciness', 'gravity', 'friction', 'ballSize'].forEach(type => {
            // Label with outline
            const label = type === 'ballSize' ? 'Ball Size' : type.charAt(0).toUpperCase() + type.slice(1);
            this.renderer.drawTextWithOutline(label, centerX, currentY, {
                font: `700 ${22 * scale}px 'Azeret Mono', monospace`,  // Increased from 18
                fillStyle: '#FFFFFF',
                textAlign: 'center',
                textBaseline: 'middle',
                outlineColor: '#000000',
                outlineWidth: 2
            });
            
            // Three option buttons
            for (let i = 0; i < 3; i++) {
                const x = centerX - buttonSpacing + (i * buttonSpacing);
                const y = currentY + 15 * scale;
                const isSelected = physics[type] === i;
                
                // Button background with rounded corners
                const smallRadius = 5 * scale;
                this.renderer.fillRoundRect(x - buttonSize/2, y, buttonSize, buttonSize, smallRadius, isSelected ? '#FF8800' : '#E0E0E0');
                
                // Button border with rounded corners
                this.renderer.strokeRoundRect(x - buttonSize/2, y, buttonSize, buttonSize, smallRadius, isSelected ? '#FF6E00' : '#CCC', 2);
                
                // Button text
                this.renderer.drawText(presetNames[type][i], x, y + buttonSize/2, {
                    font: `700 ${14 * scale}px 'Azeret Mono', monospace`,  // Increased from 12
                    fillStyle: isSelected ? '#FFFFFF' : '#333',
                    textAlign: 'center',
                    textBaseline: 'middle'
                });
                
                // Store clickable area with scroll adjustment
                this.clickableElements.push({
                    x: x - buttonSize/2,
                    y: y + this.scrollOffset, // Adjust for scroll
                    width: buttonSize,
                    height: buttonSize,
                    action: 'physics',
                    type: type,
                    value: i,
                    scrollable: true // Mark as scrollable
                });
            }
            
            currentY += controlSpacing;
            
            // Add extra spacing between different physics settings
            if (type !== 'friction') {
                currentY += 20 * scale;
            }
        });
    }
    
    /**
     * Render theme settings view
     */
    renderThemeSettings(ctx, gameWidth, gameHeight, scale) {
        const centerX = gameWidth / 2;
        let currentY = gameHeight * 0.15;
        const buttonHeight = 64 * scale;
        const buttonWidth = gameWidth * 0.8;  // Use 80% of window width
        const spacing = 20 * scale;
        
        // Title with outline
        this.renderer.drawTextWithOutline('Themes', centerX, currentY, {
            font: `900 ${38 * scale}px 'Azeret Mono', monospace`,  // Increased from 32
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle',
            outlineColor: '#000000',
            outlineWidth: 3
        });
        
        currentY += 60 * scale;
        
        // Ball theme selector
        const currentBallSelection = this.settings.settings.theme.balls;
        const ballDisplayName = this.getThemeDisplayName('balls', currentBallSelection);
        
        this.drawButton(
            ctx, 
            centerX - buttonWidth/2, 
            currentY, 
            buttonWidth, 
            buttonHeight, 
            `Ball Theme: ${ballDisplayName}`,
            'theme_category',
            'balls'
        );
        currentY += buttonHeight + spacing;
        
        // Background theme selector
        const currentBgSelection = this.settings.settings.theme.background;
        const bgDisplayName = this.getThemeDisplayName('background', currentBgSelection);
        
        this.drawButton(
            ctx, 
            centerX - buttonWidth/2, 
            currentY, 
            buttonWidth, 
            buttonHeight, 
            `Background: ${bgDisplayName}`,
            'theme_category',
            'background'
        );
        currentY += buttonHeight + spacing;
        
        // Back button
        currentY = gameHeight * 0.8;
        this.drawButton(ctx, centerX - buttonWidth/2, currentY, buttonWidth, buttonHeight, 'Back', 'back_to_main');
    }
    
    /**
     * Draw a clickable button
     */
    drawButton(ctx, x, y, width, height, text, action, data = null) {
        const borderRadius = 10 * this.scalingSystem.getScale();
        
        // Button background with rounded corners
        this.renderer.fillRoundRect(x, y, width, height, borderRadius, '#FF8800');
        
        // Button border with rounded corners
        this.renderer.strokeRoundRect(x, y, width, height, borderRadius, '#FF6E00', 3);
        
        // Button text
        this.renderer.drawText(text, x + width/2, y + height/2, {
            font: `700 ${22 * this.scalingSystem.getScale()}px 'Azeret Mono', monospace`,  // Increased from 18
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle'
        });
        
        // Store clickable area
        this.clickableElements.push({
            x: x,
            y: y,
            width: width,
            height: height,
            action: action,
            data: data
        });
    }
    
    /**
     * Get display name for theme option
     */
    getThemeDisplayName(category, value) {
        const mapping = {
            balls: { 
                realFruits: 'Real Fruits', 
                cartoonFruits: 'Cartoon Fruits', 
                planets: 'Planets',
                buttons: 'Buttons',
                iceCream: 'Ice Cream'
            },
            background: { 
                default: 'Default', 
                space: 'Space',
                chalky: 'Chalky',
                paua: 'Paua',
                skelly: 'Skelly',
                stars: 'Stars',
                cottonee: 'Cottonee',
                whimsigoth: 'Whimsigoth'
            },
            sounds: { default: 'Default' }
        };
        
        return mapping[category][value] || value;
    }
    
    /**
     * Draw scroll indicator
     */
    drawScrollIndicator(ctx, viewportLeft, viewportWidth, viewportTop, viewportHeight) {
        const scale = this.scalingSystem.getScale();
        const barWidth = 6 * scale;
        const barMargin = 8 * scale;
        const barX = viewportLeft + viewportWidth - barWidth - barMargin;
        const trackHeight = viewportHeight - 2 * barMargin;
        const barHeight = Math.max(30 * scale, (viewportHeight / (viewportHeight + this.maxScroll)) * trackHeight);
        const barY = viewportTop + barMargin + (this.scrollOffset / this.maxScroll) * (trackHeight - barHeight);
        
        // Draw scrollbar track with rounded ends
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(barX, viewportTop + barMargin, barWidth, trackHeight, barWidth / 2);
        ctx.fill();
        
        // Draw scrollbar thumb with rounded ends
        ctx.fillStyle = 'rgba(255, 136, 0, 0.8)'; // Orange to match theme
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, barWidth / 2);
        ctx.fill();
        
        // Add subtle glow effect
        ctx.shadowColor = 'rgba(255, 136, 0, 0.5)';
        ctx.shadowBlur = 5 * scale;
        ctx.fillStyle = 'rgba(255, 136, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, barWidth / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    /**
     * Draw scroll arrows
     */
    drawScrollArrows(ctx, viewportLeft, viewportWidth, viewportTop, viewportHeight) {
        const scale = this.scalingSystem.getScale();
        const centerX = viewportLeft + viewportWidth / 2;
        const arrowSize = 15 * scale;
        const arrowMargin = 5 * scale;
        
        // Top arrow (show if can scroll up)
        if (this.scrollOffset > 0) {
            const opacity = Math.min(1, this.scrollOffset / (50 * scale));
            ctx.fillStyle = `rgba(255, 136, 0, ${opacity * 0.8})`;
            ctx.beginPath();
            ctx.moveTo(centerX, viewportTop + arrowMargin);
            ctx.lineTo(centerX - arrowSize, viewportTop + arrowMargin + arrowSize);
            ctx.lineTo(centerX + arrowSize, viewportTop + arrowMargin + arrowSize);
            ctx.closePath();
            ctx.fill();
        }
        
        // Bottom arrow (show if can scroll down)
        if (this.scrollOffset < this.maxScroll) {
            const opacity = Math.min(1, (this.maxScroll - this.scrollOffset) / (50 * scale));
            ctx.fillStyle = `rgba(255, 136, 0, ${opacity * 0.8})`;
            ctx.beginPath();
            ctx.moveTo(centerX, viewportTop + viewportHeight - arrowMargin);
            ctx.lineTo(centerX - arrowSize, viewportTop + viewportHeight - arrowMargin - arrowSize);
            ctx.lineTo(centerX + arrowSize, viewportTop + viewportHeight - arrowMargin - arrowSize);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    /**
     * Handle scroll events
     */
    handleScroll(deltaY) {
        if (this.maxScroll <= 0) return;
        
        this.scrollOffset += deltaY;
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
    }
    
    /**
     * Handle touch/mouse drag for scrolling
     */
    handleDragStart(y) {
        if (!this.scrollViewport) return;
        if (y >= this.scrollViewport.top && y <= this.scrollViewport.bottom) {
            this.isDragging = true;
            this.lastTouchY = y;
            this.scrollVelocity = 0;
        }
    }
    
    handleDragMove(y) {
        if (!this.isDragging) return;
        
        const deltaY = this.lastTouchY - y;
        this.handleScroll(deltaY);
        this.scrollVelocity = deltaY;
        this.lastTouchY = y;
    }
    
    handleDragEnd() {
        this.isDragging = false;
    }
    
    /**
     * Update scroll physics (for momentum)
     */
    updateScroll() {
        if (Math.abs(this.scrollVelocity) > 0.1 && !this.isDragging) {
            this.handleScroll(this.scrollVelocity);
            this.scrollVelocity *= 0.9; // Friction
        }
    }
    
    /**
     * Handle click events
     */
    handleClick(x, y) {
        for (const element of this.clickableElements) {
            // Adjust y coordinate for scrollable elements
            const elementY = element.scrollable ? element.y - this.scrollOffset : element.y;
            
            if (x >= element.x && x <= element.x + element.width &&
                y >= elementY && y <= elementY + element.height) {
                
                // Check if click is within viewport for scrollable elements
                if (element.scrollable && this.scrollViewport) {
                    if (y < this.scrollViewport.top || y > this.scrollViewport.bottom) {
                        continue; // Skip if outside viewport
                    }
                }
                
                return this.processAction(element);
            }
        }
        return null;
    }
    
    /**
     * Process button actions
     */
    processAction(element) {
        switch (element.action) {
            case 'themes':
                this.currentView = 'themes';
                return 'refresh';
                
            case 'theme_category':
                return this.cycleThemeOption(element.data);
                
            case 'physics':
                this.settings.setPhysics(element.type, element.value);
                return 'physics_changed';
                
            case 'back':
                return 'back_to_menu';
                
            case 'back_to_main':
                this.currentView = 'main';
                return 'refresh';
                
            default:
                return null;
        }
    }
    
    /**
     * Cycle through theme options
     */
    cycleThemeOption(category) {
        const options = {
            balls: ['realFruits', 'cartoonFruits', 'planets', 'buttons', 'iceCream'],
            background: ['default', 'space', 'chalky', 'paua', 'skelly', 'stars', 'cottonee', 'whimsigoth'],
            sounds: ['default']
        };
        
        const currentValue = this.settings.settings.theme[category];
        const currentIndex = options[category].indexOf(currentValue);
        const nextIndex = (currentIndex + 1) % options[category].length;
        const nextValue = options[category][nextIndex];
        
        this.settings.setTheme(category, nextValue);
        return 'theme_changed';
    }
    
    /**
     * Reset to main view
     */
    resetView() {
        this.currentView = 'main';
        this.currentThemeCategory = null;
        this.scrollOffset = 0;
        this.scrollVelocity = 0;
        this.isDragging = false;
    }
}