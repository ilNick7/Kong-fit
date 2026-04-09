/* ======================================================
   Kong Fit - home.js (DA ZERO)
   - Saluto + iniziali account (1111 Mattia, 2222 Christian, 0000 User)
   - Hero image assets/hero.jpg
   - Schede recenti (scroll orizzontale)
   - Start / CTA / bottom-nav scroll
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, getCurrentUser } = KongFit.state;
  const { getSession } = KongFit.auth;
  const { getTemplate } = KongFit.templates;

  /* ---------- CONFIG USER LABELS ---------- */
  function userInfoFromSession(session) {
    // Usiamo lo slug che hai impostato in auth.js:
    // 1111 -> mattia
    // 2222 -> amico
    // 0000 -> admin
    const map = {
      mattia: { name: "Mattia", initials: "MN" },
      amico:  { name: "Christian", initials: "CP" },
      admin:  { name: "User", initials: "US" }
    };
    return map[session?.slug] || { name: "User", initials: "US" };
  }

  /* ---------- DATE IT ---------- */
  function pad2(n) { return String(n).padStart(2, "0"); }
  function formatDateIT(date = new Date()) {
    const giorni = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
    return `${giorni[date.getDay()]} ${date.getDate()}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  /* ---------- NEXT DAY FROM TEMPLATE ---------- */
  function getNextDay(user) {
    const tpl = getTemplate(user.config.templateId);
    const idx = (user.config.rotationIndex || 0) % tpl.days.length;
    return { tpl, day: tpl.days[idx], idx };
  }

  /* ---------- RECENT "SCHEDE" (ultimi dayName usati) ---------- */
  function getRecentSchede(user) {
    const seen = new Set();
    const out = [];

    for (const w of (user.workouts || [])) {
      const title = w.dayName || w.dayId || "Allenamento";
      if (seen.has(title)) continue;
      seen.add(title);
      out.push({ title, dayId: w.dayId || "" });
      if (out.length >= 10) break;
    }

    // fallback: giorni del template
    if (out.length === 0) {
      const tpl = getTemplate(user.config.templateId);
      for (const d of tpl.days) out.push({ title: d.name, dayId: d.id });
    }

    return out;
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function renderCards(cards) {
    const wrap = document.getElementById("recent-schede");
    if (!wrap) return;

    wrap.innerHTML = cards.map(c => `
      <div class="home-card" data-dayid="${escapeHtml(c.dayId)}" role="button" tabindex="0">
        <span>${escapeHtml(c.title)}</span>
      </div>
    `).join("");
  }

  /* ---------- HERO IMAGE INJECTION ---------- */
  function ensureHeroImage() {
    const hero = document.querySelector(".home-hero");
    if (!hero) return;

    // Se c'è già una <img>, non fare nulla
    if (hero.querySelector("img")) return;

    const img = document.createElement("img");
    img.src = "assets/hero.jpg";
    img.alt = "Kong Fit hero";
    hero.prepend(img);
  }

  /* ---------- MAIN RENDER HOME ---------- */
  function renderHome() {
    const db = getDB();
    const session = getSession();
    const user = getCurrentUser(db);
    if (!session || !user) return;

    const info = userInfoFromSession(session);

    // Hero
    ensureHeroImage();

    // Saluto
    const nameEl = document.getElementById("home-username");
    if (nameEl) nameEl.textContent = info.name;

    // Iniziali nel pallino account
    const initialsEl = document.getElementById("profile-initials");
    if (initialsEl) initialsEl.textContent = info.initials;

    // Data
    const dateEl = document.getElementById("home-date");
    if (dateEl) dateEl.textContent = formatDateIT(new Date());

    // Badge del prossimo allenamento
    const badgeEl = document.getElementById("home-active-scheda");
    const next = getNextDay(user);
    if (badgeEl) badgeEl.textContent = next.day.name;

    // Schede recenti
    renderCards(getRecentSchede(user));

    // Start → workout
    const startBtn = document.getElementById("home-start-btn");
    if (startBtn) {
      startBtn.onclick = () => {
        KongFit.app?.navigate?.("workout");
      };
    }

    // CTA Obiettivi → scroll
    const goalsBtn = document.getElementById("home-goals-btn");
    if (goalsBtn) {
      goalsBtn.onclick = () => {
        document.getElementById("section-obiettivi")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
  }

  /* ---------- BOTTOM NAV SHOW ON SCROLL ---------- */
  let lastY = 0;
  function wireBottomNav() {
    const footer = document.getElementById("app-footer");
    if (!footer) return;

    lastY = window.scrollY || 0;

    window.addEventListener("scroll", () => {
      const y = window.scrollY || 0;
      const goingDown = y > lastY;
      lastY = y;

      // appare solo se scendi un minimo
      if (goingDown && y > 40) footer.classList.add("is-visible");
      // sparisce se risali vicino all’inizio
      if (!goingDown && y < 60) footer.classList.remove("is-visible");
    }, { passive: true });

    // click bottom nav -> scroll one-page
    footer.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-nav]");
      if (!btn) return;

      const target = btn.dataset.nav;
      if (target === "schede") {
        document.getElementById("section-schede")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (target === "obiettivi") {
        document.getElementById("section-obiettivi")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  KongFit.home = {
    renderHome,
    wireBottomNav
  };
})();
