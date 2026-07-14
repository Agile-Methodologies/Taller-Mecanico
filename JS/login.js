/**
 * login.js — Lógica de autenticación
 * Taller Mecánico
 */

let dbConexion = null;

document.addEventListener("DOMContentLoaded", async () => {

  // Referencias al DOM — dentro de DOMContentLoaded para que el HTML ya exista
  const formulario  = document.getElementById("formulario-login");
  const inputCorreo = document.getElementById("correo");
  const inputPass   = document.getElementById("password");
  const btnLogin    = document.getElementById("btn-login");
  const mensajeEl   = document.getElementById("mensaje");
  const togglePass  = document.getElementById("toggle-password");

  // ── Conectar base de datos ──────────────────────────────────────────────────
  try {
    dbConexion = await abrirBaseDatos();
    console.info("✔ Base de datos conectada.");
  } catch (error) {
    mostrarMensaje(mensajeEl, "No se pudo conectar a la base de datos.", "error");
    console.error(error);
  }

  document.querySelector(".tarjeta-login").classList.add("visible");

  // ── Submit del formulario ───────────────────────────────────────────────────
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email    = inputCorreo.value.trim().toLowerCase();
    const password = inputPass.value;

    if (!validarCampos(email, password, mensajeEl)) return;

    btnLogin.disabled    = true;
    btnLogin.textContent = "Verificando...";

    await iniciarSesion(email, password, mensajeEl, btnLogin);

    btnLogin.disabled    = false;
    btnLogin.textContent = "Iniciar sesión";
  });

  // ── Toggle mostrar/ocultar contraseña ───────────────────────────────────────
  togglePass.addEventListener("click", () => {
    const tipo = inputPass.type === "password" ? "text" : "password";
    inputPass.type         = tipo;
    togglePass.textContent = tipo === "password" ? "👁" : "🙈";
  });

  // ── Sacudida del formulario en error ────────────────────────────────────────
  function sacudirFormulario() {
    formulario.classList.add("sacudir");
    setTimeout(() => formulario.classList.remove("sacudir"), 500);
  }

  // ── Validación de campos ────────────────────────────────────────────────────
  function validarCampos(email, password, mensajeEl) {
    if (!email || !password) {
      mostrarMensaje(mensajeEl, "Completa todos los campos.", "error");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mostrarMensaje(mensajeEl, "Ingresa un correo electrónico válido.", "error");
      return false;
    }
    if (password.length < 4) {
      mostrarMensaje(mensajeEl, "La contraseña es demasiado corta.", "error");
      return false;
    }
    return true;
  }

  // ── Autenticación ───────────────────────────────────────────────────────────
  async function iniciarSesion(email, password, mensajeEl, btnLogin) {
    if (!dbConexion) {
      mostrarMensaje(mensajeEl, "Sin conexión a la base de datos.", "error");
      return;
    }
    try {
      const usuario = await buscarUsuarioPorEmail(dbConexion, email);

      if (!usuario) {
        mostrarMensaje(mensajeEl, "Correo no registrado en el sistema.", "error");
        sacudirFormulario();
        return;
      }
      if (usuario.password !== password) {
        mostrarMensaje(mensajeEl, "Contraseña incorrecta.", "error");
        sacudirFormulario();
        return;
      }

      // ✔ Acceso correcto
      guardarSesion(usuario);

      mostrarMensaje(
          mensajeEl,
          `Bienvenido, ${usuario.nombre} ✓`,
          "exito"
      );

      btnLogin.disabled = true;

      setTimeout(() => {
        document.querySelector(".tarjeta-login").classList.add("exito-animacion");
      }, 500);

      setTimeout(() => {

          btnLogin.disabled = false;

          mostrarMensaje(mensajeEl, "", "");

          document
              .querySelector(".tarjeta-login")
              .classList.remove("exito-animacion");

          window.location.href = "index.html";

      }, 2500);

    } catch (error) {
      mostrarMensaje(mensajeEl, "Error al consultar la base de datos.", "error");
      console.error("Error en iniciarSesion:", error);
    }
  }

});

// ── Helper global de mensajes ─────────────────────────────────────────────────
function mostrarMensaje(el, texto, tipo) {
  el.textContent = texto;
  el.className   = "mensaje " + (tipo || "");
}
