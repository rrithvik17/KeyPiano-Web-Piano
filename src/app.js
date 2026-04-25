import { AudioEngine } from './audio.js';
import { UIManager } from './ui.js';
import { Recorder } from './recorder.js';

class App {
    constructor() {
        this.audio = new AudioEngine();
        this.baseOctave = 0; // Standard 4-octave range
        
        this.ui = new UIManager(
            document.getElementById('piano'),
            (note, octave) => this.playNote(note, octave),
            (note, octave) => this.stopNote(note, octave)
        );

        this.recorder = new Recorder(
            (note, octave) => this.playNote(note, octave, false),
            (note, octave) => this.stopNote(note, octave, false)
        );

        this.activeKeys = new Set();
        this.initEventListeners();
        this.initLoadingSequence();
        
        // Initial UI sync
        this.updateOctaveDisplay();
    }

    async initLoadingSequence() {
        const overlay = document.getElementById('loading-overlay');
        const progressFill = document.getElementById('progress-fill');

        this.audio.onProgress = (progress) => {
            progressFill.style.width = `${progress * 100}%`;
        };

        await this.audio.loadAssets();
        
        // Short delay for smoothness
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 500);
    }

    initEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            
            const key = e.key; // Keep case for arrows
            const lowerKey = key.toLowerCase();
            
            // Sustain toggle (Space)
            if (key === ' ') {
                e.preventDefault();
                this.setSustain(true);
                return;
            }

            // Octave shift (Arrows)
            if (key === 'ArrowUp') {
                this.shiftOctave(1);
                return;
            }
            if (key === 'ArrowDown') {
                this.shiftOctave(-1);
                return;
            }

            const mapping = this.ui.getNoteFromKey(lowerKey);
            if (mapping) {
                this.playNote(mapping.note, mapping.octave);
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key;
            const lowerKey = key.toLowerCase();

            if (key === ' ') {
                this.setSustain(false);
                return;
            }

            const mapping = this.ui.getNoteFromKey(lowerKey);
            if (mapping) {
                this.stopNote(mapping.note, mapping.octave);
            }
        });

        // Controls
        document.getElementById('volume').addEventListener('input', (e) => {
            this.audio.setVolume(parseFloat(e.target.value));
        });

        document.getElementById('reverb').addEventListener('input', (e) => {
            this.audio.setReverb(parseFloat(e.target.value));
        });

        const sustainBtn = document.getElementById('sustain-btn');
        sustainBtn.addEventListener('mousedown', () => this.setSustain(true));
        sustainBtn.addEventListener('mouseup', () => this.setSustain(false));
        sustainBtn.addEventListener('mouseleave', () => this.setSustain(false));

        document.getElementById('octave-down').addEventListener('click', () => this.shiftOctave(-1));
        document.getElementById('octave-up').addEventListener('click', () => this.shiftOctave(1));

        // Smart Looper
        const looperBtn = document.getElementById('smart-looper');
        const recIndicator = document.getElementById('recording-indicator');

        looperBtn.addEventListener('click', () => {
            if (!this.recorder.isRecording && !this.recorder.isPlaying) {
                // State 1: Start Recording
                this.recorder.start();
                looperBtn.textContent = 'Finish & Loop';
                looperBtn.classList.add('recording');
                recIndicator.style.display = 'flex';
            } else if (this.recorder.isRecording) {
                // State 2: Finish & Start Looping
                this.recorder.stop();
                looperBtn.textContent = 'Stop & Clear';
                looperBtn.classList.remove('recording');
                looperBtn.classList.add('playing');
                recIndicator.style.display = 'none';
                this.recorder.play(true); // Loop = true
            } else if (this.recorder.isPlaying) {
                // State 3: Stop & Reset
                this.recorder.stopPlayback();
                looperBtn.textContent = 'Start Recording';
                looperBtn.classList.remove('playing');
            }
        });
    }

    playNote(noteName, octaveOffset, record = true) {
        const octave = this.baseOctave + octaveOffset;
        const freq = this.audio.getFrequency(noteName, octave);
        const noteId = `${noteName}-${octaveOffset}`;

        // Only prevent repeats for user input (mouse/keyboard)
        if (record) {
            if (this.activeKeys.has(noteId)) return;
            this.activeKeys.add(noteId);
            
            if (this.recorder.isRecording) {
                this.recorder.recordEvent('play', noteName, octaveOffset);
            }
        }

        this.audio.playNote(noteId, freq);
        this.ui.highlightKey(noteName, octaveOffset, true);
    }

    stopNote(noteName, octaveOffset, record = true) {
        const noteId = `${noteName}-${octaveOffset}`;
        
        if (record) {
            this.activeKeys.delete(noteId);
            
            if (this.recorder.isRecording) {
                this.recorder.recordEvent('stop', noteName, octaveOffset);
            }
        }

        this.audio.stopNote(noteId);
        this.ui.highlightKey(noteName, octaveOffset, false);
    }

    setSustain(state) {
        this.audio.setSustain(state);
        const btn = document.getElementById('sustain-btn');
        if (state) btn.classList.add('active');
        else btn.classList.remove('active');
    }

    shiftOctave(delta) {
        const newOctave = this.baseOctave + delta;
        if (newOctave >= 1 && newOctave <= 7) {
            this.baseOctave = newOctave;
            this.updateOctaveDisplay();
        }
    }

    updateOctaveDisplay() {
        document.getElementById('octave-display').textContent = `OCTAVE ${this.baseOctave}`;
    }
}

// Start the app
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
