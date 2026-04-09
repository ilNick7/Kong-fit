/* Kong Fit - auth.js
   Login rapido con PIN 4 cifre + sessione
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, ensureUser, ensureShape } = KongFit.state;

  // Default accounts (puoi cambiarli quando vuoi)
  const DEFAULT_ACCOUNTS = [
    { pin: "0000", slug: "admin", label: "Admin" },
    { pin: "1111", slug: "mattia", label: "Mattia" },
    // compat: gestisco sia christian che amico
    { pin: "2222", slug: "christian", label: "Christian" }
  ];

  function ensureAuth(db) {
    db = ensureShape(db);

    db.auth ||= { accounts: [], session: null };
    db.auth.accounts ||= [];

    // se vuoto, inizializza
    if (db.auth.accounts.length === 0) {
      db.auth.accounts = DEFAULT_ACCOUNTS.map(a => ({ ...a }));
    } else {
      // se c'era "amico" in vecchie versioni, accetta comunque
      // (non rimuoviamo nulla qui, solo compat)
    }

    return db;
  }

  function normalizePin(pin) {
    return String(pin || "").trim();
  }

  function isValidPin(pin) {
    return /^\d{4}$/.test(pin);
  }

  function findAccountByPin(db, pin) {
    db = ensureAuth(db);
    return db.auth.accounts.find(a => a.pin === pin) || null;
  }

  function getSession() {
    const db = ensureAuth(getDB());
    return db.auth.session || null;
  }

  function loginWithPin(pin) {
    const db = ensureAuth(getDB());
    pin = normalizePin(pin);

    if (!isValidPin(pin)) return { ok: false, reason: "PIN non valido" };

    const acc = findAccountByPin(db, pin);
    if (!acc) return { ok: false, reason: "PIN errato" };

    // crea utente
    ensureUser(db, acc.slug);
    db.currentUserSlug = acc.slug;

    db.auth.session = {
      slug: acc.slug,
      label: acc.label || acc.slug,
      loggedAt: new Date().toISOString()
    };

    setDB(db);
    return { ok: true, session: db.auth.session };
  }

  function logout() {
    const db = ensureAuth(getDB());
    db.auth.session = null;
    db.currentUserSlug = "";
    setDB(db);
  }

  function switchAccount(pin) {
    return loginWithPin(pin);
  }

  function getPinForSlug(slug) {
    const db = ensureAuth(getDB());
    const acc = db.auth.accounts.find(a => a.slug === slug);
    // compat vecchia
    if (!acc && slug === "amico") {
      const acc2 = db.auth.accounts.find(a => a.slug === "christian");
      return acc2?.pin || "••••";
    }
    return acc?.pin || "••••";
  }

  function isAdmin() {
    const s = getSession();
    return !!s && s.slug === "admin";
  }

  KongFit.auth = {
    ensureAuth,
    getSession,
    loginWithPin,
    switchAccount,
    logout,
    isAdmin,
    getPinForSlug
  };
})();
