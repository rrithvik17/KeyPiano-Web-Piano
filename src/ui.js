/**
 * KeyPiano UI Manager
 * Handles keyboard rendering and visual interactions
 */

export class UIManager {
    constructor(pianoElement, onNotePlay, onNoteStop) {
        this.container = pianoElement;
        this.onNotePlay = onNotePlay;
        this.onNoteStop = onNoteStop;
        
        this.octavePattern = [
            { note: 'C', type: 'white' },
            { note: 'C#', type: 'black' },
            { note: 'D', type: 'white' },
            { note: 'D#', type: 'black' },
            { note: 'E', type: 'white' },
            { note: 'F', type: 'white' },
            { note: 'F#', type: 'black' },
            { note: 'G', type: 'white' },
            { note: 'G#', type: 'black' },
            { note: 'A', type: 'white' },
            { note: 'A#', type: 'black' },
            { note: 'B', type: 'white' }
        ];

            // FULL KEYBOARD MAPPING (4 Octaves)
            this.keyToNote = {
                // --- LOWER TIER (Octaves -1 and 0) ---
                // White keys
                'z': { note: 'C', octave: -1, label: 'Z' },
                'x': { note: 'D', octave: -1, label: 'X' },
                'c': { note: 'E', octave: -1, label: 'C' },
                'v': { note: 'F', octave: -1, label: 'V' },
                'b': { note: 'G', octave: -1, label: 'B' },
                'n': { note: 'A', octave: -1, label: 'N' },
                'm': { note: 'B', octave: -1, label: 'M' },
                ',': { note: 'C', octave: 0, label: ',' },
                '.': { note: 'D', octave: 0, label: '.' },
                '/': { note: 'E', octave: 0, label: '/' },
                
                // Black keys
                's': { note: 'C#', octave: -1, label: 'S' },
                'd': { note: 'D#', octave: -1, label: 'D' },
                'g': { note: 'F#', octave: -1, label: 'G' },
                'h': { note: 'G#', octave: -1, label: 'H' },
                'j': { note: 'A#', octave: -1, label: 'J' },
                'l': { note: 'C#', octave: 0, label: 'L' },
                ';': { note: 'D#', octave: 0, label: ';' },
    
                // --- UPPER TIER (Octaves 1 and 2) ---
                // White keys
                'q': { note: 'F', octave: 0, label: 'Q' },
                'w': { note: 'G', octave: 0, label: 'W' },
                'e': { note: 'A', octave: 0, label: 'E' },
                'r': { note: 'B', octave: 0, label: 'R' },
                't': { note: 'C', octave: 1, label: 'T' },
                'y': { note: 'D', octave: 1, label: 'Y' },
                'u': { note: 'E', octave: 1, label: 'U' },
                'i': { note: 'F', octave: 1, label: 'I' },
                'o': { note: 'G', octave: 1, label: 'O' },
                'p': { note: 'A', octave: 1, label: 'P' },
                '[': { note: 'B', octave: 1, label: '[' },
                ']': { note: 'C', octave: 2, label: ']' },
                
                // Black keys
                '2': { note: 'F#', octave: 0, label: '2' },
                '3': { note: 'G#', octave: 0, label: '3' },
                '4': { note: 'A#', octave: 0, label: '4' },
                '6': { note: 'C#', octave: 1, label: '6' },
                '7': { note: 'D#', octave: 1, label: '7' },
                '9': { note: 'F#', octave: 1, label: '9' },
                '0': { note: 'G#', octave: 1, label: '0' },
                '-': { note: 'A#', octave: 1, label: '-' },
            };
    
            // Generate inputMap dynamically to guarantee 1:1 mapping
            this.inputMap = {};
            for (const [key, val] of Object.entries(this.keyToNote)) {
                this.inputMap[key] = `${val.note}${val.octave}`;
            }

        this.elements = new Map();
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        const octaves = [-1, 0, 1, 2];
        
        let whiteKeyIndex = 0;
        const totalWhiteKeys = octaves.length * 7;
        
        // Create white keys
        octaves.forEach(octave => {
            this.octavePattern.forEach(item => {
                if (item.type === 'white') {
                    const keyEl = this.createKeyElement(item.note, octave, 'white');
                    this.container.appendChild(keyEl);
                    whiteKeyIndex++;
                }
            });
        });

        // Create black keys with refined positioning
        let currentWhiteKey = 0;
        octaves.forEach(octave => {
            this.octavePattern.forEach(item => {
                if (item.type === 'white') {
                    currentWhiteKey++;
                } else {
                    const keyEl = this.createKeyElement(item.note, octave, 'black');
                    const leftPosition = (currentWhiteKey / totalWhiteKeys) * 100;
                    
                    // Fine-tuned offsets for 2-3 black key grouping realism
                    let offset = 0;
                    const note = item.note;
                    if (note === 'C#' || note === 'F#') offset = -0.4;
                    if (note === 'D#' || note === 'A#') offset = 0.4;
                    
                    keyEl.style.left = `calc(${leftPosition}% - 1.4% + ${offset}%)`;
                    this.container.appendChild(keyEl);
                }
            });
        });
    }

    createKeyElement(noteName, octave, type) {
        const keyEl = document.createElement('div');
        keyEl.className = `key ${type}`;
        keyEl.dataset.note = noteName;
        keyEl.dataset.octave = octave;
        
        const noteId = `${noteName}-${octave}`;
        
        // Find best label (priority to white keys)
        const labels = Object.entries(this.keyToNote).filter(([k, v]) => v.note === noteName && v.octave === octave);
        if (labels.length > 0) {
            const label = document.createElement('span');
            label.className = 'key-label';
            // Prefer single character labels
            const bestMapping = labels.find(l => l[1].label.length === 1) || labels[0];
            label.textContent = bestMapping[1].label;
            keyEl.appendChild(label);
        }

        const play = (e) => {
            e.preventDefault();
            this.onNotePlay(noteName, octave);
        };
        const stop = () => this.onNoteStop(noteName, octave);

        keyEl.addEventListener('mousedown', play);
        keyEl.addEventListener('mouseup', stop);
        keyEl.addEventListener('mouseleave', stop);
        keyEl.addEventListener('touchstart', play);
        keyEl.addEventListener('touchend', stop);

        this.elements.set(noteId, keyEl);
        return keyEl;
    }

    highlightKey(noteName, octave, active) {
        const noteId = `${noteName}-${octave}`;
        const el = this.elements.get(noteId);
        if (el) {
            if (active) el.classList.add('active');
            else el.classList.remove('active');
        }
        
        const noteDisplay = document.getElementById('current-note');
        if (active) {
            const octaveNum = octave + (window.app?.baseOctave || 4);
            noteDisplay.textContent = `Playing: ${noteName}${octaveNum}`;
            noteDisplay.style.color = '#fff';
        }
    }

    getNoteFromKey(key) {
        const noteStr = this.inputMap[key.toLowerCase()];
        if (!noteStr) return null;
        
        // Parse "C#-1" etc.
        const match = noteStr.match(/^([A-G]#?)(-?\d+)$/);
        if (match) {
            return { note: match[1], octave: parseInt(match[2]) };
        }
        return null;
    }
}
