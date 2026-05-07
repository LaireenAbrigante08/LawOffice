const mysql = require('mysql2');
require('dotenv').config();  // ← I-add ito para sa local development

// Gamitin ang environment variables o fallback sa local values
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lawoffice_db',
    port: process.env.DB_PORT || 3306
};

console.log('🔌 Connecting to database with config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    hasPassword: !!dbConfig.password  // Para hindi ma-print ang actual password
});

const db = mysql.createConnection(dbConfig);

db.connect(err => {
    if (err) {
        console.error('❌ DB Error:', err);
    } else {
        console.log('✅ MySQL Connected');
    }
});

module.exports = db;