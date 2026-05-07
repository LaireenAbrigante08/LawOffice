const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,      // ✅ Gamitin ang MYSQL_HOST mula sa Railway
    user: process.env.DB_USER,          // ✅ Gamitin ang DB_USER
    password: process.env.DB_PASSWORD,  // ✅ Gamitin ang DB_PASSWORD
    database: process.env.DB_NAME || 'railway',  // ✅ database name (try 'railway' or kung ano nasa MySQL)
    port: process.env.DB_PORT || 3306   // ✅ port number
});

db.connect(err => {
    if (err) {
        console.error('DB Error:', err);
    } else {
        console.log('✅ MySQL Connected');
    }
});

module.exports = db;