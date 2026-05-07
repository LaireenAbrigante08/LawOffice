const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/db');

// Process staff registration from modal
router.post('/register', isAuthenticated, (req, res) => {
    const { 
        full_name, username, email, phone, address,
        position, department, license_number, hire_date,
        password, confirm_password, status
    } = req.body;

    console.log('Registration attempt for:', username);

    // Check if passwords match
    if (password !== confirm_password) {
        return res.redirect('/dashboard?error=Passwords do not match');
    }

    if (password.length < 4) {
        return res.redirect('/dashboard?error=Password must be at least 4 characters');
    }

    // Check if username or email already exists
    db.query(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect('/dashboard?error=Database error');
            }
            
            if (existingUser.length > 0) {
                return res.redirect('/dashboard?error=Username or Email already exists');
            }

            // Insert new staff member with plain text password
            db.query(
                `INSERT INTO users (
                    full_name, username, email, phone, address,
                    position, department, license_number, hire_date,
                    password, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    full_name, 
                    username, 
                    email || null, 
                    phone || null, 
                    address || null,
                    position || 'Legal Assistant', 
                    department || null, 
                    license_number || null, 
                    hire_date || null,
                    password,  // Store plain text password
                    status || 'Active'
                ],
                (insertErr, result) => {
                    if (insertErr) {
                        console.error('Insert error:', insertErr);
                        return res.redirect('/dashboard?error=Registration failed: ' + insertErr.message);
                    }
                    
                    console.log('Staff registered successfully, ID:', result.insertId);
                    res.redirect('/dashboard?success=Staff member registered successfully');
                }
            );
        }
    );
});

module.exports = router;