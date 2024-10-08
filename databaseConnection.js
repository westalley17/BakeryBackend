// databaseConnection.js
const sql = require('mssql');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MS SQL Server connection configuration
const dbConfig = {
    user: process.env.AZURE_SQL_USERNAME,
    password: process.env.AZURE_SQL_PASSWORD,
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    options: {
        encrypt: true, // for Azure
        trustServerCertificate: true // set to true for local development with self-signed certs
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Initialize connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

module.exports = { pool, poolConnect };
