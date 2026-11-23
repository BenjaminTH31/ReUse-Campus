
const jwt = require('jsonwebtoken');
const { sql } = require('../config/db');

// VERIFICAR TOKEN Y ESTADO ACTUAL DEL USUARIO
const verificarToken = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                mensaje: 'Debes iniciar sesión para acceder.'
            });
        }

        const token = authorization.split(' ')[1];

        const datosUsuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Consultar el usuario directamente en SQL Server
        const resultado = await new sql.Request()
            .input('id', sql.Int, datosUsuario.id)
            .query(`
                SELECT id, rol, estado
                FROM Usuarios
                WHERE id = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(401).json({
                mensaje: 'El usuario ya no existe.'
            });
        }

        const usuario = resultado.recordset[0];

        if (usuario.estado !== 'ACTIVO') {
            return res.status(403).json({
                mensaje: 'Tu cuenta se encuentra inactiva.'
            });
        }

        // Guardar los datos actuales del usuario
        req.usuario = {
            id: usuario.id,
            rol: usuario.rol
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError') {
            return res.status(401).json({
                mensaje: 'Token inválido o expirado.'
            });
        }

        console.error('Error al verificar usuario:', error.message);

        return res.status(500).json({
            mensaje: 'Error al verificar la autenticación.'
        });
    }
};

// VERIFICAR ROL
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: 'No tienes permisos para realizar esta acción.'
            });
        }

        next();
    };
};

module.exports = {
    verificarToken,
    verificarRol
};
