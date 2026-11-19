
-- ==========================================
-- REUSE CAMPUS
-- Script de creacion de base de datos
-- ==========================================

CREATE DATABASE ReUseCampus;
GO

USE ReUseCampus;
GO

-- ==========================================
-- 1. USUARIOS
-- ==========================================

CREATE TABLE Usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'Usuario',
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT CK_Usuarios_Rol
        CHECK (rol IN ('Usuario', 'Administrador')),

    CONSTRAINT CK_Usuarios_Estado
        CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);
GO

-- ==========================================
-- 2. PUBLICACIONES
-- ==========================================

CREATE TABLE Publicaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    modalidad VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    fechaPublicacion DATETIME NOT NULL DEFAULT GETDATE(),
    usuarioId INT NOT NULL,

    CONSTRAINT FK_Publicaciones_Usuarios
        FOREIGN KEY (usuarioId) REFERENCES Usuarios(id),

    CONSTRAINT CK_Publicaciones_Modalidad
        CHECK (modalidad IN ('DONACION', 'INTERCAMBIO')),

    CONSTRAINT CK_Publicaciones_Estado
        CHECK (estado IN (
            'DISPONIBLE',
            'RESERVADA',
            'ENTREGADA',
            'CANCELADA'
        ))
);
GO

-- ==========================================
-- 3. SOLICITUDES
-- ==========================================

CREATE TABLE Solicitudes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    publicacionId INT NOT NULL,
    solicitanteId INT NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    fechaSolicitud DATETIME NOT NULL DEFAULT GETDATE(),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT FK_Solicitudes_Publicaciones
        FOREIGN KEY (publicacionId)
        REFERENCES Publicaciones(id),

    CONSTRAINT FK_Solicitudes_Usuarios
        FOREIGN KEY (solicitanteId)
        REFERENCES Usuarios(id),

    CONSTRAINT CK_Solicitudes_Estado
        CHECK (estado IN (
            'PENDIENTE',
            'ACEPTADA',
            'RECHAZADA',
            'CANCELADA'
        ))
);
GO

CREATE UNIQUE INDEX UX_Solicitudes_Pendientes
ON Solicitudes(publicacionId, solicitanteId)
WHERE estado = 'PENDIENTE';
GO

CREATE UNIQUE INDEX UX_Solicitudes_Aceptadas
ON Solicitudes(publicacionId)
WHERE estado = 'ACEPTADA';
GO

-- ==========================================
-- 4. ENTREGAS
-- ==========================================

CREATE TABLE Entregas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    publicacionId INT NOT NULL,
    solicitudId INT NOT NULL,
    propietarioId INT NOT NULL,
    receptorId INT NOT NULL,
    fechaAcuerdo DATETIME NOT NULL DEFAULT GETDATE(),
    fechaEntrega DATETIME NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT FK_Entregas_Publicaciones
        FOREIGN KEY (publicacionId)
        REFERENCES Publicaciones(id),

    CONSTRAINT FK_Entregas_Solicitudes
        FOREIGN KEY (solicitudId)
        REFERENCES Solicitudes(id),

    CONSTRAINT FK_Entregas_Propietario
        FOREIGN KEY (propietarioId)
        REFERENCES Usuarios(id),

    CONSTRAINT FK_Entregas_Receptor
        FOREIGN KEY (receptorId)
        REFERENCES Usuarios(id),

    CONSTRAINT UQ_Entregas_Solicitud
        UNIQUE (solicitudId),

    CONSTRAINT CK_Entregas_Estado
        CHECK (estado IN ('PENDIENTE', 'COMPLETADA')),

    CONSTRAINT CK_Entregas_Usuarios
        CHECK (propietarioId <> receptorId),

    CONSTRAINT CK_Entregas_Fecha
        CHECK (
            (estado = 'PENDIENTE' AND fechaEntrega IS NULL)
            OR
            (estado = 'COMPLETADA' AND fechaEntrega IS NOT NULL)
        )
);
GO
