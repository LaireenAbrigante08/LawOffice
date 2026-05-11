const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const db = require('./config/db');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware - IMPORTANT: These must come FIRST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
    secret: 'lawoffice_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============ API ROUTES ============

// API: Get activity logs
app.get('/api/activity-logs', isAuthenticated, (req, res) => {
    console.log('API /api/activity-logs called - User:', req.session.username);
    
    const query = `
        SELECT al.*, u.full_name 
        FROM activity_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ORDER BY al.timestamp DESC 
        LIMIT 100
    `;
    
    db.query(query, (err, logs) => {
        if (err) {
            console.error('Error fetching activity logs:', err);
            return res.status(500).json({ logs: [], error: err.message });
        }
        console.log('Found logs:', logs ? logs.length : 0);
        res.json({ logs: logs || [] });
    });
});

// API: Change password
app.post('/api/change-password', isAuthenticated, (req, res) => {
    const { current_password, new_password } = req.body;
    const userId = req.session.userId;
    const username = req.session.username;
    
    console.log('Change password request for user:', username);
    
    if (!new_password || new_password.length < 6) {
        return res.json({ success: false, error: 'New password must be at least 6 characters' });
    }
    
    db.query('SELECT password FROM users WHERE id = ?', [userId], (err, users) => {
        if (err || users.length === 0) {
            return res.json({ success: false, error: 'User not found' });
        }
        
        if (users[0].password !== current_password) {
            return res.json({ success: false, error: 'Current password is incorrect' });
        }
        
        db.query('UPDATE users SET password = ? WHERE id = ?', [new_password, userId], (updateErr) => {
            if (updateErr) {
                console.error('Error updating password:', updateErr);
                return res.json({ success: false, error: 'Failed to update password' });
            }
            
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
            
            db.query(
                'INSERT INTO activity_logs (user_id, username, action, ip_address, timestamp) VALUES (?, ?, "Password Change", ?, NOW())',
                [userId, username, cleanIp],
                (logErr) => {
                    if (logErr) console.error('Error logging password change:', logErr);
                }
            );
            
            res.json({ success: true, message: 'Password changed successfully' });
        });
    });
});

// ============ END API ROUTES ============

// Import route modules
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const casesRoutes = require('./routes/casesRoutes.js');
const hearingsRoutes = require('./routes/hearingsRoutes.js');
const analyticsRoutes = require('./routes/analyticsRoutes.js');
const courtOrdersRoutes = require('./routes/courtOrdersRoutes');
const staffRoutes = require('./routes/staffRoutes.js');

// Regular Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/cases', casesRoutes);
app.use('/hearings', hearingsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/court-orders', courtOrdersRoutes);
app.use('/staff', staffRoutes);

// Error handling middleware for multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.redirect('/court-orders?error=File too large. Max size is 10MB');
        }
        return res.redirect('/court-orders?error=Upload error: ' + err.message);
    } else if (err) {
        console.error('Server error:', err);
        return res.redirect('/court-orders?error=' + encodeURIComponent(err.message));
    }
    next();
});

// Default route
app.get('/', (req, res) => res.redirect('/login'));

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Page Not Found',
        user: req.session.user || null
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).render('error', { 
        title: 'Server Error',
        message: 'Something went wrong. Please try again later.',
        user: req.session.user || null
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
