import TripModel from './trip.mjs';

const trips = {
  // Get all trips.
  getAllTrips: async function() {
    try {
      const trips = await TripModel.find({});
      return trips;
    } catch (e) {
      return {
        errors: {
          status: 500,
          source: "/getAllTrips",
          title: "Database error",
          detail: e.message
        }
      };
    }
  },

  // Get all trips for a user, by email.
  getdataByEmail: async function(email) {
    try {
      const trip = await TripModel.find({ email });
      return trip;
    } catch (e) {
      return {
        errors: {
          status: 500,
          source: "/getUserByEmail",
          title: "Database error",
          detail: e.message
        }
      };
    }
  },
}

export default trips;