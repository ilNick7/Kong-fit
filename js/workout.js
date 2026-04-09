/* ======================================================
   Kong Fit - workout.js (DA ZERO)
   - Render allenamento dal template (2/3/4 giorni)
   - Log set per esercizio (kg x reps)
   - Salvataggio in localStorage -> db.users[slug].workouts[]
   - Avanza rotazione
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, getCurrentUser } = KongFit.state;
  const { getSession } = KongFit.auth;
  const { getTemplate } = KongFit.templates;

  const $ = (q) => document.querySelector(q);

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function parseSets(raw) {
    // formato: "80x8, 80x7, 77.5x6"
    if (!raw) return [];
    return raw
      .split(",")
      .map(x => x.trim())
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

  function lastEntryForExercise(user, exerciseId) {
    // cerca nel workout più recente che contiene quell'esercizio
    for (const w of (user.workouts || [])) {
      const e = (w.entries || []).find(x => x.exerciseId === exerciseId);
      if (e) return e;
    }
    return null;
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function renderExercises(user, day) {
    const wrap = $("#workout-exercises");
    if (!wrap) return;

    wrap.innerHTML = (day.exercises || []).map(ex => {
      const last = lastEntryForExercise(user, ex.id);
      const hint = last?.sets?.length
        ? last.sets.map(s => (s.kg != null && s.reps != null) ? `${s.kg}x${s.reps}` : (s.raw || "")).join(", ")
        : "";

      return `
        <div class="item" style="margin-top:12px;">
          <p style="font-weight:800; margin-bottom:6px; color:#000;">
            ${escapeHtml(ex.name)} <span style="font-weight:600; color:#666;">(${ex.setsTarget}x ${escapeHtml(ex.repsTarget)})</span>
          </p>

          ${hint ? `<p style="margin:0 0 10px 0; color:#666; font-size:13px;">Ultimo: ${escapeHtml(hint)}</p>` : ""}

          <label style="display:block; font-size:13px; font-weight:700; margin-bottom:6px; color:#333;">
            Set (kg x reps, separati da virgola)
          </label>
          <input data-sets="${escapeHtml(ex.id)}" type="text" placeholder="es. 80x8, 80x7, 77.5x6" style="width:100%; padding:14px 16px; border-radius:14px; border:1px solid #ddd;">

          <label style="display:block; font-size:13px; font-weight:700; margin:10px 0 6px; color:#333;">
            Note (opzionale)
          </label>
          <input data-note="${escapeHtml(ex.id)}" type="text" placeholder="RIR, tecnica..." style="width:100%; padding:14px 16px; border-radius:14px; border:1px solid #ddd;">
        </div>
      `;
    }).join("");
  }

  function renderWorkoutView() {
    const db = getDB();
    const session = getSession();
    const user = getCurrentUser(db);
    if (!session || !user) return;

    const form = $("#workout-form");
    const daySelect = $("#workout-day");
    if (!form || !daySelect) return;

    const { tpl, day, idx } = getNextDay(user);

    // popola select giorni
    daySelect.innerHTML = tpl.days.map((d, i) =>
      `<option value="${i}" ${i === idx ? "selected" : ""}>${escapeHtml(d.name)}</option>`
    ).join("");

    // render esercizi giorno selezionato
    renderExercises(user, day);

    daySelect.onchange = () => {
      const chosen = tpl.days[Number(daySelect.value)];
      renderExercises(user, chosen);
    };

    form.onsubmit = (ev) => {
      ev.preventDefault();

      const chosen = tpl.days[Number(daySelect.value)];
      const dateInput = $("#workout-date");
      const date = (dateInput?.value || todayISO()).trim() || todayISO();

      const bwInput = $("#bodyweight");
      const bodyweightKg = bwInput?.value ? Number(bwInput.value) : null;

      const entries = (chosen.exercises || []).map(ex => {
        const raw = (form.querySelector(`input[data-sets="${ex.id}"]`)?.value || "").trim();
        const note = (form.querySelector(`input[data-note="${ex.id}"]`)?.value || "").trim();
        return { exerciseId: ex.id, sets: parseSets(raw), note };
      }).filter(e => e.sets.length > 0 || e.note.length > 0);

      if (entries.length === 0) {
        alert("Inserisci almeno un set o una nota per salvare l’allenamento.");
        return;
      }

      const workout = {
        date,
        templateId: tpl.id,
        dayId: chosen.id,
        dayName: chosen.name,
        bodyweightKg,
        entries
      };

      // salva
      const db2 = getDB();
      const u2 = db2.users[session.slug];
      u2.workouts ||= [];
      u2.workouts.unshift(workout);

      // rotazione: avanza sempre di 1 (MVP semplice)
      u2.config.rotationIndex = (u2.config.rotationIndex || 0) + 1;

      setDB(db2);

      // pulizia form
      if (bwInput) bwInput.value = "";
      if (dateInput) dateInput.value = "";
      form.querySelectorAll("input[data-sets], input[data-note]").forEach(i => i.value = "");

      alert("Allenamento salvato ✅");

      // torna alla home
      KongFit.app?.navigate?.("home");
    };
  }

  KongFit.workout = { renderWorkoutView };
})();
