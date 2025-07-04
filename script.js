document.addEventListener('DOMContentLoaded', function () {
  const textInput = document.getElementById('textInput');
  const voiceSelect = document.getElementById('voiceSelect');
  const rateSelect = document.getElementById('rateSelect');
  const pitchSelect = document.getElementById('pitchSelect');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const stopBtn = document.getElementById('stopBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const statusDiv = document.getElementById('status');

  const synth = window.speechSynthesis;
  let utterance = null;
  let voices = [];
  let audioChunks = [];
  let mediaRecorder = null;

  if (!('speechSynthesis' in window)) {
    showStatus('Web Speech API not supported in your browser.', 'error');
    disableAllControls();
    return;
  }

  function loadVoices() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = '<option value="">Default Voice</option>';
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.textContent = `${voice.name} (${voice.lang})`;
      option.setAttribute('data-name', voice.name);
      option.setAttribute('data-lang', voice.lang);
      voiceSelect.appendChild(option);
    });
  }

  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  loadVoices();

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
  }

  function disableAllControls() {
    playBtn.disabled = true;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    stopBtn.disabled = true;
    downloadBtn.disabled = true;
  }

  playBtn.addEventListener('click', function () {
    if (textInput.value.trim() === '') {
      showStatus('Please enter some text.', 'error');
      return;
    }

    synth.cancel();
    utterance = new SpeechSynthesisUtterance(textInput.value);

    const selectedOption = voiceSelect.selectedOptions[0];
    if (selectedOption.value !== '') {
      const selectedVoiceName = selectedOption.getAttribute('data-name');
      const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.rate = parseFloat(rateSelect.value);
    utterance.pitch = parseFloat(pitchSelect.value);

    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createMediaStreamSource(dest.stream);
    mediaRecorder = new MediaRecorder(dest.stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      downloadBtn.href = url;
      downloadBtn.download = "speech.webm";
      downloadBtn.disabled = false;
    };

    mediaRecorder.start();

    utterance.onstart = () => {
      showStatus('Playing audio...', 'success');
      playBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      resumeBtn.disabled = true;
      downloadBtn.disabled = true;
    };

    utterance.onend = () => {
      showStatus('Audio finished.', 'success');
      mediaRecorder.stop();
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      resumeBtn.disabled = true;
      stopBtn.disabled = true;
    };

    utterance.onerror = (event) => {
      showStatus('Error: ' + event.error, 'error');
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      resumeBtn.disabled = true;
      stopBtn.disabled = true;
    };

    synth.speak(utterance);
  });

  pauseBtn.addEventListener('click', function () {
    if (synth.speaking) {
      synth.pause();
      showStatus('Audio paused.', 'success');
      pauseBtn.disabled = true;
      resumeBtn.disabled = false;
    }
  });

  resumeBtn.addEventListener('click', function () {
    if (synth.paused) {
      synth.resume();
      showStatus('Audio resumed.', 'success');
      pauseBtn.disabled = false;
      resumeBtn.disabled = true;
    }
  });

  stopBtn.addEventListener('click', function () {
    synth.cancel();
    showStatus('Audio stopped.', 'success');
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    stopBtn.disabled = true;
  });

  textInput.addEventListener('input', function () {
    playBtn.disabled = textInput.value.trim() === '';
  });
});
