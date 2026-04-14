/* ======================================================
   Kong Fit - profile.js (ADMIN SAFE)
   - Nessun crash
   - Logout sempre funzionante
   - Admin separato da user
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB } = KongFit.state;
  const { getSession, logout } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  function renderProfile() {
    const session = getSession();
    if (!session) {
      KongFit.app.navigate("login");
      return;
    }

    const container = $("#view-profile .home-content");
    if (!container) return;

    // ADMIN
    if (session.slug === "admin") {
      container.innerHTML = `
        <h2>Profilo Admin</h2>
        <p class="muted">Accesso amministratore</p>

        <button id="logout-btn" class="admin-btn danger">
          Logout
        </button>
      `;
    }
    // USER
    else {
      container.innerHTML = `
        <h2>Profilo</h2>
        <p class="muted">Account: ${session.slug}</p>

        <button id="logout-btn" class="admin-btn danger">
          Logout
        </button>
      `;
    }

    $("#logout-btn")?.addEventListener("click", () => {
      const db = getDB();

      // ⚠️ SOLO per USER controlliamo allenamento attivo
      if (session.slug !== "admin" && db.activeWorkout) {
        if (!confirm("Hai un allenamento in corso. Vuoi davvero uscire?")) {
          return;
        }
      }

      logout();
      KongFit.app.navigate("login");
    });
  }

  KongFit.profile = { renderProfile };
})();
