/* ======================================================
   Kong Fit - admin.js (SAFE VERSION)
   - NIENTE observer
   - NIENTE auto-magia
   - Render SEMPRE visibile
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  function renderAdmin() {
    const session = getSession();
    if (!session || session.slug !== "admin") return;

    const root = document.getElementById("admin-root");
    if (!root) return;

    const db = getDB();
    const schede = db.schede || [];

    root.innerHTML = `
      <h2 class="home-greeting">Admin</h2>
      <p class="home-subtitle">Gestione schede</p>

      <div style="margin-top:16px;">
        ${
          schede.length === 0
            ? `<p class="muted">Nessuna scheda creata.</p>`
            : schede.map(s => `<div class="admin-card">${s.name}</div>`).join("")
        }
      </div>
    `;
  }

  // espone renderAdmin per app.js
  KongFit.admin = {
    renderAdmin
  };
})();
