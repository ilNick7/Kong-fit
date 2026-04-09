/* Kong Fit - state.js
   Stato globale + localStorage
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

    // schede create dall'admin (condivise)
    db.schede ||= [];

    // auth
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
        profile: {
          weightKg: "",
          heightCm: ""
        },
        workouts: []
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

  KongFit.state = {
    APP_KEY,
    nowISO,
    getDB,
    setDB,
    ensureShape,
    ensureUser,
    getCurrentUser
  };
})();
