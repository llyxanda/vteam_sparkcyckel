import mongoose from 'mongoose';

const scooterSchema = new mongoose.Schema({
    customid: {type: String, required: true, unique: true},
    status: { 
        type: String,
        enum: ["active", "inactive"],
        required: true 
    },
    speed: {
        type: Number,
        required: true
    },
    battery_level: {
        type: Number,
        required: true
    },
    // TODO decide which types should be required.
    current_location: { // Using GeoJSON format.
        type: {
            type: String,
            enum: ["Point"] // Make sure the location is of type Point.
        },
        coordinates: {
            type: [Number] // The order must be: [Longitude, Latitude].
        }
    },
    at_station: { type: String },
    designated_parking: { type: Boolean }
});

scooterSchema.index({ current_location: '2dsphere' }); // Enable geospatial queries.

const Scooter = mongoose.model('Scooter', scooterSchema);

export default Scooter;

// Query nearby scooters.
// const nearbyScooters = await Scooter.find({
//     current_location: {
//         $near: {
//             $geometry: {
//                 type: 'Point',
//                 coordinates: [-73.856077, 40.848447],
//             },
//             $maxDistance: 1000, // In meters.
//         },
//     },
// });