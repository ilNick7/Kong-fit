/* ======================================================
   Kong Fit - home.js (UPDATED)
   - Mostra nome utente (Mattia / Christian / User)
   - Mostra SCHEDA ATTIVA (nome + descrizione)
   - Bottone Start -> workout
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  /* ---------------- USER INFO ---------------- */

  function userInfoFromSession(session) {
    const map = {
      mattia: { name: "Mattia", initials: "MN" },
      amico: { name: "Christian", initials: "CP" },
      admin: { name: "User", initials: "US" }
    };
    return map[session?.slug] || { name: "User", initials: "US" };
  }

  /* ---------------- DATE ---------------- */

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateIT(date = new Date()) {
    const giorni = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
    return `${giorni[date.getDay()]} ${date.getDate()}/${pad2(date.getMonth()+1)}/${date.getFullYear()}`;
  }

  /* ---------------- ACTIVE SCHEDA ---------------- */

  function getActiveScheda(db) {
    const schede = db.schede || [];
    if (schede.length === 0) return null;

    if (db.activeSchedaId) {
      const found = schede.find(s => s.id === db.activeSchedaId);
      if (found) return found;
    }

    // fallback: prima scheda
    return schede[0];
  }

  /* ---------------- MAIN RENDER ---------------- */

  function renderHome() {
    const db = getDB();
    const session = getSession();
    if (!session) return;

    const info = userInfoFromSession(session);

    // saluto
    const nameEl = $("#home-username");
    if (nameEl) nameEl.textContent = info.name;

    // iniziali account
    const initialsEl = $("#profile-initials");
    if (initialsEl) initialsEl.textContent = info.initials;

    // data
    const dateEl = $("#home-date");
    if (dateEl) dateEl.textContent = formatDateIT(new Date());

    // scheda attiva
    const scheda = getActiveScheda(db);
    const schedaNameEl = $("#home-scheda-name");
    const schedaDescEl = $("#home-scheda-desc");

    if (scheda) {
      if (schedaNameEl) schedaNameEl.textContent = scheda.name;
      if (schedaDescEl) schedaDescEl.textContent = scheda.desc || "";
    } else {
      if (schedaNameEl) schedaNameEl.textContent = "Nessuna scheda";
      if (schedaDescEl) schedaDescEl.textContent = "Contatta l'admin per crearne una.";
    }

    // start -> workout
    const startBtn = $("#home-start-btn");
    if (startBtn) {
      startBtn.onclick = () => {
        if (!scheda) {
          alert("Nessuna scheda disponibile.");
          return;
        }
        KongFit.app.navigate("workout");
      };
    }

    // CTA obiettivi (placeholder)
    const goalsBtn = $("#home-goals-btn");
    if (goalsBtn) {
      goalsBtn.onclick = () => {
        alert("Sezione obiettivi in arrivo 💪");
      };
    }
  }

  KongFit.home = { renderHome };

})();
