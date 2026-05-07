const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/db');

// Hearings page route - GET all hearings
router.get('/', isAuthenticated, (req, res) => {
    // Get all hearings with case information
    db.query(
        `SELECT h.*, c.title as case_title, c.case_number 
         FROM hearings h 
         LEFT JOIN cases c ON h.case_id = c.id 
         ORDER BY h.hearing_date DESC`,
        (err, hearings) => {
            if (err) {
                console.error('Error fetching hearings:', err);
                return res.render('hearings', { 
                    user: req.session.user || 'Attorney',
                    hearings: [],
                    cases: [],
                    error: 'Failed to load hearings'
                });
            }
            
            // Get cases for dropdown
            db.query(
                "SELECT id, case_number, title FROM cases ORDER BY created_at DESC",
                (err2, cases) => {
                    res.render('hearings', { 
                        user: req.session.user || 'Attorney',
                        hearings: hearings || [],
                        cases: cases || [],
                        success: req.query.success,
                        error: req.query.error
                    });
                }
            );
        }
    );
});

// Create new hearing
router.post('/create', isAuthenticated, (req, res) => {
    const { 
        case_id, hearing_date, hearing_time, court_room, 
        judge_name, hearing_type, status, notes, outcome
    } = req.body;
    
    if (!case_id || !hearing_date || !hearing_time) {
        return res.redirect('/hearings?error=Case, Date, and Time are required');
    }
    
    db.query(
        `INSERT INTO hearings (
            case_id, hearing_date, hearing_time, court_room, 
            judge_name, hearing_type, status, notes, outcome, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            case_id, hearing_date, hearing_time, court_room || null,
            judge_name || null, hearing_type || null, status || 'Scheduled',
            notes || null, outcome || null, req.session.userId
        ],
        (err, result) => {
            if (err) {
                console.error('Error creating hearing:', err);
                return res.redirect('/hearings?error=Failed to create hearing');
            }
            res.redirect('/hearings?success=Hearing scheduled successfully');
        }
    );
});

// Update hearing
router.post('/update/:id', isAuthenticated, (req, res) => {
    const hearingId = req.params.id;
    const { 
        case_id, hearing_date, hearing_time, court_room, 
        judge_name, hearing_type, status, notes, outcome
    } = req.body;
    
    db.query(
        `UPDATE hearings SET 
            case_id = ?, hearing_date = ?, hearing_time = ?, court_room = ?, 
            judge_name = ?, hearing_type = ?, status = ?, notes = ?, outcome = ?
        WHERE id = ?`,
        [
            case_id, hearing_date, hearing_time, court_room || null,
            judge_name || null, hearing_type || null, status || 'Scheduled',
            notes || null, outcome || null, hearingId
        ],
        (err, result) => {
            if (err) {
                console.error('Error updating hearing:', err);
                return res.redirect('/hearings?error=Failed to update hearing');
            }
            res.redirect('/hearings?success=Hearing updated successfully');
        }
    );
});

// Delete hearing
router.get('/delete/:id', isAuthenticated, (req, res) => {
    const hearingId = req.params.id;
    
    db.query('DELETE FROM hearings WHERE id = ?', [hearingId], (err, result) => {
        if (err) {
            console.error('Error deleting hearing:', err);
            return res.redirect('/hearings?error=Failed to delete hearing');
        }
        res.redirect('/hearings?success=Hearing deleted successfully');
    });
});

// Add this API route for edit functionality
router.get('/api/:id', isAuthenticated, (req, res) => {
    const hearingId = req.params.id;
    db.query('SELECT * FROM hearings WHERE id = ?', [hearingId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// Edit page route (fallback)
router.get('/edit/:id', isAuthenticated, (req, res) => {
    const hearingId = req.params.id;
    db.query('SELECT * FROM hearings WHERE id = ?', [hearingId], (err, results) => {
        if (err || results.length === 0) return res.redirect('/hearings?error=Hearing not found');
        db.query("SELECT id, case_number, title FROM cases ORDER BY created_at DESC", (err2, cases) => {
            res.render('hearings-edit', { hearing: results[0], cases: cases, user: req.session.user });
        });
    });
});

module.exports = router;