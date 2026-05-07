const db = require('../config/db');

exports.showDashboard = (req, res) => {
    let activeCases = 12;
    let totalClients = 8;
    let upcomingHearings = 3;
    
    // Get active staff count
    db.query("SELECT COUNT(*) as count FROM users WHERE status = 'Active'", (err, results) => {
        if (!err && results && results.length > 0) {
            totalClients = results[0].count;
            activeCases = results[0].count;
        }
        
        // Try to get upcoming hearings
        db.query("SELECT COUNT(*) as count FROM hearings WHERE hearing_date >= CURDATE() AND status = 'Scheduled'", (err2, hearingResults) => {
            if (!err2 && hearingResults && hearingResults.length > 0) {
                upcomingHearings = hearingResults[0].count;
            }
            
            res.render('dashboard', { 
                user: req.session.user || 'Attorney',
                activeCases: activeCases,
                totalClients: totalClients,
                upcomingHearings: upcomingHearings,
                lastLogin: req.session.lastLogin || new Date().toLocaleString()
            });
        });
    });
};