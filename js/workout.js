/* ======================================================
   Kong Fit - workout.js
   - Carica esercizi da Google Sheets
   - Mostra pesi in base all'utente (1111 / 2222)
   - Nessuna logica admin
   - Nessuno stato complesso (versione stabile)
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getSession } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  function renderWorkoutView() {
    const session = getSession();
    if (!session) {
      KongFit.app.navigate("login");
      return;
    }

    // ⚠️ PER ORA decidiamo qui quale scheda caricare
    // (poi lo collegheremo a home / selezione)
    const SHEET_NAME =
      session.slug === "mattia"
        ? "Petto-Spalle | Apr26"
        : "Schiena-Tricipiti | Apr26";

    $("#workout-title").textContent = SHEET_NAME;
    $("#workout-subtitle").textContent = "Allenamento";

    loadSchedaFromSheet(SHEET_NAME, session.slug)
      .then(exercises => {
        const wrap = $("#workout-exercises");
        if (!wrap) return;

        if (!exercises || exercises.length === 0) {
          wrap.innerHTML = `<p class="muted">Nessun esercizio trovato.</p>`;
          return;
        }

        wrap.innerHTML = exercises.map((ex, i) => {
          return KongFit.workoutUI.createExerciseCard({
            id: `ex_${i}`,
            name: ex.name,
            target: `${ex.sets} x ${ex.reps}`,
            rest: ex.rest,
            last: ex.weight
          });
        }).join("");

        // attiva UI (collassabili + timer)
        KongFit.workoutUI.enhanceWorkoutUI();
      })
      .catch(err => {
        console.error("Errore caricamento scheda:", err);
        $("#workout-exercises").innerHTML =
          `<p class="muted">Errore nel caricamento della scheda.</p>`;
      });

    // ✅ submit semplice (MVP)
    const form = $("#workout-form");
    if (form) {
      form.onsubmit = (ev) => {
        ev.preventDefault();
        alert("Allenamento salvato ✅");
        KongFit.app.navigate("home");
      };
    }
  }

  KongFit.workout = {
    renderWorkoutView
  };
})();
