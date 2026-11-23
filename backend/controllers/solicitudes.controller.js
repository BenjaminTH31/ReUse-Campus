
const { sql } = require('../config/db');

// CREAR UNA SOLICITUD CON BLOQUEO PARA EVITAR RESERVAS SIMULTÁNEAS
const crearSolicitud = async (req, res) => {
    const transaccion = new sql.Transaction();
    let iniciada = false;

    try {
        const { publicacionId, mensaje } = req.body;
        const solicitanteId = req.usuario.id;
        const id = Number(publicacionId);

        if (!Number.isInteger(id) || id <= 0 ||
            typeof mensaje !== 'string' || !mensaje.trim()) {
            return res.status(400).json({
                mensaje: 'La publicación y el mensaje son obligatorios.'
            });
        }

        if (mensaje.trim().length > 500) {
            return res.status(400).json({
                mensaje: 'El mensaje no puede superar los 500 caracteres.'
            });
        }

        await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        iniciada = true;

        // Bloqueamos la publicación mientras comprobamos su estado y creamos la solicitud.
        const publicacion = await new sql.Request(transaccion)
            .input('id', sql.Int, id)
            .query(`
                SELECT id, usuarioId, estado
                FROM Publicaciones WITH (UPDLOCK, HOLDLOCK)
                WHERE id = @id
            `);

        if (publicacion.recordset.length === 0) {
            await transaccion.rollback();
            return res.status(404).json({ mensaje: 'La publicación no existe.' });
        }

        const datos = publicacion.recordset[0];

        if (datos.usuarioId === solicitanteId) {
            await transaccion.rollback();
            return res.status(400).json({ mensaje: 'No puedes solicitar tu propia publicación.' });
        }

        if (datos.estado !== 'DISPONIBLE') {
            await transaccion.rollback();
            return res.status(400).json({ mensaje: 'Esta publicación ya no está disponible.' });
        }

        const existente = await new sql.Request(transaccion)
            .input('publicacionId', sql.Int, id)
            .input('solicitanteId', sql.Int, solicitanteId)
            .query(`
                SELECT id FROM Solicitudes
                WHERE publicacionId = @publicacionId
                  AND solicitanteId = @solicitanteId
                  AND estado = 'PENDIENTE'
            `);

        if (existente.recordset.length > 0) {
            await transaccion.rollback();
            return res.status(409).json({ mensaje: 'Ya tienes una solicitud pendiente para esta publicación.' });
        }

        const resultado = await new sql.Request(transaccion)
            .input('publicacionId', sql.Int, id)
            .input('solicitanteId', sql.Int, solicitanteId)
            .input('mensaje', sql.VarChar(500), mensaje.trim())
            .query(`
                INSERT INTO Solicitudes (publicacionId, solicitanteId, mensaje)
                OUTPUT INSERTED.*
                VALUES (@publicacionId, @solicitanteId, @mensaje)
            `);

        await transaccion.commit();
        iniciada = false;

        return res.status(201).json({
            mensaje: 'Solicitud creada correctamente.',
            solicitud: resultado.recordset[0]
        });

    } catch (error) {
        if (iniciada) await transaccion.rollback();
        console.error('Error al crear solicitud:', error.message);

        if (error.number === 2601 || error.number === 2627) {
            return res.status(409).json({
                mensaje: 'Ya tienes una solicitud pendiente para esta publicación.'
            });
        }

        return res.status(500).json({ mensaje: 'Error interno al crear la solicitud.' });
    }
};

// OBTENER SOLICITUDES DE UNA PUBLICACIÓN
// Solo puede consultarlas su propietario o un administrador.
const obtenerSolicitudesPorPublicacion = async (req, res) => {
    try {
        const { publicacionId } = req.params;

        if (!Number.isInteger(Number(publicacionId)) ||
            Number(publicacionId) <= 0) {
            return res.status(400).json({
                mensaje: 'ID de publicación inválido.'
            });
        }

        const publicacion = await new sql.Request()
            .input('id', sql.Int, Number(publicacionId))
            .query(`
                SELECT usuarioId
                FROM Publicaciones
                WHERE id = @id
            `);

        if (publicacion.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'La publicación no existe.'
            });
        }

        const propietarioId = publicacion.recordset[0].usuarioId;
        const esAdministrador = req.usuario.rol === 'Administrador';

        if (propietarioId !== req.usuario.id && !esAdministrador) {
            return res.status(403).json({
                mensaje: 'No tienes permiso para ver estas solicitudes.'
            });
        }

        const resultado = await new sql.Request()
            .input('publicacionId', sql.Int, Number(publicacionId))
            .query(`
                SELECT
                    S.id,
                    S.publicacionId,
                    S.solicitanteId,
                    S.mensaje,
                    S.fechaSolicitud,
                    S.estado,
                    U.nombre AS solicitante
                FROM Solicitudes S
                INNER JOIN Usuarios U ON S.solicitanteId = U.id
                WHERE S.publicacionId = @publicacionId
                ORDER BY S.fechaSolicitud DESC
            `);

        return res.status(200).json(resultado.recordset);

    } catch (error) {
        console.error('Error al obtener solicitudes:', error.message);

        return res.status(500).json({
            mensaje: 'Error al obtener las solicitudes.'
        });
    }
};

// OBTENER LAS SOLICITUDES ENVIADAS POR EL USUARIO ACTUAL
const obtenerMisSolicitudes = async (req, res) => {
    try {
        const resultado = await new sql.Request()
            .input('solicitanteId', sql.Int, req.usuario.id)
            .query(`
                SELECT
                    S.id, S.publicacionId, S.solicitanteId, S.mensaje,
                    S.fechaSolicitud, S.estado, P.titulo
                FROM Solicitudes S
                INNER JOIN Publicaciones P ON P.id = S.publicacionId
                WHERE S.solicitanteId = @solicitanteId
                ORDER BY S.fechaSolicitud DESC
            `);

        return res.status(200).json(resultado.recordset);
    } catch (error) {
        console.error('Error al obtener mis solicitudes:', error.message);
        return res.status(500).json({ mensaje: 'Error al obtener tus solicitudes.' });
    }
};

// ACEPTAR UNA SOLICITUD
const aceptarSolicitud = async (req, res) => {
    const transaccion = new sql.Transaction();
    let iniciada = false;

    try {
        const { id } = req.params;
        const solicitudId = Number(id);
        const propietarioId = req.usuario.id;

        if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
            return res.status(400).json({
                mensaje: 'ID de solicitud inválido.'
            });
        }

        await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        iniciada = true;

        // Buscar y bloquear la solicitud y su publicación
        const solicitud = await new sql.Request(transaccion)
            .input('id', sql.Int, solicitudId)
            .query(`
                SELECT
                    S.id,
                    S.publicacionId,
                    S.solicitanteId,
                    S.estado AS estadoSolicitud,
                    P.usuarioId AS propietarioId,
                    P.estado AS estadoPublicacion
                FROM Solicitudes S WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN Publicaciones P WITH (UPDLOCK, HOLDLOCK)
                    ON P.id = S.publicacionId
                WHERE S.id = @id
            `);

        if (solicitud.recordset.length === 0) {
            await transaccion.rollback();
            return res.status(404).json({
                mensaje: 'Solicitud no encontrada.'
            });
        }

        const datos = solicitud.recordset[0];

        if (datos.propietarioId !== propietarioId) {
            await transaccion.rollback();
            return res.status(403).json({
                mensaje: 'Solo el propietario puede aceptar esta solicitud.'
            });
        }

        if (datos.estadoSolicitud !== 'PENDIENTE') {
            await transaccion.rollback();
            return res.status(400).json({
                mensaje: 'La solicitud ya no está pendiente.'
            });
        }

        if (datos.estadoPublicacion !== 'DISPONIBLE') {
            await transaccion.rollback();
            return res.status(400).json({
                mensaje: 'La publicación ya no está disponible.'
            });
        }

        // Reservar la publicación
        await new sql.Request(transaccion)
            .input('id', sql.Int, datos.publicacionId)
            .query(`
                UPDATE Publicaciones
                SET estado = 'RESERVADA'
                WHERE id = @id AND estado = 'DISPONIBLE'
            `);

        // Aceptar la solicitud elegida
        await new sql.Request(transaccion)
            .input('id', sql.Int, solicitudId)
            .query(`
                UPDATE Solicitudes
                SET estado = 'ACEPTADA'
                WHERE id = @id AND estado = 'PENDIENTE'
            `);

        // Rechazar las demás solicitudes pendientes
        await new sql.Request(transaccion)
            .input('publicacionId', sql.Int, datos.publicacionId)
            .input('idAceptada', sql.Int, solicitudId)
            .query(`
                UPDATE Solicitudes
                SET estado = 'RECHAZADA'
                WHERE publicacionId = @publicacionId
                  AND id <> @idAceptada
                  AND estado = 'PENDIENTE'
            `);

        // Crear automáticamente el registro de entrega
        const entrega = await new sql.Request(transaccion)
            .input('publicacionId', sql.Int, datos.publicacionId)
            .input('solicitudId', sql.Int, solicitudId)
            .input('propietarioId', sql.Int, datos.propietarioId)
            .input('receptorId', sql.Int, datos.solicitanteId)
            .query(`
                INSERT INTO Entregas
                    (publicacionId, solicitudId, propietarioId,
                     receptorId, fechaAcuerdo, estado)
                OUTPUT INSERTED.*
                VALUES
                    (@publicacionId, @solicitudId, @propietarioId,
                     @receptorId, GETDATE(), 'PENDIENTE')
            `);

        await transaccion.commit();
        iniciada = false;

        return res.status(200).json({
            mensaje: 'Solicitud aceptada y entrega creada correctamente.',
            entrega: entrega.recordset[0]
        });

    } catch (error) {
        if (iniciada) {
            await transaccion.rollback();
        }

        console.error('Error al aceptar solicitud:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al aceptar la solicitud.'
        });
    }
};

// RECHAZAR UNA SOLICITUD
const rechazarSolicitud = async (req, res) => {
    try {
        const solicitudId = Number(req.params.id);
        const propietarioId = req.usuario.id;

        if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
            return res.status(400).json({
                mensaje: 'ID de solicitud inválido.'
            });
        }

        const resultado = await new sql.Request()
            .input('id', sql.Int, solicitudId)
            .input('propietarioId', sql.Int, propietarioId)
            .query(`
                UPDATE S
                SET estado = 'RECHAZADA'
                OUTPUT INSERTED.*
                FROM Solicitudes S
                INNER JOIN Publicaciones P
                    ON P.id = S.publicacionId
                WHERE S.id = @id
                  AND P.usuarioId = @propietarioId
                  AND S.estado = 'PENDIENTE'
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Solicitud no encontrada, no te pertenece o ya fue resuelta.'
            });
        }

        return res.status(200).json({
            mensaje: 'Solicitud rechazada correctamente.',
            solicitud: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al rechazar solicitud:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al rechazar la solicitud.'
        });
    }
};


// CANCELAR UNA SOLICITUD PROPIA
const cancelarSolicitud = async (req, res) => {
    try {
        const solicitudId = Number(req.params.id);
        const solicitanteId = req.usuario.id;

        if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
            return res.status(400).json({
                mensaje: 'ID de solicitud inválido.'
            });
        }

        const resultado = await new sql.Request()
            .input('id', sql.Int, solicitudId)
            .input('solicitanteId', sql.Int, solicitanteId)
            .query(`
                UPDATE Solicitudes
                SET estado = 'CANCELADA'
                OUTPUT INSERTED.*
                WHERE id = @id
                  AND solicitanteId = @solicitanteId
                  AND estado = 'PENDIENTE'
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Solicitud no encontrada, no te pertenece o ya fue resuelta.'
            });
        }

        return res.status(200).json({
            mensaje: 'Solicitud cancelada correctamente.',
            solicitud: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al cancelar solicitud:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al cancelar la solicitud.'
        });
    }
};


module.exports = {
    crearSolicitud,
    obtenerSolicitudesPorPublicacion,
    obtenerMisSolicitudes,
    aceptarSolicitud,
    rechazarSolicitud,
    cancelarSolicitud
};
