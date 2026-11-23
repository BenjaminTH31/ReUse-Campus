
const express = require('express');
const router = express.Router();

const {
    crearSolicitud,
    obtenerSolicitudesPorPublicacion,
    obtenerMisSolicitudes,
    aceptarSolicitud,
    rechazarSolicitud,
    cancelarSolicitud
} = require('../controllers/solicitudes.controller');

const {
    verificarToken
} = require('../middleware/auth.middleware');

// Crear una solicitud
router.post('/', verificarToken, crearSolicitud);

// Consultar solicitudes propias y solicitudes recibidas
router.get('/mis-solicitudes', verificarToken, obtenerMisSolicitudes);
router.get('/publicacion/:publicacionId', verificarToken, obtenerSolicitudesPorPublicacion);

// Aceptar una solicitud
router.patch('/:id/aceptar', verificarToken, aceptarSolicitud);

// Rechazar una solicitud
router.patch('/:id/rechazar', verificarToken, rechazarSolicitud);

router.patch('/:id/cancelar', verificarToken, cancelarSolicitud);

module.exports = router;
