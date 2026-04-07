/* Kong Fit - history.js
   Render storico + dettaglio + delete.
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, getCurrentUser } = KongFit.state;
  const { getTemplate } = KongFit.templates;

  function renderHistoryView() {
    const db = getDB();
    const user = getCurrentUser(db);
    if (!user) return;

    const list = document.getElementById("history-list");
    const workouts = user.workouts || [];

    if (!workouts.length) {
      list.innerHTML = `<p class="muted">Nessun allenamento salvato.</p>`;
      return;
    }

    list.innerHTML = workouts.slice(0, 50).map((w, idx) => {
      const summary = summarizeWorkout(w);
      return `
        <div class="item" data-idx="${idx}">
          <div class="item-head">
            <div><strong>${escapeHtml(w.date)}</strong> <span class="pill">${escapeHtml(w.dayName || w.dayId)}</span></div>
            <span class="mini">${(w.entries || []).length} esercizi</span>
          </div>

          <div class="mini" style="margin-top:8px">${escapeHtml(summary)}</div>

          <div style="margin-top:10px; display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap;">
            <button data-action="detail" data-idx="${idx}">Dettagli</button>
            <button data-action="delete" data-idx="${idx}">Elimina</button>
          </div>
        </div>
      `;
    }).join("");

    list.onclick = (ev) => {
      const btn = ev.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const idx = Number(btn.dataset.idx);

      if (action === "detail") {
        alert(formatWorkoutDetail(user, workouts[idx]));
      }

      if (action === "delete") {
        if (!confirm("Eliminare questo allenamento?")) return;

        const db2 = getDB();
        const u2 = getCurrentUser(db2);
        u2.workouts.splice(idx, 1);
        setDB(db2);
        renderHistoryView();
      }
    };
  }

  function summarizeWorkout(w) {
    const e = (w.entries || []).slice(0, 2);
    if (!e.length) return "—";
    return e.map(x => {
      const sets = (x.sets || []).slice(0, 2).map(s => (s.kg != null && s.reps != null) ? `${s.kg}x${s.reps}` : (s.raw || "")).join(" | ");
      return `${x.exerciseId}: ${sets}`;
    }).join(" • ");
  }

  function formatWorkoutDetail(user, w) {
    const tpl = getTemplate(w.templateId);
    const day = tpl.days.find(d => d.id === w.dayId);
    const exName = (id) => day?.exercises?.find(e => e.id === id)?.name || id;

    let out = `📅 ${w.date} — ${w.dayName || w.dayId}\n`;
    if (w.bodyweightKg) out += `⚖️ BW: ${w.bodyweightKg} kg\n`;
    out += `\n`;

    for (const e of (w.entries || [])) {
      out += `• ${exName(e.exerciseId)}\n`;
      for (const s of (e.sets || [])) {
        out += (s.kg != null && s.reps != null)
          ? `  - ${s.kg}x${s.reps}\n`
          : `  - ${s.raw || "?"}\n`;
      }
      if (e.note) out += `  note: ${e.note}\n`;
      out += `\n`;
    }
    return out;
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  KongFit.history = { renderHistoryView };
})();
