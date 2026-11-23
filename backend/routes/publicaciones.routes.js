
const express = require('express');
const router = express.Router();

const {
    obtenerPublicaciones,
    obtenerPublicacionPorId,
    crearPublicacion,
    editarPublicacion,
    cancelarPublicacion
} = require('../controllers/publicaciones.controller');

const { verificarToken } = require('../middleware/auth.middleware');

// Consultar publicaciones
router.get('/', obtenerPublicaciones);
router.get('/:id', obtenerPublicacionPorId);

// Crear publicación
router.post('/', verificarToken, crearPublicacion);

// Editar publicación
router.put('/:id', verificarToken, editarPublicacion);

// Cancelar publicación
router.delete('/:id', verificarToken, cancelarPublicacion);
router.patch('/:id/cancelar', verificarToken, cancelarPublicacion); // Compatibilidad con la ruta anterior

module.exports = router;
