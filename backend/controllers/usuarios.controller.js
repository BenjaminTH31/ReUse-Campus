
const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTRAR USUARIO
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        // Validar que los campos estén completos
        if (!nombre || !correo || !password) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener al menos 6 caracteres.'
            });
        }

        // Comprobar si el correo ya está registrado
        const resultado = await new sql.Request()
            .input('correo', sql.VarChar(150), correo)
            .query('SELECT id FROM Usuarios WHERE correo = @correo');

        if (resultado.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'Este correo ya está registrado.'
            });
        }

        // Encriptar la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Guardar el usuario en SQL Server
        const nuevoUsuario = await new sql.Request()
            .input('nombre', sql.VarChar(100), nombre)
            .input('correo', sql.VarChar(150), correo)
            .input('password', sql.VarChar(255), passwordHash)
            .query(`
                INSERT INTO Usuarios (nombre, correo, password)
                OUTPUT INSERTED.id, INSERTED.nombre,
                       INSERTED.correo, INSERTED.rol, INSERTED.estado
                VALUES (@nombre, @correo, @password)
            `);

        return res.status(201).json({
            mensaje: 'Usuario registrado correctamente.',
            usuario: nuevoUsuario.recordset[0]
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al registrar el usuario.'
        });
    }
};

// INICIAR SESIÓN
const iniciarSesion = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                mensaje: 'Debes ingresar correo y contraseña.'
            });
        }

        // Buscar el usuario por su correo
        const resultado = await new sql.Request()
            .input('correo', sql.VarChar(150), correo)
            .query('SELECT * FROM Usuarios WHERE correo = @correo');

        if (resultado.recordset.length === 0) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos.'
            });
        }

        const usuario = resultado.recordset[0];

        // Comprobar si el usuario está activo
        if (usuario.estado !== 'ACTIVO') {
            return res.status(403).json({
                mensaje: 'Tu cuenta está inactiva.'
            });
        }

        // Comparar la contraseña ingresada con la contraseña protegida
        const passwordCorrecta = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos.'
            });
        }

        // Generar token de autenticación
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        return res.status(200).json({
            mensaje: 'Inicio de sesión exitoso.',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al iniciar sesión.'
        });
    }
};

module.exports = {
    registrarUsuario,
    iniciarSesion
};
