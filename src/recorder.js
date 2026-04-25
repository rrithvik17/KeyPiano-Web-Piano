/**
 * KeyPiano Recorder
 * Handles recording and playback of performances with high precision
 */

export class Recorder {
    constructor(onPlayNote, onStopNote) {
        this.onPlayNote = onPlayNote;
        this.onStopNote = onStopNote;
        
        this.isRecording = false;
        this.isPlaying = false;
        this.loop = false;
        this.startTime = 0;
        this.totalDuration = 0;
        this.events = [];
        this.playbackTimeouts = [];
        this.onPlaybackComplete = null;
    }

    start() {
        this.isRecording = true;
        this.events = [];
        this.startTime = performance.now();
    }

    stop() {
        if (!this.isRecording) return false;
        
        const now = performance.now();
        this.totalDuration = now - this.startTime;

        // Auto-release any notes still held at the end of the recording
        const activeNotes = new Set();
        this.events.forEach(e => {
            if (e.type === 'play') activeNotes.add(`${e.noteName}-${e.octave}`);
            else activeNotes.delete(`${e.noteName}-${e.octave}`);
        });

        activeNotes.forEach(noteId => {
            const [noteName, octave] = noteId.split('-');
            this.events.push({
                type: 'stop',
                noteName,
                octave: parseInt(octave),
                time: this.totalDuration
            });
        });

        this.isRecording = false;
        return this.events.length > 0;
    }

    recordEvent(type, noteName, octave) {
        if (!this.isRecording) return;
        
        this.events.push({
            type, // 'play' or 'stop'
            noteName,
            octave,
            time: performance.now() - this.startTime
        });
    }

    play(loop = false) {
        if (this.events.length === 0 || this.isPlaying) return;
        
        this.isPlaying = true;
        this.loop = loop;
        this.playbackTimeouts = [];
        
        const scheduleEvents = () => {
            this.events.forEach(event => {
                const timeout = setTimeout(() => {
                    if (event.type === 'play') {
                        this.onPlayNote(event.noteName, event.octave, false);
                    } else {
                        this.onStopNote(event.noteName, event.octave, false);
                    }
                }, event.time);
                
                this.playbackTimeouts.push(timeout);
            });

            // Handle Looping or End
            if (this.loop) {
                const loopTimeout = setTimeout(() => {
                    this.clearTimeouts();
                    scheduleEvents();
                }, this.totalDuration);
                this.playbackTimeouts.push(loopTimeout);
            } else {
                const lastEventTime = this.events[this.events.length - 1].time;
                const endTimeout = setTimeout(() => {
                    this.stopPlayback();
                    if (this.onPlaybackComplete) this.onPlaybackComplete();
                }, Math.max(this.totalDuration, lastEventTime + 100));
                this.playbackTimeouts.push(endTimeout);
            }
        };

        scheduleEvents();
    }

    stopPlayback() {
        this.clearTimeouts();
        this.isPlaying = false;
        // Kill any sustained notes from playback
        if (this.onStopNote) {
            this.events.filter(e => e.type === 'play').forEach(e => {
                this.onStopNote(e.noteName, e.octave, false);
            });
        }
    }

    clearTimeouts() {
        this.playbackTimeouts.forEach(clearTimeout);
        this.playbackTimeouts = [];
    }
}
