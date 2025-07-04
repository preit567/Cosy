const synth = window.speechSynthesis;
const textInput = document.getElementById("textInput");
const voiceSelect = document.getElementById("voiceSelect");
const rateSelect = document.getElementById("rateSelect");
const pitchSelect = document.getElementById("pitchSelect");

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const stopBtn = document.getElementById("stopBtn");
const downloadBtn = document.getElementById("downloadBtn");

const status = document.getElementById("status");

let currentUtterance = null;
let mediaRecorder;
let audioChunks = [];

function populateVoices() {
    const voices = synth.getVoices();
    voiceSelect.innerHTML = `<option value="">Default Voice</option>`;
    voices.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

// Load voices async
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
}
populateVoices();

playBtn.onclick = () => {
    const text = textInput.value;
    if (!text) return;

    const utterThis = new SpeechSynthesisUtterance(text);
    currentUtterance = utterThis;

    const selectedVoice = voiceSelect.value;
    const voices = synth.getVoices();
    if (selectedVoice) {
        utterThis.voice = voices.find(voice => voice.name === selectedVoice);
    }

    utterThis.rate = parseFloat(rateSelect.value);
    utterThis.pitch = parseFloat(pitchSelect.value);

    // Optional: MP3/WebM recording
    const audioContext = new AudioContext();
    const dest = audioContext.createMediaStreamDestination();
    const synthSource = audioContext.createMediaStreamSource(dest.stream);
    mediaRecorder = new MediaRecorder(dest.stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'speech.webm';
        a.click();
        status.textContent = "Downloaded!";
    };

    mediaRecorder.start();

    utterThis.onend = () => {
        mediaRecorder.stop();
        status.className = "status success";
        status.textContent = "Speech finished!";
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        stopBtn.disabled = true;
        downloadBtn.disabled = false;
    };

    synth.speak(utterThis);
    status.className = "status success";
    status.textContent = "Speaking...";
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    downloadBtn.disabled = true;
};

pauseBtn.onclick = () => {
    synth.pause();
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
    status.textContent = "Paused";
};

resumeBtn.onclick = () => {
    synth.resume();
    resumeBtn.disabled = true;
    pauseBtn.disabled = false;
    status.textContent = "Resumed";
};

stopBtn.onclick = () => {
    synth.cancel();
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    stopBtn.disabled = true;
    status.textContent = "Stopped";
};

downloadBtn.onclick = () => {
    // No action needed; download triggers automatically after speaking
};
