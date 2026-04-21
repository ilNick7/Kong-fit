/* ======================================================
   Kong Fit - sheets.js
   - Config Google Sheets
   - Lettura schede da fogli Google
   - Mapping utenti (1111 / 2222)
====================================================== */

/* ===============================
   CONFIG
=============================== */

// ID del file Google Sheets (uguale per tutte le tab)
const SHEET_ID = "1p_OFtaIB4S47RfcaUfF-HQa__rQ70xleCNtj09is1hE";

// Elenco schede disponibili (1 scheda = 1 tab)
const GOOGLE_SCHEDE = [
  {
    id: "petto",
    label: "Petto-Spalle",
    sheet: "Petto-Spalle | Apr26"
  },
  {
    id: "schiena",
    label: "Schiena-Tricipiti",
    sheet: "Schiena-Tricipiti | Apr26"
  }
];

/* ===============================
   UTILITY
=============================== */

// Mappa slug utente -> colonna foglio
function getUserColumn(slug) {
  if (slug === "mattia") return "1111";
  if (slug === "amico") return "2222";
  return null;
}

/* ===============================
   LOAD SCHEDA
=============================== */

async function loadSchedaFromSheet(sheetName, userSlug) {
  const column = getUserColumn(userSlug);
  if (!column) {
    console.warn("Utente non supportato:", userSlug);
    return [];
  }

  const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(sheetName)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Errore fetch sheet");

    const data = await res.json();

    // Normalizzazione dati
    return data.map(row => ({
      name: row["Esercizio"] || "",
      sets: Number(row["Serie"]) || 0,
      reps: row["Ripetizioni"] || "",
      rest: Number(row["Recupero"]) || 0,
      weight: row[column] || ""
    }));
  } catch (err) {
    console.error("Errore caricamento scheda:", err);
    return [];
  }
}

/* ===============================
   EXPORT GLOBALI
=============================== */

// Espone in window per uso negli altri file
window.GOOGLE_SCHEDE = GOOGLE_SCHEDE;
window.loadSchedaFromSheet = loadSchedaFromSheet;
