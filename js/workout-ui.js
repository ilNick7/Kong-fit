/* ======================================================
 - workout-ui.js
   - Esercizi collassabili
   - Timer recupero
   - Timer FULLSCREEN con Interrompi
====================================================== */
(function () {

  /* ===============================
     UTILS
  =============================== */
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  /* ===============================
     CREAZIONE CARD ESERCIZIO
  =============================== */
  function createExerciseCard({ id, name, target, rest, last }) {
    return `
      <div class="workout-ex" data-ex-id="${id}" data-rest="${rest || 0}">
        <div class="workout-ex-head">
          <h3>${name}</h3>
          <span>${target}</span>
        </div>

        <div class="workout-ex-body">
          ${last ? `<div class="workout-last">Ultimo: ${last}</div>` : ""}

          <label>Set (kg x reps)</label>
          <input data-sets="${id}" type="text" placeholder="es. 80x8, 80x7" />

          <div class="workout-timer">
            <div class="timer-display">${formatTime(rest || 0)}</div>
            <button type="button" class="timer-btn">
              Start recupero
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ===============================
     TIMER FULLSCREEN
  =============================== */
  function startFullscreenTimer(seconds) {
    const overlay = document.getElementById("rest-timer-overlay");
    const valueEl = document.getElementById("rest-timer-value");
    const stopBtn = document.getElementById("rest-timer-stop");

    let remaining = seconds;
    overlay.classList.remove("hidden");

    function render() {
      valueEl.textContent = formatTime(Math.max(remaining, 0));
    }

    render();

    const interval = setInterval(() => {
      remaining--;
      render();

      if (remaining <= 0) {
        clearInterval(interval);
        overlay.classList.add("hidden");
        navigator.vibrate?.(300);
      }
    }, 1000);

    stopBtn.onclick = () => {
      clearInterval(interval);
      overlay.classList.add("hidden");
    };
  }

  /* ===============================
     ENHANCE UI
  =============================== */
  function enhanceWorkoutUI() {
    const list = document.getElementById("workout-exercises");
    if (!list) return;

    /* -------- COLLASSO -------- */
    list.addEventListener("click", (ev) => {
      const head = ev.target.closest(".workout-ex-head");
      if (!head) return;

      const card = head.closest(".workout-ex");
      card.classList.toggle("open");
    });

    /* -------- TIMER -------- */
    list.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".timer-btn");
      if (!btn) return;

      const card = btn.closest(".workout-ex");
      const seconds = Number(card.dataset.rest || 0);

      if (seconds <= 0) {
        alert("Recupero non impostato");
        return;
      }

      startFullscreenTimer(seconds);
    });

    /* -------- AUTO OPEN PRIMO -------- */
    const first = list.querySelector(".workout-ex");
    if (first) first.classList.add("open");
  }

  /* ===============================
     EXPORT
  =============================== */
  window.KongFit = window.KongFit || {};
  window.KongFit.workoutUI = {
    createExerciseCard,
    enhanceWorkoutUI
  };

})();
