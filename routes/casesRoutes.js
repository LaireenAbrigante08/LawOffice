const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/db');

// GET All Cases
router.get('/', isAuthenticated, (req, res) => {
    const success = req.query.success || null;
    const error = req.query.error || null;

    db.query(
        `SELECT c.*, u.full_name as assigned_lawyer_name
         FROM cases c
         LEFT JOIN users u ON c.assigned_lawyer_id = u.id
         ORDER BY c.created_at DESC`,
        (err, cases) => {
            if (err) {
                console.error('Error fetching cases:', err);
                return res.render('cases', {
                    user: req.session.user || 'Attorney',
                    cases: [],
                    lawyers: [],
                    success: null,
                    error: 'Failed to load cases'
                });
            }

            // Get lawyers for dropdown
            db.query(
                "SELECT id, full_name FROM users WHERE position IN ('Attorney', 'Paralegal')",
                (err2, lawyers) => {
                    if (err2) console.error('Error fetching lawyers:', err2);

                    res.render('cases', {
                        user: req.session.user || 'Attorney',
                        cases: cases || [],
                        lawyers: lawyers || [],
                        success,
                        error
                    });
                }
            );
        }
    );
});

// Create New Case
router.post('/create', isAuthenticated, (req, res) => {
    console.log('Create case - Request body:', req.body);
    
    // If req.body is empty or undefined, try to parse from raw body
    if (!req.body || Object.keys(req.body).length === 0) {
        console.error('Empty request body received');
        return res.redirect('/cases?error=No data received');
    }
    
    const {
        case_number, title, client_name, client_contact, case_type,
        status, filing_date, closing_date, description, assigned_lawyer_id
    } = req.body;

    // Validate required fields
    if (!case_number || !title || !client_name) {
        console.error('Missing required fields:', { case_number, title, client_name });
        return res.redirect('/cases?error=Please fill in all required fields');
    }

    db.query(
        `INSERT INTO cases (
            case_number, title, client_name, client_contact, case_type,
            status, filing_date, closing_date, description, assigned_lawyer_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            case_number, title, client_name, client_contact || null, case_type || null,
            status || 'Active', filing_date || null, closing_date || null, 
            description || null, assigned_lawyer_id || null, req.session.userId
        ],
        (err, result) => {
            if (err) {
                console.error('Error creating case:', err);
                return res.redirect('/cases?error=Failed to create case');
            }
            res.redirect('/cases?success=Case created successfully');
        }
    );
});

// Update Case
router.post('/update/:id', isAuthenticated, (req, res) => {
    console.log('Update case - Request body:', req.body);
    console.log('Update case - Params:', req.params);
    
    // If req.body is empty or undefined
    if (!req.body || Object.keys(req.body).length === 0) {
        console.error('Empty request body received for update');
        return res.redirect('/cases?error=No data received');
    }
    
    const caseId = req.params.id;
    const {
        case_number, title, client_name, client_contact, case_type,
        status, filing_date, closing_date, description, assigned_lawyer_id
    } = req.body;

    // Validate required fields
    if (!case_number || !title || !client_name) {
        console.error('Missing required fields for update:', { case_number, title, client_name });
        return res.redirect('/cases?error=Please fill in all required fields');
    }

    db.query(
        `UPDATE cases SET
            case_number = ?, 
            title = ?, 
            client_name = ?, 
            client_contact = ?,
            case_type = ?, 
            status = ?, 
            filing_date = ?, 
            closing_date = ?,
            description = ?, 
            assigned_lawyer_id = ?
        WHERE id = ?`,
        [
            case_number, title, client_name, client_contact || null,
            case_type || null, status || 'Active', filing_date || null,
            closing_date || null, description || null, assigned_lawyer_id || null, caseId
        ],
        (err, result) => {
            if (err) {
                console.error('Error updating case:', err);
                return res.redirect('/cases?error=Failed to update case');
            }
            
            if (result.affectedRows === 0) {
                return res.redirect('/cases?error=Case not found');
            }
            
            res.redirect('/cases?success=Case updated successfully');
        }
    );
});

// Delete Case
router.get('/delete/:id', isAuthenticated, (req, res) => {
    db.query('DELETE FROM cases WHERE id = ?', [req.params.id], (err, result) => {
        if (err) {
            console.error('Error deleting case:', err);
            return res.redirect('/cases?error=Failed to delete case');
        }
        res.redirect('/cases?success=Case deleted successfully');
    });
});

// Get Single Case (for Edit) - Returns JSON
router.get('/get/:id', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM cases WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching case:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Case not found' });
        }
        
        // Format dates properly for the frontend
        const caseData = results[0];
        if (caseData.filing_date) {
            caseData.filing_date = caseData.filing_date instanceof Date ? 
                caseData.filing_date.toISOString().split('T')[0] : caseData.filing_date;
        }
        if (caseData.closing_date) {
            caseData.closing_date = caseData.closing_date instanceof Date ? 
                caseData.closing_date.toISOString().split('T')[0] : caseData.closing_date;
        }
        
        res.json(caseData);
    });
});

module.exports = router;