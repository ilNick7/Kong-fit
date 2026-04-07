/* Kong Fit - templates.js
   Templates base per 2/3/4 giorni.
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});

  const TEMPLATES = {
    "tpl-2": {
      id: "tpl-2",
      name: "Full Body 2 giorni",
      days: [
        {
          id: "fb-a",
          name: "Full Body A",
          exercises: [
            { id: "squat", name: "Squat", setsTarget: 4, repsTarget: "5-8", rest: 150 },
            { id: "bench", name: "Panca piana", setsTarget: 4, repsTarget: "6-8", rest: 120 },
            { id: "row", name: "Rematore", setsTarget: 3, repsTarget: "8-10", rest: 120 },
            { id: "rdl", name: "Stacco rumeno", setsTarget: 3, repsTarget: "6-10", rest: 150 },
            { id: "curl", name: "Curl", setsTarget: 2, repsTarget: "10-12", rest: 75 }
          ]
        },
        {
          id: "fb-b",
          name: "Full Body B",
          exercises: [
            { id: "dead", name: "Stacco (tecnica/volume)", setsTarget: 3, repsTarget: "3-5", rest: 180 },
            { id: "ohp", name: "Military press", setsTarget: 4, repsTarget: "6-10", rest: 120 },
            { id: "pulldown", name: "Lat machine / trazioni", setsTarget: 4, repsTarget: "6-10", rest: 120 },
            { id: "legcurl", name: "Leg curl", setsTarget: 3, repsTarget: "10-12", rest: 90 },
            { id: "triceps", name: "Pushdown tricipiti", setsTarget: 2, repsTarget: "10-12", rest: 75 }
          ]
        }
      ]
    },

    "tpl-3": {
      id: "tpl-3",
      name: "Push / Pull / Legs (3 giorni)",
      days: [
        {
          id: "push",
          name: "Push",
          exercises: [
            { id: "bench", name: "Panca piana", setsTarget: 4, repsTarget: "6-8", rest: 120 },
            { id: "incline", name: "Panca inclinata manubri", setsTarget: 3, repsTarget: "8-10", rest: 120 },
            { id: "ohp", name: "Military press", setsTarget: 3, repsTarget: "6-10", rest: 120 },
            { id: "lateral", name: "Alzate laterali", setsTarget: 3, repsTarget: "12-15", rest: 75 },
            { id: "triceps", name: "Pushdown tricipiti", setsTarget: 3, repsTarget: "10-12", rest: 75 }
          ]
        },
        {
          id: "pull",
          name: "Pull",
          exercises: [
            { id: "pulldown", name: "Lat machine / trazioni", setsTarget: 4, repsTarget: "6-10", rest: 120 },
            { id: "row", name: "Rematore", setsTarget: 4, repsTarget: "8-10", rest: 120 },
            { id: "rear", name: "Deltoidi posteriori", setsTarget: 3, repsTarget: "12-15", rest: 75 },
            { id: "curl", name: "Curl", setsTarget: 3, repsTarget: "10-12", rest: 75 }
          ]
        },
        {
          id: "legs",
          name: "Legs",
          exercises: [
            { id: "squat", name: "Squat", setsTarget: 4, repsTarget: "5-8", rest: 150 },
            { id: "rdl", name: "Stacco rumeno", setsTarget: 3, repsTarget: "6-10", rest: 150 },
            { id: "legpress", name: "Leg press", setsTarget: 3, repsTarget: "10-12", rest: 120 },
            { id: "calf", name: "Polpacci", setsTarget: 4, repsTarget: "10-15", rest: 75 }
          ]
        }
      ]
    },

    "tpl-4": {
      id: "tpl-4",
      name: "Upper / Lower (4 giorni)",
      days: [
        {
          id: "upper-a",
          name: "Upper A",
          exercises: [
            { id: "bench", name: "Panca piana", setsTarget: 4, repsTarget: "6-8", rest: 120 },
            { id: "row", name: "Rematore", setsTarget: 4, repsTarget: "8-10", rest: 120 },
            { id: "incline", name: "Panca inclinata manubri", setsTarget: 3, repsTarget: "8-10", rest: 120 },
            { id: "pulldown", name: "Lat machine / trazioni", setsTarget: 3, repsTarget: "6-10", rest: 120 },
            { id: "triceps", name: "Tricipiti", setsTarget: 2, repsTarget: "10-12", rest: 75 },
            { id: "curl", name: "Curl", setsTarget: 2, repsTarget: "10-12", rest: 75 }
          ]
        },
        {
          id: "lower-a",
          name: "Lower A",
          exercises: [
            { id: "squat", name: "Squat", setsTarget: 4, repsTarget: "5-8", rest: 150 },
            { id: "legcurl", name: "Leg curl", setsTarget: 3, repsTarget: "10-12", rest: 90 },
            { id: "calf", name: "Polpacci", setsTarget: 4, repsTarget: "10-15", rest: 75 }
          ]
        },
        {
          id: "upper-b",
          name: "Upper B",
          exercises: [
            { id: "ohp", name: "Military press", setsTarget: 4, repsTarget: "6-10", rest: 120 },
            { id: "pulldown", name: "Lat machine / trazioni", setsTarget: 4, repsTarget: "6-10", rest: 120 },
            { id: "dbpress", name: "Panca manubri", setsTarget: 3, repsTarget: "8-10", rest: 120 },
            { id: "cableRow", name: "Row al cavo", setsTarget: 3, repsTarget: "10-12", rest: 120 },
            { id: "lateral", name: "Alzate laterali", setsTarget: 3, repsTarget: "12-15", rest: 75 }
          ]
        },
        {
          id: "lower-b",
          name: "Lower B",
          exercises: [
            { id: "rdl", name: "Stacco rumeno", setsTarget: 4, repsTarget: "6-10", rest: 150 },
            { id: "legpress", name: "Leg press", setsTarget: 3, repsTarget: "10-12", rest: 120 },
            { id: "split", name: "Affondi / Bulgarian", setsTarget: 3, repsTarget: "8-12", rest: 120 },
            { id: "calf", name: "Polpacci", setsTarget: 4, repsTarget: "10-15", rest: 75 }
          ]
        }
      ]
    }
  };

  function templateIdForDays(days) {
    if (Number(days) === 2) return "tpl-2";
    if (Number(days) === 3) return "tpl-3";
    return "tpl-4";
  }

  function getTemplate(templateId) {
    return TEMPLATES[templateId] || TEMPLATES["tpl-4"];
  }

  KongFit.templates = {
    TEMPLATES,
    templateIdForDays,
    getTemplate
  };
})();
``
