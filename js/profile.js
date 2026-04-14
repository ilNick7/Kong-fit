/* ======================================================
   Kong Fit - profile.js (FIXED)
   - Visualizza info utente
   - Logout funzionante
   - Nessun crash -> niente schermo nero
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession, logout } = KongFit.auth;

  const $ = (q) => document.querySelector(q);

  function userInfoFromSession(session) {
    const map = {
      mattia: { name: "Mattia" },
      amico: { name: "Christian" },
      admin: { name: "Admin" }
    };
    return map[session?.slug] || { name: "User" };
  }

  function renderProfile() {
    const session = getSession();
    if (!session) {
      KongFit.app.navigate("login");
      return;
    }

    const db = getDB();
    const info = userInfoFromSession(session);

    // sicurezza: non assumiamo che gli elementi esistano
    const container = $("#view-profile .home-content");
    if (!container) return;

    container.innerHTML = `
      <h2>Profilo</h2>

      <div class="item">
        <p><strong>Nome:</strong> ${info.name}</p>
        <p><strong>Account:</strong> ${session.slug}</p>
      </div>

      <div class="item">
        <button id="logout-btn" class="admin-btn danger">
          Logout
        </button>
      </div>
    `;

    // logout
    const logoutBtn = $("#logout-btn");
    logoutBtn?.addEventListener("click", () => {
      logout();
      KongFit.app.navigate("login");
    });
  }

  KongFit.profile = {
    renderProfile
  };
})();
