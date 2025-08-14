/**
 * AudioSystem - Centralized audio management
 * 
 * Handles all game audio playback, muting, and volume control.
 * Works with ResourceManager to access preloaded sounds.
 */
export class AudioSystem {
    constructor(eventSystem, settings, resourceManager) {
        this.eventSystem = eventSystem;
        this.settings = settings;
        this.resourceManager = resourceManager;
        this.sounds = {};
        
        // Don't initialize sounds here - resources not loaded yet
    }
    
    /**
     * Initialize sound references from ResourceManager
     */
    initializeSounds() {
        // Get click sound
        this.sounds.click = this.resourceManager.getSound('click');
        
        // Get pop sounds for all fruit sizes
        for (let i = 0; i < 11; i++) {
            this.sounds[`pop${i}`] = this.resourceManager.getSound(`pop${i}`);
        }
    }
    
    /**
     * Play a sound by key
     * @param {string} soundKey - The key of the sound to play
     * @param {Object} options - Playback options (volume, loop, etc.)
     */
    play(soundKey, options = {}) {
        if (!this.settings.isMuted() && this.sounds[soundKey]) {
            try {
                const sound = this.sounds[soundKey];
                
                // Reset to start
                sound.currentTime = 0;
                
                // Apply options if provided
                if (options.volume !== undefined) {
                    sound.volume = options.volume;
                }
                
                // Play the sound
                sound.play().catch(error => {
                    console.error(`Failed to play sound: ${soundKey}`, error);
                });
            } catch (error) {
                console.error(`Error playing sound: ${soundKey}`, error);
            }
        }
    }
    
    /**
     * Toggle mute state
     * @returns {boolean} New mute state
     */
    toggleMute() {
        const isMuted = this.settings.toggleMute();
        
        // Emit mute state change event
        this.eventSystem.emit('audio:mute', { muted: isMuted });
        
        // Play feedback sound if unmuting
        if (!isMuted) {
            this.play('click');
        }
        
        return isMuted;
    }
    
    /**
     * Get current mute state
     * @returns {boolean} True if muted
     */
    isMuted() {
        return this.settings.isMuted();
    }
    
    /**
     * Set master volume (future enhancement)
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        // Future: implement master volume control
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = volume;
            }
        });
    }
    
    /**
     * Preload a new sound (for dynamic loading)
     * @param {string} key - Sound identifier
     * @param {string} url - Sound file URL
     */
    async loadSound(key, url) {
        try {
            const audio = await this.resourceManager.loadSound(key, url);
            this.sounds[key] = audio;
        } catch (error) {
            console.error(`Failed to load sound ${key}:`, error);
        }
    }
    
    /**
     * Stop all sounds
     */
    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            if (sound && !sound.paused) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    }
}