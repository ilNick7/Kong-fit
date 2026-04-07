/* Kong Fit - profile.js
   Profilo: username/pin, peso/altezza, calendario mensile con workouts
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, getCurrentUser } = KongFit.state;
  const { getSession, switchAccount, logout } = KongFit.auth;
  const { getTemplate } = KongFit.templates;

  const MONTHS_IT = [
    "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
  ];

  // Stato calendario (mese corrente mostrato)
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth(); // 0-11
  let selectedDateISO = null;

  function pad2(n){ return String(n).padStart(2,"0"); }
  function toISODate(y,m,d){ return `${y}-${pad2(m+1)}-${pad2(d)}`; }
  function todayISO(){ return new Date().toISOString().slice(0,10); }

  function ensureProfile(user){
    user.profile ||= { weightKg: "", heightCm: "" };
    return user.profile;
  }

  function getAccountPinForSlug(db, slug){
    // visto che per te non è sensibile, lo mostriamo
    const acc = db.auth?.accounts?.find(a => a.slug === slug);
    return acc?.pin || "••••";
  }

  function workoutsByDate(user){
    const map = new Map(); // iso -> array workouts
    for(const w of (user.workouts || [])){
      if(!w?.date) continue;
      const arr = map.get(w.date) || [];
      arr.push(w);
      map.set(w.date, arr);
    }
    return map;
  }

  function renderProfile(){
    const db = getDB();
    const session = getSession();
    const user = getCurrentUser(db);
    if(!session || !user) return;

    // Fill top info
    const elUser = document.getElementById("profile-username");
    const elPin  = document.getElementById("profile-pin");
    if(elUser) elUser.textContent = session.slug;
    if(elPin)  elPin.textContent  = getAccountPinForSlug(db, session.slug);

    // Fill weight/height
    const profile = ensureProfile(user);
    const wInput = document.getElementById("profile-weight");
    const hInput = document.getElementById("profile-height");
    if(wInput) wInput.value = profile.weightKg ?? "";
    if(hInput) hInput.value = profile.heightCm ?? "";

    // Calendar
    renderCalendar();
    renderSelectedDayDetail(); // se selectedDateISO rimane da prima
  }

  function renderCalendar(){
    const db = getDB();
    const user = getCurrentUser(db);
    if(!user) return;

    const monthLabel = document.getElementById("calendar-month");
    const grid = document.querySelector(".calendar-grid");
    if(!grid) return;

    // Label mese
    if(monthLabel){
      monthLabel.textContent = `${MONTHS_IT[calMonth]} ${calYear}`;
    }

    const wMap = workoutsByDate(user);

    // Calcolo primo giorno del mese (lun->dom)
    const first = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate(); // numero giorni
    // JS: 0=dom ... 6=sab. Noi vogliamo L=0..D=6
    const jsDow = first.getDay(); // 0 dom
    const offset = (jsDow + 6) % 7; // converte: lun=0 ... dom=6

    const today = todayISO();
    grid.innerHTML = "";

    // Blank cells
    for(let i=0;i<offset;i++){
      const blank = document.createElement("div");
      blank.className = "calendar-blank";
      grid.appendChild(blank);
    }

    // Days
    for(let d=1; d<=lastDay; d++){
      const iso = toISODate(calYear, calMonth, d);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";
      btn.dataset.day = iso;
      btn.textContent = String(d);

      if(iso === today) btn.classList.add("is-today");
      if(wMap.has(iso)) btn.classList.add("has-workout");
      if(selectedDateISO === iso) btn.classList.add("selected");

      btn.addEventListener("click", () => {
        selectedDateISO = iso;
        // aggiorna selezione
        grid.querySelectorAll(".calendar-day").forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");
        renderSelectedDayDetail();
      });

      grid.appendChild(btn);
    }
  }

  function renderSelectedDayDetail(){
    const db = getDB();
    const user = getCurrentUser(db);
    if(!user) return;

    const detail = document.getElementById("calendar-detail");
    const list = document.getElementById("calendar-workouts");
    if(!detail || !list) return;

    if(!selectedDateISO){
      list.innerHTML = "";
      detail.querySelector(".muted")?.removeAttribute?.("hidden");
      return;
    }

    // recupera workouts del giorno
    const workouts = (user.workouts || []).filter(w => w.date === selectedDateISO);

    if(!workouts.length){
      list.innerHTML = `<p class="muted">Nessun allenamento salvato in questa data.</p>`;
      return;
    }

    list.innerHTML = workouts.map(w => {
      const tpl = getTemplate(w.templateId);
      const day = tpl?.days?.find(d => d.id === w.dayId);
      const dayName = w.dayName || day?.name || w.dayId;

      const exCount = (w.entries || []).length;
      const bw = w.bodyweightKg ? ` • BW: ${w.bodyweightKg}kg` : "";

      return `
        <div class="workout-mini">
          <strong>${selectedDateISO} — ${escapeHtml(dayName)}</strong>
          <p class="muted">${exCount} esercizi${bw}</p>
        </div>
      `;
    }).join("");
  }

  function saveProfile(){
    const db = getDB();
    const session = getSession();
    const user = getCurrentUser(db);
    if(!session || !user) return;

    const wInput = document.getElementById("profile-weight");
    const hInput = document.getElementById("profile-height");

    ensureProfile(user);
    user.profile.weightKg = wInput?.value ? Number(wInput.value) : "";
    user.profile.heightCm = hInput?.value ? Number(hInput.value) : "";

    db.users[session.slug] = user;
    setDB(db);
  }

  function wireProfileUI(){
    // Save button
    const saveBtn = document.getElementById("save-profile");
    if(saveBtn){
      saveBtn.addEventListener("click", () => {
        saveProfile();
        alert("Profilo salvato ✅");
      });
    }

    // Close (X)
    const closeBtn = document.getElementById("close-profile");
    if(closeBtn){
      closeBtn.addEventListener("click", () => {
        KongFit.app?.navigate?.("home");
      });
    }

    // Switch account
    const sw = document.getElementById("switch-account");
    if(sw){
      sw.addEventListener("click", () => {
        const pin = prompt("Inserisci PIN (4 cifre) per cambiare account:");
        if(pin == null) return;
        const res = switchAccount(String(pin).trim());
        if(!res.ok){
          alert(res.reason || "PIN errato");
          return;
        }
        // reset selezione calendario al mese corrente
        calYear = new Date().getFullYear();
        calMonth = new Date().getMonth();
        selectedDateISO = null;
        renderProfile();
        KongFit.app?.navigate?.("home");
      });
    }

    // Logout
    const lo = document.getElementById("logout-account");
    if(lo){
      lo.addEventListener("click", () => {
        logout();
        KongFit.app?.navigate?.("login");
      });
    }

    // Calendar prev/next
    const prev = document.getElementById("calendar-prev");
    const next = document.getElementById("calendar-next");

    if(prev){
      prev.addEventListener("click", () => {
        calMonth--;
        if(calMonth < 0){ calMonth = 11; calYear--; }
        renderCalendar();
        renderSelectedDayDetail();
      });
    }

    if(next){
      next.addEventListener("click", () => {
        calMonth++;
        if(calMonth > 11){ calMonth = 0; calYear++; }
        renderCalendar();
        renderSelectedDayDetail();
      });
    }
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  KongFit.profile = {
    renderProfile,
    wireProfileUI
  };
})();
