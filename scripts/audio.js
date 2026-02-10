import { settings } from '/scripts/settings.js';

// Constant Variables
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const volume = 0.35;
const gainNode = audioCtx.createGain();

// Functions
function main() {
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = volume;
}
async function buttonSoundOnClick() {
  if (settings.sound) {
    // Fetch and decode the audio file
    const response = await fetch('/audios/switch.wav');
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Create audio source and connect to destination
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);

    // Schedule playback a short moment into the future
    source.start(audioCtx.currentTime);
  }
}
/**
 *
 * @param {boolean} isOn
 */
function setAudioStatus(isOn) {
  gainNode.gain.value = isOn ? volume : 0;
}

// Event Listeners
document.addEventListener('click', (e) => {
  // check if the click target is a <button> or <a>
  if (e.target.closest('button, a')) {
    buttonSoundOnClick(e);
  }
});

export { audioCtx, gainNode, main, setAudioStatus };
