// ==========================================
// GUARDAR SESIÓN
// ==========================================

function guardarSesion(usuario) {

    localStorage.setItem(
        "usuarioActual",
        JSON.stringify(usuario)
    );

}

// ==========================================
// OBTENER USUARIO ACTUAL
// ==========================================

function obtenerSesion() {

    return JSON.parse(
        localStorage.getItem("usuarioActual")
    );

}

// ==========================================
// ¿HAY SESIÓN?
// ==========================================

function haySesion() {

    return obtenerSesion() !== null;

}

// ==========================================
// CERRAR SESIÓN
// ==========================================

function cerrarSesion() {

    localStorage.removeItem("usuarioActual");

}

// ==========================================
// VALIDAR ADMINISTRADOR
// ==========================================

function esAdministrador() {

    const usuario = obtenerSesion();

    return usuario && usuario.rol === "admin";

}