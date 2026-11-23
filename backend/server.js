
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { conectarDB } = require('./config/db');

const usuariosRoutes = require('./routes/usuarios.routes');
const publicacionesRoutes = require('./routes/publicaciones.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const entregasRoutes = require('./routes/entregas.routes');

const app = express();

// Configuración de Express
app.use(cors());
app.use(express.json());

// Ruta inicial
app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de ReUse Campus funcionando correctamente'
    });
});

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/entregas', entregasRoutes);

// Iniciar servidor y conectar base de datos
const iniciarServidor = async () => {
    try {
        await conectarDB();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Servidor iniciado en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error.message);
        process.exit(1);
    }
};

iniciarServidor();
