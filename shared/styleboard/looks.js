// Shared style board: the looks both projects can pick from (studio mood board, adstudio brand looks).
// Each look: id, prompt (added to generation prompts), name (n), sky gradient, tint, optional building palette (pal), and swatches (sw) for the UI.
// Needs shared/lib/kit.js loaded first (uses K.LOOKS palettes).
const STYLEBOARD = {
  looks: [
    { id: 'dusk', prompt: 'warm dusk light, orange sky, soft haze', n: 'warm dusk', sky: ['#f08a5d', '#ffd29a'], tint: '#ffe0c8', sw: ['#f08a5d', '#ffd29a', '#b5735a', '#6e655a'] },
    { id: 'pastel', prompt: 'soft pastel colors, airy diffuse light', n: 'pastel', sky: ['#bfe3f2', '#fdf0f6'], tint: '#fff4fa', pal: K.LOOKS.pastel.pal, sw: ['#bfe3f2', '#ffb3c1', '#ffd6a5', '#caffbf'] },
    { id: 'noir', prompt: 'black and white film noir, hard contrast', n: 'noir', sky: ['#222', '#888'], tint: '#bbbbbb', pal: K.LOOKS.noir.pal, sw: ['#222', '#555', '#888', '#bbb'] },
    { id: 'neon', prompt: 'neon night, magenta and cyan light, wet reflections', n: 'neon', sky: ['#12061f', '#3a0f4a'], tint: '#e8b8ff', pal: K.LOOKS.neon.pal, sw: ['#12061f', '#3a1050', '#ff6bd6', '#0a3a40'] },
    ],
};
