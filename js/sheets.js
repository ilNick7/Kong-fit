/* ======================================================
   Kong Fit - sheets.js
   - Lettura schede da Google Sheets
====================================================== */

const SHEET_ID = "1p_OFtaIB4S47RfcaUfF-HQa__rQ70xleCNtj09is1hE";

const SHEETS = {
  "Petto-Spalle": "Petto-Spalle | Apr26",
  "Schiena-Tricipiti": "Schiena-Tricipiti | Apr26"
};

function getUserColumn(slug) {
  if (slug === "mattia") return "1111";
  if (slug === "amico") return "2222";
  return null;
}

async function loadSchedaFromSheet(sheetName, userSlug) {
  const column = getUserColumn(userSlug);
  if (!column) return [];

  const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const data = await res.json();

  return data.map(row => ({
    name: row["Esercizio"],
    sets: Number(row["Serie"]),
    reps: row["Ripetizioni"],
    rest: Number(row["Recupero"]),
    weight: row[column] || ""
  }));
}
