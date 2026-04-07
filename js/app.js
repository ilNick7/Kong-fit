/* Kong Fit - app.js
   Router SPA + Auth PIN + navigazione pulita:
   Sezioni principali: Allenamento (home), Schede, Obiettivi
   Profilo apribile da icona user (profile-btn)
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, ensureUser, getCurrentUser } = KongFit.state;
  const { templateIdForDays, getTemplate } = KongFit.templates;
  const { getSession, loginWithPin, ensureAuth, isAdmin } = KongFit.auth;

  // -------------------------
  // Helpers DOM
  // -------------------------
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  // -------------------------
  // View mapping (robusto)
  // -------------------------
  // Supporta sia view-scheda che view-schede
  function resolveViewId(name) {
    const direct = `view-${name}`;
    if (document.getElementById(direct)) return direct;

    // alias utili
    const aliases = {
      allenamento: ["home"],
      home: ["allenamento"],
      schede: ["scheda"],
      scheda: ["schede"],
      obiettivi: ["obiettivo", "goals"],
      goals: ["obiettivi"],
      profile: ["profilo"],
      profilo: ["profile"]
    };

    for (const alt of (aliases[name] || [])) {
      const id = `view-${alt}`;
      if (document.getElementById(id)) return id;
    }

    return null;
  }

  function hideAllViews() {
    $all("[data-view-section]").forEach(sec => {
      sec.style.display = "none";
    });
  }

  function showView(name) {
    hideAllViews();
    const id = resolveViewId(name);
    if (!id) return;
    const sec = document.getElementById(id);
    sec.style.display = "block";
  }

  // -------------------------
  // Guard (auth)
  // -------------------------
  function guard(viewName) {
    const session = getSession();

    // se non loggato -> login
    if (!session && viewName !== "login") return "login";

    // se view richiesta non esiste, fallback
    if (!resolveViewId(viewName)) return "home";

    return viewName;
  }

  // -------------------------
  // Setup logic
  // -------------------------
  function userNeedsSetup(user) {
    // Se non ha daysPerWeek/templateId definiti, consideriamo setup necessario
    if (!user?.config) return true;
    if (!user.config.daysPerWeek) return true;
    if (!user.config.templateId) return true;
    return false;
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
        if (err) err.textContent = res.reason || "PIN errato";
        pinInput.value = "";
        pinInput.focus();
        return;
      }

      pinInput.value = "";

      const db = getDB();
      const user = getCurrentUser(db);

      // se serve setup -> setup, altrimenti home
      if (userNeedsSetup(user) && resolveViewId("setup")) navigate("setup");
      else navigate("home");
    };
  }

  function wireSetup() {
    const form = document.getElementById("setup-form");
    const slugInput = document.getElementById("user-slug");
    const daysSelect = document.getElementById("days-per-week");
    if (!form || !daysSelect) return;

    form.onsubmit = (ev) => {
      ev.preventDefault();

      const session = getSession();
      if (!session) return navigate("login");

      const slug = session.slug;
      const days = Number(daysSelect.value || 4);

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

    // prefill slug e blocca
    function prefill() {
      const s = getSession();
      if (!s) return;
      if (slugInput) {
        slugInput.value = s.slug;
        slugInput.disabled = true;
      }
      // seleziona days già esistenti se presenti
      const db = getDB();
      const user = getCurrentUser(db);
      if (user && daysSelect) {
        daysSelect.value = String(user.config.daysPerWeek || 4);
      }
    }

    KongFit.app._prefillSetup = prefill;
  }

  // -------------------------
  // Home (Allenamento) render
  // -------------------------
  function getNextDay(user) {
    const tpl = getTemplate(user.config.templateId);
    const idx = (user.config.rotationIndex || 0) % tpl.days.length;
    return { tpl, day: tpl.days[idx], idx };
  }

  function renderHomeAllenamento() {
    const db = getDB();
    const user = getCurrentUser(db);
    if (!user) return;

    const label = document.getElementById("today-workout");
    const preview = document.getElementById("today-preview");

    const { day } = getNextDay(user);

    if (label) label.textContent = day.name;

    // Preview esercizi (opzionale): se in HTML c'è #today-preview
    if (preview) {
      preview.innerHTML = day.exercises.slice(0, 6).map(ex => `
        <div class="item">
          <strong>${escapeHtml(ex.name)}</strong>
          <span class="pill">${ex.setsTarget}x ${escapeHtml(ex.repsTarget)}</span>
        </div>
      `).join("");
    }
  }

  // Home actions (se presenti pulsanti)
  function wireHomeActions() {
    const wrap = document.getElementById("home-actions");
    if (!wrap) return;

    wrap.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-action]");
      if (!b) return;

      const a = b.dataset.action;

      // se nel tuo HTML vuoi ancora un workflow separato con view-workout, supportato:
      if (a === "start-workout") {
        if (resolveViewId("workout")) navigate("workout");
        else navigate("home");
      }
      if (a === "view-scheda") navigate(resolveViewId("schede") ? "schede" : "scheda");
      if (a === "view-history") {
        // storico non è più sezione principale, ma se esiste ancora lo supportiamo
        if (resolveViewId("history")) navigate("history");
      }
    });
  }

  // -------------------------
  // Schede render
  // -------------------------
  function renderSchede() {
    const db = getDB();
    const user = getCurrentUser(db);
    if (!user) return;

    const tpl = getTemplate(user.config.templateId);
    const wrap = document.getElementById("scheda-container") || document.getElementById("schede-container");
    if (!wrap) return;

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
            <span class="mini">${escapeHtml(day.id)}</span>
          </div>
          <div style="margin-top:10px; display:grid; gap:10px;">
            ${exHtml}
          </div>
        </div>
      `;
    }).join("");
  }

  // -------------------------
  // Obiettivi (placeholder)
  // -------------------------
  function renderObiettivi() {
    // Per ora non facciamo nulla: è solo una view
    // Qui potremo poi renderizzare target peso, checklist, ecc.
  }

  // -------------------------
  // Profilo
  // -------------------------
  function wireProfileButton() {
    const btn = document.getElementById("profile-btn");
    if (!btn) return;
    btn.addEventListener("click", () => navigate("profile"));
  }

  // -------------------------
  // Nav principale (solo Allenamento/Schede/Obiettivi)
  // -------------------------
  function wireMainNav() {
    const nav = document.getElementById("main-nav");
    if (!nav) return;

    nav.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-view]");
      if (!b) return;

      const view = b.dataset.view;
      navigate(view);
    });

    // Se per caso in HTML hai ancora Admin, lo nascondiamo automaticamente
    const adminBtn = document.getElementById("nav-admin");
    if (adminBtn) {
      adminBtn.style.display = isAdmin() ? "inline-block" : "none";
    }
  }

  // -------------------------
  // Router
  // -------------------------
  function navigate(viewName) {
    viewName = guard(viewName);

    showView(viewName);

    // Hook speciali per vista
    if (viewName === "setup") {
      KongFit.app._prefillSetup && KongFit.app._prefillSetup();
      return;
    }

    if (viewName === "home" || viewName === "allenamento") {
      renderHomeAllenamento();
      return;
    }

    if (viewName === "schede" || viewName === "scheda") {
      renderSchede();
      return;
    }

    if (viewName === "obiettivi" || viewName === "goals") {
      renderObiettivi();
      return;
    }

    // Supporto legacy: workout/history se ancora presenti
    if (viewName === "workout" && KongFit.workout?.renderWorkoutView) {
      KongFit.workout.renderWorkoutView();
      return;
    }

    if (viewName === "history" && KongFit.history?.renderHistoryView) {
      KongFit.history.renderHistoryView();
      return;
    }

    // Profilo
    if ((viewName === "profile" || viewName === "profilo") && KongFit.profile?.renderProfile) {
      KongFit.profile.renderProfile();
      return;
    }
  }

  // Expose
  KongFit.app = KongFit.app || {};
  KongFit.app.navigate = navigate;
  KongFit.app._prefillSetup = null;

  // -------------------------
  // Boot
  // -------------------------
  document.addEventListener("DOMContentLoaded", () => {
    // Init DB auth shape
    const db = ensureAuth(getDB());
    setDB(db);

    wireMainNav();
    wireLogin();
    wireSetup();
    wireHomeActions();
    wireProfileButton();

    // wiring profilo (close/switch/logout/calendar) se profile.js presente
    if (KongFit.profile?.wireProfileUI) {
      KongFit.profile.wireProfileUI();
    }

    // Start
    const session = getSession();
    if (!session) {
      navigate("login");
      return;
    }

    // se loggato, se serve setup -> setup, altrimenti Allenamento (home)
    const user = getCurrentUser(getDB());
    if (userNeedsSetup(user) && resolveViewId("setup")) navigate("setup");
    else navigate("home");
  });
})();
