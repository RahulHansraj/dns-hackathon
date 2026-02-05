const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');

// Get all crops
router.get('/', cropController.getCrops);

// Get categories
router.get('/categories', cropController.getCategories);

// Search crops
router.get('/search', cropController.searchCrops);

module.exports = router;
