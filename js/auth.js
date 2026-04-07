/* Kong Fit - auth.js
   Login rapido con PIN 4 cifre + ruoli (admin/user)
   Storage: localStorage (db kongfit_v1)
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, ensureUser } = KongFit.state;

  const DEFAULT_ACCOUNTS = [
    { pin: "0000", slug: "admin", role: "admin", label: "Admin" },
    { pin: "1111", slug: "mattia", role: "user", label: "Mattia" },
    { pin: "2222", slug: "amico", role: "user", label: "Amico" }
  ];

  function ensureAuth(db) {
    db.auth ||= {};
    db.auth.accounts ||= [];
    db.auth.session ||= null;

    // Se non ci sono account, inizializza i 3 di default
    if (!db.auth.accounts.length) {
      db.auth.accounts = DEFAULT_ACCOUNTS.map(a => ({ ...a }));
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

    if (!isValidPin(pin)) {
      return { ok: false, reason: "PIN non valido (4 cifre)" };
    }

    const acc = findAccountByPin(db, pin);
    if (!acc) {
      return { ok: false, reason: "PIN errato" };
    }

    // assicura esistenza user data (workouts/config)
    ensureUser(db, acc.slug);

    db.currentUserSlug = acc.slug;
    db.auth.session = {
      slug: acc.slug,
      role: acc.role,
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
    return true;
  }

  function isAdmin() {
    const s = getSession();
    return !!s && s.role === "admin";
  }

  function getAccounts() {
    const db = ensureAuth(getDB());
    return db.auth.accounts.map(({ pin, ...safe }) => safe); // non esporre pin
  }

  // Usato per “passa ad admin” o cambio account in-app: basta reinserire PIN
  function switchAccount(pin) {
    return loginWithPin(pin);
  }

  KongFit.auth = {
    ensureAuth,
    getSession,
    getAccounts,
    loginWithPin,
    switchAccount,
    logout,
    isAdmin,
    isValidPin
  };
})();
