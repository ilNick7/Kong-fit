/* ======================================================
   Kong Fit - home.js
   -amento
   - Selezione scheda
   - UI pulita (mai Start + Riprendi insieme)
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  /* ===============================
     UTENTE
  =============================== */
  function userInfo(session) {
    const map = {
      mattia: { name: "Mattia", initials: "MN" },
      amico: { name: "Christian", initials: "CP" },
      elis: { name: "Elis", initials: "EL" }
    };
    return map[session.slug] || { name: "User", initials: "US" };
  }

  /* ===============================
     RENDER HOME
  =============================== */
  function renderHome() {
    const db = getDB();
    const session = getSession();
    if (!session) return;

    const info = userInfo(session);

    // saluto + iniziali
    $("#home-username").textContent = info.name;
    $("#profile-initials").textContent = info.initials;

    /* -------------------------------
       SCHEDA ATTIVA (fallback: prima)
    -------------------------------- */
    const activeScheda =
      GOOGLE_SCHEDE.find(s => s.id === db.activeSchedaId) ||
      GOOGLE_SCHEDE[0];

    $("#home-scheda-name").textContent = activeScheda.label;
    $("#home-scheda-desc").textContent = "Scheda di allenamento";

    /* -------------------------------
       START / RIPRENDI
    -------------------------------- */
    const startBtn = $("#home-start-btn");
    const resumeBtn = $("#home-resume-btn");

    if (db.activeWorkout) {
      // ✅ allenamento in corso
      startBtn.classList.add("hidden");
      resumeBtn.classList.remove("hidden");
    } else {
      // ✅ nessun allenamento
      resumeBtn.classList.add("hidden");
      startBtn.classList.remove("hidden");
    }

    // START NUOVO ALLENAMENTO
    startBtn.onclick = () => {
      db.activeSchedaId = activeScheda.id;

      // crea allenamento attivo
      db.activeWorkout = {
        schedaId: activeScheda.id,
        startedAt: new Date().toISOString()
      };

      setDB(db);
      KongFit.app.navigate("workout");
    };

    // RIPRENDI ALLENAMENTO
    resumeBtn.onclick = () => {
      KongFit.app.navigate("workout");
    };

    /* -------------------------------
       CAMBIA SCHEDA
    -------------------------------- */
    $("#change-scheda-btn").onclick = () => {
      openSchedaSelect(db);
    };
  }

  /* ===============================
     MODAL SELEZIONE SCHEDA
  =============================== */
  function openSchedaSelect(db) {
    const modal = $("#scheda-select-modal");
    const list = $("#scheda-select-list");
    const closeBtn = $("#close-scheda-select");

    modal.classList.remove("hidden");

    list.innerHTML = GOOGLE_SCHEDE.map(s => `
      <button class="admin-btn" data-id="${s.id}">
        ${s.label}
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

    closeBtn.onclick = () => {
      modal.classList.add("hidden");
    };
  }

  /* ===============================
     EXPORT
  =============================== */
  KongFit.home = {
    renderHome
  };
})();
