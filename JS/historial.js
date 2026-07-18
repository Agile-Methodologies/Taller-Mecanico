document.addEventListener("DOMContentLoaded", async () => {

  // ── Guard de sesión ──────────────────────────────────────────────────────
  if (!haySesion()) {
    window.location.href = "login.html";
    return;
  }
  const usuario = obtenerSesion();

  // ── Referencias al DOM ───────────────────────────────────────────────────
  const contenedorEl   = document.getElementById("linea-historial");
  const estadoVacioEl  = document.getElementById("estado-vacio");
  const textoVacioEl   = document.getElementById("texto-vacio");
  const filtroVehiculo = document.getElementById("filtro-vehiculo");

  let entradasCompletas = [];

  try {
    const db = await abrirBaseDatos();

    const [registros, vehiculosUsuario] = await Promise.all([
      obtenerPorIndice(db, "historialCitas", "usuarioId", usuario.id),
      obtenerPorIndice(db, "vehiculos", "usuarioId", usuario.id),
    ]);

    // Poblar el filtro de vehículos
    vehiculosUsuario
      .sort((a, b) => (a.marca || "").localeCompare(b.marca || ""))
      .forEach(v => {
        const opcion = document.createElement("option");
        opcion.value = v.id;
        opcion.textContent = `${v.marca} ${v.modelo} (${v.placa})`;
        filtroVehiculo.appendChild(opcion);
      });

    entradasCompletas = await Promise.all(
      registros.map(async (registro) => {
        const [vehiculo, cita] = await Promise.all([
          obtenerPorId(db, "vehiculos", registro.vehiculoId),
          registro.citaId ? obtenerPorId(db, "citas", registro.citaId) : null,
        ]);
        const servicio = cita && cita.servicioId
          ? await obtenerPorId(db, "servicios", cita.servicioId)
          : null;

        return { registro, vehiculo, cita, servicio };
      })
    );

    entradasCompletas.sort(
      (a, b) => new Date(b.registro.fecha) - new Date(a.registro.fecha)
    );

    renderizar(entradasCompletas);

  } catch (error) {
    console.error("Error cargando historial:", error);
    textoVacioEl.textContent = "No se pudo cargar el historial. Intenta de nuevo más tarde.";
    estadoVacioEl.hidden = false;
  }

  // ── Filtro por vehículo ──────────────────────────────────────────────────
  filtroVehiculo.addEventListener("change", () => {
    const valor = filtroVehiculo.value;
    const filtradas = valor === "todos"
      ? entradasCompletas
      : entradasCompletas.filter(e => e.registro.vehiculoId === valor);
    renderizar(filtradas, valor !== "todos");
  });

  // ── Render ───────────────────────────────────────────────────────────────
  function renderizar(entradas, esFiltro = false) {
    contenedorEl.innerHTML = "";

    if (!entradas || entradas.length === 0) {
      textoVacioEl.textContent = esFiltro
        ? "No hay historial para el vehículo seleccionado."
        : "Cuando se complete un servicio, aparecerá aquí.";
      estadoVacioEl.hidden = false;
      return;
    }
    estadoVacioEl.hidden = true;

    entradas.forEach(e => contenedorEl.appendChild(crearEntrada(e)));
  }

  function crearEntrada({ registro, vehiculo, cita, servicio }) {
    const fecha = new Date(registro.fecha);
    const dia = !isNaN(fecha) ? fecha.getDate() : "—";
    const mesAnio = !isNaN(fecha)
      ? fecha.toLocaleDateString("es-CR", { month: "short", year: "numeric" }).replace(".", "")
      : "";

    const nombreServicio = servicio?.nombre || "Servicio realizado";
    const infoVehiculo = vehiculo
      ? `${vehiculo.marca} ${vehiculo.modelo}`
      : "Vehículo no disponible";
    const placa = vehiculo?.placa || "";

    const estado = cita?.estado || "completada";
    const claseEstado = ["completada", "pendiente", "cancelada"].includes(estado) ? estado : "default";

    const el = document.createElement("article");
    el.className = "ficha entrada-historial";
    el.innerHTML = `
      <div class="entrada-fecha">
        <span class="dia">${escaparHTML(dia)}</span>
        <span class="mes-anio">${escaparHTML(mesAnio)}</span>
      </div>
      <div class="entrada-cuerpo">
        <h3>${escaparHTML(nombreServicio)}</h3>
        <div class="vehiculo-info">${escaparHTML(infoVehiculo)}${placa ? " · " + escaparHTML(placa) : ""}</div>
        <p class="resultado">${escaparHTML(registro.resultado || "Sin observaciones registradas.")}</p>
      </div>
      <div class="entrada-lado">
        <span class="badge-estado ${claseEstado}">${escaparHTML(formatearEstado(estado))}</span>
      </div>
    `;
    return el;
  }

  function formatearEstado(estado) {
    const mapa = {
      completada: "Completada",
      pendiente: "Pendiente",
      cancelada: "Cancelada",
      confirmada: "Confirmada",
    };
    return mapa[estado] || estado;
  }

  function escaparHTML(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
  }

});