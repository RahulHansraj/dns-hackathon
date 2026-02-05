const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(authMiddleware);

// Get profile
router.get('/profile', farmerController.getProfile);

// Update location
router.put('/location', [
  body('locationName').notEmpty().withMessage('Location name is required'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required')
], farmerController.updateLocation);

// Add crop
router.post('/crops', [
  body('cropId').isInt().withMessage('Crop ID is required'),
  body('weightKg').isFloat({ min: 0.1 }).withMessage('Weight must be positive')
], farmerController.addCrop);

// Get crops
router.get('/crops', farmerController.getCrops);

// Delete crop
router.delete('/crops/:id', farmerController.deleteCrop);

// Get profit summary
router.get('/profit', farmerController.getProfitSummary);

module.exports = router;
