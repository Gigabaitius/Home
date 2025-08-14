(function(){
  const USERS = {
    "Никося": "Никося123",
    "Славик": "Славик123"
  };

  function getStoredUser(){
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  }

  function isValidUser(u){
    if(!u || !u.name) return false;
    return USERS[u.name] !== undefined;
  }

  function signIn(login, password){
    if (USERS[login] && USERS[login] === password){
      localStorage.setItem("user", JSON.stringify({ name: login }));
      location.replace("home.html");
      return true;
    }
    return false;
  }

  function signOut(){
    localStorage.removeItem("user");
    location.replace("index.html");
  }

  // Expose
  window.Auth = { getStoredUser, isValidUser, signIn, signOut };

  // Index page logic
  document.addEventListener("DOMContentLoaded", () => {
    const onIndex = location.pathname.endsWith("index.html") || location.pathname.endsWith("/");
    if (onIndex){
      const u = getStoredUser();
      if (isValidUser(u)) {
        // уже вошёл — переходим в приложение
        location.replace("home.html");
        return;
      }
      const form = document.getElementById("loginForm");
      if (!form) return;
      const err = document.getElementById("authError");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const login = document.getElementById("login").value.trim();
        const pass = document.getElementById("password").value;
        if (!signIn(login, pass)){
          err.textContent = "Неверный логин или пароль";
        }
      });
    }
  });
})();
