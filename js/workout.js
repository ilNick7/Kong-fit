/* Kong Fit - workout.js
   Render workout, parsing sets e salvataggio.
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, getCurrentUser } = KongFit.state;
  const { getTemplate } = KongFit.templates;

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function parseSets(raw) {
    // formato: "80x8, 80x7, 77.5x6"
    if (!raw) return [];
    return raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(token => {
        const m = token.replace(/\s/g, "").match(/^([0-9]+(\.[0-9]+)?)x([0-9]+)$/i);
        if (!m) return { kg: null, reps: null, raw: token };
        return { kg: Number(m[1]), reps: Number(m[3]) };
      });
  }

  function getNextDay(user) {
    const tpl = getTemplate(user.config.templateId);
    const idx = (user.config.rotationIndex || 0) % tpl.days.length;
    return { tpl, day: tpl.days[idx], idx };
  }

  function findLastEntryForExercise(user, exerciseId) {
    for (const w of user.workouts || []) {
      const e = (w.entries || []).find(x => x.exerciseId === exerciseId);
      if (e) return e;
    }
    return null;
  }

  function renderWorkoutView() {
    const db = getDB();
    const user = getCurrentUser(db);
    if (!user) return;

    const view = document.getElementById("view-workout");
    const daySelect = document.getElementById("workout-day");
    const exercisesWrap = document.getElementById("workout-exercises");
    const dateInput = view.querySelector("#workout-date") || null;

    const { tpl, day, idx } = getNextDay(user);

    // Popola select giorni
    daySelect.innerHTML = tpl.days
      .map((d, i) => `<option value="${i}" ${i === idx ? "selected" : ""}>${escapeHtml(d.name)}</option>`)
      .join("");

    // Data (se vuoi aggiungerla in HTML in futuro; per ora usiamo todayISO)
    // Se non c'è, ok.

    function buildExercises(dayIndex) {
      const selectedDay = tpl.days[Number(dayIndex)];
      exercisesWrap.innerHTML = selectedDay.exercises.map(ex => {
        const last = findLastEntryForExercise(user, ex.id);
        const hint = last?.sets?.length
          ? last.sets.map(s => (s.kg != null && s.reps != null) ? `${s.kg}x${s.reps}` : (s.raw || "")).join(", ")
          : "";

        return `
          <div class="item">
            <div class="item-head">
              <div>
                <strong>${escapeHtml(ex.name)}</strong>
                <span class="pill">${ex.setsTarget}x ${escapeHtml(ex.repsTarget)}</span>
              </div>
              <span class="mini">${hint ? "last: " + escapeHtml(hint) : ""}</span>
            </div>

            <div style="margin-top:10px; display:grid; gap:10px;">
              <div>
                <label>Set (kg x reps, separati da virgola)</label>
                <input data-sets="${ex.id}" placeholder="es. 80x8, 80x7, 77.5x6" />
              </div>
              <div>
                <label>Note (opz.)</label>
                <input data-note="${ex.id}" placeholder="RIR, tecnica, ecc." />
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    buildExercises(idx);

    daySelect.onchange = () => buildExercises(daySelect.value);

    // Submit form
    const form = document.getElementById("workout-form");
    form.onsubmit = (ev) => {
      ev.preventDefault();

      const dayIndex = Number(daySelect.value);
      const chosenDay = tpl.days[dayIndex];
      const date = todayISO(); // MVP: oggi
      const bw = Number(document.getElementById("bodyweight").value || 0) || null;

      const entries = chosenDay.exercises.map(ex => {
        const raw = (form.querySelector(`input[data-sets="${ex.id}"]`)?.value || "").trim();
        const note = (form.querySelector(`input[data-note="${ex.id}"]`)?.value || "").trim();
        const sets = parseSets(raw);
        return { exerciseId: ex.id, sets, note };
      }).filter(e => e.sets.length > 0 || e.note);

      const workout = {
        date,
        templateId: tpl.id,
        dayId: chosenDay.id,
        dayName: chosenDay.name,
        bodyweightKg: bw,
        entries
      };

      // Salva: più recenti davanti
      const db2 = getDB();
      const u2 = db2.users[user.config.slug];
      u2.workouts.unshift(workout);

      // Rotazione: avanza sempre di 1 (semplice)
      u2.config.rotationIndex = (u2.config.rotationIndex || 0) + 1;

      setDB(db2);

      // pulisci form
      document.getElementById("bodyweight").value = "";
      form.querySelectorAll("input[data-sets], input[data-note]").forEach(i => i.value = "");

      // Vai allo storico
      KongFit.app?.navigate?.("history");
    };
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  KongFit.workout = { renderWorkoutView };
})();
``
