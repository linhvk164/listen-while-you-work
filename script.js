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
        // Play/pause buttons (compact)
        document.querySelectorAll('.play-btn-compact').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const soundName = e.target.dataset.sound;
                this.toggleSound(soundName, e.target);
            });
        });

        // Volume sliders (compact)
        document.querySelectorAll('.volume-slider-compact').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const soundName = e.target.dataset.sound;
                const volume = e.target.value / 100;
                this.setVolume(soundName, volume);
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
        this.currentBackground = 'beach';
        this.setupEventListeners();
        this.loadSavedSettings();
    }

    setupEventListeners() {
        // Background selection (compact)
        document.querySelectorAll('.background-option-compact').forEach(option => {
            option.addEventListener('click', (e) => {
                const backgroundType = e.currentTarget.dataset.background;
                this.setBackground(backgroundType);
            });
        });
    }

    setBackground(backgroundType) {
        // Remove active class from all options
        document.querySelectorAll('.background-option-compact').forEach(option => {
            option.classList.remove('active');
        });

        // Add active class to selected option
        document.querySelector(`[data-background="${backgroundType}"]`).classList.add('active');

        this.currentBackground = backgroundType;

        // Use background image
        let imageUrl;
        if (backgroundType === 'building') {
            imageUrl = `assets/backgrounds/building.jpg`;
        } else if (backgroundType === 'beach') {
            imageUrl = `assets/backgrounds/Beach.JPG`;
        } else {
            imageUrl = `assets/backgrounds/${backgroundType}.jpg`;
        }
        
        // Update the background image directly in CSS
        const style = document.createElement('style');
        style.textContent = `
            body::before {
                background-image: url('${imageUrl}');
            }
        `;
        
        // Remove any existing dynamic styles
        const existingStyle = document.querySelector('#dynamic-bg-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        style.id = 'dynamic-bg-style';
        document.head.appendChild(style);

        this.saveSettings();
    }

    saveSettings() {
        const settings = {
            background: this.currentBackground
        };
        localStorage.setItem('listenWhileYouWorkBackgroundSettings', JSON.stringify(settings));
    }

    loadSavedSettings() {
        const saved = localStorage.getItem('listenWhileYouWorkBackgroundSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.setBackground(settings.background);
        }
    }
}

// View Mode Manager
class ViewModeManager {
    constructor() {
        this.currentMode = 'version1'; // version1, version2
        this.modes = [
            { name: 'version1', icon: '📋', text: 'Version 2' },
            { name: 'version2', icon: '🎛️', text: 'Version 1' }
        ];
        this.setupEventListeners();
        this.loadSavedMode();
    }

    setupEventListeners() {
        const toggleButton = document.getElementById('viewModeToggle');
        toggleButton.addEventListener('click', () => {
            this.cycleMode();
        });

        // Keyboard shortcut: Press 'V' to toggle modes
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Only trigger if not typing in an input
                if (document.activeElement.tagName !== 'INPUT') {
                    this.cycleMode();
                }
            }
        });
    }

    cycleMode() {
        const currentIndex = this.modes.findIndex(mode => mode.name === this.currentMode);
        const nextIndex = (currentIndex + 1) % this.modes.length;
        const nextMode = this.modes[nextIndex];
        
        this.setMode(nextMode.name);
    }

    setMode(modeName) {
        // Remove all mode classes
        document.body.classList.remove('version1-mode', 'version2-mode');
        
        // Add new mode class
        document.body.classList.add(`${modeName}-mode`);
        
        this.currentMode = modeName;
        this.updateToggleButton();
        this.saveMode();
    }

    updateToggleButton() {
        const currentIndex = this.modes.findIndex(mode => mode.name === this.currentMode);
        const nextIndex = (currentIndex + 1) % this.modes.length;
        const nextMode = this.modes[nextIndex];
        
        const toggleIcon = document.querySelector('.toggle-icon');
        const toggleText = document.querySelector('.toggle-text');
        
        toggleIcon.textContent = nextMode.icon;
        toggleText.textContent = nextMode.text;
    }

    saveMode() {
        localStorage.setItem('listenWhileYouWorkViewMode', this.currentMode);
    }

    loadSavedMode() {
        const savedMode = localStorage.getItem('listenWhileYouWorkViewMode');
        if (savedMode && this.modes.find(mode => mode.name === savedMode)) {
            this.setMode(savedMode);
        }
    }
}

// Initialize managers when the page loads
let soundManager;
let backgroundManager;
let viewModeManager;

document.addEventListener('DOMContentLoaded', () => {
    soundManager = new SoundManager();
    backgroundManager = new BackgroundManager();
    viewModeManager = new ViewModeManager();
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
