    // backend/src/routes/calculationRoutes.js
    const express = require('express');
    const router = express.Router();
    const calculationController = require('../controllers/calculationController');
    const multer = require('multer');

    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });

    router.use((req, res, next) => {
      console.log(`[Router] Incoming Request to calculationRoutes: ${req.method} ${req.originalUrl}`);
      next();
    });

    router.post('/calculate-movement', (req, res, next) => {
      console.log('[Router] POST /calculate-movement hit');
      next();
    }, calculationController.calculateMovement);

    router.post('/upload-and-calculate', (req, res, next) => {
      console.log('[Router] POST /upload-and-calculate hit');
      next();
    }, upload.single('datafile'), calculationController.uploadAndCalculate);

    router.get('/history', (req, res, next) => {
      console.log('[Router] GET /history hit');
      next();
    }, calculationController.getCalculationHistory);

    module.exports = router;
    