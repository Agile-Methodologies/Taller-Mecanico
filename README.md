# Documentación del Proyecto - Sistema de Gestión para Taller Mecánico

## Estado del Proyecto

**Versión:** 1.0 (En desarrollo)

**Tecnologías utilizadas**

* HTML5
* CSS3
* JavaScript (ES6)
* IndexedDB
* LocalStorage
* Font Awesome
* Google Fonts (Poppins)

---

# Objetivo del Sistema

Desarrollar una aplicación web para un taller mecánico que permita a los clientes registrarse, iniciar sesión, administrar sus vehículos, reservar citas para servicios mecánicos y consultar el historial de mantenimientos realizados.

El sistema contará además con un administrador que podrá gestionar los diferentes procesos internos del taller.

---

# Arquitectura General

Actualmente el proyecto está dividido en tres capas principales.

```
Interfaz (HTML + CSS)

        │

        ▼

Lógica de negocio (JavaScript)

        │

        ▼

Persistencia (IndexedDB)
```

---

# Estructura actual del proyecto

```
Proyecto

│

├── index.html
├── login.html

│

├── CSS
│      index.css
│      login.css

│

├── JS
│      db.js
│      login.js
│      index.js
│      auth.js (Pendiente)

│

├── IMG
│      hero.jpg
│      taller.jpg

│

└── db.json
```

---

# Base de datos

Actualmente la aplicación utiliza IndexedDB.

Nombre de la base:

```
TallerMecanicoDB
```

Versión:

```
2
```

---

## Almacenes creados

### Usuarios

Información de cada usuario registrado.

Campos principales

* id
* nombre
* email
* password
* rol
* createdAt

---

### Vehículos

Vehículos pertenecientes a un usuario.

Campos

* id
* usuarioId
* marca
* modelo
* año
* placa
* color
* kilometraje

---

### Servicios

Servicios ofrecidos por el taller.

Ejemplo

* Cambio de aceite
* Revisión de frenos
* Afinamiento
* Diagnóstico

---

### Citas

Información de las reservas.

Campos

* id
* usuarioId
* vehiculoId
* servicioId
* fecha
* estado
* notas

---

### Historial de Citas

Registro permanente de los trabajos realizados.

Campos

* id
* usuarioId
* vehiculoId
* citaId
* resultado
* fecha

---

# Flujo implementado actualmente

## 1. Inicio de la aplicación

```
Usuario

↓

Abre la página

↓

index.html
```

---

## 2. Navegación

Desde el menú principal el usuario puede visualizar información general del taller.

Secciones disponibles

* Inicio
* Servicios
* Nosotros
* Contacto
* Reservar cita
* Iniciar sesión

---

## 3. Inicio de sesión

El usuario accede al formulario.

```
login.html
```

Proceso:

```
Usuario escribe

↓

Correo

↓

Contraseña

↓

login.js

↓

buscarUsuarioPorEmail()

↓

IndexedDB
```

---

## Validaciones implementadas

Actualmente se validan:

* Campos vacíos.
* Correo con formato válido.
* Longitud mínima de contraseña.
* Usuario existente.
* Contraseña correcta.
* Errores de conexión con la base de datos.

---

## Resultado

Si las credenciales son correctas

```
Mensaje de bienvenida

↓

Animación

↓

(Próximamente)

Guardar sesión

↓

Redireccionar al inicio
```

---

# Página principal (Index)

Actualmente el Index funciona como una página informativa.

Contiene las siguientes secciones.

---

## Hero

Presentación del taller.

Botón para reservar cita.

---

## Servicios

Listado de servicios principales.

* Cambio de aceite
* Frenos
* Afinamiento
* Diagnóstico
* Electricidad
* Alineado y balanceo

---

## Beneficios

Ventajas del taller.

* Técnicos certificados
* Garantía
* Atención rápida
* Equipo especializado
* Historial digital

---

## Proceso

Explicación del flujo para reservar una cita.

```
Reserva

↓

Confirmación

↓

Visita al taller

↓

Servicio realizado
```

---

## Nosotros

Información institucional.

Incluye:

* Historia
* Experiencia
* Estadísticas

---

## Testimonios

Opiniones simuladas de clientes.

---

## Contacto

Información del taller.

* Dirección
* Teléfono
* Correo
* Horario

---

## Footer

Enlaces rápidos y redes sociales.

---

# CSS implementado

Actualmente se desarrolló el diseño de:

* Header
* Navbar
* Hero
* Servicios
* Beneficios
* Proceso
* Nosotros
* Testimonios
* Contacto
* Footer
* Responsive

---

# Componentes JavaScript desarrollados

## db.js

Responsable de:

* Abrir IndexedDB.
* Crear almacenes.
* Insertar datos iniciales.
* CRUD general.
* Buscar usuario por correo.

---

## login.js

Responsable de:

* Validar formulario.
* Conectar con IndexedDB.
* Buscar usuario.
* Validar contraseña.
* Mostrar mensajes.
* Mostrar/Ocultar contraseña.

---

## index.js (Base)

Responsable de:

* Navbar dinámico.
* Menú responsive.
* Cambio del navbar al hacer scroll.
* Preparación para manejo de sesión.

---

# Funcionalidades pendientes

## 1. auth.js

Pendiente de implementar.

Será responsable de:

* Guardar sesión.
* Obtener sesión.
* Validar sesión.
* Cerrar sesión.
* Validar administrador.

---

## 2. Integración Login

Modificar login.js para:

Guardar el usuario autenticado en LocalStorage.

---

## 3. Integración Index

Mostrar:

```
Iniciar sesión
```

o

```
Mi Perfil
```

dependiendo del estado de autenticación.

---

# Módulos pendientes

## Perfil

Mostrará:

* Nombre
* Correo
* Rol
* Fecha de registro

Opciones:

* Mis vehículos
* Reservar cita
* Historial
* Cerrar sesión

---

## Mis Vehículos

Permitirá:

* Registrar vehículo.
* Editar.
* Eliminar.
* Consultar.

Cada vehículo estará asociado a un usuario.

---

## Reservar cita

Permitirá:

Seleccionar

* Vehículo.
* Servicio.
* Fecha.
* Hora.

Generará un registro en:

```
Citas
```

---

## Historial

Mostrará todas las citas anteriores del usuario.

Incluye:

* Servicio
* Vehículo
* Fecha
* Resultado
* Estado

---

## Header-comun

Este archivo se encarga de controlar el comportamiento del encabezado (header) y la navegación de todas las páginas del sistema. Su objetivo es que el mismo código funcione en:

* index.html
* perfil.html
* mis-vehiculos.html
* historial.html

## Administración (Opcional)

Panel exclusivo para administradores.

Podrá gestionar:

* Usuarios
* Servicios
* Citas
* Historial

---

# Flujo final esperado del sistema

```
Usuario

↓

Index

↓

Login

↓

Validación

↓

Guardar sesión

↓

Index

↓

Perfil

↓

Mis Vehículos

↓

Registrar Vehículo

↓

Reservar Cita

↓

Seleccionar Servicio

↓

Seleccionar Vehículo

↓

Guardar Cita

↓

Citas Pendientes

↓

Servicio realizado

↓

Historial

↓

Cerrar sesión
```

---

# Flujo de autenticación

```
Usuario

↓

Login

↓

IndexedDB

↓

Usuario encontrado

↓

Contraseña correcta

↓

Guardar sesión

↓

Index

↓

Perfil

↓

Cerrar sesión

↓

Eliminar sesión
```

---

# Estado actual del proyecto

| Módulo                    | Estado                                         |
| ------------------------- | ---------------------------------------------- |
| Base de datos (IndexedDB) | ✅ Finalizado                                   |
| CRUD base                 | ✅ Finalizado                                   |
| Login                     | ✅ Finalizado (pendiente integración de sesión) |
| Página principal          | ✅ Finalizada                                   |
| CSS principal             | ✅ Finalizado                                   |
| Navbar                    | ✅ Finalizado                                   |
| Hero                      | ✅ Finalizado                                   |
| Servicios                 | ✅ Finalizado                                   |
| Nosotros                  | ✅ Finalizado                                   |
| Contacto                  | ✅ Finalizado                                   |
| Footer                    | ✅ Finalizado                                   |
| Responsive                | ✅ Finalizado                                   |
| auth.js                   | ⏳ Pendiente                                    |
| Perfil                    | ✅ Finalizado                                   |
| Mis Vehículos             | ✅ Finalizado                                   |
| Reservar cita             | ⏳ Pendiente                                    |
| Historial                 | ✅ Finalizado                                   |
| Panel administrador       | ⏳ Pendiente                                    |

---

# Próximo paso recomendado

1. Implementar `auth.js`.
2. Integrar la autenticación con `login.js`.
3. Adaptar `index.js` para mostrar el estado de sesión.
4. Desarrollar el módulo **Reservar Cita**.
5. (Opcional) Crear el panel de administración.
