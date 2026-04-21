/* ======================================================
   Kong Fit - workout.js (Google Sheets)
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  function renderWorkoutView() {
    const session = getSession();
    const db = getDB();
    if (!session) {
      KongFit.app.navigate("login");
      return;
    }

    const scheda =
      GOOGLE_SCHEDE.find(s => s.id === db.activeSchedaId) || GOOGLE_SCHEDE[0];

    $("#workout-title").textContent = scheda.label;
    $("#workout-subtitle").textContent = "Allenamento";

    loadSchedaFromSheet(scheda.sheet, session.slug)
      .then(exercises => {
        const wrap = $("#workout-exercises");
        if (!wrap) return;

        wrap.innerHTML = exercises.map((ex, i) => {
          return KongFit.workoutUI.createExerciseCard({
            id: `ex_${i}`,
            name: ex.name,
            target: `${ex.sets} x ${ex.reps}`,
            rest: ex.rest,
            last: ex.weight
          });
        }).join("");

        KongFit.workoutUI.enhanceWorkoutUI();
      })
      .catch(() => {
        $("#workout-exercises").innerHTML =
          `<p class="muted">Errore caricamento scheda.</p>`;
      });

    $("#workout-form").onsubmit = (ev) => {
      ev.preventDefault();
      alert("Allenamento salvato ✅");
      KongFit.app.navigate("home");
    };
  }

  KongFit.workout = { renderWorkoutView };
})();
