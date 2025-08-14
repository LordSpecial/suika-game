import { UIComponent } from '../UIComponent.js';

/**
 * ScoreDisplay - Animated score display component
 * 
 * Displays score with animation effects and formatting.
 */
export class ScoreDisplay extends UIComponent {
    constructor(bounds, initialScore = 0) {
        super(bounds);
        
        this.score = initialScore;
        this.displayScore = initialScore;
        this.targetScore = initialScore;
        
        // Animation properties
        this.animationSpeed = 0.1; // Speed of score animation
        this.isAnimating = false;
        
        // Score change effects
        this.scoreChangeEffects = [];
        
        // Default styling
        this.style = {
            ...this.style,
            fontSize: 64,
            fontFamily: "'Azeret Mono', monospace",
            fontWeight: '900',
            textColor: 'var(--col-bg-lighter)',
            textAlign: 'left',
            
            // Text shadow for score
            textShadow: true,
            shadowPattern: [
                { x: 3, y: 3, color: 'var(--col-primary)' },
                { x: -3, y: -3, color: 'var(--col-primary)' },
                { x: -3, y: 3, color: 'var(--col-primary)' },
                { x: 3, y: -3, color: 'var(--col-primary)' }
            ],
            
            // Prefix text (e.g., "Score: ")
            prefix: '',
            prefixColor: null, // Uses textColor if null
            
            // Animation easing
            easing: 'easeOutCubic'
        };
    }
    
    /**
     * Set the score (with animation)
     * @param {number} score - New score value
     * @param {boolean} animate - Whether to animate the change
     */
    setScore(score, animate = true) {
        const oldScore = this.score;
        this.score = score;
        this.targetScore = score;
        
        if (animate && oldScore !== score) {
            this.isAnimating = true;
            
            // Add score change effect
            if (score > oldScore) {
                this.addScoreChangeEffect(score - oldScore);
            }
        } else {
            this.displayScore = score;
            this.isAnimating = false;
        }
    }
    
    /**
     * Add a floating score change effect
     * @param {number} change - Score change amount
     */
    addScoreChangeEffect(change) {
        this.scoreChangeEffects.push({
            value: `+${change}`,
            x: this.bounds.x + this.bounds.width / 2,
            y: this.bounds.y + this.bounds.height / 2,
            opacity: 1,
            offsetY: 0,
            lifetime: 1000, // milliseconds
            elapsed: 0
        });
    }
    
    /**
     * Update score animation
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Animate score display
        if (this.isAnimating) {
            const diff = this.targetScore - this.displayScore;
            
            if (Math.abs(diff) < 1) {
                this.displayScore = this.targetScore;
                this.isAnimating = false;
            } else {
                // Smooth animation with easing
                const speed = this.animationSpeed * (deltaTime / 16); // Normalize to 60fps
                this.displayScore += diff * speed;
            }
        }
        
        // Update score change effects
        this.scoreChangeEffects = this.scoreChangeEffects.filter(effect => {
            effect.elapsed += deltaTime;
            const progress = effect.elapsed / effect.lifetime;
            
            if (progress >= 1) {
                return false; // Remove completed effects
            }
            
            // Animate effect
            effect.opacity = 1 - progress;
            effect.offsetY = -progress * 50; // Float upward
            
            return true;
        });
    }
    
    /**
     * Render score display content
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Renderer} renderer - Renderer instance
     */
    renderContent(ctx, renderer) {
        // Format score with commas
        const formattedScore = Math.floor(this.displayScore).toLocaleString();
        const fullText = this.style.prefix + formattedScore;
        
        // Calculate position
        let textX = this.bounds.x;
        const textY = this.bounds.y + this.bounds.height / 2;
        
        if (this.style.textAlign === 'center') {
            textX = this.bounds.x + this.bounds.width / 2;
        } else if (this.style.textAlign === 'right') {
            textX = this.bounds.x + this.bounds.width;
        }
        
        // Render text shadows
        if (this.style.textShadow && this.style.shadowPattern) {
            ctx.save();
            
            // Draw each shadow
            this.style.shadowPattern.forEach(shadow => {
                ctx.save();
                ctx.translate(shadow.x, shadow.y);
                
                renderer.drawText(fullText, textX, textY, {
                    font: `${this.style.fontWeight} ${this.style.fontSize}px ${this.style.fontFamily}`,
                    fillStyle: shadow.color,
                    textAlign: this.style.textAlign,
                    textBaseline: 'middle'
                });
                
                ctx.restore();
            });
            
            ctx.restore();
        }
        
        // Render main text
        renderer.drawText(fullText, textX, textY, {
            font: `${this.style.fontWeight} ${this.style.fontSize}px ${this.style.fontFamily}`,
            fillStyle: this.style.textColor,
            textAlign: this.style.textAlign,
            textBaseline: 'middle'
        });
        
        // Render score change effects
        this.renderScoreChangeEffects(ctx, renderer);
    }
    
    /**
     * Render floating score change effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Renderer} renderer - Renderer instance
     */
    renderScoreChangeEffects(ctx, renderer) {
        for (const effect of this.scoreChangeEffects) {
            ctx.save();
            ctx.globalAlpha = effect.opacity;
            
            renderer.drawText(
                effect.value,
                effect.x,
                effect.y + effect.offsetY,
                {
                    font: `700 ${this.style.fontSize * 0.5}px ${this.style.fontFamily}`,
                    fillStyle: '#4CAF50',
                    textAlign: 'center',
                    textBaseline: 'middle'
                }
            );
            
            ctx.restore();
        }
    }
    
    /**
     * Get current displayed score
     * @returns {number} Currently displayed score
     */
    getDisplayScore() {
        return Math.floor(this.displayScore);
    }
    
    /**
     * Get actual score value
     * @returns {number} Actual score
     */
    getScore() {
        return this.score;
    }
}