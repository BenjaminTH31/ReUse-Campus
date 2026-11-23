
const { sql } = require('../config/db');

// OBTENER TODAS LAS PUBLICACIONES
const obtenerPublicaciones = async (req, res) => {
    try {
        const resultado = await new sql.Request().query(`
            SELECT
                P.id,
                P.titulo,
                P.descripcion,
                P.categoria,
                P.modalidad,
                P.estado,
                P.fechaPublicacion,
                P.usuarioId,
                U.nombre AS propietario
            FROM Publicaciones P
            INNER JOIN Usuarios U ON P.usuarioId = U.id
            ORDER BY P.fechaPublicacion DESC
        `);

        return res.status(200).json(resultado.recordset);

    } catch (error) {
        console.error('Error al obtener publicaciones:', error.message);
        return res.status(500).json({
            mensaje: 'Error al obtener las publicaciones.'
        });
    }
};

// OBTENER UNA PUBLICACIÓN POR ID
const obtenerPublicacionPorId = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'ID de publicación inválido.'
            });
        }

        const resultado = await new sql.Request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    P.id,
                    P.titulo,
                    P.descripcion,
                    P.categoria,
                    P.modalidad,
                    P.estado,
                    P.fechaPublicacion,
                    P.usuarioId,
                    U.nombre AS propietario
                FROM Publicaciones P
                INNER JOIN Usuarios U ON P.usuarioId = U.id
                WHERE P.id = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Publicación no encontrada.'
            });
        }

        return res.status(200).json(resultado.recordset[0]);

    } catch (error) {
        console.error('Error al obtener publicación:', error.message);
        return res.status(500).json({
            mensaje: 'Error al obtener la publicación.'
        });
    }
};

// CREAR UNA PUBLICACIÓN
const crearPublicacion = async (req, res) => {
    try {
        const { titulo, descripcion, categoria, modalidad } = req.body;

        if (
            !titulo?.trim() ||
            !descripcion?.trim() ||
            !categoria?.trim() ||
            !modalidad
        ) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios.'
            });
        }

        const modalidadesPermitidas = ['DONACION', 'INTERCAMBIO'];

        if (!modalidadesPermitidas.includes(modalidad)) {
            return res.status(400).json({
                mensaje: 'La modalidad debe ser DONACION o INTERCAMBIO.'
            });
        }

        const resultado = await new sql.Request()
            .input('titulo', sql.VarChar(150), titulo.trim())
            .input('descripcion', sql.VarChar(500), descripcion.trim())
            .input('categoria', sql.VarChar(80), categoria.trim())
            .input('modalidad', sql.VarChar(20), modalidad)
            .input('usuarioId', sql.Int, req.usuario.id)
            .query(`
                INSERT INTO Publicaciones
                    (titulo, descripcion, categoria, modalidad, usuarioId)
                OUTPUT INSERTED.*
                VALUES
                    (@titulo, @descripcion, @categoria, @modalidad, @usuarioId)
            `);

        return res.status(201).json({
            mensaje: 'Publicación creada correctamente.',
            publicacion: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear publicación:', error.message);
        return res.status(500).json({
            mensaje: 'Error interno al crear la publicación.'
        });
    }
};

// EDITAR UNA PUBLICACIÓN
const editarPublicacion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const usuarioId = req.usuario.id;
        const { titulo, descripcion, categoria, modalidad } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'ID de publicación inválido.'
            });
        }

        if (
            !titulo?.trim() ||
            !descripcion?.trim() ||
            !categoria?.trim() ||
            !modalidad
        ) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios.'
            });
        }

        if (!['DONACION', 'INTERCAMBIO'].includes(modalidad)) {
            return res.status(400).json({
                mensaje: 'Modalidad inválida.'
            });
        }

        const resultado = await new sql.Request()
            .input('id', sql.Int, id)
            .input('usuarioId', sql.Int, usuarioId)
            .input('titulo', sql.VarChar(150), titulo.trim())
            .input('descripcion', sql.VarChar(500), descripcion.trim())
            .input('categoria', sql.VarChar(80), categoria.trim())
            .input('modalidad', sql.VarChar(20), modalidad)
            .query(`
                UPDATE Publicaciones
                SET titulo = @titulo,
                    descripcion = @descripcion,
                    categoria = @categoria,
                    modalidad = @modalidad
                OUTPUT INSERTED.*
                WHERE id = @id
                  AND usuarioId = @usuarioId
                  AND estado = 'DISPONIBLE'
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Publicación no encontrada, no te pertenece o ya no está disponible para editar.'
            });
        }

        return res.status(200).json({
            mensaje: 'Publicación actualizada correctamente.',
            publicacion: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al editar publicación:', error.message);
        return res.status(500).json({
            mensaje: 'Error interno al editar la publicación.'
        });
    }
};

// CANCELAR UNA PUBLICACIÓN SIN BORRAR EL HISTORIAL
const cancelarPublicacion = async (req, res) => {
    const transaccion = new sql.Transaction();
    let iniciada = false;

    try {
        const id = Number(req.params.id);
        const usuarioId = req.usuario.id;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ mensaje: 'ID de publicación inválido.' });
        }

        await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        iniciada = true;

        const resultado = await new sql.Request(transaccion)
            .input('id', sql.Int, id)
            .input('usuarioId', sql.Int, usuarioId)
            .query(`
                UPDATE Publicaciones WITH (UPDLOCK, HOLDLOCK)
                SET estado = 'CANCELADA'
                OUTPUT INSERTED.*
                WHERE id = @id
                  AND usuarioId = @usuarioId
                  AND estado = 'DISPONIBLE'
            `);

        if (resultado.recordset.length === 0) {
            await transaccion.rollback();
            return res.status(404).json({
                mensaje: 'Publicación no encontrada, no te pertenece o no se puede cancelar en su estado actual.'
            });
        }

        await new sql.Request(transaccion)
            .input('publicacionId', sql.Int, id)
            .query(`
                UPDATE Solicitudes
                SET estado = 'CANCELADA'
                WHERE publicacionId = @publicacionId
                  AND estado = 'PENDIENTE'
            `);

        await transaccion.commit();
        iniciada = false;

        return res.status(200).json({
            mensaje: 'Publicación cancelada y solicitudes pendientes cerradas correctamente.',
            publicacion: resultado.recordset[0]
        });

    } catch (error) {
        if (iniciada) await transaccion.rollback();
        console.error('Error al cancelar publicación:', error.message);
        return res.status(500).json({ mensaje: 'Error interno al cancelar la publicación.' });
    }
};

module.exports = {
    obtenerPublicaciones,
    obtenerPublicacionPorId,
    crearPublicacion,
    editarPublicacion,
    cancelarPublicacion
};
