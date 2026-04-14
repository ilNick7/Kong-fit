/* ======================================================
   Kong Fit - admin.js (COMPLETO)
   - Modalità admin: clean / create / edit
   - Schede recenti ordinate per updatedAt desc
   - Crea scheda con esercizi infiniti
   - Modifica / elimina scheda
   - Modal dettaglio "lista spesa"
   - Imposta scheda attiva -> db.activeSchedaId
====================================================== */
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB } = KongFit.state;
  const { getSession } = KongFit.auth;

  // ---------- helpers ----------
  const $ = (q) => document.querySelector(q);
  const uid = () => "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const nowISO = () => new Date().toISOString();

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function ensureSchede(db) {
    db.schede ||= [];
    return db;
  }

  function isAdmin() {
    const s = getSession();
    return !!s && s.slug === "admin";
  }

  function getSchedeSorted() {
    const db = ensureSchede(getDB());
    return [...db.schede].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }

  function setActiveScheda(id) {
    const db = ensureSchede(getDB());
    db.activeSchedaId = id;
    setDB(db);
  }

  // ---------- DOM refs ----------
  let root;
  let recentWrap, goCreate, goEdit;
  let createSection, editSection;
  let backCreate, backEdit;

  let form, exList, addBtn;
  let editSelect, loadBtn, saveBtn, delBtn;

  // modal
  let modal, modalTitle, modalDesc, modalExercises;
  let modalClose, modalOk, modalEdit, modalSetActive;

  // state
  let editingId = null;     // id scheda caricata nel form
  let modalSchedaId = null; // id scheda mostrata nel modal

  // ---------- mode switching ----------
  function setMode(mode) {
    if (!root) return;
    root.dataset.mode = mode; // clean | create | edit
    root.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  // ---------- exercise rows ----------
  function exerciseRowHTML(index, data = {}) {
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

  function addExerciseRow(prefill) {
    const idx = exList.querySelectorAll(".exercise-row").length;
    exList.insertAdjacentHTML("beforeend", exerciseRowHTML(idx, prefill));
  }

  function getExercisesFromDOM() {
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

  function resetCreateForm() {
    $("#scheda-name").value = "";
    $("#scheda-desc").value = "";
    exList.innerHTML = "";
    addExerciseRow(); // almeno 1 esercizio
    editingId = null;
  }

  // ---------- CRUD schede ----------
  function upsertScheda({ id, name, desc, exercises }) {
    const db = ensureSchede(getDB());
    const now = nowISO();

    if (id) {
      const s = db.schede.find(x => x.id === id);
      if (!s) return;
      s.name = name;
      s.desc = desc;
      s.exercises = exercises;
      s.updatedAt = now;
    } else {
      const newId = uid();
      db.schede.unshift({
        id: newId,
        name,
        desc,
        exercises,
        createdAt: now,
        updatedAt: now
      });

      // se non esiste una scheda attiva, imposta la prima creata
      if (!db.activeSchedaId) db.activeSchedaId = newId;
    }

    setDB(db);
  }

  function deleteSchedaById(id) {
    const db = ensureSchede(getDB());
    db.schede = db.schede.filter(x => x.id !== id);

    // se stai eliminando la scheda attiva, fallback sulla prima rimasta
    if (db.activeSchedaId === id) {
      db.activeSchedaId = db.schede[0]?.id || null;
    }

    setDB(db);
  }

  // ---------- render recent + select ----------
  function renderRecent() {
    if (!recentWrap) return;
    const schede = getSchedeSorted();
    const db = ensureSchede(getDB());
    const activeId = db.activeSchedaId;

    if (schede.length === 0) {
      recentWrap.innerHTML = `<p class="muted">Nessuna scheda creata.</p>`;
      return;
    }

    recentWrap.innerHTML = schede.slice(0, 6).map(s => {
      const isActive = s.id === activeId;
      return `
        <div class="admin-card" data-id="${s.id}" role="button" tabindex="0"
             style="${isActive ? "outline:2px solid #6aff7a;" : ""}">
          ${escapeHtml(s.name)}${isActive ? " ✓" : ""}
        </div>
      `;
    }).join("");
  }

  function renderEditSelect() {
    if (!editSelect) return;
    const schede = getSchedeSorted();

    if (schede.length === 0) {
      editSelect.innerHTML = `<option value="">Nessuna scheda</option>`;
      return;
    }

    editSelect.innerHTML = schede.map(s => `
      <option value="${s.id}">${escapeHtml(s.name)}</option>
    `).join("");
  }

  function loadSchedaToForm(id) {
    const schede = getSchedeSorted();
    const s = schede.find(x => x.id === id);
    if (!s) return;

    $("#scheda-name").value = s.name || "";
    $("#scheda-desc").value = s.desc || "";
    exList.innerHTML = "";
    (s.exercises || []).forEach(ex => addExerciseRow(ex));
    if ((s.exercises || []).length === 0) addExerciseRow();
    editingId = s.id;
  }

  // ---------- modal details ----------
  function openModalForScheda(id) {
    const schede = getSchedeSorted();
    const s = schede.find(x => x.id === id);
    if (!s) return;

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

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    modalSchedaId = null;
  }

  // ---------- wiring ----------
  function wire() {
    root = $("#admin-root");
    if (!root) return;

    // refs
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
    saveBtn = $("#save-changes"); // opzionale se nel tuo HTML esiste ancora
    delBtn = $("#delete-scheda");

    // modal
    modal = $("#scheda-modal");
    modalTitle = $("#modal-title");
    modalDesc = $("#modal-desc");
    modalExercises = $("#modal-exercises");
    modalClose = $("#modal-close");
    modalOk = $("#modal-ok");
    modalEdit = $("#modal-edit");
    modalSetActive = $("#modal-set-active");

    // default mode
    setMode("clean");

    // init form
    if (exList && exList.children.length === 0) addExerciseRow();

    // render lists
    renderRecent();
    renderEditSelect();

    // CTA mode
    goCreate?.addEventListener("click", () => {
      resetCreateForm();
      setMode("create");
      createSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    goEdit?.addEventListener("click", () => {
      setMode("edit");
      renderEditSelect();
      editSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    backCreate?.addEventListener("click", () => setMode("clean"));
    backEdit?.addEventListener("click", () => setMode("clean"));

    // add/remove exercise
    addBtn?.addEventListener("click", () => addExerciseRow());

    exList?.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".exercise-remove");
      if (!btn) return;
      btn.closest(".exercise-row")?.remove();
    });

    // create/save (stesso form)
    form?.addEventListener("submit", (ev) => {
      ev.preventDefault();

      const name = $("#scheda-name").value.trim();
      const desc = $("#scheda-desc").value.trim();
      const exercises = getExercisesFromDOM();

      if (!name) {
        alert("Inserisci il nome della scheda.");
        return;
      }
      if (exercises.length === 0) {
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
      if (!id) return;
      loadSchedaToForm(id);

      // riuso form unico in modalità create
      setMode("create");
      createSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // se nel tuo HTML non c'è più save-changes, non succede nulla
    saveBtn?.addEventListener("click", () => {
      if (!editingId) {
        alert("Carica una scheda da modificare.");
        return;
      }
      form.requestSubmit();
    });

    delBtn?.addEventListener("click", () => {
      const id = editSelect.value;
      if (!id) return;
      if (!confirm("Eliminare questa scheda?")) return;

      deleteSchedaById(id);
      renderRecent();
      renderEditSelect();
      resetCreateForm();
      setMode("clean");
    });

    // click card recente -> modal dettaglio
    recentWrap?.addEventListener("click", (ev) => {
      const card = ev.target.closest(".admin-card");
      if (!card) return;
      openModalForScheda(card.dataset.id);
    });

    // modal buttons
    modalClose?.addEventListener("click", closeModal);
    modalOk?.addEventListener("click", closeModal);

    modalEdit?.addEventListener("click", () => {
      if (!modalSchedaId) return;
      closeModal();
      loadSchedaToForm(modalSchedaId);
      setMode("create");
      createSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    modalSetActive?.addEventListener("click", () => {
      if (!modalSchedaId) return;
      setActiveScheda(modalSchedaId);
      renderRecent();
      alert("Scheda impostata come attiva ✅");
      closeModal();
    });

    // click fuori modal -> chiudi
    modal?.addEventListener("click", (ev) => {
      if (ev.target === modal) closeModal();
    });
  }

  function renderAdmin() {
    if (!isAdmin()) return;
    wire();
  }

  KongFit.admin = { renderAdmin };
})();
