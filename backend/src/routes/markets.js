const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const { optionalAuth } = require('../middleware/auth');

// Get all markets
router.get('/', marketController.getMarkets);

// Get top 10 performing markets (optional auth for personalization)
router.get('/top', optionalAuth, marketController.getTopMarkets);

// Get market demands
router.get('/demands', marketController.getMarketDemands);

// Get market details
router.get('/:id', marketController.getMarketDetails);

// Get price history for a market
router.get('/:marketId/prices', marketController.getPriceHistory);

module.exports = router;
