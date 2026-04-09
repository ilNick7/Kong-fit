/* Kong Fit - home.js
   - Home user: Ciao Mattia / Christian / User
   - Iniziali nel pallino: MN / CP / US
   - Hero image assets/hero.jpg
   - Cards "ultime schede" da db.schede (admin) (fallback template)
   - One-page scroll + bottom nav show-on-scroll
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, getCurrentUser } = KongFit.state;
  const { getSession } = KongFit.auth;
  const { getTemplate } = KongFit.templates;

  function infoFromSlug(slug) {
    // compat: christian e amico = Christian
    if (slug === "mattia") return { name: "Mattia", initials: "MN" };
    if (slug === "christian" || slug === "amico") return { name: "Christian", initials: "CP" };
    return { name: "User", initials: "US" };
  }

  const pad2 = (n) => String(n).padStart(2, "0");

  function formatDateIT(date = new Date()) {
    const giorni = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
    return `${giorni[date.getDay()]} ${date.getDate()}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  function ensureHeroImage() {
    const hero = document.querySelector("#view-home .home-hero");
    if (!hero) return;
    if (hero.querySelector("img")) return;

    const img = document.createElement("img");
    img.src = "assets/hero.jpg";
    img.alt = "Kong Fit hero";
    hero.prepend(img);
  }

  function getNextDay(user) {
    const tpl = getTemplate(user.config.templateId);
    const idx = (user.config.rotationIndex || 0) % tpl.days.length;
    return { tpl, day: tpl.days[idx], idx };
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function getRecentSchedeFromDB(db) {
    const list = (db.schede || [])
      .slice()
      .sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""))
      .slice(0, 10)
      .map(s => ({ id: s.id, title: s.name }));

    return list;
  }

  function renderRecentCards(cards) {
    const wrap = document.getElementById("recent-schede");
    if (!wrap) return;

    wrap.innerHTML = cards.map(c => `
      <div class="home-card" data-id="${escapeHtml(c.id)}" role="button" tabindex="0">
        <span>${escapeHtml(c.title)}</span>
      </div>
    `).join("");
  }

  function renderSchedeSection(db) {
    const container = document.getElementById("scheda-container");
    if (!container) return;

    const schede = (db.schede || [])
      .slice()
      .sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));

    if (schede.length === 0) {
      container.innerHTML = `<p class="muted">Nessuna scheda creata dall'admin.</p>`;
      return;
    }

    container.innerHTML = schede.slice(0, 8).map(s => `
      <div class="item">
        <h3 style="margin:0 0 6px 0;">${escapeHtml(s.name)}</h3>
        <p class="muted" style="margin:0 0 10px 0;">${escapeHtml(s.desc || "")}</p>
        <p class="muted" style="margin:0;">Esercizi: ${(s.exercises||[]).length}</p>
      </div>
    `).join("");
  }

  function renderHome() {
    const db = getDB();
    const session = getSession();
    const user = getCurrentUser(db);
    if (!session || !user) return;

    // hero
    ensureHeroImage();

    // greeting + initials
    const info = infoFromSlug(session.slug);
    const nameEl = document.getElementById("home-username");
    if (nameEl) nameEl.textContent = info.name;

    const ini = document.getElementById("profile-initials");
    if (ini) ini.textContent = info.initials;

    // date
    const dateEl = document.getElementById("home-date");
    if (dateEl) dateEl.textContent = formatDateIT(new Date());

    // badge prossimo giorno (da template)
    const badgeEl = document.getElementById("home-active-scheda");
    const next = getNextDay(user);
    if (badgeEl) badgeEl.textContent = next.day.name;

    // cards recenti: preferisci le schede admin, fallback template days
    const recent = getRecentSchedeFromDB(db);
    if (recent.length > 0) {
      renderRecentCards(recent);
    } else {
      const tpl = getTemplate(user.config.templateId);
      renderRecentCards(tpl.days.map(d => ({ id: d.id, title: d.name })));
    }

    // sezione schede (one page)
    renderSchedeSection(db);

    // start -> workout view
    const startBtn = document.getElementById("home-start-btn");
    if (startBtn) {
      startBtn.onclick = () => KongFit.app?.navigate?.("workout");
    }

    // goals -> scroll
    const goalsBtn = document.getElementById("home-goals-btn");
    if (goalsBtn) {
      goalsBtn.onclick = () => {
        document.getElementById("section-obiettivi")
          ?.scrollIntoView({ behavior:"smooth", block:"start" });
      };
    }

    // click sulle cards: scroll a schede (MVP)
    const wrap = document.getElementById("recent-schede");
    if (wrap) {
      wrap.onclick = () => {
        document.getElementById("section-schede")
          ?.scrollIntoView({ behavior:"smooth", block:"start" });
      };
    }
  }

  // bottom nav show/hide on scroll + scroll to anchors
  let lastY = 0;
  function wireBottomNav() {
    const footer = document.getElementById("app-footer");
    if (!footer) return;

    lastY = window.scrollY || 0;

    window.addEventListener("scroll", () => {
      const y = window.scrollY || 0;
      const goingDown = y > lastY;
      lastY = y;

      if (goingDown && y > 40) footer.classList.add("is-visible");
      if (!goingDown && y < 60) footer.classList.remove("is-visible");
    }, { passive: true });

    footer.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-nav]");
      if (!btn) return;
      const target = btn.dataset.nav;

      if (target === "schede") {
        document.getElementById("section-schede")
          ?.scrollIntoView({ behavior:"smooth", block:"start" });
      }
      if (target === "obiettivi") {
        document.getElementById("section-obiettivi")
          ?.scrollIntoView({ behavior:"smooth", block:"start" });
      }
    });
  }

  KongFit.home = { renderHome, wireBottomNav };
})();
