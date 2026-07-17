let dbConexion = null;
let usuarioActual = null;
let vehiculoEditandoId = null;
let idAEliminar = null;

document.addEventListener("DOMContentLoaded", async () => {

  // ── Guard de sesión ──────────────────────────────────────────────────────
  if (!haySesion()) {
    window.location.href = "login.html";
    return;
  }
  usuarioActual = obtenerSesion();

  // ── Referencias al DOM ───────────────────────────────────────────────────
  const listaEl       = document.getElementById("lista-vehiculos");
  const estadoVacioEl = document.getElementById("estado-vacio");

  const btnNuevo        = document.getElementById("btn-nuevo-vehiculo");
  const fondoModal       = document.getElementById("fondo-modal");
  const modalTitulo      = document.getElementById("modal-titulo");
  const formulario        = document.getElementById("formulario-vehiculo");
  const btnCerrarModal    = document.getElementById("btn-cerrar-modal");
  const btnCancelarForm   = document.getElementById("btn-cancelar-form");
  const btnGuardar        = document.getElementById("btn-guardar-vehiculo");
  const mensajeFormEl     = document.getElementById("mensaje-form");

  const campoId   = document.getElementById("vehiculo-id");
  const campoMarca = document.getElementById("v-marca");
  const campoModelo = document.getElementById("v-modelo");
  const campoAnio   = document.getElementById("v-anio");
  const campoPlaca  = document.getElementById("v-placa");
  const campoColor  = document.getElementById("v-color");
  const campoKm     = document.getElementById("v-kilometraje");

  const fondoConfirmar     = document.getElementById("fondo-confirmar");
  const nombreAEliminarEl  = document.getElementById("nombre-a-eliminar");
  const btnCancelarEliminar  = document.getElementById("btn-cancelar-eliminar");
  const btnConfirmarEliminar = document.getElementById("btn-confirmar-eliminar");

  const mensajeFlotanteEl = document.getElementById("mensaje");

  // ── Conectar base de datos y cargar vehículos ────────────────────────────
  try {
    dbConexion = await abrirBaseDatos();
    await cargarVehiculos();
  } catch (error) {
    mostrarMensajeFlotante("No se pudo conectar a la base de datos.", "error");
    console.error(error);
  }

  // ── Cargar y renderizar vehículos del usuario ────────────────────────────
  async function cargarVehiculos() {
    const vehiculos = await obtenerPorIndice(dbConexion, "vehiculos", "usuarioId", usuarioActual.id);
    renderizarVehiculos(vehiculos);
  }

  function renderizarVehiculos(vehiculos) {
    listaEl.innerHTML = "";

    if (!vehiculos || vehiculos.length === 0) {
      estadoVacioEl.hidden = false;
      return;
    }
    estadoVacioEl.hidden = true;

    vehiculos
      .sort((a, b) => (a.marca || "").localeCompare(b.marca || ""))
      .forEach(v => listaEl.appendChild(crearTarjetaVehiculo(v)));
  }

  function crearTarjetaVehiculo(v) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "ficha tarjeta-vehiculo";
    tarjeta.innerHTML = `
      <div class="tarjeta-vehiculo-cabecera">
        <div class="tarjeta-vehiculo-titulo">
          <h3>${escaparHTML(v.marca)} ${escaparHTML(v.modelo)}</h3>
          <span>Año ${escaparHTML(v.anio)}</span>
        </div>
        <span class="tag-placa">${escaparHTML(v.placa)}</span>
      </div>
      <div class="tarjeta-vehiculo-datos">
        <div><span class="label">Color</span>${escaparHTML(v.color)}</div>
        <div><span class="label">Kilometraje</span>${formatearNumero(v.kilometraje)} km</div>
      </div>
      <div class="tarjeta-vehiculo-acciones">
        <button class="btn btn-fantasma btn-editar" type="button" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-peligro btn-eliminar" type="button" title="Eliminar">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    tarjeta.querySelector(".btn-editar").addEventListener("click", () => abrirModalEdicion(v));
    tarjeta.querySelector(".btn-eliminar").addEventListener("click", () => abrirConfirmacionEliminar(v));

    return tarjeta;
  }

  // ── Abrir / cerrar modal ─────────────────────────────────────────────────
  function abrirModalNuevo() {

    vehiculoEditandoId = null;
    modalTitulo.textContent = "Agregar vehículo";
    btnGuardar.textContent = "Guardar vehículo";
    formulario.reset();
    campoId.value = "";
    mensajeFormEl.textContent = "";
    fondoModal.hidden = false;
    fondoModal.style.display = "flex";
    campoMarca.focus();

}

  function abrirModalEdicion(v) {
    vehiculoEditandoId = v.id;
    modalTitulo.textContent = "Editar vehículo";
    btnGuardar.textContent = "Actualizar vehículo";
    campoId.value = v.id;
    campoMarca.value = v.marca;
    campoModelo.value = v.modelo;
    campoAnio.value = v.anio;
    campoPlaca.value = v.placa;
    campoColor.value = v.color;
    campoKm.value = v.kilometraje;
    mensajeFormEl.textContent = "";
    fondoModal.hidden = false;
    fondoModal.style.display = "flex";
    campoMarca.focus();
  }

  function cerrarModal() {

    formulario.reset();
    vehiculoEditandoId = null;
    mensajeFormEl.textContent = "";
    fondoModal.hidden = true;
    fondoModal.style.display = "none";

}
  
  btnNuevo.addEventListener("click", abrirModalNuevo);
  btnCerrarModal.addEventListener("click", cerrarModal);
  btnCancelarForm.addEventListener("click", cerrarModal);
  fondoModal.addEventListener("click", (e) => { if (e.target === fondoModal) cerrarModal(); });

  // ── Guardar (crear o actualizar) ─────────────────────────────────────────
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datos = {
      marca:       campoMarca.value.trim(),
      modelo:      campoModelo.value.trim(),
      anio:        parseInt(campoAnio.value, 10),
      placa:       campoPlaca.value.trim().toUpperCase(),
      color:       campoColor.value.trim(),
      kilometraje: parseInt(campoKm.value, 10),
    };

    const error = validarVehiculo(datos);
    if (error) {
      mensajeFormEl.textContent = error;
      return;
    }

    const esEdicion = Boolean(vehiculoEditandoId);
    const registro = {
      id: esEdicion ? vehiculoEditandoId : generarId("v"),
      usuarioId: usuarioActual.id,
      ...datos,
    };

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";

    try {
      // Evitar placas duplicadas entre los vehículos del mismo usuario
      const vehiculosUsuario = await obtenerPorIndice(dbConexion, "vehiculos", "usuarioId", usuarioActual.id);
      const placaDuplicada = vehiculosUsuario.some(
        v => v.placa === registro.placa && v.id !== registro.id
      );
      if (placaDuplicada) {
        mensajeFormEl.textContent = "Ya tienes un vehículo registrado con esa placa.";
        btnGuardar.disabled = false;
        btnGuardar.textContent = esEdicion ? "Actualizar vehículo" : "Guardar vehículo";
        return;
      }

      await guardar(dbConexion, "vehiculos", registro);
      cerrarModal();
      await cargarVehiculos();
      mostrarMensajeFlotante(
        esEdicion ? "Vehículo actualizado." : "Vehículo agregado.",
        "exito"
      );
    } catch (err) {
      mensajeFormEl.textContent = "No se pudo guardar el vehículo. Intenta de nuevo.";
      console.error(err);
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = esEdicion ? "Actualizar vehículo" : "Guardar vehículo";
    }
  });

  function validarVehiculo(d) {
    if (!d.marca || !d.modelo || !d.placa || !d.color) return "Completa todos los campos.";
    const anioActual = new Date().getFullYear();
    if (!d.anio || d.anio < 1970 || d.anio > anioActual + 1) return "Ingresa un año válido.";
    if (isNaN(d.kilometraje) || d.kilometraje < 0) return "El kilometraje debe ser un número válido.";
    if (!/^[A-Z0-9\-\s]{4,10}$/i.test(d.placa)) return "Ingresa una placa válida.";
    return null;
  }

 // ── Eliminar ──────────────────────────────────────────────────────────────

function abrirConfirmacionEliminar(v) {
    idAEliminar = v.id;

    if (nombreAEliminarEl) {
        nombreAEliminarEl.textContent = `${v.marca} ${v.modelo} (${v.placa})`;
    }

    if (fondoConfirmar) {
        fondoConfirmar.hidden = false;
        fondoConfirmar.style.display = "flex";
    }
}

function cerrarConfirmacionEliminar() {
    if (fondoConfirmar) {
        fondoConfirmar.hidden = true;
        fondoConfirmar.style.display = "none";
    }

    idAEliminar = null;
}

if (btnCancelarEliminar) {
    btnCancelarEliminar.addEventListener("click", cerrarConfirmacionEliminar);
}

if (fondoConfirmar) {
    fondoConfirmar.addEventListener("click", (e) => {
        if (e.target === fondoConfirmar) {
            cerrarConfirmacionEliminar();
        }
    });
}

if (btnConfirmarEliminar) {

    btnConfirmarEliminar.addEventListener("click", async () => {

        if (!idAEliminar) return;

        btnConfirmarEliminar.disabled = true;

        try {

            await eliminar(dbConexion, "vehiculos", idAEliminar);

            cerrarConfirmacionEliminar();

            await cargarVehiculos();

            mostrarMensajeFlotante("Vehículo eliminado.", "exito");

        } catch (err) {

            console.error(err);

            mostrarMensajeFlotante(
                "No se pudo eliminar el vehículo.",
                "error"
            );

        } finally {

            btnConfirmarEliminar.disabled = false;

        }

    });

}

  // ── Helpers ──────────────────────────────────────────────────────────────
  function mostrarMensajeFlotante(texto, tipo) {
    mensajeFlotanteEl.textContent = texto;
    mensajeFlotanteEl.className = "mensaje-flotante mostrar " + (tipo || "");
    setTimeout(() => mensajeFlotanteEl.classList.remove("mostrar"), 2500);
  }

  function formatearNumero(n) {
    return new Intl.NumberFormat("es-CR").format(n || 0);
  }

  function escaparHTML(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
  }

});