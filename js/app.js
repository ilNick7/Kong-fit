/* Kong Fit - app.js
   Router SPA + Auth PIN + Ruoli (admin/user)
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, ensureUser, getCurrentUser } = KongFit.state;
  const { templateIdForDays, getTemplate } = KongFit.templates;
  const { getSession, loginWithPin, switchAccount, logout, isAdmin, ensureAuth } = KongFit.auth;

  function hideAllViews() {
    document.querySelectorAll("[data-view-section]").forEach(sec => {
      sec.style.display = "none";
    });
  }

  function showView(viewName) {
    hideAllViews();
    const sec = document.getElementById(`view-${viewName}`);
    if (sec) sec.style.display = "block";
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function updateAccountBar() {
    const label = document.getElementById("account-label");
    const btnLogout = document.getElementById("logout-btn");
    const btnSwitch = document.getElementById("switch-btn");
    const navAdmin = document.getElementById("nav-admin");

    const s = getSession();

    if (!label || !btnLogout || !btnSwitch) return;

    if (!s) {
      label.textContent = "Non loggato";
      btnLogout.style.display = "none";
      btnSwitch.style.display = "none";
      if (navAdmin) navAdmin.style.display = "none";
      return;
    }

    label.textContent = `👤 ${s.slug} (${s.role})`;
    btnLogout.style.display = "inline-block";
    btnSwitch.style.display = "inline-block";
    if (navAdmin) navAdmin.style.display = isAdmin() ? "inline-block" : "none";
  }

  function updateTodayLabelAndPreview() {
    const db = getDB();
    const user = getCurrentUser(db);
    const label = document.getElementById("today-workout");
    if (!label) return;

    if (!user) {
      label.textContent = "—";
      return;
    }

    const tpl = getTemplate(user.config.templateId);
    const idx = (user.config.rotationIndex || 0) % tpl.days.length;
    label.textContent = tpl.days[idx].name;
  }

  function renderScheda() {
    const db = getDB();
    const user = getCurrentUser(db);
    if (!user) return;

    const tpl = getTemplate(user.config.templateId);
    const wrap = document.getElementById("scheda-container");

    wrap.innerHTML = tpl.days.map(day => {
      const exHtml = day.exercises.map(ex => `
        <div class="item">
          <div class="item-head">
            <div><strong>${escapeHtml(ex.name)}</strong> <span class="pill">${ex.setsTarget}x ${escapeHtml(ex.repsTarget)}</span></div>
            <span class="mini">rest ${ex.rest || 0}s</span>
          </div>
        </div>
      `).join("");

      return `
        <div class="item">
          <div class="item-head">
            <div><strong>${escapeHtml(day.name)}</strong></div>
            <span class="mini">${day.id}</span>
          </div>
          <div style="margin-top:10px; display:grid; gap:10px;">
            ${exHtml}
          </div>
        </div>
      `;
    }).join("");
  }

  function wireNav() {
    document.querySelectorAll("#main-nav button[data-view]").forEach(btn => {
      btn.addEventListener("click", () => navigate(btn.dataset.view));
    });

    const homeActions = document.getElementById("home-actions");
    if (homeActions) {
      homeActions.addEventListener("click", (ev) => {
        const b = ev.target.closest("button[data-action]");
        if (!b) return;
        const a = b.dataset.action;
        if (a === "start-workout") navigate("workout");
        if (a === "view-scheda") navigate("scheda");
        if (a === "view-history") navigate("history");
      });
    }
  }

  function wireLogin() {
    const form = document.getElementById("login-form");
    const pinInput = document.getElementById("pin-input");
    const err = document.getElementById("login-error");

    if (!form || !pinInput) return;

    form.onsubmit = (ev) => {
      ev.preventDefault();
      if (err) err.textContent = "";

      const pin = (pinInput.value || "").trim();
      const res = loginWithPin(pin);

      if (!res.ok) {
        if (err) err.textContent = res.reason || "Errore login";
        pinInput.value = "";
        pinInput.focus();
        return;
      }

      pinInput.value = "";
      updateAccountBar();

      // Se è la prima volta che entra, lo mandi al setup per scegliere 2/3/4 (opzionale)
      navigate("setup");
    };
  }

  function wireSetup() {
    const form = document.getElementById("setup-form");
    if (!form) return;

    const slugInput = document.getElementById("user-slug");
    const daysSelect = document.getElementById("days-per-week");

    form.onsubmit = (ev) => {
      ev.preventDefault();

      const s = getSession();
      if (!s) return navigate("login");

      const slug = s.slug; // lo slug lo decide l'account
      const days = Number(daysSelect?.value || 4);

      const db = getDB();
      ensureUser(db, slug);

      const user = db.users[slug];
      user.config.slug = slug;
      user.config.daysPerWeek = days;
      user.config.templateId = templateIdForDays(days);
      user.config.rotationIndex = user.config.rotationIndex || 0;

      db.currentUserSlug = slug;
      setDB(db);

      navigate("home");
    };

    // Quando entro nel setup, precompila slug e bloccalo (non si cambia)
    function prefill() {
      const s = getSession();
      if (!s || !slugInput) return;

      slugInput.value = s.slug;
      slugInput.disabled = true;

      const db = getDB();
      const user = getCurrentUser(db);
      if (user && daysSelect) {
        daysSelect.value = String(user.config.daysPerWeek || 4);
      }
    }

    KongFit.app._prefillSetup = prefill;
  }

  function wireAccountButtons() {
    const btnLogout = document.getElementById("logout-btn");
    const btnSwitch = document.getElementById("switch-btn");

    if (btnLogout) {
      btnLogout.onclick = () => {
        logout();
        updateAccountBar();
        navigate("login");
      };
    }

    if (btnSwitch) {
      btnSwitch.onclick = () => {
        const pin = prompt("Inserisci PIN (4 cifre) per cambiare account / passare ad admin:");
        if (pin == null) return;

        const res = switchAccount(pin.trim());
        if (!res.ok) {
          alert(res.reason || "PIN errato");
          return;
        }

        updateAccountBar();
        navigate("home");
      };
    }
  }

  function wireSettings() {
    const resetBtn = document.getElementById("reset-plan");
    if (resetBtn) {
      resetBtn.onclick = () => {
        const s = getSession();
        if (!s) return navigate("login");

        if (!confirm("Reset piano: cancella workouts e reimposta config. Continuo?")) return;

        const db = getDB();
        db.users[s.slug] = {
          config: { slug: s.slug, createdAt: new Date().toISOString(), daysPerWeek: 4, templateId: "tpl-4", rotationIndex: 0 },
          workouts: []
        };
        setDB(db);
        navigate("home");
      };
    }

    // GitHub buttons restano nel tuo app.js precedente? Qui non li tocchiamo.
    // Se vuoi, li reintegriamo dopo senza conflitti.
  }

  function guard(viewName) {
    const s = getSession();

    // Se non sei loggato, puoi vedere solo login
    if (!s && viewName !== "login") return "login";

    // Se chiedi admin ma non sei admin -> home
    if (viewName === "admin" && !isAdmin()) return "home";

    return viewName;
  }

  function navigate(viewName) {
    viewName = guard(viewName);

    showView(viewName);
    updateAccountBar();

    if (viewName === "login") return;

    // Setup: prefill
    if (viewName === "setup") {
      KongFit.app._prefillSetup && KongFit.app._prefillSetup();
      return;
    }

    // Render per vista
    if (viewName === "home") updateTodayLabelAndPreview();
    if (viewName === "scheda") renderScheda();
    if (viewName === "workout") KongFit.workout.renderWorkoutView();
    if (viewName === "history") KongFit.history.renderHistoryView();

    // Admin placeholder
    if (viewName === "admin") {
      // per ora niente, in futuro editor schede
    }
  }

  // Expose minimal API
  KongFit.app = KongFit.app || {};
  KongFit.app.navigate = navigate;
  KongFit.app._prefillSetup = null;

  document.addEventListener("DOMContentLoaded", () => {
    // ensure db has auth accounts
    const db = ensureAuth(getDB());
    setDB(db);

    wireNav();
    wireLogin();
    wireSetup();
    wireAccountButtons();
    wireSettings();

    // start
    updateAccountBar();
    const s = getSession();
    if (!s) navigate("login");
    else navigate("home");
  });
})();
