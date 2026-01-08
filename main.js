// Supabase Configuration
const SUPABASE_URL = "https://wlsvgxbhwpfqcarmgmrj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rzTlU1PcUypSOnAzAEMDwQ_Z2cHjPl8";
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Audio
const startSound = new Audio("./sound/click.mp3");
const pauseSound = new Audio("./sound/click.mp3");
const completeSound = new Audio("./sound/complete.mp3");
const resetSound = new Audio("./sound/click.mp3");

function playStartSound() {
  startSound.play();
}
function playPauseSound() {
  pauseSound.play();
}
function playCompleteSound() {
  completeSound.play();
}
function playResetSound() {
  resetSound.play();
}

// Timer State
let currentMode = "focus";
let timeLeft = 25 * 60;
let isRunning = false;
let intervalId = null;
let currentTask = null;

// DOM Elements
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

// Confirmation Modal Elements
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const confirmOk = document.getElementById("confirmOk");
const confirmCancel = document.getElementById("confirmCancel");

// Alert Modal Elements
const alertOverlay = document.getElementById("alertOverlay");
const alertTitle = document.getElementById("alertTitle");
const alertMessage = document.getElementById("alertMessage");
const alertOk = document.getElementById("alertOk");

// Task Elements
const taskSelector = document.getElementById("taskSelector");
const taskSelectorText = document.getElementById("taskSelectorText");
const taskDropdown = document.querySelector(".task-dropdown");
const taskDropdownList = document.getElementById("taskDropdownList");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskInfoBtn = document.getElementById("taskInfoBtn");
const taskInfoPanel = document.getElementById("taskInfoPanel");
const taskDescription = document.getElementById("taskDescription");
const taskProgressText = document.getElementById("taskProgressText");
const taskProgressPercent = document.getElementById("taskProgressPercent");
const taskProgressBar = document.getElementById("taskProgressBar");
const taskSessionsList = document.getElementById("taskSessionsList");
const editTaskBtn = document.getElementById("editTaskBtn");
const deleteTaskBtn = document.getElementById("deleteTaskBtn");

const taskFormOverlay = document.getElementById("taskFormOverlay");
const taskForm = document.getElementById("taskForm");
const taskFormTitle = document.getElementById("taskFormTitle");
const taskFormClose = document.getElementById("taskFormClose");
const taskFormCancel = document.getElementById("taskFormCancel");
const taskTitleInput = document.getElementById("taskTitleInput");
const taskDescInput = document.getElementById("taskDescInput");
const taskTargetInput = document.getElementById("taskTargetInput");

let isEditingTask = false;
let editingTaskId = null;
let isSubmittingTask = false;

const modeSettings = {
  focus: { duration: 25, label: "Focus time" },
  short: { duration: 5, label: "Short break" },
  long: { duration: 15, label: "Long break" },
};

// ==========================================
// TASK FUNCTIONS
// ==========================================

async function loadCurrentTask() {
  try {
    const { data: tasks, error } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (tasks && tasks.length > 0) {
      currentTask = tasks[0];
      updateCurrentTaskDisplay();
    } else {
      currentTask = null;
      updateCurrentTaskDisplay();
    }
  } catch (error) {
    console.error("Error loading current task:", error);
  }
}

function updateCurrentTaskDisplay() {
  if (!currentTask) {
    taskSelectorText.textContent = "No task selected";
    taskSelector.classList.add("no-task");
    taskInfoBtn.classList.add("hidden");
    taskInfoPanel.classList.add("hidden");
    return;
  }

  taskSelectorText.textContent = currentTask.title;
  taskSelector.classList.remove("no-task");
  taskInfoBtn.classList.remove("hidden");
}

async function loadAllTasks() {
  try {
    const { data: tasks, error } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("status", "active")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    if (tasks && tasks.length === 0) {
      taskDropdownList.innerHTML =
        '<div class="task-dropdown-item">No tasks available</div>';
      return;
    }

    taskDropdownList.innerHTML = tasks
      .map((task) => {
        const isSelected = currentTask && currentTask.id === task.id;
        const progress =
          task.target_sessions > 0
            ? Math.round(
                (task.total_sessions / task.target_sessions) * 100
              )
            : 0;
        return `
          <div class="task-dropdown-item ${
            isSelected ? "selected" : ""
          }" data-task-id="${task.id}">
            <div class="task-dropdown-item-title">${task.title}</div>
            <div class="task-dropdown-item-desc">${
              task.description || "No description"
            }</div>
            <div class="task-dropdown-item-progress">${task.total_sessions} / ${task.target_sessions} sessions (${progress}%)</div>
          </div>
        `;
      })
      .join("");

    // Attach event listeners
    taskDropdownList.querySelectorAll(".task-dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const taskId = parseInt(item.getAttribute("data-task-id"));
        selectTask(taskId);
      });
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
    taskDropdownList.innerHTML =
      '<div class="task-dropdown-item">Error loading tasks</div>';
  }
}

async function selectTask(taskId) {
  try {
    const { data: task, error } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error) throw error;

    currentTask = task;
    updateCurrentTaskDisplay();
    // Reset task info panel when changing task
    taskInfoPanel.classList.add("hidden");
    closeTaskDropdown();
  } catch (error) {
    console.error("Error selecting task:", error);
    await showAlertModal("Error", "Error selecting task");
  }
}

function toggleTaskDropdown() {
  taskDropdown.classList.toggle("open");
  if (taskDropdown.classList.contains("open")) {
    loadAllTasks();
  } else {
    taskDropdownList.classList.add("hidden");
  }
}

function closeTaskDropdown() {
  taskDropdown.classList.remove("open");
  taskDropdownList.classList.add("hidden");
}

function toggleTaskInfo() {
  if (!currentTask) return;

  taskInfoPanel.classList.toggle("hidden");

  if (!taskInfoPanel.classList.contains("hidden")) {
    loadTaskInfo();
  }
}

async function loadTaskInfo() {
  if (!currentTask) return;

  taskDescription.textContent = currentTask.description || "No description";

  const progress =
    currentTask.target_sessions > 0
      ? Math.round(
          (currentTask.total_sessions / currentTask.target_sessions) * 100
        )
      : 0;

  taskProgressText.textContent = `${currentTask.total_sessions} / ${currentTask.target_sessions} sessions`;
  taskProgressPercent.textContent = `${progress}%`;
  taskProgressBar.style.width = `${progress}%`;

  await loadTaskSessions();
}

// Helper function to format timestamp from database
function formatSessionTime(timestamp) {
  if (!timestamp) return "Invalid date";

  // Debug: Log raw timestamp from database
  console.log("Raw timestamp from DB:", timestamp, "Type:", typeof timestamp);

  let date;

  // Handle different timestamp formats from database
  if (typeof timestamp === "string") {
    // Supabase returns timestamp without Z (e.g., "2026-01-08T03:54:31.269")
    // This is UTC time but JS will parse it as local time if no Z
    // Solution: Add Z if it's missing to force UTC parsing
    let timestampStr = timestamp.trim();

    // If it has T but no Z or timezone offset, it's UTC from Supabase
    if (
      timestampStr.includes("T") &&
      !timestampStr.includes("Z") &&
      !timestampStr.match(/[+-]\d{2}:\d{2}$/)
    ) {
      // Add Z to indicate UTC
      timestampStr = timestampStr + "Z";
      console.log("Added Z to timestamp:", timestampStr);
    }

    date = new Date(timestampStr);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    // Fallback: try to create date from whatever we got
    date = new Date(timestamp);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error("Invalid date:", timestamp);
    return "Invalid date";
  }

  // Debug: Log parsed date
  console.log(
    "Parsed date (UTC):",
    date.toUTCString(),
    "Local time:",
    date.toLocaleString()
  );

  // Format to local timezone (date object already has correct local time after UTC parse)
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

async function loadTaskSessions() {
  if (!currentTask) {
    taskSessionsList.innerHTML = "";
    return;
  }

  try {
    const { data: sessions, error } = await supabaseClient
      .from("sessions")
      .select("*")
      .eq("task_id", currentTask.id)
      .order("completed_at", { ascending: false });

    if (error) throw error;

    if (sessions && sessions.length > 0) {
      // Debug: Log first session to see format
      console.log("Sample session from DB:", sessions[0]);
      console.log("completed_at value:", sessions[0].completed_at);
      console.log("completed_at type:", typeof sessions[0].completed_at);

      taskSessionsList.innerHTML = `
        <h4>Recent Sessions:</h4>
        ${sessions
          .map(
            (session) => `
          <div class="session-item">
            <div class="session-item-info">
              <div>${formatSessionTime(session.completed_at)}</div>
              <div>${Math.round(session.duration)} min</div>
            </div>
            <div class="session-item-actions">
              <button class="session-delete-btn" data-session-id="${
                session.id
              }">Delete</button>
            </div>
          </div>
        `
          )
          .join("")}
      `;

      // Attach event listeners
      taskSessionsList
        .querySelectorAll(".session-delete-btn")
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const sessionId = parseInt(btn.getAttribute("data-session-id"));
            deleteSession(sessionId);
          });
        });
    } else {
      taskSessionsList.innerHTML =
        '<p style="font-size: 0.85em; color: #666;">No sessions yet</p>';
    }
  } catch (error) {
    console.error("Error loading sessions:", error);
  }
}

async function deleteSession(sessionId) {
  const confirmed = await showConfirmModal(
    "Confirm",
    "Are you sure you want to delete this session?"
  );
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    if (error) throw error;

    // Recalculate total_sessions from DB to avoid race condition
    if (currentTask) {
      const { count, error: countError } = await supabaseClient
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("task_id", currentTask.id);

      if (countError) throw countError;

      const newTotalSessions = count || 0;

      const { error: updateError } = await supabaseClient
        .from("tasks")
        .update({
          total_sessions: newTotalSessions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentTask.id);

      if (updateError) throw updateError;
    }

    await loadCurrentTask();
    if (!taskInfoPanel.classList.contains("hidden")) {
      await loadTaskInfo();
    }
  } catch (error) {
    console.error("Error deleting session:", error);
    await showAlertModal("Error", "Error deleting session");
  }
}

async function saveCompletedSession() {
  if (!currentTask || currentMode !== "focus") return;

  try {
    // Get current time and convert to ISO string (UTC)
    const now = new Date();
    const completedAt = now.toISOString();

    // Debug: Log what we're saving
    console.log("Saving session with completed_at:", completedAt);
    console.log("Local time:", now.toLocaleString());
    console.log("UTC time:", now.toUTCString());

    const { error: sessionError } = await supabaseClient
      .from("sessions")
      .insert([
        {
          task_id: currentTask.id,
          duration: modeSettings.focus.duration,
          completed_at: completedAt,
        },
      ]);

    if (sessionError) throw sessionError;

    const { error: taskError } = await supabaseClient
      .from("tasks")
      .update({
        total_sessions: currentTask.total_sessions + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentTask.id);

    if (taskError) throw taskError;

    await loadCurrentTask();
    if (!taskInfoPanel.classList.contains("hidden")) {
      await loadTaskInfo();
    }
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

function openTaskForm(editing = false, task = null) {
  if (isSubmittingTask) return;

  isEditingTask = editing;

  if (editing && task) {
    editingTaskId = task.id;
    taskFormTitle.textContent = "Update Task Info";
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || "";
    taskTargetInput.value = task.target_sessions;
  } else {
    editingTaskId = null;
    taskFormTitle.textContent = "New Task";
    taskTitleInput.value = "";
    taskDescInput.value = "";
    taskTargetInput.value = 4;
  }

  taskFormOverlay.classList.remove("hidden");
  setTimeout(() => {
    taskTitleInput.focus();
  }, 100);
}

function closeTaskForm() {
  taskFormOverlay.classList.add("hidden");
  taskForm.reset();
  isSubmittingTask = false;
  isEditingTask = false;
  editingTaskId = null;
}

async function saveTask(e) {
  e.preventDefault();

  if (isSubmittingTask) return;

  const title = taskTitleInput.value.trim();
  const targetSessions = parseInt(taskTargetInput.value);

  // Validation
  if (!title) {
    await showAlertModal("Error", "Please enter task title");
    taskTitleInput.focus();
    return;
  }

  if (isNaN(targetSessions) || targetSessions < 1) {
    await showAlertModal("Error", "Target sessions must be greater than 0");
    taskTargetInput.focus();
    return;
  }

  isSubmittingTask = true;

  const taskData = {
    title: title,
    description: taskDescInput.value.trim(),
    target_sessions: targetSessions,
    updated_at: new Date().toISOString(),
  };

  try {
    if (isEditingTask && editingTaskId) {
      const { error } = await supabaseClient
        .from("tasks")
        .update(taskData)
        .eq("id", editingTaskId);

      if (error) throw error;

      if (currentTask && currentTask.id === editingTaskId) {
        await loadCurrentTask();
        if (!taskInfoPanel.classList.contains("hidden")) {
          await loadTaskInfo();
        }
      }
    } else {
      const now = new Date().toISOString();
      const { data, error } = await supabaseClient
        .from("tasks")
        .insert([
          {
            ...taskData,
            status: "active",
            total_sessions: 0,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      currentTask = data;
      updateCurrentTaskDisplay();
    }

    closeTaskForm();
  } catch (error) {
    console.error("Error saving task:", error);
    await showAlertModal(
      "Error",
      "Error saving task: " + (error.message || "Unknown error")
    );
  } finally {
    isSubmittingTask = false;
  }
}

async function deleteTask() {
  if (!currentTask) return;
  const confirmed = await showConfirmModal(
    "Confirm Delete",
    `Are you sure you want to delete task "${currentTask.title}"? All sessions will be deleted.`
  );
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from("tasks")
      .delete()
      .eq("id", currentTask.id);

    if (error) throw error;

    currentTask = null;
    await loadCurrentTask();
    taskInfoPanel.classList.add("hidden");
  } catch (error) {
    console.error("Error deleting task:", error);
    await showAlertModal("Error", "Error deleting task");
  }
}

// ==========================================
// TIMER FUNCTIONS
// ==========================================

function updateGifAndBackground() {
  focusGif.classList.add("hidden");
  shortBreakGif.classList.add("hidden");
  longBreakGif.classList.add("hidden");

  body.classList.remove("focus-mode", "short-break-mode", "long-break-mode");

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

  // Save to localStorage
  localStorage.setItem(
    "pomodoroSettings",
    JSON.stringify({
      focus: modeSettings.focus.duration,
      short: modeSettings.short.duration,
      long: modeSettings.long.duration,
    })
  );
}

function loadSettings() {
  const saved = localStorage.getItem("pomodoroSettings");
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      if (settings.focus && settings.focus >= 1) {
        focusTimeInput.value = settings.focus;
        modeSettings.focus.duration = settings.focus;
      }
      if (settings.short && settings.short >= 1) {
        shortBreakTimeInput.value = settings.short;
        modeSettings.short.duration = settings.short;
      }
      if (settings.long && settings.long >= 1) {
        longBreakTimeInput.value = settings.long;
        modeSettings.long.duration = settings.long;
      }
      // Update current timer based on loaded settings
      timeLeft = modeSettings[currentMode].duration * 60;
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  }
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
    pauseTimer(true);
  } else {
    startTimer();
  }
}

function startTimer() {
  isRunning = true;
  startBtn.textContent = "Pause";
  playStartSound();

  intervalId = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(intervalId);
      isRunning = false;
      startBtn.textContent = "Start";
      playCompleteSound();

      // Handle async session save
      if (currentMode === "focus") {
        saveCompletedSession()
          .then(() => {
            // Reset timer after completing session
            resetTimer();
          })
          .catch((error) => {
            console.error("Error saving session:", error);
            // Still reset timer even if save fails
            resetTimer();
          });
      } else {
        // Reset timer for non-focus modes
        resetTimer();
      }
    }
  }, 1000);
}

function pauseTimer(playSound = false) {
  isRunning = false;
  startBtn.textContent = "Start";
  clearInterval(intervalId);

  if (playSound && timeLeft > 0) {
    playPauseSound();
  }
}

function resetTimer() {
  pauseTimer(false);
  playResetSound();
  updateSettings();
  timeLeft = modeSettings[currentMode].duration * 60;
  updateDisplay();
}

function switchMode(mode) {
  pauseTimer(false);
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

// ==========================================
// MODAL FUNCTIONS
// ==========================================

function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    confirmTitle.textContent = title || "Confirm";
    confirmMessage.textContent = message;
    confirmOverlay.classList.remove("hidden");

    const handleOk = () => {
      confirmOverlay.classList.add("hidden");
      confirmOk.removeEventListener("click", handleOk);
      confirmCancel.removeEventListener("click", handleCancel);
      confirmOverlay.removeEventListener("click", handleOverlay);
      resolve(true);
    };

    const handleCancel = () => {
      confirmOverlay.classList.add("hidden");
      confirmOk.removeEventListener("click", handleOk);
      confirmCancel.removeEventListener("click", handleCancel);
      confirmOverlay.removeEventListener("click", handleOverlay);
      resolve(false);
    };

    const handleOverlay = (e) => {
      if (e.target === confirmOverlay) {
        handleCancel();
      }
    };

    confirmOk.addEventListener("click", handleOk);
    confirmCancel.addEventListener("click", handleCancel);
    confirmOverlay.addEventListener("click", handleOverlay);
  });
}

function showAlertModal(title, message) {
  return new Promise((resolve) => {
    alertTitle.textContent = title || "Notification";
    alertMessage.textContent = message;
    alertOverlay.classList.remove("hidden");

    const handleOk = () => {
      alertOverlay.classList.add("hidden");
      alertOk.removeEventListener("click", handleOk);
      alertOverlay.removeEventListener("click", handleOverlay);
      resolve();
    };

    const handleOverlay = (e) => {
      if (e.target === alertOverlay) {
        handleOk();
      }
    };

    alertOk.addEventListener("click", handleOk);
    alertOverlay.addEventListener("click", handleOverlay);
  });
}

// ==========================================
// LETTER DIALOG
// ==========================================

function openLetterDialog() {
  letterOverlay.classList.remove("hidden");
}

function closeLetterDialog() {
  letterOverlay.classList.add("hidden");
}

// ==========================================
// EVENT LISTENERS
// ==========================================

startBtn.addEventListener("click", toggleTimer);
resetBtn.addEventListener("click", resetTimer);

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchMode(btn.dataset.mode);
  });
});

[focusTimeInput, shortBreakTimeInput, longBreakTimeInput].forEach((input) => {
  input.addEventListener("change", () => {
    // Validate: if empty or < 1, set to 1
    const value = parseInt(input.value);
    if (isNaN(value) || value < 1) {
      input.value = 1;
    }
    if (!isRunning) {
      resetTimer();
    }
  });

  // Also validate on blur
  input.addEventListener("blur", () => {
    const value = parseInt(input.value);
    if (isNaN(value) || value < 1) {
      input.value = 1;
      if (!isRunning) {
        resetTimer();
      }
    }
  });
});

openLetterBtn.addEventListener("click", openLetterDialog);
closeLetterBtn.addEventListener("click", closeLetterDialog);

letterOverlay.addEventListener("click", (e) => {
  if (e.target === letterOverlay) {
    closeLetterDialog();
  }
});

// Task Dropdown
taskSelector.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTaskDropdown();
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!taskDropdown.contains(e.target)) {
    closeTaskDropdown();
  }
});

// Task Actions
addTaskBtn.addEventListener("click", () => {
  openTaskForm(false);
});

taskInfoBtn.addEventListener("click", toggleTaskInfo);

editTaskBtn.addEventListener("click", () => {
  openTaskForm(true, currentTask);
});

deleteTaskBtn.addEventListener("click", deleteTask);

// Task Form
taskForm.addEventListener("submit", saveTask);
taskFormClose.addEventListener("click", closeTaskForm);
taskFormCancel.addEventListener("click", closeTaskForm);

taskFormOverlay.addEventListener("click", (e) => {
  if (e.target === taskFormOverlay) {
    closeTaskForm();
  }
});

// ==========================================
// INITIALIZATION
// ==========================================

// Load settings from localStorage
loadSettings();

// Ensure form is closed on init
taskFormOverlay.classList.add("hidden");
taskInfoPanel.classList.add("hidden");
taskDropdownList.classList.add("hidden");

updateDisplay();
updateGifAndBackground();
loadCurrentTask();
