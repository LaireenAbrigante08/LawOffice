const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'mysql.railway.internal',
    user: 'root',
    password: 'ZlflTFTvCJQFgAJtmoModdigSeLjePgR',
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
