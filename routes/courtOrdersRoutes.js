const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/db');

// Create upload directories if they don't exist
const uploadDir = 'public/uploads/court-orders/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Setup - File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .pdf, .doc, .docx files are allowed'));
    }
});

// Get all court orders
router.get('/', isAuthenticated, (req, res) => {
    db.query('SELECT id, case_title, order_type, issued_date, received_date, judge_name, court_branch, summary, key_provisions, status, compliance_date, file_path, created_by, created_at FROM court_orders ORDER BY issued_date DESC', (err, orders) => {
        if (err) {
            console.error(err);
            return res.render('court-orders', { 
                orders: [], 
                user: req.session.username || 'Attorney', 
                success: null, 
                error: 'Error loading court orders' 
            });
        }

        res.render('court-orders', {
            user: req.session.username || 'Attorney',
            orders: orders || [],
            success: req.query.success || null,
            error: req.query.error || null,
            viewId: req.query.view || null
        });
    });
});

// Get single court order (for viewing/editing)
router.get('/:id', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM court_orders WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(results[0]);
    });
});

// Create new court order
router.post('/create', isAuthenticated, upload.single('order_file'), (req, res) => {
    const { 
        case_title, order_type, issued_date, received_date,
        judge_name, court_branch, summary, key_provisions, status, compliance_date 
    } = req.body;

    const file_path = req.file ? `/uploads/court-orders/${req.file.filename}` : null;

    db.query(`
        INSERT INTO court_orders 
        (case_title, order_type, issued_date, received_date, 
         judge_name, court_branch, summary, key_provisions, status, 
         compliance_date, file_path, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            case_title, order_type, issued_date, 
            received_date || null, judge_name, court_branch, 
            summary, key_provisions, status || 'Received', 
            compliance_date || null, file_path, req.session.userId
        ],
        (err) => {
            if (err) {
                console.error(err);
                return res.redirect('/court-orders?error=Failed to create court order');
            }
            res.redirect('/court-orders?success=Court order added successfully');
        }
    );
});

// Update court order
router.post('/update/:id', isAuthenticated, upload.single('order_file'), (req, res) => {
    const { 
        case_title, order_type, issued_date, received_date,
        judge_name, court_branch, summary, key_provisions, status, compliance_date 
    } = req.body;

    const file_path = req.file ? `/uploads/court-orders/${req.file.filename}` : null;

    let query = `
        UPDATE court_orders SET 
        case_title=?, order_type=?, issued_date=?, 
        received_date=?, judge_name=?, court_branch=?, summary=?, 
        key_provisions=?, status=?, compliance_date=?`;

    let params = [
        case_title, order_type, issued_date, 
        received_date || null, judge_name, court_branch, summary, 
        key_provisions, status, compliance_date || null
    ];

    if (file_path) {
        query += ", file_path=?";
        params.push(file_path);
    }

    query += " WHERE id=?";
    params.push(req.params.id);

    db.query(query, params, (err) => {
        if (err) {
            console.error(err);
            return res.redirect('/court-orders?error=Failed to update order');
        }
        res.redirect('/court-orders?success=Court order updated successfully');
    });
});

// Delete court order
router.delete('/delete/:id', isAuthenticated, (req, res) => {
    // First get the file path to delete the actual file
    db.query('SELECT file_path FROM court_orders WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Delete the file if it exists
        if (results[0] && results[0].file_path) {
            const filePath = path.join(__dirname, '..', 'public', results[0].file_path);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            });
        }
        
        // Delete from database
        db.query("DELETE FROM court_orders WHERE id = ?", [req.params.id], (deleteErr) => {
            if (deleteErr) {
                console.error(deleteErr);
                return res.status(500).json({ error: 'Failed to delete order' });
            }
            res.json({ success: true });
        });
    });
});

// Download order file
router.get('/download/:id', isAuthenticated, (req, res) => {
    db.query('SELECT file_path FROM court_orders WHERE id = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0 || !results[0].file_path) {
            return res.status(404).send('File not found');
        }
        
        const filePath = path.join(__dirname, '..', 'public', results[0].file_path);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send('File not found on server');
        }
    });
});

module.exports = router;
