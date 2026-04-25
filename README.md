# 🎹 KeyPiano

**KeyPiano** is a professional-grade, browser-based hybrid grand piano. It transforms your computer keyboard into a fully functional 48-key virtual instrument, combining the authentic acoustic texture of real grand piano samples with the precision of physical modeling synthesis.

---

## 🌟 Features

*   **Hybrid Audio Engine (90/10 Layering)**:
    *   **90% Acoustic Samples**: Uses high-fidelity **Salamander Grand Piano** samples (Yamaha C5) for authentic hammer strikes and wooden decay.
    *   **10% Physical Modeling**: Layers in additive synthesis to provide subtle "body" and harmonic resonance, ensuring the sound feels alive across all pitches.
*   **Concert Hall Acoustics**: Replaces standard digital reverb with a true **Convolution Reverb** utilizing a real Impulse Response (IR) of a professional concert hall.
*   **4-Octave QWERTY Layout**: A completely collision-free mapping system that allows you to play 48 unique keys using your computer keyboard.
*   **Smart Looper**: A single-button, 3-state professional looper (Record -> Finish & Loop -> Stop & Clear) with high-precision synchronization.
*   **Professional Envelopes**: Notes follow a natural exponential decay curve, mimicking the physics of a vibrating piano string.
*   **Asset Pre-caching**: A splash screen ensures all high-fidelity samples and acoustic files are fully loaded and decoded before you start playing, eliminating audio lag.

---

## ⌨️ Keyboard Layout

KeyPiano uses a unique "Two-Tier" system to map 48 piano keys to your QWERTY keyboard without any overlaps:

### Lower Tier (Octaves 4 & 5)
*   **White Keys**: Bottom row (`Z` through `/`)
*   **Black Keys**: Home row (`S` through `;`)

### Upper Tier (Octaves 6 & 7)
*   **White Keys**: Top row (`Q` through `]`)
*   **Black Keys**: Number row (`2` through `-`)

**Global Controls:**
*   **Sustain Pedal**: `Spacebar` (Hold to sustain notes, release to dampen)

---

## 🚀 Running Locally

Because KeyPiano relies on the Web Audio API and external CDNs for high-fidelity assets, it must be run on a local development server (opening the HTML file directly in the browser may cause CORS issues).

1. Clone the repository:
   ```bash
   git clone https://github.com/rrithvik17/KeyPiano-Web-Piano.git
   cd KeyPiano-Web-Piano
   ```
2. Start a local server. If you have Node.js installed, you can use `npx`:
   ```bash
   npx serve .
   ```
   *(Alternatively, use Python: `python -m http.server 8000`)*
3. Open your browser and navigate to the local address provided (e.g., `http://localhost:3000`).

---

## 🛠️ Technologies Used

*   **HTML5 / CSS3**: Responsive, dark-mode UI with a "glassmorphism" aesthetic.
*   **Vanilla JavaScript (ES6 Modules)**: Complete separation of concerns (UI, Audio Engine, Recorder).
*   **Web Audio API**: `AudioBufferSourceNode`, `ConvolverNode`, `GainNode` envelopes, and oscillators for synthesis.
*   **Tone.js CDN**: Hosting for the Salamander Grand Piano samples.
