document.addEventListener("DOMContentLoaded", () => {

  // ── Guard de sesión ──────────────────────────────────────────────────────
  if (!haySesion()) {
    window.location.href = "login.html";
    return;
  }

  const usuario = obtenerSesion();

  // ── Referencias al DOM ───────────────────────────────────────────────────
  const elNombre     = document.getElementById("perfil-nombre");
  const elRol        = document.getElementById("perfil-rol");
  const elCorreo     = document.getElementById("perfil-correo");
  const elFecha      = document.getElementById("perfil-fecha");
  const elIniciales  = document.getElementById("avatar-iniciales");

  // ── Pintar datos del usuario ─────────────────────────────────────────────
  elNombre.textContent = usuario.nombre || "Usuario";
  elRol.textContent    = formatearRol(usuario.rol);
  elCorreo.textContent = usuario.email || "—";
  elFecha.textContent  = formatearFecha(usuario.createdAt);
  elIniciales.textContent = obtenerIniciales(usuario.nombre);


  // ── Helpers ──────────────────────────────────────────────────────────────
  function formatearRol(rol) {
    const mapa = { admin: "Administrador", cliente: "Cliente", mecanico: "Mecánico" };
    return mapa[rol] || rol || "—";
  }

  function formatearFecha(iso) {
    if (!iso) return "—";
    const fecha = new Date(iso);
    if (isNaN(fecha)) return "—";
    return fecha.toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric" });
  }

  function obtenerIniciales(nombre) {
    if (!nombre) return "?";
    const partes = nombre.trim().split(/\s+/);
    const iniciales = partes.slice(0, 2).map(p => p[0].toUpperCase()).join("");
    return iniciales || "?";
  }

});