
function inicializarHeaderComun() {

  const header          = document.querySelector(".header");
  const menuBtn         = document.querySelector(".menu-btn");
  const navLinks        = document.querySelector(".nav-links");

  const loginContainer  = document.querySelector(".login-container");
  const perfilContainer = document.querySelector(".perfil-container");
  const perfilBtn       = document.querySelector(".perfil-btn");
  const dropdown         = document.querySelector(".dropdown");

  const nombreUsuarioEl  = document.getElementById("nombre-usuario");
  const enlaceCerrarSesion = document.getElementById("cerrarSesion"); 

  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("scroll", window.scrollY > 60);
    });
  }

  // ── Menú responsive ─────────────────────────────────────────────────────
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => navLinks.classList.toggle("active"));

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => navLinks.classList.remove("active"));
    });
  }

  // ── Estado de sesión (mostrar perfil vs. iniciar sesión) ────────────────
  const usuario = obtenerSesion();

  if (usuario && loginContainer && perfilContainer) {
    loginContainer.classList.add("oculto");
    perfilContainer.classList.remove("oculto");
    if (nombreUsuarioEl) nombreUsuarioEl.textContent = usuario.nombre;
  }

  // ── Dropdown de perfil ───────────────────────────────────────────────────
  if (perfilBtn && dropdown) {
    perfilBtn.addEventListener("click", () => dropdown.classList.toggle("mostrar"));

    window.addEventListener("click", (e) => {
      if (perfilContainer && !perfilContainer.contains(e.target)) {
        dropdown.classList.remove("mostrar");
      }
    });
  }

  // ── Cerrar sesión ─────────────────────────────────────────────────────────
  if (enlaceCerrarSesion) {
    enlaceCerrarSesion.addEventListener("click", (e) => {
      e.preventDefault();
      cerrarSesion(); // función de auth.js — ya sin colisión de nombres
      window.location.href = "index.html";
    });
  }

  return { usuario };
}

document.addEventListener("DOMContentLoaded", inicializarHeaderComun);