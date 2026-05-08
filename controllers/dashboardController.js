const db = require('../config/db');

exports.showDashboard = (req, res) => {
    // Default values
    let activeCases = 0;
    let totalStaff = 0;
    let upcomingHearings = 0;
    
    // QUERY 1: Get ACTIVE CASES from cases table
    db.query("SELECT COUNT(*) as count FROM cases WHERE status = 'Active'", (err, caseResults) => {
        if (!err && caseResults && caseResults.length > 0) {
            activeCases = caseResults[0].count;
            console.log(`✅ Active cases found: ${activeCases}`);
        } else if (err) {
            console.error("Error counting active cases:", err);
        }
        
        // QUERY 2: Get TOTAL STAFF from users table
        db.query("SELECT COUNT(*) as count FROM users", (err, userResults) => {
            if (!err && userResults && userResults.length > 0) {
                totalStaff = userResults[0].count;
                console.log(`✅ Total staff found: ${totalStaff}`);
            } else if (err) {
                console.error("Error counting users:", err);
            }
            
            // QUERY 3: Get UPCOMING HEARINGS
            db.query("SELECT COUNT(*) as count FROM hearings WHERE hearing_date >= CURDATE() AND status = 'Scheduled'", (err2, hearingResults) => {
                if (!err2 && hearingResults && hearingResults.length > 0) {
                    upcomingHearings = hearingResults[0].count;
                } else if (err2) {
                    console.log("Hearings table note:", err2?.message || "Table may not exist");
                }
                
                // Render dashboard with CORRECT data
                res.render('dashboard', { 
                    user: req.session.user || 'Attorney',
                    activeCases: activeCases,      // ✅ From cases table ONLY
                    totalStaff: totalStaff,        // ✅ From users table ONLY
                    upcomingHearings: upcomingHearings,
                    lastLogin: req.session.lastLogin || new Date().toLocaleString()
                });
            });
        });
    });
};
