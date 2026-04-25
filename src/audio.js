/**
 * KeyPiano Audio Engine v3.1
 * Hybrid Sample-Based & Physical Modeling Engine
 * FORCE REFRESH: Cache-Busted Assets
 */

export class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master Bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // Reverb System (Convolution)
        this.reverbNode = this.ctx.createConvolver();
        this.reverbGain = this.ctx.createGain();
        this.dryGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.3;
        this.dryGain.gain.value = 1.0;

        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);
        this.dryGain.connect(this.masterGain);

        this.samples = new Map();
        this.activeNotes = new Map();
        this.sustain = false;
        this.isLoaded = false;
        this.onProgress = null;

        // Salamander Sample Mapping (every minor third)
        this.sampleNotes = ['C', 'Ds', 'Fs', 'A'];
        this.noteMapping = {
            'C':  { sample: 'C',  shift: 0 },
            'C#': { sample: 'C',  shift: 1 },
            'D':  { sample: 'C',  shift: 2 },
            'D#': { sample: 'Ds', shift: 0 },
            'E':  { sample: 'Ds', shift: 1 },
            'F':  { sample: 'Ds', shift: 2 },
            'F#': { sample: 'Fs', shift: 0 },
            'G':  { sample: 'Fs', shift: 1 },
            'G#': { sample: 'Fs', shift: 2 },
            'A':  { sample: 'A',  shift: 0 },
            'A#': { sample: 'A',  shift: 1 },
            'B':  { sample: 'A',  shift: 2 }
        };
    }

    async loadAssets() {
        // V3.1: Guaranteed stable URLs
        const sampleBaseUrl = 'https://tonejs.github.io/audio/salamander/';
        const irUrl = 'https://raw.githubusercontent.com/cwilso/web-audio-samples/master/samples/audio/impulse-responses/matrix-reverb2.wav';
        
        // Fetch octaves 1-7 to ensure full range coverage
        const octaves = [1, 2, 3, 4, 5, 6, 7];
        const total = (octaves.length * this.sampleNotes.length) + 1;
        let loaded = 0;

        const updateProgress = () => {
            loaded++;
            if (this.onProgress) this.onProgress(loaded / total);
        };

        // Load Reverb IR
        try {
            console.log('Hybrid Engine: Loading Reverb IR...');
            const irBuffer = await this.fetchBuffer(irUrl);
            this.reverbNode.buffer = irBuffer;
            console.log('Hybrid Engine: Reverb Loaded.');
            updateProgress();
        } catch (e) {
            console.error('Hybrid Engine: Reverb Load Failed:', e);
            updateProgress();
        }

        // Load Piano Samples in parallel
        const promises = [];
        for (const octave of octaves) {
            for (const note of this.sampleNotes) {
                const fileName = `${note}${octave}.mp3`;
                const url = `${sampleBaseUrl}${fileName}`;
                promises.push(this.loadSample(note, octave, url).then(updateProgress));
            }
        }

        await Promise.all(promises);
        this.isLoaded = true;
        console.log(`Hybrid Engine Ready. ${this.samples.size} samples loaded.`);
    }

    async loadSample(note, octave, url) {
        try {
            const buffer = await this.fetchBuffer(url);
            this.samples.set(`${note}${octave}`, buffer);
        } catch (e) {
            console.warn(`Hybrid Engine: Missing sample [${note}${octave}]`);
        }
    }

    async fetchBuffer(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return await this.ctx.decodeAudioData(arrayBuffer);
    }

    setVolume(value) {
        this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
    }

    setReverb(value) {
        this.reverbGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
    }

    setSustain(state) {
        this.sustain = state;
        if (!state) {
            this.activeNotes.forEach((note, key) => {
                if (note.shouldRelease) this.stopNote(key, true);
            });
        }
    }

    getFrequency(noteName, octave) {
        const freqs = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };
        return freqs[noteName] * Math.pow(2, octave - 4);
    }

    playNote(noteId, frequency) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.activeNotes.has(noteId)) this.stopNote(noteId, true);

        const now = this.ctx.currentTime;
        console.log(`Hybrid Engine: Playing ${noteId}`);
        
        const match = noteId.match(/^(.+?)-(-?\d+)$/);
        if (!match) {
            console.error(`Hybrid Engine: Invalid noteId format [${noteId}]`);
            return;
        }

        const noteName = match[1];
        const octaveStr = match[2];
        const octave = parseInt(octaveStr) + 4; 

        if (isNaN(octave)) {
            console.error(`Hybrid Engine: Octave parse failure for [${noteId}]`);
            return;
        }

        const mapping = this.noteMapping[noteName];
        if (!mapping) {
            console.error(`Hybrid Engine: No mapping for note [${noteName}]`);
            return;
        }
        
        const noteGain = this.ctx.createGain();
        noteGain.connect(this.dryGain);
        noteGain.connect(this.reverbNode);

        const sources = [];

        // Layer 1: REAL SAMPLE
        const sampleBuffer = this.samples.get(`${mapping.sample}${octave}`);
        if (sampleBuffer) {
            const sampleSource = this.ctx.createBufferSource();
            sampleSource.buffer = sampleBuffer;
            sampleSource.playbackRate.setValueAtTime(Math.pow(2, mapping.shift / 12), now);
            
            const sampleGain = this.ctx.createGain();
            sampleGain.gain.setValueAtTime(0.9, now);
            sampleSource.connect(sampleGain);
            sampleGain.connect(noteGain);
            
            sampleSource.start(now);
            sources.push(sampleSource);
        } else {
            console.warn(`No sample found for ${noteName} octave ${octave}`);
        }

        // Layer 2: SYNTH HARMONICS
        const synthOsc = this.ctx.createOscillator();
        const synthGain = this.ctx.createGain();
        synthOsc.type = 'triangle';
        synthOsc.frequency.setValueAtTime(frequency, now);
        synthGain.gain.setValueAtTime(0.15, now);
        synthOsc.connect(synthGain);
        synthGain.connect(noteGain);
        synthOsc.start(now);
        sources.push(synthOsc);

        // Envelope
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(1, now + 0.005);
        noteGain.gain.exponentialRampToValueAtTime(0.3, now + 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + 3.5);

        this.activeNotes.set(noteId, { sources, gainNode: noteGain, shouldRelease: false });
    }

    stopNote(noteId, force = false) {
        const note = this.activeNotes.get(noteId);
        if (!note) return;

        if (this.sustain && !force) {
            note.shouldRelease = true;
            return;
        }

        const { sources, gainNode } = note;
        const now = this.ctx.currentTime;
        const releaseTime = 0.5;

        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

        setTimeout(() => {
            sources.forEach(s => { try { s.stop(); s.disconnect(); } catch(e) {} });
            gainNode.disconnect();
        }, releaseTime * 1000 + 100);

        this.activeNotes.delete(noteId);
    }
}
