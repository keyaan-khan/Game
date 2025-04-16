/**
 * Simplified Asset Manager for the game
 */
class AssetManager {
    constructor() {
        this.images = {};
        this.sounds = {};
    }

    /**
     * Queue an image for loading (simplified)
     */
    queueImage(name, src) {
        console.log(`Would load image: ${name} from ${src}`);
    }

    /**
     * Queue a sound for loading (simplified)
     */
    queueSound(name, src) {
        console.log(`Would load sound: ${name} from ${src}`);
    }

    /**
     * Set a callback to be called when all assets are loaded
     */
    onComplete(callback) {
        // Call the callback immediately in this simplified version
        if (callback) {
            setTimeout(callback, 100);
        }
    }

    /**
     * Get a loaded image by name (returns null in this simplified version)
     */
    getImage(name) {
        return null;
    }

    /**
     * Get a loaded sound by name (returns null in this simplified version)
     */
    getSound(name) {
        return null;
    }

    /**
     * Play a sound by name (does nothing in this simplified version)
     */
    playSound(name) {
        console.log(`Would play sound: ${name}`);
    }
}

// Create a global asset manager instance
const ASSETS = new AssetManager();
