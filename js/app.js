/* ======================================================
   Kong Fit - app.js
   - Routing SPA
   - Login PIN
   - Redirect: admin -> admin view, user -> home view
   - Hook: home.js, admin.js, workout.js, profile.js
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession, loginWithPin, ensureAuth } = KongFit.auth;

  const $ = (q) => document.querySelector(q);
  const $all = (q) => Array.from(document.querySelectorAll(q));

  function hideAllViews() {
    $all("[data-view-section]").forEach(v => (v.style.display = "none"));
  }

  function showView(name) {
    hideAllViews();
    const el = document.getElementById(`view-${name}`);
    if (el) el.style.display = "block";
    document.body.setAttribute("data-view", name);
  }

  function navigate(view) {
    // guard: se non loggato -> login
    const session = getSession();
    if (!session && view !== "login") view = "login";

    showView(view);

    // hook per vista
    if (view === "home") {
      KongFit.home?.renderHome?.();
      return;
    }

    if (view === "admin") {
      KongFit.admin?.renderAdmin?.();
      return;
    }

    if (view === "workout") {
      KongFit.workout?.renderWorkoutView?.();
      return;
    }

    if (view === "profile") {
      KongFit.profile?.renderProfile?.();
      return;
    }
  }

  // expose
  KongFit.app = KongFit.app || {};
  KongFit.app.navigate = navigate;

  function wireLogin() {
    const form = $("#login-form");
    const pinInput = $("#pin-input");
    const err = $("#login-error");
    if (!form || !pinInput) return;

    form.onsubmit = (ev) => {
      ev.preventDefault();
      if (err) err.textContent = "";

      const pin = (pinInput.value || "").trim();
      const res = loginWithPin(pin);

      if (!res.ok) {
        if (err) err.textContent = res.reason || "PIN errato";
        pinInput.value = "";
        pinInput.focus();
        return;
      }

      pinInput.value = "";

      // ✅ redirect in base all'account
      const s = getSession();
      if (s?.slug === "admin") navigate("admin");
      else navigate("home");
    };
  }

  function wireProfileButton() {
    const btnHome = $("#profile-btn");
    if (btnHome) btnHome.addEventListener("click", () => navigate("profile"));

    // Se in admin hai un bottone profilo diverso
    const btnAdmin = $("#admin-profile-btn");
    if (btnAdmin) btnAdmin.addEventListener("click", () => navigate("profile"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    // ensure auth structure
    const db = ensureAuth(getDB());
    setDB(db);

    wireLogin();
    wireProfileButton();

    // wiring moduli optional
    KongFit.home?.wireBottomNav?.();
    KongFit.profile?.wireProfileUI?.();

    // ✅ start route
    const s = getSession();
    if (!s) {
      navigate("login");
    } else {
      if (s.slug === "admin") navigate("admin");
      else navigate("home");
    }
  });
})();
