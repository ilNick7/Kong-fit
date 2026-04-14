/* ======================================================
   Kong Fit - workout-ui.js
   - Esercizi collassabili
   - Timer recupero per esercizio
====================================================== */
(function () {

  function formatTime(sec){
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2,"0")}`;
  }

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
            <button type="button" class="timer-btn">Start recupero</button>
          </div>
        </div>
      </div>
    `;
  }

  function enhanceWorkoutUI() {
    const list = document.getElementById("workout-exercises");
    if(!list) return;

    // COLLAPSE
    list.addEventListener("click", (ev) => {
      const head = ev.target.closest(".workout-ex-head");
      if(!head) return;
      head.parentElement.classList.toggle("open");
    });

    // TIMER
    list.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".timer-btn");
      if(!btn) return;

      const card = btn.closest(".workout-ex");
      let seconds = Number(card.dataset.rest || 0);
      let display = card.querySelector(".timer-display");

      if(btn.classList.contains("running")){
        btn.classList.remove("running");
        btn.textContent = "Start recupero";
        clearInterval(card._timer);
        return;
      }

      btn.classList.add("running");
      btn.textContent = "Stop";

      display.textContent = formatTime(seconds);

      card._timer = setInterval(() => {
        seconds--;
        display.textContent = formatTime(Math.max(seconds,0));
        if(seconds <= 0){
          clearInterval(card._timer);
          btn.classList.remove("running");
          btn.textContent = "Start recupero";
          display.textContent = "0:00";
          navigator.vibrate?.(200);
        }
      }, 1000);
    });
  }

  // hook globale chiamato da workout.js dopo render
  window.KongFit = window.KongFit || {};
  window.KongFit.workoutUI = {
    enhanceWorkoutUI,
    createExerciseCard
  };

})();
