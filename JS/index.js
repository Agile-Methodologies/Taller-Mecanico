// ==========================================
// ELEMENTOS DEL DOM
// ==========================================

const header = document.querySelector(".header");
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

const loginContainer = document.querySelector(".login-container");
const perfilContainer = document.querySelector(".perfil-container");

const perfilBtn = document.querySelector(".perfil-btn");
const dropdown = document.querySelector(".dropdown");

const nombreUsuario = document.getElementById("nombre-usuario");
const enlaceCerrarSesion = document.getElementById("cerrarSesion");

const btnReservar = document.querySelector(".btn-principal");

// ==========================================
// NAVBAR SCROLL
// ==========================================

window.addEventListener("scroll", () => {

    if (window.scrollY > 60) {

        header.classList.add("scroll");

    } else {

        header.classList.remove("scroll");

    }

});

// ==========================================
// MENU RESPONSIVE
// ==========================================

menuBtn.addEventListener("click", () => {

    navLinks.classList.toggle("active");

});

// ==========================================
// VERIFICAR SESION
// ==========================================

const usuario = obtenerSesion();

if (usuario) {

    loginContainer.classList.add("oculto");

    perfilContainer.classList.remove("oculto");

    nombreUsuario.textContent = usuario.nombre;

}

// ==========================================
// DROPDOWN PERFIL
// ==========================================

if (perfilBtn) {

    perfilBtn.addEventListener("click", () => {

        dropdown.classList.toggle("mostrar");

    });

}

// ==========================================
// CERRAR DROPDOWN
// ==========================================

window.addEventListener("click", (e) => {

    if (!perfilContainer.contains(e.target)) {

        dropdown.classList.remove("mostrar");

    }

});

// ==========================================
// CERRAR SESION
// ==========================================

if (enlaceCerrarSesion) {

    enlaceCerrarSesion.addEventListener("click", (e) => {

        e.preventDefault();

        cerrarSesion();

        window.location.href = "index.html";

    });

}

// ==========================================
// RESERVAR CITA
// ==========================================

btnReservar.addEventListener("click", (e) => {

    e.preventDefault();

    if (usuario) {

        window.location.href = "reservar-cita.html";

    } else {

        window.location.href = "login.html";

    }

    
});
// ==========================================
// CERRAR MENU
// ==========================================

document.querySelectorAll(".nav-links a").forEach(link => {

    link.addEventListener("click", () => {

        navLinks.classList.remove("active");

    });

});
