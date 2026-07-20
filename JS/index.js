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

    if(window.scrollY > 60){

        header.classList.add("scroll");

    }else{

        header.classList.remove("scroll");

    }

});


// ==========================================
// MENU RESPONSIVE
// ==========================================

if(menuBtn && navLinks){

    menuBtn.addEventListener("click", () => {

        navLinks.classList.toggle("active");

    });

}


// ==========================================
// CERRAR MENU AL SELECCIONAR OPCION
// ==========================================

document.querySelectorAll(".nav-links a").forEach(link => {

    link.addEventListener("click", () => {

        if(navLinks){

            navLinks.classList.remove("active");

        }

    });

});


// ==========================================
// VERIFICAR SESION
// ==========================================

const usuario = obtenerSesion();


if(usuario){

    if(loginContainer){

        loginContainer.classList.add("oculto");

    }


    if(perfilContainer){

        perfilContainer.classList.remove("oculto");

    }


    if(nombreUsuario){

        nombreUsuario.textContent = usuario.nombre;

    }

}


// ==========================================
// DROPDOWN PERFIL
// ==========================================

if(perfilBtn && dropdown){

    perfilBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        dropdown.classList.toggle("mostrar");

    });

}


// ==========================================
// CERRAR DROPDOWN AL HACER CLICK FUERA
// ==========================================

window.addEventListener("click", (e) => {


    if(perfilContainer && dropdown){


        if(!perfilContainer.contains(e.target)){


            dropdown.classList.remove("mostrar");


        }


    }


});


// ==========================================
// CERRAR SESION
// ==========================================

if(enlaceCerrarSesion){

    enlaceCerrarSesion.addEventListener("click", (e) => {


        e.preventDefault();


        cerrarSesion();


        window.location.href = "index.html";


    });

}


// ==========================================
// RESERVAR CITA
// ==========================================

if(btnReservar){

    btnReservar.addEventListener("click", (e) => {


        e.preventDefault();


        if(usuario){


            window.location.href = "reservar-cita.html";


        }else{


            window.location.href = "login.html";


        }


    });

}