/* ======================================================
   Kong Fit - app.js (DEFINITIVO)
   - Routing SPA
   - Hook corretti per TUTTE le view
   - Admin / User separati
   - Nessuno schermo nero
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession, ensureAuth } = KongFit.auth;

  const $ = (q) => document.querySelector(q);
  const $$ = (q) => Array.from(document.querySelectorAll(q));

  /* ===============================
     VIEW HELPERS
  =============================== */

  function hideAllViews() {
    $$("[data-view-section]").forEach(v => {
      v.style.display = "none";
    });
  }

  function showView(name) {
    hideAllViews();
    const el = document.getElementById(`view-${name}`);
    if (el) el.style.display = "block";
    document.body.setAttribute("data-view", name);
  }

  /* ===============================
     NAVIGATE (CORE)
  =============================== */

  function navigate(view) {
    const session = getSession();

    // guard globale
    if (!session && view !== "login") {
      view = "login";
    }

    showView(view);

    // 🔗 HOOK DI RENDER PER OGNI VIEW
    if (view === "home") {
      KongFit.home?.renderHome?.();
    }

    if (view === "admin") {
      KongFit.admin?.renderAdmin?.();
    }

    if (view === "workout") {
      KongFit.workout?.renderWorkoutView?.();
    }

    if (view === "profile") {
      KongFit.profile?.renderProfile?.();
    }
  }

  // expose navigate
  KongFit.app = KongFit.app || {};
  KongFit.app.navigate = navigate;

  /* ===============================
     LOGIN
  =============================== */

  function wireLogin() {
    const form = $("#login-form");
    const pinInput = $("#pin-input");
    if (!form || !pinInput) return;

    form.onsubmit = (ev) => {
      ev.preventDefault();

      const pin = pinInput.value.trim();
      const res = KongFit.auth.loginWithPin(pin);

      if (!res.ok) {
        alert("PIN errato");
        pinInput.value = "";
        pinInput.focus();
        return;
      }

      pinInput.value = "";

      const session = getSession();
      if (!session) {
        navigate("login");
        return;
      }

      // ✅ ROUTING CORRETTO
      if (session.slug === "admin") {
        navigate("admin");
      } else {
        navigate("home");
      }
    };
  }

  /* ===============================
     PROFILE BUTTON
  =============================== */

  function wireProfileButtons() {
    // user
    $("#profile-btn")?.addEventListener("click", () => {
      navigate("profile");
    });

    // admin
    $("#admin-profile-btn")?.addEventListener("click", () => {
      navigate("profile");
    });
  }

  /* ===============================
     INIT APP
  =============================== */

  document.addEventListener("DOMContentLoaded", () => {
    // inizializza DB/auth se serve
    const db = ensureAuth(getDB());
    setDB(db);

    wireLogin();
    wireProfileButtons();

    const session = getSession();

    if (!session) {
      navigate("login");
      return;
    }

    // ✅ ROUTE INIZIALE CORRETTA
    if (session.slug === "admin") {
      navigate("admin");
    } else {
      navigate("home");
    }
  });

})();
