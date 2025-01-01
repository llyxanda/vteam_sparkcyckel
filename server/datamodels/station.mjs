import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: true 
    },
    charging_station: {
        type: Boolean,
        required: true
    },
    no_of_scooters_available: {
        type: Number,
        required: true
    },
    no_of_scooters_max: {
        type: Number,
        required: true
    },
    available_scooters: {
        type: Array,
        required: true
    },
    // TODO decide which types should be required.
    location: { // Using GeoJSON format.
        type: {
            type: String,
            enum: ["Point"] // Make sure the location is of type Point.
        },
        coordinates: {
            type: [Number] // The order must be: [Longitude, Latitude].
        }
    },
});

stationSchema.index({ current_location: '2dsphere' }); // Enable geospatial queries.

const Station = mongoose.model('Station', stationSchema);

export default Station;