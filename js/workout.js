/* ======================================================
   Kong Fit - workout.js (UPDATED & FINAL)
   - Usa le SCHEDE create dall'admin (db.schede)
   - Esercizi collassabili + timer (via workout-ui.js)
   - Salvataggio allenamento user
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, getCurrentUser } = KongFit.state;
  const { getSession } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  /* ---------------- HELPERS ---------------- */

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function parseSets(raw) {
    if (!raw) return [];
    return raw
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)
      .map(token => {
        const m = token.replace(/\s/g, "").match(/^([0-9]+(\.[0-9]+)?)x([0-9]+)$/i);
        if (!m) return { raw: token };
        return { kg: Number(m[1]), reps: Number(m[3]) };
      });
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  /* ---------------- ADMIN SCHEDA ---------------- */

  function getActiveAdminScheda(db) {
    const schede = db.schede || [];
    if (schede.length === 0) return null;
    // per ora usiamo l'ultima modificata (in testa)
    return schede[0];
  }

  function lastEntryForExercise(user, exerciseId) {
    for (const w of (user.workouts || [])) {
      const e = (w.entries || []).find(x => x.exerciseId === exerciseId);
      if (e) return e;
    }
    return null;
  }

  /* ---------------- RENDER ESERCIZI ---------------- */

  function renderExercisesFromScheda(user, scheda) {
    const wrap = $("#workout-exercises");
    if (!wrap) return;

    wrap.innerHTML = (scheda.exercises || []).map((ex, i) => {
      const exId = `${scheda.id}_${i}`;
      const last = lastEntryForExercise(user, exId);
      const hint = last?.sets?.length
        ? last.sets.map(s =>
            (s.kg != null && s.reps != null)
              ? `${s.kg}x${s.reps}`
              : (s.raw || "")
          ).join(", ")
        : "";

      return KongFit.workoutUI.createExerciseCard({
        id: exId,
        name: escapeHtml(ex.name),
        target: `${ex.sets}x ${escapeHtml(ex.reps)}`,
        rest: ex.rest || 0,
        last: hint
      });
    }).join("");

    // abilita UI avanzata
    KongFit.workoutUI.enhanceWorkoutUI();
  }

  /* ---------------- MAIN VIEW ---------------- */

  function renderWorkoutView() {
    const db = getDB();
    const session = getSession();
    const user = getCurrentUser(db);

    if (!session || !user) return;

    const scheda = getActiveAdminScheda(db);

    if (!scheda) {
      alert("Nessuna scheda disponibile. Contatta l'admin.");
      KongFit.app.navigate("home");
      return;
    }

    // HEADER
    const title = $("#workout-title");
    const subtitle = $("#workout-subtitle");
    if (title) title.textContent = scheda.name || "Allenamento";
    if (subtitle) subtitle.textContent = `Scheda attiva · ${todayISO()}`;

    // PRECOMPILA PESO CORPOREO
    const bwInput = $("#bodyweight");
    const lastBW = (user.workouts || [])
      .map(w => w.bodyweightKg)
      .find(v => v != null);
    if (bwInput && lastBW != null) bwInput.value = lastBW;

    // RENDER ESERCIZI
    renderExercisesFromScheda(user, scheda);

    // SUBMIT
    const form = $("#workout-form");
    if (!form) return;

    form.onsubmit = (ev) => {
      ev.preventDefault();

      const date = todayISO();
      const bodyweightKg = bwInput?.value ? Number(bwInput.value) : null;

      const entries = (scheda.exercises || []).map((ex, i) => {
        const exId = `${scheda.id}_${i}`;
        const raw = (form.querySelector(`input[data-sets="${exId}"]`)?.value || "").trim();
        return {
          exerciseId: exId,
          sets: parseSets(raw)
        };
      }).filter(e => e.sets.length > 0);

      if (entries.length === 0) {
        alert("Inserisci almeno un set per salvare l’allenamento.");
        return;
      }

      const workout = {
        date,
        schedaId: scheda.id,
        schedaName: scheda.name,
        bodyweightKg,
        entries
      };

      // SALVATAGGIO
      const db2 = getDB();
      const u2 = db2.users[session.slug];
      u2.workouts ||= [];
      u2.workouts.unshift(workout);
      setDB(db2);

      // FEEDBACK UX
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Salvataggio…";
      }

      setTimeout(() => {
        if (btn) btn.textContent = "Allenamento salvato ✅";
        setTimeout(() => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Salva allenamento";
          }
          KongFit.app.navigate("home");
        }, 600);
      }, 300);
    };
  }

  KongFit.workout = { renderWorkoutView };

})();
