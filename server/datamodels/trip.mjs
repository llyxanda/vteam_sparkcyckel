import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  scooterId: { type: String, required: true },
  email: { type: String, required: true },
  startLocation: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], // Longitude, Latitude
      required: true
    }
  },
  endLocation: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number], // Longitude, Latitude
      required: false
    }
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date},
  duration: { type: Number },
  avgSpeed: {type: Number},
  cost: {type: Number}
});

tripSchema.index({ startLocation: '2dsphere' });
tripSchema.index({ endLocation: '2dsphere' });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
