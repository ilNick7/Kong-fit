/* Kong Fit - app.js
   - Auth flow
   - SPA views (login, home, profile, workout)
   - Home render + bottom nav scroll behaviour
*/
(function () {
  const KongFit = (window.KongFit = window.KongFit || {});
  const { getDB, setDB, ensureUser, getCurrentUser } = KongFit.state;
  const { getSession, loginWithPin, ensureAuth } = KongFit.auth;

  function $ (sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

  function hideAllViews(){
    $all("[data-view-section]").forEach(v => v.style.display = "none");
  }

  function showView(name){
    hideAllViews();
    const el = document.getElementById(`view-${name}`);
    if(el) el.style.display = "block";
    document.body.setAttribute("data-view", name);
  }

  function guard(view){
    const s = getSession();
    if(!s && view !== "login") return "login";
    return view;
  }

  function navigate(view){
    view = guard(view);
    showView(view);

    if(view === "home"){
      KongFit.home?.renderHome?.();
      return;
    }

    if(view === "profile"){
      KongFit.profile?.renderProfile?.();
      return;
    }

    if(view === "workout"){
      KongFit.workout?.renderWorkoutView?.();
      return;
    }
  }

  KongFit.app = KongFit.app || {};
  KongFit.app.navigate = navigate;

  function wireLogin(){
    const form = $("#login-form");
    const pinInput = $("#pin-input");
    const err = $("#login-error");
    if(!form || !pinInput) return;

    form.onsubmit = (ev) => {
      ev.preventDefault();
      if(err) err.textContent = "";

      const pin = (pinInput.value || "").trim();
      const res = loginWithPin(pin);

      if(!res.ok){
        if(err) err.textContent = res.reason || "PIN errato";
        pinInput.value = "";
        pinInput.focus();
        return;
      }

      pinInput.value = "";
      navigate("home");
    };
  }

  function wireProfileButton(){
    const btn = $("#profile-btn");
    if(btn){
      btn.addEventListener("click", () => navigate("profile"));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // ensure auth in db
    const db = ensureAuth(getDB());
    setDB(db);

    wireLogin();
    wireProfileButton();

    // bottom nav show/hide
    KongFit.home?.wireBottomNav?.();

    // wire profilo (close/switch/logout/calendar)
    KongFit.profile?.wireProfileUI?.();

    // start
    if(!getSession()) navigate("login");
    else navigate("home");
  });
})();
