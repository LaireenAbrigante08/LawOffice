const db = require('../config/db');

exports.showLogin = (req, res) => {
    res.render('login', { errorMessage: null });
};

exports.login = (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt for:', username);
    
    db.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username],
        (err, users) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('login', { errorMessage: 'Database error. Please try again.' });
            }
            
            if (users.length > 0) {
                const user = users[0];
                
                if (password === user.password) {
                    // Get IP address
                    const ip = req.headers['x-forwarded-for'] || 
                              req.connection.remoteAddress || 
                              req.socket.remoteAddress || 
                              req.ip;
                    
                    let cleanIp = ip;
                    if (cleanIp && cleanIp.startsWith('::ffff:')) {
                        cleanIp = cleanIp.substring(7);
                    }
                    if (cleanIp === '::1') {
                        cleanIp = '127.0.0.1';
                    }
                    
                    // Record LOGIN activity
                    db.query(
                        'INSERT INTO activity_logs (user_id, username, action, ip_address, timestamp) VALUES (?, ?, "Login", ?, NOW())',
                        [user.id, user.username, cleanIp],
                        (logErr) => {
                            if (logErr) {
                                console.error('Error logging login:', logErr);
                            } else {
                                console.log('✅ Login recorded for:', user.username, 'at', new Date().toLocaleString());
                            }
                        }
                    );
                    
                    req.session.userId = user.id;
                    req.session.username = user.username;
                    req.session.user = user.full_name || user.username;
                    req.session.userRole = user.position;
                    req.session.lastLogin = new Date().toLocaleString();
                    
                    console.log('Login successful for:', user.username);
                    res.redirect('/dashboard');
                } else {
                    res.render('login', { errorMessage: 'Invalid password' });
                }
            } else {
                res.render('login', { errorMessage: 'User not found' });
            }
        }
    );
};

exports.logout = (req, res) => {
    const userId = req.session.userId;
    const username = req.session.username;
    
    console.log('Logout attempt for:', username);
    
    if (userId && username) {
        const ip = req.headers['x-forwarded-for'] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress || 
                  req.ip;
        
        let cleanIp = ip;
        if (cleanIp && cleanIp.startsWith('::ffff:')) {
            cleanIp = cleanIp.substring(7);
        }
        if (cleanIp === '::1') {
            cleanIp = '127.0.0.1';
        }
        
        // Record LOGOUT activity
        db.query(
            'INSERT INTO activity_logs (user_id, username, action, ip_address, timestamp) VALUES (?, ?, "Logout", ?, NOW())',
            [userId, username, cleanIp],
            (logErr) => {
                if (logErr) {
                    console.error('Error logging logout:', logErr);
                } else {
                    console.log('✅ Logout recorded for:', username, 'at', new Date().toLocaleString());
                }
            }
        );
    }
    
    req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
        res.redirect('/login');
    });
};
