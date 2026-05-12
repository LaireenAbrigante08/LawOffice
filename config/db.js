const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'mysql.railway.internal',  // internal - walang egress cost
    user: 'root',
    password: 'PmWkFPDtGynuWpLBYExeTIQwGwNmWiX',  // bagong password
    database: 'railway',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error('DB Error:', err);
    } else {
        console.log('✅ MySQL Connected to Railway');
    }
});

module.exports = db;
