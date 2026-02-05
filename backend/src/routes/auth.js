const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('express-validator');

// Signup
router.post('/signup', [
  body('fullName').notEmpty().trim().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.signup);

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

// Google OAuth
router.post('/google', authController.googleAuth);

// Get current user
router.get('/me', authMiddleware, authController.me);

// Update theme
router.put('/theme', authMiddleware, authController.updateTheme);

module.exports = router;
