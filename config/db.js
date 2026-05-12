const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'tramway.proxy.rlwy.net',  // Public host, hindi internal
    user: 'root',
    password: 'PnmvRFPDfGynuWpLBYExeTiQwGwNmWiX',  // Tamang password
    database: 'railway',
    port: 38719  // Tamang port
});

db.connect(err => {
    if (err) {
        console.error('DB Error:', err);
    } else {
        console.log('✅ MySQL Connected to Railway');
    }
});

module.exports = db;
