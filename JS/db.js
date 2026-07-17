const DB_NOMBRE  = "TallerMecanicoDB";
const DB_VERSION = 2; // ← subido de 1 a 2 para forzar onupgradeneeded

const ALMACENES = ["usuarios", "vehiculos", "servicios", "citas", "historialCitas"];

function abrirBaseDatos() {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(DB_NOMBRE, DB_VERSION);

    solicitud.onupgradeneeded = (evento) => {
      const db  = evento.target.result;

      // Borrar almacenes viejos si existen (limpieza de versión anterior)
      for (const nombre of ALMACENES) {
        if (db.objectStoreNames.contains(nombre)) {
          db.deleteObjectStore(nombre);
        }
      }

      // Recrear todos con la estructura correcta
      const u = db.createObjectStore("usuarios", { keyPath: "id" });
      u.createIndex("email", "email", { unique: true });

      const v = db.createObjectStore("vehiculos", { keyPath: "id" });
      v.createIndex("usuarioId", "usuarioId");

      db.createObjectStore("servicios", { keyPath: "id" });

      const c = db.createObjectStore("citas", { keyPath: "id" });
      c.createIndex("usuarioId", "usuarioId");
      c.createIndex("estado",    "estado");

      const h = db.createObjectStore("historialCitas", { keyPath: "id" });
      h.createIndex("usuarioId", "usuarioId");
      h.createIndex("citaId",    "citaId");
    };

    solicitud.onsuccess = async (evento) => {
      const db = evento.target.result;
      try {
        await _sembrarDesdeJSON(db);
      } catch (e) {
        console.warn("Siembra omitida:", e);
      }
      resolve(db);
    };

    solicitud.onerror = (evento) => {
      reject("Error al abrir IndexedDB: " + evento.target.error);
    };
  });
}

async function _sembrarDesdeJSON(db) {
  const yaHayDatos = await _contarRegistros(db, "usuarios");
  if (yaHayDatos > 0) {
    console.info("✔ IndexedDB ya tiene datos.");
    return;
  }

  let semilla;
  try {
    const respuesta = await fetch("db.json");
    if (!respuesta.ok) throw new Error("No se pudo leer db.json");
    semilla = await respuesta.json();
    console.info("✔ db.json leído correctamente.");
  } catch (e) {
    console.warn("db.json no disponible, usando fallback:", e.message);
    semilla = _datosFallback();
  }

  for (const almacen of ALMACENES) {
    const registros = semilla[almacen];
    if (!Array.isArray(registros) || registros.length === 0) continue;
    await _insertarLote(db, almacen, registros);
    console.info(`✔ Sembrado: ${registros.length} registro(s) en "${almacen}"`);
  }
}

function _contarRegistros(db, almacen) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(almacen, "readonly");
    const req = tx.objectStore(almacen).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function _insertarLote(db, almacen, registros) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(almacen, "readwrite");
    const store = tx.objectStore(almacen);
    registros.forEach(r => store.put(r));
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// ── API pública ───────────────────────────────────────────────────────────────

function obtenerTodos(db, almacen) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(almacen, "readonly");
    const req = tx.objectStore(almacen).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function obtenerPorId(db, almacen, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(almacen, "readonly");
    const req = tx.objectStore(almacen).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

function obtenerPorIndice(db, almacen, indice, valor) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(almacen, "readonly");
    const req = tx.objectStore(almacen).index(indice).getAll(valor);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function guardar(db, almacen, registro) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(almacen, "readwrite");
    const req = tx.objectStore(almacen).put(registro);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function eliminar(db, almacen, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(almacen, "readwrite");
    const req = tx.objectStore(almacen).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

function buscarUsuarioPorEmail(db, email) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction("usuarios", "readonly");
    const req = tx.objectStore("usuarios").index("email").get(email.trim().toLowerCase());
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

function generarId(prefijo = "r") {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function _datosFallback() {
  return {
    usuarios: [
      { id: "u-001",   nombre: "Carlos López",   email: "carlos@mail.com",  password: "hash123", rol: "cliente", createdAt: "2026-06-01T10:00:00Z" },
      { id: "u-admin", nombre: "Administrador",   email: "admin@taller.com", password: "123456",  rol: "admin",   createdAt: "2026-01-01T00:00:00Z" }
    ],
    vehiculos: [
      { id: "v-001", usuarioId: "u-001", marca: "Toyota", modelo: "Corolla", anio: 2020, placa: "ABC-123", color: "Blanco", kilometraje: 45000 }
    ],
    servicios: [
      { id: "s-001", nombre: "Cambio de aceite",   descripcion: "Cambio de aceite y filtro",     precio: 3500, duracionMinutos: 30 },
      { id: "s-002", nombre: "Revisión de frenos", descripcion: "Inspección y ajuste de frenos", precio: 5000, duracionMinutos: 60 }
    ],
    citas: [
      { id: "c-001", usuarioId: "u-001", vehiculoId: "v-001", servicioId: "s-001", fecha: "2026-06-10T09:00:00Z", estado: "completada", notas: "Cliente pidió aceite sintético" }
    ],
    historialCitas: [
      { id: "h-001", usuarioId: "u-001", vehiculoId: "v-001", citaId: "c-001", resultado: "Servicio completado sin inconvenientes", fecha: "2026-06-10T10:00:00Z" }
    ]
  };
}
