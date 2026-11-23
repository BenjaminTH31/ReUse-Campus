
const express = require('express');
const router = express.Router();

const {
    obtenerMisEntregas,
    completarEntrega
} = require('../controllers/entregas.controller');

const {
    verificarToken
} = require('../middleware/auth.middleware');

// Consultar las entregas del usuario
router.get('/mis-entregas', verificarToken, obtenerMisEntregas);

// Completar una entrega
router.patch('/:id/completar', verificarToken, completarEntrega);

module.exports = router;
