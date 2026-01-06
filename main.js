// Đường dẫn âm thanh của bạn:
const startSound = new Audio("./sound/click.mp3");
const pauseSound = new Audio("./sound/click.mp3");
const completeSound = new Audio("./sound/complete.mp3");
const resetSound = new Audio("./sound/click.mp3");

// Hàm phát âm thanh Start
function playStartSound() {
  startSound.play();
}

// Hàm phát âm thanh Pause
function playPauseSound() {
  pauseSound.play();
}

// Hàm phát âm thanh Complete
function playCompleteSound() {
  completeSound.play();
}

// Hàm phát âm thanh Reset
function playResetSound() {
  resetSound.play();
}

let currentMode = "focus";
let timeLeft = 25 * 60;
let isRunning = false;
let intervalId = null;

const timerDisplay = document.getElementById("timer");
const modeLabel = document.getElementById("modeLabel");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const modeButtons = document.querySelectorAll(".mode-btn");

const focusTimeInput = document.getElementById("focusTime");
const shortBreakTimeInput = document.getElementById("shortBreakTime");
const longBreakTimeInput = document.getElementById("longBreakTime");

const focusGif = document.getElementById("focusGif");
const shortBreakGif = document.getElementById("shortBreakGif");
const longBreakGif = document.getElementById("longBreakGif");

const body = document.body;

// Letter Dialog Elements
const openLetterBtn = document.getElementById("openLetterBtn");
const closeLetterBtn = document.getElementById("closeLetterBtn");
const letterOverlay = document.getElementById("letterOverlay");

const modeSettings = {
  focus: { duration: 25, label: "Focus time" },
  short: { duration: 5, label: "Short break" },
  long: { duration: 15, label: "Long break" },
};

function updateGifAndBackground() {
  // Hide all GIFs
  focusGif.classList.add("hidden");
  shortBreakGif.classList.add("hidden");
  longBreakGif.classList.add("hidden");

  // Remove all background classes
  body.classList.remove("focus-mode", "short-break-mode", "long-break-mode");

  // Show appropriate GIF and background
  if (currentMode === "focus") {
    focusGif.classList.remove("hidden");
    body.classList.add("focus-mode");
  } else if (currentMode === "short") {
    shortBreakGif.classList.remove("hidden");
    body.classList.add("short-break-mode");
  } else if (currentMode === "long") {
    longBreakGif.classList.remove("hidden");
    body.classList.add("long-break-mode");
  }
}

function updateSettings() {
  modeSettings.focus.duration = parseInt(focusTimeInput.value);
  modeSettings.short.duration = parseInt(shortBreakTimeInput.value);
  modeSettings.long.duration = parseInt(longBreakTimeInput.value);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(timeLeft);
  modeLabel.textContent = modeSettings[currentMode].label;
}

function toggleTimer() {
  if (isRunning) {
    pauseTimer(true); // Truyền tham số true để phát âm thanh pause
  } else {
    startTimer();
  }
}

function startTimer() {
  isRunning = true;
  startBtn.textContent = "Pause";
  playStartSound(); // Phát âm thanh khi Start

  intervalId = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      pauseTimer(false); // Không phát âm thanh pause khi hoàn thành
      playCompleteSound(); // Phát âm thanh khi hoàn thành
    }
  }, 1000);
}

function pauseTimer(playSound = false) {
  isRunning = false;
  startBtn.textContent = "Start";
  clearInterval(intervalId);

  // Chỉ phát âm thanh pause khi được yêu cầu (từ nút Pause)
  if (playSound && timeLeft > 0) {
    playPauseSound();
  }
}

function resetTimer() {
  pauseTimer(false); // Không phát âm thanh start/pause khi reset
  playResetSound(); // Phát âm thanh reset
  updateSettings();
  timeLeft = modeSettings[currentMode].duration * 60;
  updateDisplay();
}

function switchMode(mode) {
  pauseTimer(false); // Không phát âm thanh khi đổi mode
  currentMode = mode;
  updateSettings();
  timeLeft = modeSettings[mode].duration * 60;
  updateDisplay();
  updateGifAndBackground();

  modeButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.mode === mode) {
      btn.classList.add("active");
    }
  });
}

// Letter Dialog Functions
function openLetterDialog() {
  letterOverlay.classList.remove("hidden");
}

function closeLetterDialog() {
  letterOverlay.classList.add("hidden");
}

// Event Listeners
startBtn.addEventListener("click", toggleTimer);
resetBtn.addEventListener("click", resetTimer);

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchMode(btn.dataset.mode);
  });
});

[focusTimeInput, shortBreakTimeInput, longBreakTimeInput].forEach((input) => {
  input.addEventListener("change", () => {
    if (!isRunning) {
      resetTimer();
    }
  });
});

// Letter Dialog Event Listeners
openLetterBtn.addEventListener("click", openLetterDialog);
closeLetterBtn.addEventListener("click", closeLetterDialog);

// Close dialog when clicking outside
letterOverlay.addEventListener("click", (e) => {
  if (e.target === letterOverlay) {
    closeLetterDialog();
  }
});

updateDisplay();
updateGifAndBackground();
