/* Kong Fit - profile.js
   Profilo: username/pin, peso/altezza, calendario mensile, switch/logout, close.
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, getCurrentUser } = KongFit.state;
  const { getSession, getPinForSlug, switchAccount, logout } = KongFit.auth;

  const MONTHS_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  let selectedDateISO = null;

  const pad2 = (n) => String(n).padStart(2, "0");
  const todayISO = () => new Date().toISOString().slice(0,10);
  const toISO = (y,m,d) => `${y}-${pad2(m+1)}-${pad2(d)}`;

  function workoutsByDate(user){
    const map = new Map();
    for (const w of (user.workouts || [])) {
      if (!w?.date) continue;
      const arr = map.get(w.date) || [];
      arr.push(w);
      map.set(w.date, arr);
    }
    return map;
  }

  function renderCalendar(){
    const user = getCurrentUser(getDB());
    if(!user) return;

    const monthLabel = document.getElementById("calendar-month");
    const grid = document.querySelector(".calendar-grid");
    if (!grid) return;

    if (monthLabel) monthLabel.textContent = `${MONTHS_IT[calMonth]} ${calYear}`;

    const wMap = workoutsByDate(user);
    const first = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const jsDow = first.getDay(); // 0 dom
    const offset = (jsDow + 6) % 7; // lun=0

    const today = todayISO();
    grid.innerHTML = "";

    for(let i=0;i<offset;i++){
      const blank = document.createElement("div");
      blank.className = "calendar-blank";
      grid.appendChild(blank);
    }

    for(let d=1; d<=lastDay; d++){
      const iso = toISO(calYear, calMonth, d);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";
      btn.dataset.day = iso;
      btn.textContent = String(d);

      if (iso === today) btn.classList.add("is-today");
      if (wMap.has(iso)) btn.classList.add("has-workout");
      if (selectedDateISO === iso) btn.classList.add("selected");

      btn.onclick = () => {
        selectedDateISO = iso;
        grid.querySelectorAll(".calendar-day").forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");
        renderSelectedDayDetail();
      };

      grid.appendChild(btn);
    }
  }

  function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function renderSelectedDayDetail(){
    const user = getCurrentUser(getDB());
    if(!user) return;

    const list = document.getElementById("calendar-workouts");
    if (!list) return;

    if(!selectedDateISO){
      list.innerHTML = `<p class="muted">Seleziona un giorno</p>`;
      return;
    }

    const workouts = (user.workouts || []).filter(w => w.date === selectedDateISO);
    if(workouts.length === 0){
      list.innerHTML = `<p class="muted">Nessun allenamento in questa data.</p>`;
      return;
    }

    list.innerHTML = workouts.map(w => `
      <div class="workout-mini">
        <strong>${escapeHtml(w.date)} — ${escapeHtml(w.dayName || w.dayId)}</strong>
        <p class="muted">${(w.entries||[]).length} esercizi</p>
      </div>
    `).join("");
  }

  function renderProfile(){
    const db = getDB();
    const session = getSession();
    const user = getCurrentUser(db);
    if(!session || !user) return;

    document.getElementById("profile-username").textContent = session.slug;
    document.getElementById("profile-pin").textContent = getPinForSlug(session.slug);

    // profile values
    const w = document.getElementById("profile-weight");
    const h = document.getElementById("profile-height");
    if(w) w.value = user.profile?.weightKg ?? "";
    if(h) h.value = user.profile?.heightCm ?? "";

    // calendar
    renderCalendar();
    renderSelectedDayDetail();
  }

  function wireProfileUI(){
    const saveBtn = document.getElementById("save-profile");
    const closeBtn = document.getElementById("close-profile");
    const prev = document.getElementById("calendar-prev");
    const next = document.getElementById("calendar-next");
    const sw = document.getElementById("switch-account");
    const lo = document.getElementById("logout-account");

    saveBtn?.addEventListener("click", () => {
      const db = getDB();
      const session = getSession();
      const user = getCurrentUser(db);
      if(!session || !user) return;

      const w = document.getElementById("profile-weight")?.value;
      const h = document.getElementById("profile-height")?.value;
      user.profile ||= {};
      user.profile.weightKg = w ? Number(w) : "";
      user.profile.heightCm = h ? Number(h) : "";

      db.users[session.slug] = user;
      setDB(db);
      alert("Profilo salvato ✅");
    });

    closeBtn?.addEventListener("click", () => {
      KongFit.app?.goBackFromProfile?.();
    });

    prev?.addEventListener("click", () => {
      calMonth--;
      if(calMonth < 0){ calMonth = 11; calYear--; }
      renderCalendar();
      renderSelectedDayDetail();
    });

    next?.addEventListener("click", () => {
      calMonth++;
      if(calMonth > 11){ calMonth = 0; calYear++; }
      renderCalendar();
      renderSelectedDayDetail();
    });

    sw?.addEventListener("click", () => {
      const pin = prompt("Inserisci PIN (4 cifre) per cambiare account:");
      if(pin == null) return;
      const res = switchAccount(String(pin).trim());
      if(!res.ok){ alert(res.reason || "PIN errato"); return; }
      selectedDateISO = null;
      calYear = new Date().getFullYear();
      calMonth = new Date().getMonth();
      KongFit.app?.navigate?.(getSession()?.slug === "admin" ? "admin" : "home");
    });

    lo?.addEventListener("click", () => {
      logout();
      KongFit.app?.navigate?.("login");
    });
  }

  KongFit.profile = { renderProfile, wireProfileUI };
})();
