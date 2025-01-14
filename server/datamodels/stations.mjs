import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  charging_station: {
    type: Boolean,
    required: true,
  },
  no_of_scooters_max: {
    type: Number,
    required: true,
    min: 1,
  },
  location:  { 
    type: {
    type: String,
    enum: ["Point"] // Make sure the location is of type Point.
},
coordinates: {
    type: [Number] // The order must be: [Longitude, Latitude].
},
  }
});

stationSchema.index({ location: "2dsphere" });

// Create the Station model
const Stations = mongoose.model("Station", stationSchema);


export default Stations;

