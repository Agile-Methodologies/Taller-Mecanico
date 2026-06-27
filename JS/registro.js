/**
 * registro.js — Lógica de registro de cliente
 * Taller Mecánico
 *
 * Todo registro público crea un usuario con rol "cliente" fijo.
 * Los roles "mecanico" / "admin" los crea el administrador desde su panel.
 */

let dbConexion = null;

document.addEventListener("DOMContentLoaded", async () => {

  // ── Referencias al DOM ──────────────────────────────────────────────────────
  const formulario        = document.getElementById("formulario-registro");
  const inputNombre        = document.getElementById("nombre");
  const inputTelefono      = document.getElementById("telefono");
  const inputEmail         = document.getElementById("email");
  const inputPass          = document.getElementById("password");
  const inputConfirmarPass = document.getElementById("confirmar-password");
  const btnRegistro        = document.getElementById("btn-registro");
  const mensajeEl          = document.getElementById("mensaje");
  const togglePass         = document.getElementById("toggle-password");
  const toggleConfirmarPass = document.getElementById("toggle-confirmar-password");

  const reqLongitud = document.getElementById("req-longitud");
  const reqNumero   = document.getElementById("req-numero");

  // ── Conectar base de datos ──────────────────────────────────────────────────
  try {
    dbConexion = await abrirBaseDatos();
    console.info("✔ Base de datos conectada (registro.html).");
  } catch (error) {
    mostrarMensaje(mensajeEl, "No se pudo conectar a la base de datos.", "error");
    btnRegistro.disabled = true;
    console.error(error);
  }

  document.querySelector(".tarjeta-login").classList.add("visible");

  // ── Toggle mostrar/ocultar contraseña (ambos campos) ────────────────────────
  togglePass.addEventListener("click", () => {
    const tipo = inputPass.type === "password" ? "text" : "password";
    inputPass.type         = tipo;
    togglePass.textContent = tipo === "password" ? "👁" : "🙈";
  });

  toggleConfirmarPass.addEventListener("click", () => {
    const tipo = inputConfirmarPass.type === "password" ? "text" : "password";
    inputConfirmarPass.type         = tipo;
    toggleConfirmarPass.textContent = tipo === "password" ? "👁" : "🙈";
  });

  // ── Feedback visual de requisitos de contraseña mientras se escribe ────────
  inputPass.addEventListener("input", () => {
    const valor = inputPass.value;
    reqLongitud.classList.toggle("cumplido", valor.length >= 8);
    reqNumero.classList.toggle("cumplido", /\d/.test(valor));
  });

  // ── Sacudida del formulario en error ────────────────────────────────────────
  function sacudirFormulario() {
    formulario.classList.add("sacudir");
    setTimeout(() => formulario.classList.remove("sacudir"), 500);
  }

  // ── Submit del formulario ───────────────────────────────────────────────────
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nombre   = inputNombre.value.trim();
    const telefono = inputTelefono.value.trim();
    const email    = inputEmail.value.trim().toLowerCase();
    const password = inputPass.value;
    const confirmarPassword = inputConfirmarPass.value;

    if (!validarCampos(nombre, telefono, email, password, confirmarPassword, mensajeEl)) {
      sacudirFormulario();
      return;
    }

    btnRegistro.disabled    = true;
    btnRegistro.textContent = "Creando cuenta...";

    await registrarUsuario(nombre, telefono, email, password, mensajeEl);

    btnRegistro.disabled    = false;
    btnRegistro.textContent = "Registrarme";
  });

  // ── Validación de campos ────────────────────────────────────────────────────
  function validarCampos(nombre, telefono, email, password, confirmarPassword, mensajeEl) {
    if (!nombre || !telefono || !email || !password || !confirmarPassword) {
      mostrarMensaje(mensajeEl, "Completa todos los campos.", "error");
      return false;
    }
    if (nombre.length < 3) {
      mostrarMensaje(mensajeEl, "El nombre debe tener al menos 3 caracteres.", "error");
      return false;
    }
    if (!/^[0-9\-\s]{8,}$/.test(telefono)) {
      mostrarMensaje(mensajeEl, "Ingresa un teléfono válido (mínimo 8 dígitos).", "error");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mostrarMensaje(mensajeEl, "Ingresa un correo electrónico válido.", "error");
      return false;
    }
    if (password.length < 8) {
      mostrarMensaje(mensajeEl, "La contraseña debe tener al menos 8 caracteres.", "error");
      return false;
    }
    if (!/\d/.test(password)) {
      mostrarMensaje(mensajeEl, "La contraseña debe incluir al menos un número.", "error");
      return false;
    }
    if (password !== confirmarPassword) {
      mostrarMensaje(mensajeEl, "Las contraseñas no coinciden.", "error");
      return false;
    }
    return true;
  }

  // ── Registro del usuario en IndexedDB ───────────────────────────────────────
  async function registrarUsuario(nombre, telefono, email, password, mensajeEl) {
    if (!dbConexion) {
      mostrarMensaje(mensajeEl, "Sin conexión a la base de datos.", "error");
      return;
    }
    try {
      // Verificar que el correo no esté ya registrado
      const usuarioExistente = await buscarUsuarioPorEmail(dbConexion, email);
      if (usuarioExistente) {
        mostrarMensaje(mensajeEl, "Ese correo ya está registrado.", "error");
        sacudirFormulario();
        return;
      }

      const nuevoUsuario = {
        id: generarId("u"),
        nombre: nombre,
        email: email,
        telefono: telefono, // Campo adicional al esquema base; IndexedDB no exige esquema fijo.
        password: password, // En producción: nunca texto plano, se hashea (bcrypt, etc.) en el backend.
        rol: "cliente",      // Todo registro público crea un cliente; mecánico/admin los crea el administrador.
        createdAt: new Date().toISOString(),
      };

      await guardar(dbConexion, "usuarios", nuevoUsuario);

      mostrarMensaje(mensajeEl, `Cuenta creada, ${nuevoUsuario.nombre} ✓`, "exito");

      setTimeout(() => {
        document.querySelector(".tarjeta-login").classList.add("exito-animacion");
      }, 300);

      // Tal como pediste: tras registrarse, vuelve a login.html para iniciar sesión.
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1600);

    } catch (error) {
      mostrarMensaje(mensajeEl, "Error al crear la cuenta. Intenta de nuevo.", "error");
      console.error("Error en registrarUsuario:", error);
    }
  }

});

// ── Helper global de mensajes (mismo patrón que login.js) ────────────────────
function mostrarMensaje(el, texto, tipo) {
  el.textContent = texto;
  el.className   = "mensaje " + (tipo || "");
}