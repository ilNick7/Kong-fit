/* ======================================================
   Kong Fit - home.js (Google Sheets)
   - Start allenamento
   - Selezione scheda
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  function userInfo(session) {
     const map = {
       mattia: { name: "Mattia", initials: "MN" },
       amico: { name: "Christian", initials: "CP" },
       elis: { name: "Elis", initials: "EL" }
     };
     return map[session.slug];
   }

  function renderHome() {
    const db = getDB();
    const session = getSession();
    if (!session) return;

    const info = userInfo(session);
    $("#home-username").textContent = info.name;
    $("#profile-initials").textContent = info.initials;

    // ✅ scheda selezionata (fallback: prima)
    const activeScheda =
      GOOGLE_SCHEDE.find(s => s.id === db.activeSchedaId) || GOOGLE_SCHEDE[0];

    $("#home-scheda-name").textContent = activeScheda.label;
    $("#home-scheda-desc").textContent = "Scheda di allenamento";

    // START
    $("#home-start-btn").onclick = () => {
      db.activeSchedaId = activeScheda.id;
      setDB(db);
      KongFit.app.navigate("workout");
    };

    // SELEZIONE SCHEDA
    $("#change-scheda-btn").onclick = () => {
      openSchedaSelect(db);
    };
  }

  function openSchedaSelect(db) {
    const modal = $("#scheda-select-modal");
    const list = $("#scheda-select-list");

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

    $("#close-scheda-select").onclick = () => {
      modal.classList.add("hidden");
    };
  }

  KongFit.home = { renderHome };
})();
