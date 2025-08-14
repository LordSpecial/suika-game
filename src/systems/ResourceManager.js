/**
 * ResourceManager - Centralised asset loading and caching
 * 
 * Handles loading of images and sounds with caching and preloading support.
 * Emits events for loading progress and completion.
 */
export class ResourceManager {
    constructor(eventSystem) {
        this.eventSystem = eventSystem;
        this.images = new Map();
        this.sounds = new Map();
        this.loadingQueue = [];
        this.isLoading = false;
        this.loadProgress = { loaded: 0, total: 0 };
    }
    
    /**
     * Load multiple images
     * @param {Object} manifest - Image manifest { key: url, ... }
     * @returns {Promise} Resolves when all images are loaded
     */
    async loadImages(manifest) {
        const promises = Object.entries(manifest).map(([key, url]) => 
            this.loadImage(key, url)
        );
        
        return Promise.all(promises);
    }
    
    /**
     * Load a single image
     * @param {string} key - Image identifier
     * @param {string} url - Image URL
     * @returns {Promise<Image>} Loaded image
     */
    async loadImage(key, url) {
        // Return cached image if available
        if (this.images.has(key)) {
            return this.images.get(key);
        }
        
        return new Promise((resolve, reject) => {
            const image = new Image();
            
            image.onload = () => {
                this.images.set(key, image);
                this.updateProgress();
                resolve(image);
            };
            
            image.onerror = () => {
                const error = new Error(`Failed to load image: ${url}`);
                this.eventSystem.emit('resource:load:error', { key, url, error });
                reject(error);
            };
            
            image.src = url;
        });
    }
    
    /**
     * Load multiple sounds
     * @param {Object} manifest - Sound manifest { key: url, ... }
     * @returns {Promise} Resolves when all sounds are loaded
     */
    async loadSounds(manifest) {
        const promises = Object.entries(manifest).map(([key, url]) => 
            this.loadSound(key, url)
        );
        
        return Promise.all(promises);
    }
    
    /**
     * Load a single sound
     * @param {string} key - Sound identifier
     * @param {string} url - Sound URL
     * @returns {Promise<Audio>} Loaded audio
     */
    async loadSound(key, url) {
        // Return cached sound if available
        if (this.sounds.has(key)) {
            return this.sounds.get(key);
        }
        
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            // Configure for better compatibility
            audio.preload = 'auto';
            audio.setAttribute('playsinline', 'true');
            audio.setAttribute('webkit-playsinline', 'true');
            
            // iOS-specific configuration
            audio.volume = 0.7;
            
            // Handle audio interruption gracefully
            audio.addEventListener('pause', () => {
                // Don't restart automatically if paused by system
            });
            
            audio.addEventListener('ended', () => {
                // Reset to beginning for reuse
                audio.currentTime = 0;
            });
            
            // Handle loading errors gracefully
            audio.addEventListener('error', (e) => {
                console.warn('Audio loading failed:', e);
            });
            
            const handleCanPlay = () => {
                audio.removeEventListener('canplaythrough', handleCanPlay);
                this.sounds.set(key, audio);
                this.updateProgress();
                resolve(audio);
            };
            
            const handleError = () => {
                audio.removeEventListener('error', handleError);
                const error = new Error(`Failed to load sound: ${url}`);
                this.eventSystem.emit('resource:load:error', { key, url, error });
                reject(error);
            };
            
            audio.addEventListener('canplaythrough', handleCanPlay);
            audio.addEventListener('error', handleError);
            
            audio.src = url;
            
            // For iOS compatibility, we might need to trigger load
            audio.load();
        });
    }
    
    /**
     * Load all resources from a complete manifest
     * @param {Object} manifest - Complete resource manifest
     * @returns {Promise} Resolves when all resources are loaded
     */
    async loadAll(manifest) {
        this.isLoading = true;
        this.loadProgress = { loaded: 0, total: 0 };
        
        // Count total resources
        if (manifest.images) {
            this.loadProgress.total += Object.keys(manifest.images).length;
        }
        if (manifest.sounds) {
            this.loadProgress.total += Object.keys(manifest.sounds).length;
        }
        
        this.eventSystem.emit('resource:load:start', { total: this.loadProgress.total });
        
        try {
            const promises = [];
            
            if (manifest.images) {
                promises.push(this.loadImages(manifest.images));
            }
            
            if (manifest.sounds) {
                promises.push(this.loadSounds(manifest.sounds));
            }
            
            await Promise.all(promises);
            
            this.isLoading = false;
            this.eventSystem.emit('resource:load:complete', { 
                loaded: this.loadProgress.loaded,
                total: this.loadProgress.total 
            });
            
            return true;
        } catch (error) {
            this.isLoading = false;
            throw error;
        }
    }
    
    /**
     * Get loaded image by key
     * @param {string} key - Image identifier
     * @returns {Image|null} Loaded image or null
     */
    getImage(key) {
        return this.images.get(key) || null;
    }
    
    /**
     * Get loaded sound by key
     * @param {string} key - Sound identifier
     * @returns {Audio|null} Loaded audio or null
     */
    getSound(key) {
        return this.sounds.get(key) || null;
    }
    
    /**
     * Check if image is loaded
     * @param {string} key - Image identifier
     * @returns {boolean} True if loaded
     */
    hasImage(key) {
        return this.images.has(key);
    }
    
    /**
     * Check if sound is loaded
     * @param {string} key - Sound identifier
     * @returns {boolean} True if loaded
     */
    hasSound(key) {
        return this.sounds.has(key);
    }
    
    /**
     * Get all loaded images
     * @returns {Map} All loaded images
     */
    getAllImages() {
        return new Map(this.images);
    }
    
    /**
     * Get all loaded sounds
     * @returns {Map} All loaded sounds
     */
    getAllSounds() {
        return new Map(this.sounds);
    }
    
    /**
     * Clear specific resource
     * @param {string} type - Resource type ('image' or 'sound')
     * @param {string} key - Resource key
     */
    clearResource(type, key) {
        if (type === 'image') {
            this.images.delete(key);
        } else if (type === 'sound') {
            const sound = this.sounds.get(key);
            if (sound) {
                sound.pause();
                sound.src = '';
                this.sounds.delete(key);
            }
        }
    }
    
    /**
     * Clear all resources of a specific type
     * @param {string} type - Resource type ('image' or 'sound')
     */
    clearResourceType(type) {
        if (type === 'image') {
            this.images.clear();
        } else if (type === 'sound') {
            this.sounds.forEach(sound => {
                sound.pause();
                sound.src = '';
            });
            this.sounds.clear();
        }
    }
    
    /**
     * Clear all resources
     */
    clearAll() {
        this.clearResourceType('image');
        this.clearResourceType('sound');
        this.loadProgress = { loaded: 0, total: 0 };
    }
    
    /**
     * Update loading progress
     * @private
     */
    updateProgress() {
        this.loadProgress.loaded++;
        this.eventSystem.emit('resource:load:progress', {
            loaded: this.loadProgress.loaded,
            total: this.loadProgress.total,
            percentage: (this.loadProgress.loaded / this.loadProgress.total) * 100
        });
    }
    
    /**
     * Get loading progress
     * @returns {Object} Loading progress
     */
    getProgress() {
        return {
            ...this.loadProgress,
            percentage: this.loadProgress.total > 0 
                ? (this.loadProgress.loaded / this.loadProgress.total) * 100 
                : 0
        };
    }
    
    /**
     * Create a resource manifest from configuration
     * @param {Object} config - Game configuration
     * @returns {Object} Resource manifest
     */
    static createManifestFromConfig(config) {
        const manifest = {
            images: {},
            sounds: {}
        };
        
        // Add basic images
        if (config.ASSETS?.images) {
            Object.entries(config.ASSETS.images).forEach(([key, url]) => {
                if (typeof url === 'string') {
                    manifest.images[key] = url;
                }
            });
        }
        
        // Add theme images
        if (config.THEMES) {
            // Ball themes
            if (config.THEMES.BALLS) {
                Object.entries(config.THEMES.BALLS).forEach(([themeKey, theme]) => {
                    theme.items?.forEach((item, index) => {
                        manifest.images[`${themeKey}_${index}`] = item.img;
                    });
                });
            }
            
            // Background themes
            if (config.THEMES.BACKGROUNDS) {
                Object.entries(config.THEMES.BACKGROUNDS).forEach(([themeKey, theme]) => {
                    if (theme.background) {
                        manifest.images[`bg_${themeKey}`] = theme.background;
                    }
                    if (theme.menuBackground) {
                        manifest.images[`menu_bg_${themeKey}`] = theme.menuBackground;
                    }
                });
            }
        }
        
        // Add sounds
        if (config.ASSETS?.sounds) {
            Object.entries(config.ASSETS.sounds).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    manifest.sounds[key] = value;
                } else if (Array.isArray(value)) {
                    value.forEach((url, index) => {
                        manifest.sounds[`${key}${index}`] = url;
                    });
                }
            });
        }
        
        return manifest;
    }
}