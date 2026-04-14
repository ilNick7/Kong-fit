/* ======================================================
   Kong Fit - home.js (ACTIVE WORKOUT)
   - Start nuovo allenamento
   - Riprendi allenamento
   - Scelta scheda
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  function userInfoFromSession(session) {
    const map = {
      mattia: { name: "Mattia", initials: "MN" },
      amico: { name: "Christian", initials: "CP" },
      admin: { name: "User", initials: "US" }
    };
    return map[session?.slug] || { name: "User", initials: "US" };
  }

  function getActiveScheda(db) {
    if (db.activeSchedaId) {
      return (db.schede || []).find(s => s.id === db.activeSchedaId);
    }
    return (db.schede || [])[0] || null;
  }

  function renderHome() {
    const db = getDB();
    const session = getSession();
    if (!session) return;

    const info = userInfoFromSession(session);

    $("#home-username").textContent = info.name;
    $("#profile-initials").textContent = info.initials;

    const scheda = getActiveScheda(db);
    $("#home-scheda-name").textContent = scheda?.name || "Nessuna scheda";
    $("#home-scheda-desc").textContent = scheda?.desc || "";

    const startBtn = $("#home-start-btn");
    const resumeBtn = $("#home-resume-btn");

    // 🔁 Allenamento attivo?
    if (db.activeWorkout) {
      startBtn.classList.add("hidden");
      resumeBtn.classList.remove("hidden");
    } else {
      startBtn.classList.remove("hidden");
      resumeBtn.classList.add("hidden");
    }

    // START NUOVO
    startBtn.onclick = () => {
      if (!scheda) {
        alert("Nessuna scheda disponibile.");
        return;
      }

      db.activeWorkout = {
        schedaId: scheda.id,
        schedaName: scheda.name,
        startedAt: new Date().toISOString()
      };
      setDB(db);

      KongFit.app.navigate("workout");
    };

    // RIPRENDI
    resumeBtn.onclick = () => {
      KongFit.app.navigate("workout");
    };

    // CAMBIA SCHEDA
    $("#change-scheda-btn").onclick = () => {
      openSchedaSelect(db);
    };
  }

  /* ---------- MODAL SELEZIONE SCHEDA ---------- */

  function openSchedaSelect(db) {
    const modal = $("#scheda-select-modal");
    const list = $("#scheda-select-list");
    modal.classList.remove("hidden");

    list.innerHTML = (db.schede || []).map(s => `
      <button class="admin-btn" data-id="${s.id}">
        ${s.name}
      </button>
    `).join("");

    list.onclick = (ev) => {
      const btn = ev.target.closest("button[data-id]");
      if (!btn) return;
      db.activeSchedaId = btn.dataset.id;
      setDB(db);
      modal.classList.add("hidden");
      renderHome();
    };

    $("#close-scheda-select").onclick = () => {
      modal.classList.add("hidden");
    };
  }

  KongFit.home = { renderHome };
})();
