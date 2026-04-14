/* ======================================================
   Kong Fit - profile.js (BULLETPROOF)
   - Render automatico quando la view diventa visibile
   - Admin e User separati
   - Logout sempre disponibile
   - ZERO schermi neri
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB } = KongFit.state;
  const { getSession, logout } = KongFit.auth;

  const view = document.getElementById("view-profile");

  function renderProfile() {
    const session = getSession();
    if (!session) {
      KongFit.app?.navigate?.("login");
      return;
    }

    const container = view?.querySelector(".home-content");
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

    const logoutBtn = container.querySelector("#logout-btn");
    logoutBtn?.addEventListener("click", () => {
      const db = getDB();

      // protezione SOLO per user
      if (session.slug !== "admin" && db.activeWorkout) {
        if (!confirm("Hai un allenamento in corso. Vuoi davvero uscire?")) {
          return;
        }
      }

      logout();
      KongFit.app?.navigate?.("login");
    });
  }

  /* ======================================================
     AUTO‑RENDER QUANDO LA VIEW DIVENTA VISIBILE
     (questa è la chiave)
  ====================================================== */
  const observer = new MutationObserver(() => {
    if (view && view.style.display !== "none") {
      renderProfile();
    }
  });

  if (view) {
    observer.observe(view, {
      attributes: true,
      attributeFilter: ["style"]
    });
  }

  // fallback manuale
  KongFit.profile = {
    renderProfile
  };
})();
