const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer'); // IMPORTANT: This line fixes the error

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const casesRoutes = require('./routes/casesRoutes.js');
const hearingsRoutes = require('./routes/hearingsRoutes.js');
const analyticsRoutes = require('./routes/analyticsRoutes.js');
const courtOrdersRoutes = require('./routes/courtOrdersRoutes');
const staffRoutes = require('./routes/staffRoutes.js');

const app = express();

// Configure multer for file uploads (ADD THIS SECTION)
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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
    secret: 'lawoffice_secret',
    resave: false,
    saveUninitialized: false
}));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
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