const db = require('../config/db');

exports.showLogin = (req, res) => {
    res.render('login', { errorMessage: null });
};

exports.login = (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt for:', username);
    
    // Query user from database using callback
    db.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username],
        (err, users) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('login', { errorMessage: 'Database error. Please try again.' });
            }
            
            console.log('Found users:', users.length);
            
            if (users.length > 0) {
                const user = users[0];
                
                // Direct string comparison for plain text passwords
                if (password === user.password) {
                    // Set session
                    req.session.userId = user.id;
                    req.session.username = user.username;
                    req.session.user = user.full_name || user.username;
                    req.session.userRole = user.position;
                    req.session.lastLogin = new Date().toLocaleString();
                    
                    console.log('Login successful for:', user.username);
                    res.redirect('/dashboard');
                } else {
                    console.log('Password mismatch for user:', user.username);
                    console.log('Entered:', password);
                    console.log('Stored:', user.password);
                    res.render('login', { errorMessage: 'Invalid password' });
                }
            } else {
                console.log('User not found:', username);
                res.render('login', { errorMessage: 'User not found' });
            }
        }
    );
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};