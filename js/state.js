/* Kong Fit - state.js
   Gestione stato + localStorage + utente corrente
*/
(function () {
  const APP_KEY = "kongfit_v1";

  const KongFit = (window.KongFit = window.KongFit || {});
  KongFit.state = KongFit.state || {};

  function nowISO() {
    return new Date().toISOString();
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(APP_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function save(db) {
    localStorage.setItem(APP_KEY, JSON.stringify(db));
  }

  function ensureShape(db) {
    db.currentUserSlug ||= "";
    db.users ||= {};
    db.github ||= { owner: "", repo: "", branch: "main", token: "" };
    db.auth ||= { accounts: [], session: null };
    return db;
  }

  function ensureUser(db, slug) {
    ensureShape(db);
    if (!db.users[slug]) {
      db.users[slug] = {
        config: {
          slug,
          createdAt: nowISO(),
          daysPerWeek: 4,
          templateId: "tpl-4",
          rotationIndex: 0
        },
        workouts: [] // array di workout (più recenti davanti)
      };
    }
    return db.users[slug];
  }

  function getDB() {
    return ensureShape(load());
  }

  function setDB(db) {
    save(ensureShape(db));
  }

  function getCurrentUser(db) {
    db = db || getDB();
    const slug = db.currentUserSlug;
    if (!slug) return null;
    return db.users?.[slug] || null;
  }

  function setCurrentUserSlug(db, slug) {
    db.currentUserSlug = slug;
    ensureUser(db, slug);
    setDB(db);
  }

  function resetUser(db, slug) {
    delete db.users[slug];
    if (db.currentUserSlug === slug) db.currentUserSlug = "";
    setDB(db);
  }

  KongFit.state = {
    APP_KEY,
    nowISO,
    getDB,
    setDB,
    ensureUser,
    getCurrentUser,
    setCurrentUserSlug,
    resetUser
  };
})();
