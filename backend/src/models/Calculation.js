// backend/src/models/Calculation.js
const mongoose = require('mongoose');

// Define the schema for a single calculation entry.
const CalculationSchema = new mongoose.Schema({
    user: { // New field: Reference to the User who performed the calculation
        type: mongoose.Schema.Types.ObjectId, // Stores MongoDB ObjectId
        ref: 'User', // Refers to the 'User' model
        required: true,
    },
    plant: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    warehouse: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    city: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    angleDegrees: { type: Number, required: true },
    isBackwardMovement: { type: Boolean, required: true },
    distancePlantWarehouseKm: { type: Number, required: true },
    distanceWarehouseCityKm: { type: Number, required: true },
    distancePlantCityKm: { type: Number, required: true },
    calculatedAt: { type: Date, default: Date.now },
});

// Export the Mongoose model.
module.exports = mongoose.model('Calculation', CalculationSchema);
