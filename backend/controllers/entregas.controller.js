
const { sql } = require('../config/db');

// OBTENER LAS ENTREGAS DEL USUARIO
const obtenerMisEntregas = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const resultado = await new sql.Request()
            .input('usuarioId', sql.Int, usuarioId)
            .query(`
                SELECT
                    E.id,
                    E.publicacionId,
                    E.solicitudId,
                    E.propietarioId,
                    E.receptorId,
                    E.fechaAcuerdo,
                    E.fechaEntrega,
                    E.estado,
                    P.titulo,
                    UP.nombre AS propietario,
                    UR.nombre AS receptor
                FROM Entregas E
                INNER JOIN Publicaciones P
                    ON P.id = E.publicacionId
                INNER JOIN Usuarios UP
                    ON UP.id = E.propietarioId
                INNER JOIN Usuarios UR
                    ON UR.id = E.receptorId
                WHERE E.propietarioId = @usuarioId
                   OR E.receptorId = @usuarioId
                ORDER BY E.fechaAcuerdo DESC
            `);

        return res.status(200).json(resultado.recordset);

    } catch (error) {
        console.error('Error al obtener entregas:', error.message);

        return res.status(500).json({
            mensaje: 'Error al obtener las entregas.'
        });
    }
};

// COMPLETAR UNA ENTREGA
const completarEntrega = async (req, res) => {
    const transaccion = new sql.Transaction();
    let iniciada = false;

    try {
        const entregaId = Number(req.params.id);
        const usuarioId = req.usuario.id;

        if (!Number.isInteger(entregaId) || entregaId <= 0) {
            return res.status(400).json({
                mensaje: 'ID de entrega inválido.'
            });
        }

        await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        iniciada = true;

        // Buscar y bloquear la entrega
        const resultado = await new sql.Request(transaccion)
            .input('id', sql.Int, entregaId)
            .query(`
                SELECT
                    E.id,
                    E.publicacionId,
                    E.propietarioId,
                    E.receptorId,
                    E.estado AS estadoEntrega,
                    P.estado AS estadoPublicacion
                FROM Entregas E WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN Publicaciones P WITH (UPDLOCK, HOLDLOCK)
                    ON P.id = E.publicacionId
                WHERE E.id = @id
            `);

        if (resultado.recordset.length === 0) {
            await transaccion.rollback();
            return res.status(404).json({
                mensaje: 'Entrega no encontrada.'
            });
        }

        const entrega = resultado.recordset[0];

        // Solo pueden confirmar el propietario o el receptor
        if (
            entrega.propietarioId !== usuarioId &&
            entrega.receptorId !== usuarioId
        ) {
            await transaccion.rollback();
            return res.status(403).json({
                mensaje: 'No tienes permiso para completar esta entrega.'
            });
        }

        if (entrega.estadoEntrega !== 'PENDIENTE') {
            await transaccion.rollback();
            return res.status(400).json({
                mensaje: 'Esta entrega ya fue completada.'
            });
        }

        if (entrega.estadoPublicacion !== 'RESERVADA') {
            await transaccion.rollback();
            return res.status(400).json({
                mensaje: 'La publicación no se encuentra reservada.'
            });
        }

        // Marcar entrega como completada
        await new sql.Request(transaccion)
            .input('id', sql.Int, entregaId)
            .query(`
                UPDATE Entregas
                SET estado = 'COMPLETADA',
                    fechaEntrega = GETDATE()
                WHERE id = @id AND estado = 'PENDIENTE'
            `);

        // Marcar publicación como entregada
        await new sql.Request(transaccion)
            .input('id', sql.Int, entrega.publicacionId)
            .query(`
                UPDATE Publicaciones
                SET estado = 'ENTREGADA'
                WHERE id = @id AND estado = 'RESERVADA'
            `);

        await transaccion.commit();
        iniciada = false;

        return res.status(200).json({
            mensaje: 'Entrega completada correctamente. La publicación ahora está ENTREGADA.'
        });

    } catch (error) {
        if (iniciada) {
            await transaccion.rollback();
        }

        console.error('Error al completar entrega:', error.message);

        return res.status(500).json({
            mensaje: 'Error interno al completar la entrega.'
        });
    }
};

module.exports = {
    obtenerMisEntregas,
    completarEntrega
};
