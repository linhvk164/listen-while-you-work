// Clock functionality
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('time').textContent = timeString;
    document.getElementById('date').textContent = dateString;
}

// Update clock immediately and then every second
updateClock();
setInterval(updateClock, 1000);

// Audio context and sound management
class SoundManager {
    constructor() {
        this.sounds = {};
        this.masterVolume = 0.7;
        this.initializeSounds();
        this.setupEventListeners();
    }

    initializeSounds() {
        const soundConfigs = {
            rain: {
                url: 'https://www.soundjay.com/misc/sounds/rain-01.wav',
                fallbackFrequency: this.generateRainNoise.bind(this)
            },
            forest: {
                url: 'https://www.soundjay.com/nature/sounds/forest-01.wav',
                fallbackFrequency: this.generateForestNoise.bind(this)
            },
            cafe: {
                url: 'https://www.soundjay.com/human/sounds/cafe-01.wav',
                fallbackFrequency: this.generateCafeNoise.bind(this)
            },
            ocean: {
                url: 'https://www.soundjay.com/nature/sounds/ocean-01.wav',
                fallbackFrequency: this.generateOceanNoise.bind(this)
            },
            fireplace: {
                url: 'https://www.soundjay.com/misc/sounds/fire-01.wav',
                fallbackFrequency: this.generateFireplaceNoise.bind(this)
            },
            whitenoise: {
                fallbackFrequency: this.generateWhiteNoise.bind(this)
            }
        };

        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        this.masterGainNode.gain.value = this.masterVolume;

        // Initialize each sound
        Object.keys(soundConfigs).forEach(soundName => {
            this.sounds[soundName] = {
                isPlaying: false,
                volume: 0.5,
                gainNode: this.audioContext.createGain(),
                source: null,
                config: soundConfigs[soundName]
            };
            this.sounds[soundName].gainNode.connect(this.masterGainNode);
        });
    }

    setupEventListeners() {
        // Play/pause buttons
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const soundName = e.target.dataset.sound;
                this.toggleSound(soundName, e.target);
            });
        });

        // Volume sliders
        document.querySelectorAll('.volume-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const soundName = e.target.dataset.sound;
                const volume = e.target.value / 100;
                this.setVolume(soundName, volume);
                
                // Update volume display
                const volumeValue = e.target.parentElement.querySelector('.volume-value');
                volumeValue.textContent = e.target.value + '%';
            });
        });

        // Master volume
        const masterVolumeSlider = document.getElementById('masterVolume');
        masterVolumeSlider.addEventListener('input', (e) => {
            this.masterVolume = e.target.value / 100;
            this.masterGainNode.gain.value = this.masterVolume;
            document.getElementById('masterVolumeValue').textContent = e.target.value + '%';
        });

        // Stop all button
        document.getElementById('stopAll').addEventListener('click', () => {
            this.stopAllSounds();
        });
    }

    async toggleSound(soundName, button) {
        // Resume audio context if suspended (required by browsers)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const sound = this.sounds[soundName];
        
        if (sound.isPlaying) {
            this.stopSound(soundName, button);
        } else {
            this.playSound(soundName, button);
        }
    }

    playSound(soundName, button) {
        const sound = this.sounds[soundName];
        
        // Use generated noise for ambient sounds
        sound.source = sound.config.fallbackFrequency();
        sound.source.connect(sound.gainNode);
        sound.source.start();
        
        sound.isPlaying = true;
        button.textContent = '⏸️';
        button.classList.add('playing');
    }

    stopSound(soundName, button) {
        const sound = this.sounds[soundName];
        
        if (sound.source) {
            sound.source.stop();
            sound.source = null;
        }
        
        sound.isPlaying = false;
        button.textContent = '▶️';
        button.classList.remove('playing');
    }

    setVolume(soundName, volume) {
        const sound = this.sounds[soundName];
        sound.volume = volume;
        sound.gainNode.gain.value = volume;
    }

    stopAllSounds() {
        Object.keys(this.sounds).forEach(soundName => {
            const button = document.querySelector(`[data-sound="${soundName}"]`);
            if (this.sounds[soundName].isPlaying) {
                this.stopSound(soundName, button);
            }
        });
    }

    // Noise generation functions
    generateWhiteNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        return whiteNoise;
    }

    generateRainNoise() {
        // Create filtered white noise that sounds like rain
        const source = this.generateWhiteNoise();
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;
        
        source.connect(filter);
        return filter;
    }

    generateOceanNoise() {
        // Create low-frequency filtered noise for ocean waves
        const source = this.generateWhiteNoise();
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        filter.Q.value = 1;
        
        // Add some oscillation for wave-like effect
        const oscillator = this.audioContext.createOscillator();
        oscillator.frequency.value = 0.1;
        oscillator.connect(filter.frequency);
        oscillator.start();
        
        source.connect(filter);
        return filter;
    }

    generateForestNoise() {
        // Create filtered noise with some high frequencies for forest ambience
        const source = this.generateWhiteNoise();
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.3;
        
        source.connect(filter);
        return filter;
    }

    generateCafeNoise() {
        // Create mid-frequency noise for cafe chatter
        const source = this.generateWhiteNoise();
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.7;
        
        source.connect(filter);
        return filter;
    }

    generateFireplaceNoise() {
        // Create crackling fire sound with filtered noise
        const source = this.generateWhiteNoise();
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 500;
        filter.Q.value = 0.8;
        
        source.connect(filter);
        return filter;
    }
}

// Background management
class BackgroundManager {
    constructor() {
        this.currentBackground = 'gradient';
        this.opacity = 1;
        this.setupEventListeners();
        this.loadSavedSettings();
    }

    setupEventListeners() {
        // Background selection
        document.querySelectorAll('.background-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const backgroundType = e.currentTarget.dataset.background;
                this.setBackground(backgroundType);
            });
        });

        // Background opacity
        const opacitySlider = document.getElementById('backgroundOpacity');
        opacitySlider.addEventListener('input', (e) => {
            this.setOpacity(e.target.value / 100);
            document.getElementById('backgroundOpacityValue').textContent = e.target.value + '%';
        });
    }

    setBackground(backgroundType) {
        // Remove active class from all options
        document.querySelectorAll('.background-option').forEach(option => {
            option.classList.remove('active');
        });

        // Add active class to selected option
        document.querySelector(`[data-background="${backgroundType}"]`).classList.add('active');

        this.currentBackground = backgroundType;

        if (backgroundType === 'gradient') {
            // Use original gradient
            document.body.classList.remove('has-background');
            document.body.style.setProperty('--bg-opacity', this.opacity);
        } else {
            // Use background image
            document.body.classList.add('has-background');
            const imageUrl = `assets/backgrounds/${backgroundType}.jpg`;
            document.body.style.setProperty('--background-image', `url('${imageUrl}')`);
            this.updateBackgroundImage();
        }

        this.saveSettings();
    }

    updateBackgroundImage() {
        const beforeElement = document.body;
        beforeElement.style.setProperty('--bg-opacity', this.opacity);
        
        // Update the ::before pseudo-element background
        const style = document.createElement('style');
        style.textContent = `
            body::before {
                background-image: var(--background-image);
                opacity: var(--bg-opacity);
            }
        `;
        
        // Remove any existing dynamic styles
        const existingStyle = document.querySelector('#dynamic-bg-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        style.id = 'dynamic-bg-style';
        document.head.appendChild(style);
    }

    setOpacity(opacity) {
        this.opacity = opacity;
        document.body.style.setProperty('--bg-opacity', opacity);
        
        if (this.currentBackground !== 'gradient') {
            this.updateBackgroundImage();
        } else {
            // For gradient, adjust the body opacity
            document.body.style.opacity = opacity;
        }
        
        this.saveSettings();
    }

    saveSettings() {
        const settings = {
            background: this.currentBackground,
            opacity: this.opacity
        };
        localStorage.setItem('focusZoneBackgroundSettings', JSON.stringify(settings));
    }

    loadSavedSettings() {
        const saved = localStorage.getItem('focusZoneBackgroundSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.setBackground(settings.background);
            this.setOpacity(settings.opacity);
            
            // Update UI elements
            document.getElementById('backgroundOpacity').value = settings.opacity * 100;
            document.getElementById('backgroundOpacityValue').textContent = Math.round(settings.opacity * 100) + '%';
        }
    }
}

// Initialize managers when the page loads
let soundManager;
let backgroundManager;

document.addEventListener('DOMContentLoaded', () => {
    soundManager = new SoundManager();
    backgroundManager = new BackgroundManager();
});

// Handle page visibility changes to pause/resume sounds appropriately
document.addEventListener('visibilitychange', () => {
    if (soundManager && soundManager.audioContext) {
        if (document.hidden) {
            soundManager.audioContext.suspend();
        } else {
            soundManager.audioContext.resume();
        }
    }
});
