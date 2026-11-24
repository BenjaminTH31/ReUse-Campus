# ReUse Campus

## 1. Descripción del proyecto

ReUse Campus es una plataforma web que permite a los estudiantes publicar, donar e intercambiar materiales académicos que ya no necesitan.

Los usuarios pueden crear publicaciones, enviar solicitudes y coordinar entregas. El sistema controla los estados de las publicaciones y solicitudes para mantener un registro de las operaciones.

## 2. Autor

- **Nombre:** Benjamin Manríquez.
- **Institución:** Instituto Profesional Virginio Gómez.
- **Carrera:** Ingeniería en Informática.
- **Asignatura:** Electivo Angular.

## 3. Tecnologías utilizadas

- **Frontend:** Angular 22, TypeScript, HTML, CSS y RxJS.
- **Backend:** Node.js, Express y JavaScript.
- **Base de datos:** Microsoft SQL Server y SQL Server Management Studio.
- **Autenticación:** JWT y bcryptjs.
- **Conexión a la base de datos:** mssql, msnodesqlv8 y ODBC Driver 18.
- **Herramientas:** Git y GitHub.

## 4. Requisitos, instalación y ejecución

### Requisitos

- Node.js y npm.
- Angular CLI 22.
- Microsoft SQL Server y SSMS.
- ODBC Driver 18 for SQL Server.
- Git.

### Descargar el proyecto

```bash
git clone https://github.com/BenjaminTH31/ReUse-Campus.git
cd ReUse-Campus
```

### Configurar la base de datos

1. Abrir SQL Server Management Studio.
2. Ejecutar el script `database/crear_base_datos.sql`.
3. Verificar que se haya creado la base de datos `ReUseCampus`.

### Ejecutar el backend

```bash
cd backend
npm install
```

Crear un archivo `.env` dentro de `backend`:

```env
PORT=3000
DB_SERVER=TU_INSTANCIA_SQL_SERVER
DB_DATABASE=ReUseCampus
JWT_SECRET=TU_CLAVE_SECRETA
```

Reemplazar los valores de ejemplo por los correspondientes al equipo donde se ejecutará el proyecto.

Iniciar el servidor:

```bash
npm run dev
```

El backend estará disponible en `http://localhost:3000`.

### Ejecutar el frontend

En otra terminal:

```bash
cd frontend
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

Para generar la compilación:

```bash
npm run build
```

**Importante:** El backend utiliza autenticación de Windows para conectarse a SQL Server. El usuario de Windows debe tener permisos sobre la base de datos. El archivo `.env` no debe subirse a GitHub.

## 5. Base de datos

El proyecto utiliza SQL Server y contiene cuatro entidades principales:

| Entidad | Función |
|---|---|
| Usuarios | Almacena los datos y credenciales de los usuarios. |
| Publicaciones | Guarda los artículos publicados. |
| Solicitudes | Registra las solicitudes realizadas. |
| Entregas | Registra las entregas generadas al aceptar solicitudes. |

Las entidades se relacionan mediante identificadores y claves foráneas.

El archivo de conexión se encuentra en `backend/config/db.js` y el script de creación en `database/crear_base_datos.sql`.

## 6. Estructura del proyecto

```text
ReUse-Campus/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
├── database/
│   └── crear_base_datos.sql
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── pages/
│   │       ├── services/
│   │       ├── app.config.ts
│   │       └── app.routes.ts
│   └── package.json
│
└── README.md
```

- **config:** configuración de la conexión a la base de datos.
- **controllers:** lógica de las operaciones.
- **middleware:** autenticación y control de acceso.
- **routes:** rutas de la API REST.
- **pages:** páginas de la aplicación Angular.
- **services:** comunicación entre el frontend y el backend.

## 7. Funcionalidades implementadas

- Registro e inicio de sesión de usuarios.
- Autenticación mediante JWT.
- Creación, edición, consulta y cancelación de publicaciones.
- Publicaciones mediante donación o intercambio.
- Envío, consulta, aceptación y rechazo de solicitudes.
- Generación y finalización de entregas.
- Control de estados de publicaciones, solicitudes y entregas.
- Validaciones de las reglas de negocio.
- Persistencia de la información en SQL Server.

Entre las reglas implementadas se encuentran impedir solicitudes a publicaciones propias, evitar solicitudes duplicadas y permitir que solamente el propietario acepte o rechace solicitudes.

Al aceptar una solicitud, la publicación queda RESERVADA, las demás solicitudes pendientes son RECHAZADAS y se genera una entrega PENDIENTE. Al completar la entrega, la publicación pasa a ENTREGADA.

## 8. Pruebas realizadas

Durante el desarrollo se realizaron pruebas funcionales para comprobar:

- Inicio del backend y conexión con SQL Server.
- Registro e inicio de sesión.
- Creación, edición y cancelación de publicaciones.
- Envío y administración de solicitudes.
- Aceptación y rechazo de solicitudes.
- Generación y finalización de entregas.
- Actualización de estados y persistencia de los datos en SQL Server.
- Actualización de la interfaz después de realizar operaciones.

También se revisaron validaciones para evitar operaciones no permitidas, como solicitar publicaciones propias o duplicar solicitudes pendientes.

## 9. Declaración de uso de Inteligencia Artificial

Durante el desarrollo se utilizó ChatGPT como herramienta de apoyo para comprender conceptos, proponer código, organizar archivos, solucionar errores y documentar el proyecto.

Se recibió ayuda en el desarrollo del frontend Angular, el backend Express, la conexión con SQL Server, la autenticación y las reglas de negocio.