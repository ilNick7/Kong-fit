/* Kong Fit - app.js
   Router SPA: mostra/nasconde viste, setup, render e settings.
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, ensureUser, getCurrentUser, setCurrentUserSlug, resetUser } = KongFit.state;
  const { templateIdForDays, getTemplate } = KongFit.templates;

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

  function updateTodayLabel() {
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

  function wireNav() {
    // Top nav buttons
    document.querySelectorAll("#main-nav button[data-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        navigate(btn.dataset.view);
      });
    });

    // Home actions
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

  function wireSetup() {
    const form = document.getElementById("setup-form");
    if (!form) return;

    form.onsubmit = (ev) => {
      ev.preventDefault();

      const slug = (document.getElementById("user-slug").value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      const days = Number(document.getElementById("days-per-week").value || 4);

      if (!slug) {
        alert("Inserisci un nome utente valido (es. mattia).");
        return;
      }

      const db = getDB();
      const user = ensureUser(db, slug);

      user.config.slug = slug;
      user.config.daysPerWeek = days;
      user.config.templateId = templateIdForDays(days);
      user.config.rotationIndex = user.config.rotationIndex || 0;

      db.users[slug] = user;
      db.currentUserSlug = slug;

      setDB(db);
      navigate("home");
    };
  }

  function wireSettings() {
    const view = document.getElementById("view-settings");
    if (!view) return;

    const resetBtn = document.getElementById("reset-plan");
    resetBtn.onclick = () => {
      const db = getDB();
      const user = getCurrentUser(db);
      if (!user) return;

      if (!confirm("Reset piano: cancella workouts e reimposta config. Continuo?")) return;

      const slug = user.config.slug;
      // reset morbido: mantieni utente ma azzera data
      db.users[slug] = {
        config: { slug, createdAt: new Date().toISOString(), daysPerWeek: 4, templateId: "tpl-4", rotationIndex: 0 },
        workouts: []
      };
      setDB(db);
      navigate("home");
    };

    // GitHub settings
    const ghPull = document.getElementById("gh-pull");
    const ghPush = document.getElementById("gh-push");

    function saveGitHubSettings() {
      const db = getDB();
      db.github.owner = (document.getElementById("gh-owner").value || "").trim();
      db.github.repo = (document.getElementById("gh-repo").value || "").trim();
      db.github.branch = (document.getElementById("gh-branch").value || "main").trim() || "main";
      db.github.token = (document.getElementById("gh-token").value || "").trim();
      setDB(db);
    }

    ghPull.onclick = async (ev) => {
      ev.preventDefault();
      saveGitHubSettings();

      try {
        const db = getDB();
        const user = getCurrentUser(db);
        if (!user) return;

        await KongFit.github.pullUser(user.config.slug);
        alert("Pull completato ✅");
        navigate("home");
      } catch (e) {
        console.error(e);
        alert("Pull fallito. Controlla owner/repo/token.");
      }
    };

    ghPush.onclick = async (ev) => {
      ev.preventDefault();
      saveGitHubSettings();

      try {
        const db = getDB();
        const user = getCurrentUser(db);
        if (!user) return;

        await KongFit.github.pushUser(user.config.slug);
        alert("Push completato ✅");
      } catch (e) {
        console.error(e);
        alert("Push fallito. Controlla owner/repo/token.");
      }
    };
  }

  function fillSettingsInputs() {
    const db = getDB();
    const gh = db.github || {};
    const o = document.getElementById("gh-owner");
    const r = document.getElementById("gh-repo");
    const b = document.getElementById("gh-branch");
    const t = document.getElementById("gh-token");

    if (o) o.value = gh.owner || "";
    if (r) r.value = gh.repo || "";
    if (b) b.value = gh.branch || "main";
    if (t) t.value = gh.token || "";
  }

  function ensureInitialView() {
    const db = getDB();
    const user = getCurrentUser(db);

    if (!user) {
      showView("setup");
      return;
    }
    showView("home");
    updateTodayLabel();
  }

  function navigate(viewName) {
    const db = getDB();
    const user = getCurrentUser(db);

    // Se non c'è user, forziamo setup
    if (!user && viewName !== "setup") viewName = "setup";

    showView(viewName);

    // Render per vista
    if (viewName === "home") updateTodayLabel();
    if (viewName === "scheda") renderScheda();
    if (viewName === "workout") KongFit.workout.renderWorkoutView();
    if (viewName === "history") KongFit.history.renderHistoryView();
    if (viewName === "settings") fillSettingsInputs();
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  // Expose minimal API
  KongFit.app = { navigate };

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    wireNav();
    wireSetup();
    wireSettings();
    ensureInitialView();
  });
})();
