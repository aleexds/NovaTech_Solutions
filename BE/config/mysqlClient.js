const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Leer configuración de config.json
const configRaw = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
const dbConfig = JSON.parse(configRaw).development;

// Pool de conexiones MySQL
const pool = mysql.createPool({
    host: dbConfig.host || '127.0.0.1',
    user: dbConfig.username || 'root',
    password: dbConfig.password || 'root',
    database: dbConfig.database || 'novatech',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
});

module.exports = { pool };
