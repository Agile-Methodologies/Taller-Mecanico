/**
 * admin-citas.js — Panel de administración: gestión de citas
 * Taller Mecánico
 *
 * Permite al administrador ver todas las citas con los datos del
 * cliente y sus notas, además de actualizar el estado de la cita
 * (pendiente / aceptada / completada / cancelada) y dejar un review
 * del servicio. El review se guarda en el almacén "historialCitas"
 * (mismo almacén que ya usa historial.js para el cliente), así que
 * queda visible automáticamente en el historial del cliente.
 */

let dbConexion = null;

document.addEventListener("DOMContentLoaded", async () => {

  // ── Guard de sesión + rol ───────────────────────────────────────────────
  if (!haySesion()) {
    window.location.href = "login.html";
    return;
  }
  if (!esAdministrador()) {
    window.location.href = "index.html";
    return;
  }

  // ── Referencias al DOM ───────────────────────────────────────────────────
  const contenedorEl      = document.getElementById("lista-citas");
  const estadoVacioEl     = document.getElementById("estado-vacio");
  const textoVacioEl      = document.getElementById("texto-vacio");
  const filtroEstado      = document.getElementById("filtro-estado");
  const buscarInput       = document.getElementById("buscar-cliente");
  const mensajeFlotanteEl = document.getElementById("mensaje");

  const contadorTotalEl       = document.getElementById("contador-total");
  const contadorPendientesEl  = document.getElementById("contador-pendientes");
  const contadorAceptadasEl   = document.getElementById("contador-aceptadas");
  const contadorCompletadasEl = document.getElementById("contador-completadas");

  let citasCompletas = []; // [{ cita, usuario, vehiculo, servicio, historial }]

  try {
    dbConexion = await abrirBaseDatos();
    await cargarCitas();
  } catch (error) {
    console.error("Error cargando panel de citas:", error);
    textoVacioEl.textContent = "No se pudo conectar a la base de datos.";
    estadoVacioEl.hidden = false;
  }

  filtroEstado.addEventListener("change", aplicarFiltros);
  buscarInput.addEventListener("input", aplicarFiltros);

  async function cargarCitas() {
    const [citas, usuarios, vehiculos, servicios, historiales] = await Promise.all([
      obtenerTodos(dbConexion, "citas"),
      obtenerTodos(dbConexion, "usuarios"),
      obtenerTodos(dbConexion, "vehiculos"),
      obtenerTodos(dbConexion, "servicios"),
      obtenerTodos(dbConexion, "historialCitas"),
    ]);

    const mapaUsuarios  = new Map(usuarios.map(u => [u.id, u]));
    const mapaVehiculos = new Map(vehiculos.map(v => [v.id, v]));
    const mapaServicios = new Map(servicios.map(s => [s.id, s]));

    const mapaHistorialPorCita = new Map();
    historiales.forEach(h => { if (h.citaId) mapaHistorialPorCita.set(h.citaId, h); });

    citasCompletas = citas.map(cita => ({
      cita,
      usuario:   mapaUsuarios.get(cita.usuarioId)   || null,
      vehiculo:  mapaVehiculos.get(cita.vehiculoId) || null,
      servicio:  mapaServicios.get(cita.servicioId) || null,
      historial: mapaHistorialPorCita.get(cita.id)  || null,
    }));

    citasCompletas.sort((a, b) => new Date(b.cita.fecha) - new Date(a.cita.fecha));

    actualizarContadores();
    aplicarFiltros();
  }

  function aplicarFiltros() {
    const estadoSel = filtroEstado.value;
    const busqueda  = buscarInput.value.trim().toLowerCase();

    const filtradas = citasCompletas.filter(({ cita, usuario }) => {
      const coincideEstado = estadoSel === "todos" || (cita.estado || "pendiente") === estadoSel;
      const coincideBusqueda = !busqueda ||
        (usuario?.nombre || "").toLowerCase().includes(busqueda) ||
        (usuario?.email  || "").toLowerCase().includes(busqueda);
      return coincideEstado && coincideBusqueda;
    });

    renderizar(filtradas, estadoSel !== "todos" || !!busqueda);
  }

  function actualizarContadores() {
    const total       = citasCompletas.length;
    const pendientes  = citasCompletas.filter(e => (e.cita.estado || "pendiente") === "pendiente").length;
    const aceptadas   = citasCompletas.filter(e => e.cita.estado === "confirmada").length;
    const completadas = citasCompletas.filter(e => e.cita.estado === "completada").length;

    contadorTotalEl.textContent       = total;
    contadorPendientesEl.textContent  = pendientes;
    contadorAceptadasEl.textContent   = aceptadas;
    contadorCompletadasEl.textContent = completadas;
  }

  function renderizar(entradas, esFiltro) {
    contenedorEl.innerHTML = "";

    if (!entradas || entradas.length === 0) {
      textoVacioEl.textContent = esFiltro
        ? "No hay citas que coincidan con ese filtro."
        : "Todavía no hay citas registradas.";
      estadoVacioEl.hidden = false;
      return;
    }
    estadoVacioEl.hidden = true;

    entradas.forEach(entrada => contenedorEl.appendChild(crearTarjeta(entrada)));
  }

  function crearTarjeta({ cita, usuario, vehiculo, servicio, historial }) {
    const fecha = new Date(cita.fecha);
    const fechaTexto = !isNaN(fecha)
      ? fecha.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })
      : "Fecha no disponible";
    const horaTexto = !isNaN(fecha)
      ? fecha.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })
      : "";

    const estado = cita.estado || "pendiente";

    const el = document.createElement("article");
    el.className = "ficha admin-cita";
    el.dataset.citaId = cita.id;

    el.innerHTML = `
      <div class="admin-cita-cabecera">
        <div class="admin-cita-fecha">
          <i class="fa-solid fa-calendar-days"></i>
          <span>${escaparHTML(fechaTexto)}${horaTexto ? " · " + escaparHTML(horaTexto) : ""}</span>
        </div>
        <span class="badge-estado ${claseEstado(estado)}">${escaparHTML(etiquetaEstado(estado))}</span>
      </div>

      <div class="admin-cita-cuerpo">
        <div class="admin-cita-cliente">
          <i class="fa-solid fa-user"></i>
          <div>
            <strong>${escaparHTML(usuario?.nombre || "Cliente no encontrado")}</strong>
            <span class="admin-cita-subtexto">
              ${escaparHTML(usuario?.email || "sin correo")}${usuario?.telefono ? " · " + escaparHTML(usuario.telefono) : ""}
            </span>
          </div>
        </div>

        <div class="admin-cita-detalle">
          <span><i class="fa-solid fa-car"></i> ${vehiculo ? escaparHTML(`${vehiculo.marca} ${vehiculo.modelo} · ${vehiculo.placa}`) : "Vehículo no disponible"}</span>
          <span><i class="fa-solid fa-wrench"></i> ${escaparHTML(servicio?.nombre || "Servicio no especificado")}</span>
        </div>

        ${cita.notas ? `
        <p class="admin-cita-notas">
          <i class="fa-solid fa-note-sticky"></i>
          <span><strong>Notas del cliente:</strong> ${escaparHTML(cita.notas)}</span>
        </p>` : ""}
      </div>

      <div class="admin-cita-acciones">
        <div class="campo campo-estado-admin">
          <label>Estado de la cita</label>
          <select class="select-estado">
            <option value="pendiente"  ${estado === "pendiente"  ? "selected" : ""}>Pendiente</option>
            <option value="confirmada" ${estado === "confirmada" ? "selected" : ""}>Aceptada</option>
            <option value="completada" ${estado === "completada" ? "selected" : ""}>Completada</option>
            <option value="cancelada"  ${estado === "cancelada"  ? "selected" : ""}>Cancelada</option>
          </select>
        </div>

        <div class="campo campo-review">
          <label>Review / observaciones del servicio</label>
          <textarea class="input-review" rows="2" placeholder="Ej: Se realizó el cambio de aceite sin inconvenientes...">${escaparHTML(historial?.resultado || "")}</textarea>
        </div>

        <button type="button" class="btn btn-primario btn-guardar-cita">
          <i class="fa-solid fa-floppy-disk"></i> Guardar cambios
        </button>
      </div>
    `;

    el.querySelector(".btn-guardar-cita")
      .addEventListener("click", () => guardarCambios(el, cita));

    return el;
  }

  async function guardarCambios(el, cita) {
    const nuevoEstado  = el.querySelector(".select-estado").value;
    const reviewTexto  = el.querySelector(".input-review").value.trim();
    const boton        = el.querySelector(".btn-guardar-cita");
    const textoOriginal = boton.innerHTML;

    boton.disabled  = true;
    boton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;

    try {
      cita.estado = nuevoEstado;
      await guardar(dbConexion, "citas", cita);

      if (reviewTexto) {
        const historialesExistentes = await obtenerPorIndice(dbConexion, "historialCitas", "citaId", cita.id);
        const registroExistente = historialesExistentes[0] || null;

        const registroHistorial = {
          id:         registroExistente?.id || generarId("h"),
          usuarioId:  cita.usuarioId,
          vehiculoId: cita.vehiculoId,
          citaId:     cita.id,
          resultado:  reviewTexto,
          fecha:      registroExistente?.fecha || new Date().toISOString(),
        };
        await guardar(dbConexion, "historialCitas", registroHistorial);
      }

      mostrarMensajeFlotante("Cita actualizada correctamente.", "exito");
      await cargarCitas();

    } catch (error) {
      console.error("Error al guardar cambios de la cita:", error);
      mostrarMensajeFlotante("No se pudo guardar la cita. Intenta de nuevo.", "error");
      boton.disabled  = false;
      boton.innerHTML = textoOriginal;
    }
  }

  function claseEstado(estado) {
    return ["completada", "pendiente", "cancelada", "confirmada"].includes(estado) ? estado : "default";
  }

  function etiquetaEstado(estado) {
    const mapa = {
      pendiente:  "Pendiente",
      confirmada: "Aceptada",
      completada: "Completada",
      cancelada:  "Cancelada",
    };
    return mapa[estado] || estado;
  }

  function escaparHTML(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
  }

  function mostrarMensajeFlotante(texto, tipo) {
    mensajeFlotanteEl.textContent = texto;
    mensajeFlotanteEl.className   = "mensaje-flotante mostrar " + (tipo || "");
    setTimeout(() => mensajeFlotanteEl.classList.remove("mostrar"), 2500);
  }

});