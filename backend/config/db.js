
const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    driver: 'ODBC Driver 18 for SQL Server',
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const conectarDB = async () => {
    try {
        await sql.connect(config);
        console.log('Conectado a SQL Server correctamente.');
    } catch (error) {
        console.error('Error al conectar con SQL Server:', error.message);
        throw error;
    }
};

module.exports = {
    sql,
    conectarDB
};
