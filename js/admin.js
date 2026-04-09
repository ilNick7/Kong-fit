/* ======================================================
   Kong Fit - admin.js
   - CRUD schede in localStorage condiviso (db.schede)
   - Recenti: ordinate per updatedAt desc
   - Form crea con esercizi infiniti (add/remove)
   - Modifica base: seleziona, carica, salva, elimina
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  // --- helpers ---
  const uid = () => "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const nowISO = () => new Date().toISOString();
  const $ = (q) => document.querySelector(q);

  function ensureSchede(db){
    db.schede ||= []; // array di schede create dall'admin
    return db;
  }

  function isAdmin(){
    const s = getSession();
    return s && s.slug === "admin";
  }

  // --- DOM refs ---
  let recentWrap, form, exList, addBtn, goCreate, goEdit, editSelect, loadBtn, saveBtn, delBtn;
  let adminInitials;

  // stato modifica
  let editingId = null;

  function renderAdminInitials(){
    const s = getSession();
    if(!s) return;
    // admin => US (come richiesto)
    if(adminInitials) adminInitials.textContent = "US";
  }

  function exerciseRowHTML(index, data={}){
    const v = {
      name: data.name || "",
      group: data.group || "",
      sets: data.sets ?? "",
      reps: data.reps ?? "",
      rest: data.rest ?? ""
    };

    return `
      <div class="exercise-row" data-index="${index}">
        <div class="exercise-grid">
          <div class="full">
            <label>Nome esercizio</label>
            <input data-field="name" type="text" value="${escapeHtml(v.name)}" placeholder="es. Panca piana" />
          </div>

          <div class="full">
            <label>Gruppo muscolare</label>
            <input data-field="group" type="text" value="${escapeHtml(v.group)}" placeholder="es. Petto" />
          </div>

          <div>
            <label>Serie</label>
            <input data-field="sets" type="number" min="1" value="${escapeHtml(v.sets)}" placeholder="4" />
          </div>

          <div>
            <label>Ripetizioni</label>
            <input data-field="reps" type="text" value="${escapeHtml(v.reps)}" placeholder="6-8" />
          </div>

          <div class="full">
            <label>Recupero (sec)</label>
            <input data-field="rest" type="number" min="0" value="${escapeHtml(v.rest)}" placeholder="120" />
          </div>
        </div>

        <div class="exercise-actions">
          <button type="button" class="exercise-remove">Rimuovi</button>
        </div>
      </div>
    `;
  }

  function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function getExercisesFromDOM(){
    const rows = Array.from(exList.querySelectorAll(".exercise-row"));
    return rows.map(row => {
      const get = (field) => row.querySelector(`input[data-field="${field}"]`)?.value?.trim() || "";
      return {
        name: get("name"),
        group: get("group"),
        sets: Number(get("sets") || 0) || 0,
        reps: get("reps"),
        rest: Number(get("rest") || 0) || 0
      };
    }).filter(ex => ex.name.length > 0);
  }

  function addExerciseRow(prefill){
    const idx = exList.querySelectorAll(".exercise-row").length;
    exList.insertAdjacentHTML("beforeend", exerciseRowHTML(idx, prefill));
  }

  function resetCreateForm(){
    $("#scheda-name").value = "";
    $("#scheda-desc").value = "";
    exList.innerHTML = "";
    addExerciseRow(); // almeno 1 esercizio
    editingId = null;
  }

  function upsertScheda({ id, name, desc, exercises }){
    const db = ensureSchede(getDB());
    const now = nowISO();

    if(id){
      const s = db.schede.find(x => x.id === id);
      if(!s) return;
      s.name = name;
      s.desc = desc;
      s.exercises = exercises;
      s.updatedAt = now;
    } else {
      db.schede.unshift({
        id: uid(),
        name,
        desc,
        exercises,
        createdAt: now,
        updatedAt: now
      });
    }

    setDB(db);
  }

  function deleteSchedaById(id){
    const db = ensureSchede(getDB());
    db.schede = db.schede.filter(x => x.id !== id);
    setDB(db);
  }

  function renderRecent(){
    const db = ensureSchede(getDB());
    const schede = [...db.schede].sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));
    if(!recentWrap) return;

    if(schede.length === 0){
      recentWrap.innerHTML = `<p class="muted">Nessuna scheda creata.</p>`;
      return;
    }

    // mostra le prime 4 per layout come screenshot (poi scroll/altro se vuoi)
    recentWrap.innerHTML = schede.slice(0,4).map(s => `
      <div class="admin-card" data-id="${s.id}" role="button" tabindex="0">
        ${escapeHtml(s.name)}
      </div>
    `).join("");
  }

  function renderEditSelect(){
    const db = ensureSchede(getDB());
    const schede = [...db.schede].sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));
    if(!editSelect) return;

    editSelect.innerHTML = schede.map(s => `
      <option value="${s.id}">${escapeHtml(s.name)}</option>
    `).join("");

    if(schede.length === 0){
      editSelect.innerHTML = `<option value="">Nessuna scheda</option>`;
    }
  }

  function loadSchedaToForm(id){
    const db = ensureSchede(getDB());
    const s = db.schede.find(x => x.id === id);
    if(!s) return;

    $("#scheda-name").value = s.name || "";
    $("#scheda-desc").value = s.desc || "";
    exList.innerHTML = "";
    (s.exercises || []).forEach(ex => addExerciseRow(ex));
    if((s.exercises || []).length === 0) addExerciseRow();
    editingId = s.id;

    // scroll alla sezione create dove sta il form
    $("#admin-create-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function wire(){
    // refs
    recentWrap = $("#admin-recent-schede");
    form = $("#create-scheda-form");
    exList = $("#exercise-list");
    addBtn = $("#add-exercise");
    goCreate = $("#admin-go-create");
    goEdit = $("#admin-go-edit");
    editSelect = $("#edit-select");
    loadBtn = $("#load-scheda");
    saveBtn = $("#save-changes");
    delBtn = $("#delete-scheda");
    adminInitials = $("#admin-profile-initials");

    if(!recentWrap || !form || !exList) return;

    // iniziali admin
    renderAdminInitials();

    // default: un esercizio
    if(exList.children.length === 0) addExerciseRow();

    // CTA scroll
    goCreate?.addEventListener("click", () => {
      $("#admin-create-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });
    goEdit?.addEventListener("click", () => {
      $("#admin-edit-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });

    // add exercise
    addBtn?.addEventListener("click", () => addExerciseRow());

    // remove exercise (delegation)
    exList.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".exercise-remove");
      if(!btn) return;
      btn.closest(".exercise-row")?.remove();
    });

    // submit create (or save if editingId present)
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();

      const name = $("#scheda-name").value.trim();
      const desc = $("#scheda-desc").value.trim();
      const exercises = getExercisesFromDOM();

      if(!name){
        alert("Inserisci il nome della scheda.");
        return;
      }
      if(exercises.length === 0){
        alert("Inserisci almeno un esercizio.");
        return;
      }

      upsertScheda({ id: editingId, name, desc, exercises });

      // refresh lists
      renderRecent();
      renderEditSelect();

      alert(editingId ? "Scheda aggiornata ✅" : "Scheda creata ✅");
      resetCreateForm();
    });

    // edit select refresh
    renderEditSelect();

    loadBtn?.addEventListener("click", () => {
      const id = editSelect.value;
      if(!id) return;
      loadSchedaToForm(id);
    });

    saveBtn?.addEventListener("click", () => {
      if(!editingId){
        alert("Carica una scheda da modificare.");
        return;
      }
      // trigger submit to reuse validation
      form.requestSubmit();
    });

    delBtn?.addEventListener("click", () => {
      const id = editSelect.value;
      if(!id) return;
      if(!confirm("Eliminare questa scheda?")) return;
      deleteSchedaById(id);
      renderRecent();
      renderEditSelect();
      resetCreateForm();
    });

    // click su card recente -> carica per edit veloce
    recentWrap.addEventListener("click", (ev) => {
      const card = ev.target.closest(".admin-card");
      if(!card) return;
      loadSchedaToForm(card.dataset.id);
    });

    // initial render
    renderRecent();
  }

  function renderAdmin(){
    if(!isAdmin()) return;
    wire();
  }

  KongFit.admin = { renderAdmin };
})();
