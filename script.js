window.onload = function () {
  setTimeout(() => {
    const loader = document.querySelector('.loader');
    const loginForm = document.querySelector('.login-container');
    if (loader) loader.classList.add('hidden');
    if (loginForm) loginForm.classList.remove('hidden');
  }, 2000);
};

function login() {
  const loginInput = document.getElementById('login').value.trim();
  const passwordInput = document.getElementById('password').value.trim();
  const error = document.getElementById('error');

  const users = {
    "Никося": "Никося123",
    "Славик": "Славик123"
  };

  if (users[loginInput] === passwordInput) {
    localStorage.setItem("user", loginInput);
    window.location.href = "home.html"; // ← переход на следующую страницу
  } else {
    error.textContent = "Неверный логин или пароль";
  }
}
