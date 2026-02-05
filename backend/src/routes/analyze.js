const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Analyze markets (optional auth for basic analysis)
router.post('/', optionalAuth, analyzeController.analyzeMarkets);

// Confirm market (requires auth)
router.post('/confirm', authMiddleware, analyzeController.confirmMarket);

// Get confirmed markets
router.get('/confirmed', authMiddleware, analyzeController.getConfirmedMarkets);

// Complete transaction
router.put('/confirmed/:id/complete', authMiddleware, analyzeController.completeTransaction);

// Cancel confirmed market
router.delete('/confirmed/:id', authMiddleware, analyzeController.cancelConfirmedMarket);

module.exports = router;
