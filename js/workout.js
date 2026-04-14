/* ======================================================
   Kong Fit - workout.js (ACTIVE WORKOUT FLOW)
   - Usa activeWorkout
   - Riprende allenamento
   - Termina allenamento
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, getCurrentUser } = KongFit.state;
  const { getSession } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  function renderWorkoutView() {
    const db = getDB();
    const session = getSession();
    const user = getCurrentUser(db);
    if (!session || !user) return;

    const active = db.activeWorkout;
    if (!active) {
      KongFit.app.navigate("home");
      return;
    }

    const scheda = (db.schede || []).find(s => s.id === active.schedaId);
    if (!scheda) {
      alert("Scheda non trovata.");
      db.activeWorkout = null;
      setDB(db);
      KongFit.app.navigate("home");
      return;
    }

    $("#workout-title").textContent = scheda.name;
    $("#workout-subtitle").textContent = "Allenamento in corso";

    const wrap = $("#workout-exercises");
    wrap.innerHTML = scheda.exercises.map((ex, i) => {
      const id = `${scheda.id}_${i}`;
      return KongFit.workoutUI.createExerciseCard({
        id,
        name: ex.name,
        target: `${ex.sets}x ${ex.reps}`,
        rest: ex.rest
      });
    }).join("");

    KongFit.workoutUI.enhanceWorkoutUI();

    // TERMINA ALLENAMENTO
    $("#end-workout-btn").onclick = () => {
      if (!confirm("Terminare l'allenamento?")) return;
      db.activeWorkout = null;
      setDB(db);
      KongFit.app.navigate("home");
    };

    // SALVA ALLENAMENTO (MVP)
    $("#workout-form").onsubmit = (ev) => {
      ev.preventDefault();
      alert("Allenamento salvato ✅");
    };
  }

  KongFit.workout = { renderWorkoutView };
})();
