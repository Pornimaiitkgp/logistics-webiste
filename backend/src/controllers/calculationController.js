// backend/src/controllers/calculationController.js
const calculationService = require('../services/calculationService');
const Calculation = require('../models/Calculation');
const csv = require('csv-parser');
const stream = require('stream');

// Function to handle a single calculation (e.g., from manual input, if re-added later)
const calculateMovement = async (req, res) => {
    console.log('[Controller] calculateMovement function entered.');
    // Get user ID from the authenticated request
    const userId = req.user._id; // User ID is available from the 'protect' middleware
    const { plant, warehouse, city } = req.body;

    if (!plant || !warehouse || !city ||
        !plant.lat || !plant.lon ||
        !warehouse.lat || !warehouse.lon ||
        !city.lat || !city.lon) {
        console.error('[Controller] Missing required lat/lon for manual calculation.');
        return res.status(400).json({ message: 'Missing required latitude or longitude for plant, warehouse, or city.' });
    }

    const parsedPlant = { lat: parseFloat(plant.lat), lon: parseFloat(plant.lon) };
    const parsedWarehouse = { lat: parseFloat(warehouse.lat), lon: parseFloat(warehouse.lon) };
    const parsedCity = { lat: parseFloat(city.lat), lon: parseFloat(city.lon) };

    if (isNaN(parsedPlant.lat) || isNaN(parsedPlant.lon) ||
        isNaN(parsedWarehouse.lat) || isNaN(parsedWarehouse.lon) ||
        isNaN(parsedCity.lat) || isNaN(parsedCity.lon)) {
        console.error('[Controller] Invalid lat/lon format for manual calculation.');
        return res.status(400).json({ message: 'Invalid latitude or longitude format. Must be numbers.' });
    }

    try {
        const result = calculationService.analyzeMovement(parsedPlant, parsedWarehouse, parsedCity);
        const newCalculation = new Calculation({
            user: userId, // Associate calculation with the user
            plant: parsedPlant,
            warehouse: parsedWarehouse,
            city: parsedCity,
            ...result
        });
        await newCalculation.save();
        res.status(200).json(result);
    } catch (error) {
        console.error('[Controller] Calculation error or DB save error in calculateMovement:', error);
        res.status(500).json({ message: 'Error performing calculation or saving data', error: error.message });
    }
};

const uploadAndCalculate = async (req, res) => {
    console.log('[Controller] uploadAndCalculate function entered.');
    // Get user ID from the authenticated request
    const userId = req.user._id; // User ID is available from the 'protect' middleware

    if (!req.file) {
        console.error('[Controller] No file uploaded in uploadAndCalculate.');
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    console.log('[Controller] File received:', req.file.originalname, req.file.size, 'bytes');

    const results = [];
    const errors = [];
    let rowCount = 0;

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', async (row) => {
            rowCount++;
            console.log(`[Controller] Processing row ${rowCount}:`, row);

            const plant = { lat: parseFloat(row.plant_lat), lon: parseFloat(row.plant_lon) };
            const warehouse = { lat: parseFloat(row.warehouse_lat), lon: parseFloat(row.warehouse_lon) };
            const city = { lat: parseFloat(row.city_lat), lon: parseFloat(row.city_lon) };

            if (isNaN(plant.lat) || isNaN(plant.lon) ||
                isNaN(warehouse.lat) || isNaN(warehouse.lon) ||
                isNaN(city.lat) || isNaN(city.lon)) {
                errors.push(`Invalid data in row ${rowCount}: Lat/Lon must be numbers.`);
                console.warn(`[Controller] Invalid data in row ${rowCount}:`, row);
                return;
            }

            try {
                const calculationResult = calculationService.analyzeMovement(plant, warehouse, city);
                const fullResult = {
                    plant,
                    warehouse,
                    city,
                    ...calculationResult
                };
                results.push(fullResult);
                const newCalculation = new Calculation({
                    user: userId, // Associate calculation with the user
                    plant,
                    warehouse,
                    city,
                    ...calculationResult
                });
                await newCalculation.save();
            } catch (error) {
                console.error(`[Controller] Error processing row ${rowCount}:`, error);
                errors.push(`Error processing row ${rowCount}: ${error.message}`);
            }
        })
        .on('end', () => {
            console.log('[Controller] CSV parsing finished. Total results:', results.length, 'Errors:', errors.length);
            res.status(200).json(results);
        })
        .on('error', (err) => {
            console.error('[Controller] CSV parsing stream error:', err);
            res.status(500).json({ message: 'Error parsing CSV file.', error: err.message });
        });
};

// Function to get calculation history (now filtered by user)
const getCalculationHistory = async (req, res) => {
    console.log('[Controller] getCalculationHistory function entered.');
    const userId = req.user._id; // Get user ID from the authenticated request

    try {
        // Fetch calculations only for the authenticated user
        const history = await Calculation.find({ user: userId }).sort({ calculatedAt: -1 }); // Removed limit to fetch all for dashboard
        res.status(200).json(history);
    } catch (error) {
        console.error('[Controller] Error fetching history for user:', userId, error);
        res.status(500).json({ message: 'Error fetching calculation history', error: error.message });
    }
};

// NEW: Function to get summary statistics for the authenticated user
const getSummaryStatistics = async (req, res) => {
    console.log('[Controller] getSummaryStatistics function entered.');
    const userId = req.user._id; // Get user ID from the authenticated request

    try {
        // Aggregate calculations for the user
        const totalCalculations = await Calculation.countDocuments({ user: userId });
        const backwardMovements = await Calculation.countDocuments({ user: userId, isBackwardMovement: true });
        const forwardMovements = totalCalculations - backwardMovements;

        // Calculate average angle for backward movements
        const avgBackwardAngleResult = await Calculation.aggregate([
            { $match: { user: userId, isBackwardMovement: true } },
            { $group: { _id: null, averageAngle: { $avg: '$angleDegrees' } } }
        ]);
        const averageBackwardAngle = avgBackwardAngleResult.length > 0 ? avgBackwardAngleResult[0].averageAngle : 0;

        // Calculate average angle for forward movements
        const avgForwardAngleResult = await Calculation.aggregate([
            { $match: { user: userId, isBackwardMovement: false } },
            { $group: { _id: null, averageAngle: { $avg: '$angleDegrees' } } }
        ]);
        const averageForwardAngle = avgForwardAngleResult.length > 0 ? avgForwardAngleResult[0].averageAngle : 0;


        res.status(200).json({
            totalCalculations,
            backwardMovements,
            forwardMovements,
            percentageBackward: totalCalculations > 0 ? (backwardMovements / totalCalculations * 100).toFixed(2) : 0,
            percentageForward: totalCalculations > 0 ? (forwardMovements / totalCalculations * 100).toFixed(2) : 0,
            averageBackwardAngle: averageBackwardAngle.toFixed(2),
            averageForwardAngle: averageForwardAngle.toFixed(2),
        });

    } catch (error) {
        console.error('[Controller] Error fetching summary statistics for user:', userId, error);
        res.status(500).json({ message: 'Error fetching summary statistics', error: error.message });
    }
};


module.exports = { calculateMovement, uploadAndCalculate, getCalculationHistory, getSummaryStatistics };
