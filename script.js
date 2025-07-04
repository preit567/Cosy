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

let mediaRecorder;
let audioChunks = [];

function populateVoices() {
    const voices = synth.getVoices();
    voiceSelect.innerHTML = `<option value="">Default Voice</option>`;
    voices.forEach((voice, i) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

synth.onvoiceschanged = populateVoices;

playBtn.onclick = () => {
    const utterThis = new SpeechSynthesisUtterance(textInput.value);
    const selectedVoice = voiceSelect.value;
    const voices = synth.getVoices();

    if (selectedVoice) {
        utterThis.voice = voices.find(voice => voice.name === selectedVoice);
    }

    utterThis.rate = parseFloat(rateSelect.value);
    utterThis.pitch = parseFloat(pitchSelect.value);

    // Start audio capture
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createMediaStreamSource(dest.stream);
    mediaRecorder = new MediaRecorder(dest.stream);

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = "speech.webm"; // not mp3, but can play/download
        a.click();
    };

    mediaRecorder.start();
    status.className = "status success";
    status.textContent = "Playing and recording...";
    status.style.display = "block";

    utterThis.onend = () => {
        mediaRecorder.stop();
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        stopBtn.disabled = true;
        downloadBtn.disabled = false;
        status.textContent = "Finished! Click Download.";
    };

    synth.speak(utterThis);

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
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    stopBtn.disabled = true;
    status.textContent = "Stopped";
};

downloadBtn.onclick = () => {
    status.textContent = "Downloading...";
};