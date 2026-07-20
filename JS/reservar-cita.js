/**
 * reservar-cita.js — Wizard de reserva de citas
 * Taller Mecánico
 *
 * Flujo: 1) Vehículo  2) Servicio  3) Fecha y hora  4) Confirmar
 * Guarda el registro final en el almacén "citas" de IndexedDB.
 */

// Horario de atención: Lunes a Viernes, 8:00 a.m. – 6:00 p.m. (última cita 17:00)
const HORAS_DISPONIBLES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const DIAS_HABILES = [1, 2, 3, 4, 5]; // 0=domingo ... 6=sábado

let dbConexion  = null;
let usuarioActual = null;

let vehiculos = [];
let servicios = [];
let citasDelDia = []; // citas ya existentes para la fecha seleccionada

let pasoActual = 1;
const TOTAL_PASOS = 4;

const seleccion = {
  vehiculoId: null,
  servicioId: null,
  fecha: null, // "YYYY-MM-DD"
  hora: null,  // "HH:MM"
};

document.addEventListener("DOMContentLoaded", async () => {

  // ── Guard de sesión ──────────────────────────────────────────────────────
  if (!haySesion()) {
    window.location.href = "login.html";
    return;
  }
  usuarioActual = obtenerSesion();

  // ── Referencias al DOM ───────────────────────────────────────────────────
  const estadoSinVehiculosEl = document.getElementById("estado-sin-vehiculos");
  const formulario            = document.getElementById("formulario-reserva");

  const gridVehiculosEl = document.getElementById("grid-vehiculos");
  const gridServiciosEl = document.getElementById("grid-servicios");

  const campoFecha         = document.getElementById("campo-fecha");
  const contenedorHorarios = document.getElementById("contenedor-horarios");
  const gridHorariosEl     = document.getElementById("grid-horarios");
  const mensajeHorariosEl  = document.getElementById("mensaje-horarios");

  const campoNotas   = document.getElementById("campo-notas");
  const resumenEl    = document.getElementById("resumen-reserva");
  const mensajeFormEl = document.getElementById("mensaje-form");

  const btnAtras      = document.getElementById("btn-atras");
  const btnSiguiente  = document.getElementById("btn-siguiente");
  const btnConfirmar  = document.getElementById("btn-confirmar");

  const pantallaExitoEl = document.getElementById("pantalla-exito");
  const textoExitoEl    = document.getElementById("texto-exito");

  const mensajeFlotanteEl = document.getElementById("mensaje");

  // ── Fecha mínima seleccionable: hoy ──────────────────────────────────────
  campoFecha.min = formatearFechaISO(new Date());

  // ── Conectar base de datos y cargar datos base ───────────────────────────
  try {
    dbConexion = await abrirBaseDatos();

    vehiculos = await obtenerPorIndice(dbConexion, "vehiculos", "usuarioId", usuarioActual.id);
    servicios = await obtenerTodos(dbConexion, "servicios");

    if (!vehiculos || vehiculos.length === 0) {
      estadoSinVehiculosEl.hidden = false;
      formulario.hidden = true;
      document.getElementById("pasos").hidden = true;
      return;
    }

    formulario.hidden = false;
    renderizarVehiculos();
    renderizarServicios();

  } catch (error) {
    mostrarMensajeFlotante("No se pudo conectar a la base de datos.", "error");
    console.error(error);
    return;
  }

  // ══════════════════════════════════════════════════════════════════════
  // PASO 1 — Vehículo
  // ══════════════════════════════════════════════════════════════════════

  function renderizarVehiculos() {
    gridVehiculosEl.innerHTML = "";
    vehiculos.forEach(v => {
      const tarjeta = document.createElement("button");
      tarjeta.type = "button";
      tarjeta.className = "tarjeta-seleccionable";
      tarjeta.dataset.id = v.id;
      tarjeta.innerHTML = `
        <div class="tarjeta-seleccionable-cabecera">
          <h3>${escaparHTML(v.marca)} ${escaparHTML(v.modelo)}</h3>
          <span class="check"><i class="fa-solid fa-check"></i></span>
        </div>
        <p>${escaparHTML(v.placa)} · ${escaparHTML(v.color)}</p>
        <div class="meta"><span><i class="fa-solid fa-gauge"></i> ${formatearNumero(v.kilometraje)} km</span></div>
      `;
      tarjeta.addEventListener("click", () => {
        seleccion.vehiculoId = v.id;
        gridVehiculosEl.querySelectorAll(".tarjeta-seleccionable")
          .forEach(el => el.classList.toggle("seleccionada", el === tarjeta));
        actualizarBotonSiguiente();
      });
      gridVehiculosEl.appendChild(tarjeta);
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // PASO 2 — Servicio
  // ══════════════════════════════════════════════════════════════════════

  function renderizarServicios() {
    gridServiciosEl.innerHTML = "";

    if (!servicios || servicios.length === 0) {
      gridServiciosEl.innerHTML = `<p class="ayuda-campo">No hay servicios disponibles por el momento.</p>`;
      return;
    }

    servicios.forEach(s => {
      const tarjeta = document.createElement("button");
      tarjeta.type = "button";
      tarjeta.className = "tarjeta-seleccionable";
      tarjeta.dataset.id = s.id;
      tarjeta.innerHTML = `
        <div class="tarjeta-seleccionable-cabecera">
          <h3>${escaparHTML(s.nombre)}</h3>
          <span class="check"><i class="fa-solid fa-check"></i></span>
        </div>
        <p>${escaparHTML(s.descripcion || "")}</p>
        <div class="meta">
          <span><i class="fa-solid fa-clock"></i> ${s.duracionMinutos || 30} min</span>
          ${s.precio ? `<span><i class="fa-solid fa-tag"></i> ₡${formatearNumero(s.precio)}</span>` : ""}
        </div>
      `;
      tarjeta.addEventListener("click", () => {
        seleccion.servicioId = s.id;
        gridServiciosEl.querySelectorAll(".tarjeta-seleccionable")
          .forEach(el => el.classList.toggle("seleccionada", el === tarjeta));
        actualizarBotonSiguiente();
      });
      gridServiciosEl.appendChild(tarjeta);
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // PASO 3 — Fecha y hora
  // ══════════════════════════════════════════════════════════════════════

  campoFecha.addEventListener("change", async () => {
    seleccion.hora = null;
    contenedorHorarios.hidden = true;

    const valor = campoFecha.value;
    if (!valor) return;

    const fecha = new Date(valor + "T00:00:00");
    if (!DIAS_HABILES.includes(fecha.getDay())) {
      mensajeHorariosEl.textContent = "El taller no atiende ese día. Elige de lunes a viernes.";
      contenedorHorarios.hidden = false;
      gridHorariosEl.innerHTML = "";
      seleccion.fecha = null;
      actualizarBotonSiguiente();
      return;
    }

    seleccion.fecha = valor;

    try {
      citasDelDia = await obtenerTodos(dbConexion, "citas");
      citasDelDia = citasDelDia.filter(c =>
        c.estado !== "cancelada" &&
        String(c.fecha).slice(0, 10) === valor
      );
    } catch (error) {
      citasDelDia = [];
      console.error("No se pudieron cargar las citas del día:", error);
    }

    renderizarHorarios();
    contenedorHorarios.hidden = false;
    actualizarBotonSiguiente();
  });

  function renderizarHorarios() {
    gridHorariosEl.innerHTML = "";
    mensajeHorariosEl.textContent = "";

    const ahora    = new Date();
    const esHoy    = seleccion.fecha === formatearFechaISO(ahora);
    let disponibles = 0;

    HORAS_DISPONIBLES.forEach(hora => {
      const ocupado = citasDelDia.some(c => String(c.fecha).slice(11, 16) === hora);

      const [h, m] = hora.split(":").map(Number);
      const horaPasada = esHoy && (h < ahora.getHours() || (h === ahora.getHours() && m <= ahora.getMinutes()));

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-horario";
      btn.textContent = hora;
      btn.disabled = ocupado || horaPasada;
      if (!btn.disabled) disponibles++;

      btn.addEventListener("click", () => {
        seleccion.hora = hora;
        gridHorariosEl.querySelectorAll(".btn-horario")
          .forEach(el => el.classList.toggle("seleccionado", el === btn));
        actualizarBotonSiguiente();
      });

      gridHorariosEl.appendChild(btn);
    });

    if (disponibles === 0) {
      mensajeHorariosEl.textContent = "No quedan horarios disponibles ese día. Prueba con otra fecha.";
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // PASO 4 — Confirmar
  // ══════════════════════════════════════════════════════════════════════

  function renderizarResumen() {
    const vehiculo = vehiculos.find(v => v.id === seleccion.vehiculoId);
    const servicio  = servicios.find(s => s.id === seleccion.servicioId);
    const fechaTexto = seleccion.fecha
      ? new Date(seleccion.fecha + "T00:00:00").toLocaleDateString("es-CR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : "—";

    resumenEl.innerHTML = `
      <div class="resumen-item">
        <span class="label">Vehículo</span>
        <span class="valor">${vehiculo ? escaparHTML(vehiculo.marca + " " + vehiculo.modelo) : "—"}</span>
      </div>
      <div class="resumen-item">
        <span class="label">Placa</span>
        <span class="valor">${vehiculo ? escaparHTML(vehiculo.placa) : "—"}</span>
      </div>
      <div class="resumen-item">
        <span class="label">Servicio</span>
        <span class="valor">${servicio ? escaparHTML(servicio.nombre) : "—"}</span>
      </div>
      <div class="resumen-item">
        <span class="label">Hora</span>
        <span class="valor">${escaparHTML(seleccion.hora || "—")}</span>
      </div>
      <div class="resumen-item" style="grid-column:1 / -1;">
        <span class="label">Fecha</span>
        <span class="valor" style="text-transform:capitalize;">${escaparHTML(fechaTexto)}</span>
      </div>
    `;
  }

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeFormEl.textContent = "";

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Guardando...";

    try {
      // Revalidar que el horario siga libre (por si otra pestaña lo tomó mientras el usuario decidía)
      const citasActuales = await obtenerTodos(dbConexion, "citas");
      const yaOcupado = citasActuales.some(c =>
        c.estado !== "cancelada" &&
        String(c.fecha).slice(0, 10) === seleccion.fecha &&
        String(c.fecha).slice(11, 16) === seleccion.hora
      );

      if (yaOcupado) {
        mensajeFormEl.textContent = "Ese horario se acaba de ocupar. Elige otra hora.";
        pasoActual = 3;
        actualizarPasoVisible();
        await campoFecha.dispatchEvent(new Event("change"));
        return;
      }

      const nuevaCita = {
        id: generarId("c"),
        usuarioId: usuarioActual.id,
        vehiculoId: seleccion.vehiculoId,
        servicioId: seleccion.servicioId,
        fecha: `${seleccion.fecha}T${seleccion.hora}:00`,
        estado: "pendiente",
        notas: campoNotas.value.trim(),
      };

      await guardar(dbConexion, "citas", nuevaCita);

      const servicio = servicios.find(s => s.id === seleccion.servicioId);
      textoExitoEl.textContent = `${servicio ? servicio.nombre : "Tu servicio"} quedó agendado para el ${seleccion.fecha} a las ${seleccion.hora}.`;

      formulario.hidden = true;
      document.getElementById("pasos").hidden = true;
      pantallaExitoEl.hidden = false;

    } catch (error) {
      mensajeFormEl.textContent = "No se pudo guardar la cita. Intenta de nuevo.";
      console.error("Error al guardar cita:", error);
    } finally {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "Confirmar cita";
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // Navegación entre pasos
  // ══════════════════════════════════════════════════════════════════════

  btnSiguiente.addEventListener("click", () => {
    if (!validarPasoActual()) return;
    pasoActual = Math.min(pasoActual + 1, TOTAL_PASOS);
    actualizarPasoVisible();
  });

  btnAtras.addEventListener("click", () => {
    pasoActual = Math.max(pasoActual - 1, 1);
    actualizarPasoVisible();
  });

  function validarPasoActual() {
    mensajeFormEl.textContent = "";
    if (pasoActual === 1 && !seleccion.vehiculoId) {
      mostrarMensajeFlotante("Selecciona un vehículo para continuar.", "error");
      return false;
    }
    if (pasoActual === 2 && !seleccion.servicioId) {
      mostrarMensajeFlotante("Selecciona un servicio para continuar.", "error");
      return false;
    }
    if (pasoActual === 3 && (!seleccion.fecha || !seleccion.hora)) {
      mostrarMensajeFlotante("Selecciona fecha y hora para continuar.", "error");
      return false;
    }
    return true;
  }

  function actualizarBotonSiguiente() {
    // Habilita/deshabilita visualmente no es estrictamente necesario:
    // la validación real ocurre al hacer clic en "Siguiente".
  }

  function actualizarPasoVisible() {
    document.querySelectorAll(".panel-paso").forEach(panel => {
      panel.classList.toggle("activo", Number(panel.dataset.panel) === pasoActual);
    });

    document.querySelectorAll(".paso").forEach(paso => {
      const numero = Number(paso.dataset.paso);
      paso.classList.toggle("activo", numero === pasoActual);
      paso.classList.toggle("completado", numero < pasoActual);
    });

    btnAtras.hidden = pasoActual === 1;
    btnSiguiente.hidden = pasoActual === TOTAL_PASOS;
    btnConfirmar.hidden = pasoActual !== TOTAL_PASOS;

    if (pasoActual === TOTAL_PASOS) {
      renderizarResumen();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════════════════

  function formatearFechaISO(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatearNumero(n) {
    return new Intl.NumberFormat("es-CR").format(n || 0);
  }

  function escaparHTML(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
  }

  function mostrarMensajeFlotante(texto, tipo) {
    mensajeFlotanteEl.textContent = texto;
    mensajeFlotanteEl.className = "mensaje-flotante mostrar " + (tipo || "");
    setTimeout(() => mensajeFlotanteEl.classList.remove("mostrar"), 2500);
  }

});