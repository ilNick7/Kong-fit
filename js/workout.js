/* ======================================================
   Kong Fit - workout.js (STEP 3)
   - Salvataggio progressivo (draft)
   - Ripristino automatico
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
      db.activeWorkout = null;
      setDB(db);
      KongFit.app.navigate("home");
      return;
    }

    // init draft
    active.draft ||= { sets: {}, bodyweight: null };

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

    // RIPRISTINO SET
    Object.entries(active.draft.sets).forEach(([id, value]) => {
      const input = document.querySelector(`input[data-sets="${id}"]`);
      if (input) input.value = value;
    });

    // RIPRISTINO PESO
    const bwInput = $("#bodyweight");
    if (bwInput && active.draft.bodyweight != null) {
      bwInput.value = active.draft.bodyweight;
    }

    // SALVATAGGIO PROGRESSIVO SET
    wrap.addEventListener("input", (ev) => {
      const input = ev.target.closest("input[data-sets]");
      if (!input) return;
      active.draft.sets[input.dataset.sets] = input.value;
      setDB(db);
    });

    // SALVATAGGIO PESO
    bwInput?.addEventListener("input", () => {
      active.draft.bodyweight = Number(bwInput.value) || null;
      setDB(db);
    });

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
