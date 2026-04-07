/* Kong Fit - github.js
   Sync semplice su GitHub (opzionale).
   Nota: token nel browser => ok per uso personale.
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, ensureUser } = KongFit.state;

  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64decode(b64) {
    return decodeURIComponent(escape(atob((b64 || "").replace(/\n/g, ""))));
  }

  async function ghRequest(url, method = "GET", token = "", body = null) {
    const headers = {
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (body) headers["Content-Type"] = "application/json";

    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : null });
    const text = await res.text();
    if (!res.ok) throw new Error(text || res.statusText);
    return text ? JSON.parse(text) : null;
  }

  async function getFile({ owner, repo, branch, token, path }) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch || "main")}`;
    try {
      const data = await ghRequest(url, "GET", token);
      if (!data?.content) return null;
      const json = JSON.parse(b64decode(data.content));
      return { json, sha: data.sha };
    } catch (e) {
      if (String(e.message).includes("404")) return null;
      throw e;
    }
  }

  async function putFile({ owner, repo, branch, token, path, json, message }) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const existing = await getFile({ owner, repo, branch, token, path });
    const content = b64encode(JSON.stringify(json, null, 2));

    const body = {
      message: message || `Update ${path}`,
      content,
      branch: branch || "main",
      ...(existing?.sha ? { sha: existing.sha } : {})
    };

    return ghRequest(url, "PUT", token, body);
  }

  async function pullUser(slug) {
    const db = getDB();
    const cfg = db.github || {};
    if (!cfg.owner || !cfg.repo || !cfg.token) throw new Error("GitHub config mancante");

    const confPath = `users/${slug}/config.json`;
    const wPath = `users/${slug}/workouts.json`;

    const conf = await getFile({ ...cfg, path: confPath });
    const w = await getFile({ ...cfg, path: wPath });

    const user = ensureUser(db, slug);

    if (conf?.json) user.config = conf.json;
    if (w?.json) user.workouts = w.json.workouts || [];

    db.users[slug] = user;
    db.currentUserSlug = slug;

    setDB(db);
    return true;
  }

  async function pushUser(slug) {
    const db = getDB();
    const cfg = db.github || {};
    if (!cfg.owner || !cfg.repo || !cfg.token) throw new Error("GitHub config mancante");

    const user = ensureUser(db, slug);

    await putFile({
      ...cfg,
      path: `users/${slug}/config.json`,
      json: user.config,
      message: `Update config (${slug})`
    });

    await putFile({
      ...cfg,
      path: `users/${slug}/workouts.json`,
      json: { workouts: user.workouts || [] },
      message: `Update workouts (${slug})`
    });

    return true;
  }

  KongFit.github = { pullUser, pushUser };
})();
``
