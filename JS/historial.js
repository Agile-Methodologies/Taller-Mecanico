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
  const filtroEstado   = document.getElementById("filtro-estado");

  let entradasCompletas = [];

  try {
    const db = await abrirBaseDatos();

    // Traemos TODO lo relacionado a citas del usuario: las que están en
    // curso (pendiente/confirmada/cancelada) y las que ya se completaron.
    const [todasLasCitas, registrosHistorial, vehiculosUsuario] = await Promise.all([
      obtenerPorIndice(db, "citas", "usuarioId", usuario.id),
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

    // Índice rápido: citaId -> registro de historial (si el servicio ya se completó)
    const historialPorCitaId = new Map();
    registrosHistorial.forEach(h => {
      if (h.citaId) historialPorCitaId.set(h.citaId, h);
    });

    // ── 1) Una entrada por cada cita del usuario (sin importar el estado) ──
    const entradasDeCitas = await Promise.all(
      todasLasCitas.map(async (cita) => {
        const [vehiculo, servicio] = await Promise.all([
          obtenerPorId(db, "vehiculos", cita.vehiculoId),
          cita.servicioId ? obtenerPorId(db, "servicios", cita.servicioId) : null,
        ]);
        const historial = historialPorCitaId.get(cita.id) || null;

        return { cita, historial, vehiculo, servicio };
      })
    );

    // ── 2) Registros de historial "huérfanos": no tienen una cita asociada  ─
    //     (por ejemplo, datos sembrados directamente en historialCitas)
    const idsDeCitas = new Set(todasLasCitas.map(c => c.id));
    const registrosHuerfanos = registrosHistorial.filter(h => !h.citaId || !idsDeCitas.has(h.citaId));

    const entradasHuerfanas = await Promise.all(
      registrosHuerfanos.map(async (h) => {
        const vehiculo = await obtenerPorId(db, "vehiculos", h.vehiculoId);
        return { cita: null, historial: h, vehiculo, servicio: null };
      })
    );

    entradasCompletas = [...entradasDeCitas, ...entradasHuerfanas];

    entradasCompletas.sort((a, b) => new Date(obtenerFecha(b)) - new Date(obtenerFecha(a)));

    renderizar(entradasCompletas);

  } catch (error) {
    console.error("Error cargando historial:", error);
    textoVacioEl.textContent = "No se pudo cargar el historial. Intenta de nuevo más tarde.";
    estadoVacioEl.hidden = false;
  }

  // ── Filtros ──────────────────────────────────────────────────────────────
  filtroVehiculo.addEventListener("change", aplicarFiltros);
  filtroEstado.addEventListener("change", aplicarFiltros);

  function aplicarFiltros() {
    const vehiculoSel = filtroVehiculo.value;
    const estadoSel   = filtroEstado.value;

    const filtradas = entradasCompletas.filter(e => {
      const coincideVehiculo = vehiculoSel === "todos" || e.vehiculo?.id === vehiculoSel;
      const coincideEstado   = estadoSel === "todos" || obtenerEstado(e) === estadoSel;
      return coincideVehiculo && coincideEstado;
    });

    renderizar(filtradas, vehiculoSel !== "todos" || estadoSel !== "todos");
  }

  // ── Helpers de datos combinados ─────────────────────────────────────────
  function obtenerFecha(entrada) {
    // Si ya se completó, la fecha real del trabajo es la del registro de historial.
    return entrada.historial ? entrada.historial.fecha : entrada.cita.fecha;
  }

  function obtenerEstado(entrada) {
    if (entrada.historial) return "completada";
    return entrada.cita?.estado || "pendiente";
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function renderizar(entradas, esFiltro = false) {
    contenedorEl.innerHTML = "";

    if (!entradas || entradas.length === 0) {
      textoVacioEl.textContent = esFiltro
        ? "No hay citas que coincidan con ese filtro."
        : "Cuando reserves una cita, aparecerá aquí.";
      estadoVacioEl.hidden = false;
      return;
    }
    estadoVacioEl.hidden = true;

    entradas.forEach(e => contenedorEl.appendChild(crearEntrada(e)));
  }

  function crearEntrada({ cita, historial, vehiculo, servicio }) {
    const fecha = new Date(obtenerFecha({ cita, historial }));
    const dia = !isNaN(fecha) ? fecha.getDate() : "—";
    const mesAnio = !isNaN(fecha)
      ? fecha.toLocaleDateString("es-CR", { month: "short", year: "numeric" }).replace(".", "")
      : "";
    const horaTexto = !isNaN(fecha) && cita
      ? fecha.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })
      : "";

    const nombreServicio = servicio?.nombre || "Servicio realizado";
    const infoVehiculo = vehiculo
      ? `${vehiculo.marca} ${vehiculo.modelo}`
      : "Vehículo no disponible";
    const placa = vehiculo?.placa || "";

    const estado = obtenerEstado({ cita, historial });
    const claseEstado = ["completada", "pendiente", "cancelada", "confirmada"].includes(estado) ? estado : "default";

    const descripcion = historial
      ? (historial.resultado || "Sin observaciones registradas.")
      : mensajePorEstado(estado, cita?.notas, horaTexto);

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
        <p class="resultado">${escaparHTML(descripcion)}</p>
      </div>
      <div class="entrada-lado">
        <span class="badge-estado ${claseEstado}">${escaparHTML(formatearEstado(estado))}</span>
      </div>
    `;
    return el;
  }

  function mensajePorEstado(estado, notas, horaTexto) {
    if (notas && notas.trim()) return notas;
    switch (estado) {
      case "pendiente":  return horaTexto ? `Cita agendada a las ${horaTexto}, en espera de confirmación.` : "Cita en espera de confirmación.";
      case "confirmada": return horaTexto ? `Cita confirmada a las ${horaTexto}.` : "Cita confirmada.";
      case "cancelada":  return "Esta cita fue cancelada.";
      default:           return "Sin observaciones registradas.";
    }
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