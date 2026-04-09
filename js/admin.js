/* ======================================================
   Kong Fit - admin.js (UPDATED)
   - Admin pulita con modalità: clean / create / edit
   - Click card recenti -> modal dettaglio "lista spesa"
   - Crea scheda con esercizi infiniti
   - Modifica: seleziona -> carica -> salva / elimina
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  // ---------- helpers ----------
  const uid = () => "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const nowISO = () => new Date().toISOString();
  const $ = (q) => document.querySelector(q);

  function ensureSchede(db){
    db.schede ||= [];
    return db;
  }

  function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function isAdmin(){
    const s = getSession();
    return !!s && s.slug === "admin";
  }

  // ---------- DOM refs ----------
  let root;
  let recentWrap, goCreate, goEdit;
  let createSection, editSection;
  let backCreate, backEdit;

  let form, exList, addBtn;
  let editSelect, loadBtn, saveBtn, delBtn;

  // modal
  let modal, modalTitle, modalDesc, modalExercises, modalClose, modalOk, modalEdit;

  // editing state
  let editingId = null;          // id scheda in editing nel form
  let modalSchedaId = null;      // id scheda mostrata nel modal

  // ---------- mode switching ----------
  function setMode(mode){
    if(!root) return;
    root.dataset.mode = mode; // clean | create | edit

    // scroll top del contenuto bianco quando cambi sezione
    root.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  // ---------- exercises form ----------
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

  function addExerciseRow(prefill){
    const idx = exList.querySelectorAll(".exercise-row").length;
    exList.insertAdjacentHTML("beforeend", exerciseRowHTML(idx, prefill));
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

  function resetCreateForm(){
    $("#scheda-name").value = "";
    $("#scheda-desc").value = "";
    exList.innerHTML = "";
    addExerciseRow();
    editingId = null;
  }

  // ---------- storage CRUD ----------
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

  function getSchedeSorted(){
    const db = ensureSchede(getDB());
    return [...db.schede].sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));
  }

  // ---------- render recent + select ----------
  function renderRecent(){
    if(!recentWrap) return;
    const schede = getSchedeSorted();

    if(schede.length === 0){
      recentWrap.innerHTML = `<p class="muted">Nessuna scheda creata.</p>`;
      return;
    }

    // mostriamo le prime 6 (resta grid 2 colonne)
    recentWrap.innerHTML = schede.slice(0,6).map(s => `
      <div class="admin-card" data-id="${s.id}" role="button" tabindex="0">
        ${escapeHtml(s.name)}
      </div>
    `).join("");
  }

  function renderEditSelect(){
    if(!editSelect) return;
    const schede = getSchedeSorted();

    if(schede.length === 0){
      editSelect.innerHTML = `<option value="">Nessuna scheda</option>`;
      return;
    }

    editSelect.innerHTML = schede.map(s => `
      <option value="${s.id}">${escapeHtml(s.name)}</option>
    `).join("");
  }

  // ---------- load to form ----------
  function loadSchedaToForm(id){
    const schede = getSchedeSorted();
    const s = schede.find(x => x.id === id);
    if(!s) return;

    $("#scheda-name").value = s.name || "";
    $("#scheda-desc").value = s.desc || "";
    exList.innerHTML = "";
    (s.exercises || []).forEach(ex => addExerciseRow(ex));
    if((s.exercises || []).length === 0) addExerciseRow();
    editingId = s.id;
  }

  // ---------- modal details ----------
  function openModalForScheda(id){
    const schede = getSchedeSorted();
    const s = schede.find(x => x.id === id);
    if(!s) return;

    modalSchedaId = s.id;

    modalTitle.textContent = s.name || "Scheda";
    modalDesc.textContent = s.desc || "";

    modalExercises.innerHTML = (s.exercises || []).map(ex => `
      <div class="modal-item">
        <div class="title">${escapeHtml(ex.name)}</div>
        <div class="meta">
          Gruppo: <strong>${escapeHtml(ex.group || "-")}</strong><br/>
          Serie: <strong>${ex.sets || 0}</strong> • Reps: <strong>${escapeHtml(ex.reps || "-")}</strong><br/>
          Recupero: <strong>${ex.rest || 0}</strong> sec
        </div>
      </div>
    `).join("");

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(){
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    modalSchedaId = null;
  }

  // ---------- wiring ----------
  function wire(){
    root = $("#admin-root");
    if(!root) return;

    recentWrap = $("#admin-recent-schede");
    goCreate = $("#admin-go-create");
    goEdit = $("#admin-go-edit");

    createSection = $("#admin-create-section");
    editSection = $("#admin-edit-section");

    backCreate = $("#admin-back-from-create");
    backEdit = $("#admin-back-from-edit");

    form = $("#create-scheda-form");
    exList = $("#exercise-list");
    addBtn = $("#add-exercise");

    editSelect = $("#edit-select");
    loadBtn = $("#load-scheda");
    saveBtn = $("#save-changes");
    delBtn = $("#delete-scheda");

    // modal
    modal = $("#scheda-modal");
    modalTitle = $("#modal-title");
    modalDesc = $("#modal-desc");
    modalExercises = $("#modal-exercises");
    modalClose = $("#modal-close");
    modalOk = $("#modal-ok");
    modalEdit = $("#modal-edit");

    // default mode
    setMode("clean");

    // inizializza form con 1 esercizio
    if(exList && exList.children.length === 0) addExerciseRow();

    // render lists
    renderRecent();
    renderEditSelect();

    // --- CTA pulite ---
    goCreate?.addEventListener("click", () => {
      resetCreateForm();
      setMode("create");
      $("#admin-create-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });

    goEdit?.addEventListener("click", () => {
      setMode("edit");
      renderEditSelect();
      $("#admin-edit-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });

    backCreate?.addEventListener("click", () => setMode("clean"));
    backEdit?.addEventListener("click", () => setMode("clean"));

    // add exercise
    addBtn?.addEventListener("click", () => addExerciseRow());

    // remove exercise (delegation)
    exList?.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".exercise-remove");
      if(!btn) return;
      btn.closest(".exercise-row")?.remove();
    });

    // submit create/save
    form?.addEventListener("submit", (ev) => {
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

      renderRecent();
      renderEditSelect();

      alert(editingId ? "Scheda aggiornata ✅" : "Scheda creata ✅");
      resetCreateForm();
      setMode("clean");
    });

    // edit actions
    loadBtn?.addEventListener("click", () => {
      const id = editSelect.value;
      if(!id) return;
      loadSchedaToForm(id);
      // carichiamo nel form Crea e portiamo in create (che fa anche save)
      setMode("create");
      $("#admin-create-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });

    saveBtn?.addEventListener("click", () => {
      if(!editingId){
        alert("Carica una scheda da modificare, oppure clicca una card recente e premi Modifica.");
        return;
      }
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
      setMode("clean");
    });

    // click su card recenti -> APRI DETTAGLIO (come richiesto)
    recentWrap?.addEventListener("click", (ev) => {
      const card = ev.target.closest(".admin-card");
      if(!card) return;
      openModalForScheda(card.dataset.id);
    });

    // modal close
    modalClose?.addEventListener("click", closeModal);
    modalOk?.addEventListener("click", closeModal);

    // modal edit -> vai in edit e carica scheda nel form
    modalEdit?.addEventListener("click", () => {
      if(!modalSchedaId) return;
      closeModal();
      loadSchedaToForm(modalSchedaId);
      setMode("create"); // riuso form unico per edit
      $("#admin-create-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });

    // click fuori modal -> chiudi
    modal?.addEventListener("click", (ev) => {
      if(ev.target === modal) closeModal();
    });
  }

  function renderAdmin(){
    if(!isAdmin()) return;
    wire();
  }

  KongFit.admin = { renderAdmin };
})();
