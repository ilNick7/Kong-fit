/* ======================================================
   Kong Fit - admin.js)
   - Auto-render quando la view diventa visibile
   - Nessuno schermo nero su login admin
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  const view = document.getElementById("view-admin");
  const $ = (q) => view?.querySelector(q);

  function isAdmin() {
    const s = getSession();
    return s && s.slug === "admin";
  }

  function renderAdmin() {
    if (!isAdmin()) return;

    const root = $("#admin-root");
    if (!root) return;

    // sicurezza: se è già renderizzato non rifare tutto
    if (root.dataset.rendered === "true") return;
    root.dataset.rendered = "true";

    const db = getDB();
    db.schede ||= [];
    setDB(db);

    // render schede recenti
    const recent = $("#admin-recent-schede");
    if (recent) {
      if (db.schede.length === 0) {
        recent.innerHTML = `<p class="muted">Nessuna scheda creata.</p>`;
      } else {
        recent.innerHTML = db.schede.map(s => `
          <div class="admin-card">${s.name}</div>
        `).join("");
      }
    }
  }

  /* ======================================================
     AUTO-RENDER QUANDO LA VIEW DIVENTA VISIBILE
     (QUESTA È LA CHIAVE)
  ====================================================== */
  const observer = new MutationObserver(() => {
    if (view && view.style.display !== "none") {
      renderAdmin();
    }
  });

  if (view) {
    observer.observe(view, {
      attributes: true,
      attributeFilter: ["style"]
    });
  }

  // fallback manuale (se chiamato da app.js)
  KongFit.admin = {
    renderAdmin
  };
})();
