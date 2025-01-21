import { Server } from "socket.io";
import scooter from "../datamodels/scooter.mjs";
import Trip from "../datamodels/trip.mjs";
import Stations from "../datamodels/stations.mjs";
import { getDistance } from 'geolib';
import Scooter from "../datamodels/scooter.mjs";

let movingTimeouts = {};
let currentTrips = {};
let startAmount = 10;
let parkAmount = 10;

const updateScooter = async (scooterId, updateData) => {
  try {
    const response = await scooter.findOneAndUpdate(
      { customid: scooterId },
      { $set: updateData },
      { new: true }
    );
    if (response) {
      console.log(`Scooter ${scooterId} updated:`, response);
      return response
    } else {
      console.log(`Scooter ${scooterId} not found`);
    }
  } catch (error) {
    console.error(`Error updating scooter ${scooterId}:`, error);
  }
};

export const initializeSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:8080", "https://www.student.bth.se"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A scooter connected:", socket.id);

    socket.on("joinScooter", async ({ scooterId, email, current_location }) => {
      try {
        socket.join(scooterId);
        console.log(`User ${socket.id} (Email: ${email}) joined scooter ${scooterId}`);
        const scooter = await updateScooter(scooterId, { status: "active" });
        console.log(scooter)
        if (scooter.designated_parking==false) {
          startAmount = startAmount * 0.5
        }

        // Start a new trip
        const startLocation = {
          type: "Point",
          coordinates: [current_location.lon, current_location.lat],
        };
        const startTime = new Date();

        currentTrips[scooterId] = new Trip({
          scooterId,
          email,
          startLocation,
          startTime,
          endLocation: null,
          endTime: null,
          duration: null,
        });
        await currentTrips[scooterId].save();
        console.log(`Trip started and logged for scooter ${scooterId}`);
        io.emit("scooterJoined", { scooterId, email, current_location });
      } catch (err) {
        console.error("Error updating scooter status or log:", err);
      }
    });

    const handleMovement = async ({ scooterId, current_location, updateData }) => {
      console.log(`User ${scooterId} is moving to:`, current_location);
      if (movingTimeouts[scooterId]) clearTimeout(movingTimeouts[scooterId]);

      movingTimeouts[scooterId] = setTimeout(() => {
        updateScooter(scooterId, updateData);
      }, 3000);

      socket.to(scooterId).emit("receivemovingLocation", current_location);
    };

    socket.on("moving", ({ scooterId, current_location, email }) => {
      handleMovement({
        scooterId,
        current_location,
        updateData: { current_location: { type: "Point", coordinates: [current_location.lon, current_location.lat] } }
      });
    });

    socket.on("speedchange", ({ scooterId, speed }) => {
      console.log(`Scooter ${scooterId} speed updated to: ${speed}`);
      updateScooter(scooterId, {speed:speed});

      if (speed > 30) {
        socket.to(scooterId).emit("receivechangingspeed", 30);
      }
    });

    socket.on("batterychange", ({ scooterId, battery }) => {
      console.log(`Scooter ${scooterId} battery updated to: ${battery}`);
      updateScooter(scooterId, {battery_level:battery});;

      socket.to(scooterId).emit("receivechangingbattery", battery);
    });

    socket.on("endTrip", async ({ scooterId, current_location, avg_speed }) => {
      try {
        const trip = currentTrips[scooterId];
        if (!trip) {
          console.warn(`No active trip found for scooter ${scooterId}`);
          return;
        }
    
        // Calculate trip details
        const endTime = new Date();
        const duration = (endTime - trip.startTime) / 1000;
        const endLocation = {
          type: "Point",
          coordinates: [current_location.lon, current_location.lat],
        };
    
        // Update trip object
        trip.endLocation = endLocation;
        trip.endTime = endTime;
        trip.duration = duration;
        trip.avgSpeed = avg_speed;
    
        // Find nearest station and calculate parking amount
        const locationData = {
          type: "Point",
          coordinates: [current_location.lon, current_location.lat],
        };
    
        const stations = await Stations.find({});
        let nearestStation = null;
    
        for (const station of stations) {
          if (!station.location?.coordinates) continue;
    
          const stationCoordinates = {
            latitude: station.location.coordinates[1],
            longitude: station.location.coordinates[0],
          };
    
          const distance = getDistance(
            { latitude: current_location.lat, longitude: current_location.lon },
            stationCoordinates
          );
    
          if (distance <= 4) {
            nearestStation = station;
            break;
          } else {
            parkAmount *= 1.5;
          }
        }
    
        // Calculate total cost
        const cost = startAmount + parkAmount + duration * 0.00001;
        trip.cost=cost
    
        // Save trip and update scooter status
        await trip.save();
        delete currentTrips[scooterId]; // Clean up after trip ends
    
        await updateScooter(scooterId, {
          status: "inactive",
          current_location: locationData,
          at_station: nearestStation ? nearestStation._id : null,
          designated_parking: Boolean(nearestStation),
        });
        socket.emit("tripEnded", { scooterId, cost });
        console.log(`Trip ended and logged for scooter ${scooterId}`);
      } catch (err) {
        console.error("Error ending trip:", err);
      }

    });
    
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
