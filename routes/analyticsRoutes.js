const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Analytics page route
router.get('/', isAuthenticated, (req, res) => {
    // Sample data - replace with your database aggregates
    const analyticsData = {
        totalCases: 47,
        activeCases: 24,
        totalHearings: 156,
        totalClients: 142,
        pendingCases: 15,
        closedCases: 32,
        upcomingHearings: 8
    };
    
    res.render('analytics', { 
        user: req.session.user || 'Attorney',
        ...analyticsData
    });
});

module.exports = router;