import { Server } from "socket.io";
import scooter from "../datamodels/scooter.mjs";
import Trip from "../datamodels/trip.mjs";
import Stations from "../datamodels/stations.mjs";
import { getDistance } from 'geolib';

let movingTimeouts = {};
let currentTrips = {};
let startAmount = 10;
let parkAmount = 10;

const updateScooter = async (scooterId, updateData) => {
  try {
    console.log('updating scooter', scooterId, updateData)
    const response = await scooter.findOneAndUpdate(
      { customid: String(scooterId) },
      { $set: updateData },
      { new: true }
    );
    if (response) {
      console.log(`Scooter ${scooterId} updated:`, updateData);
      return response
    } else {
      console.log(`Scooter ${scooterId} not found ${response}`);
    }
  } catch (error) {
    console.error(`Error updating scooter ${scooterId}:`, error);
  }
};

export const initializeSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:8080", "https://www.student.bth.se"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user/scooter connected:", socket.id);

    socket.on("joinScooter", async (data) => {
      try {
        console.log("A user connected:", socket.id, data.scooterId, data.email);
        socket.join(data.scooterId);
        if (data.type === "user") {
          const {type,  scooterId, email, statusc, battery_levelc, current_locationc} = data;
          const currents = await scooter.findOne({ customid: scooterId });
          const currentstatus = currents.status;
          const battery_level = currents.battery_level;
          const current_location = currents.current_location;
          io.to(scooterId).emit("scooterJoined", { scooterId, email, battery_level, currentstatus, current_location});
          console.log("current status ", currents)
          const status = "active"

          if (currents.status === "inactive") {
            console.log('inactive')
            const scooter = await updateScooter(scooterId, { status: status });
            //console.log(scooter)
          
    
          
            if (scooter.designated_parking==false) {
              startAmount = startAmount * 0.5
            }
      
            // Start a new trip
            const startLocation = {
              type: "Point",
              coordinates: [current_location.coordinates[0], current_location.coordinates[1]],
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
            io.emit("statusChange", { scooterId, status});
          }
        } else if (data.type === "scooter") {
          console.log("A scooter connected:", socket.id, data.scooterId);
        }
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

      io.to(scooterId).emit("receivemovingLocation", {scooterId, current_location});
    };

    socket.on("moving", async ({ scooterId, current_location, email }) => {
      console.log('moving update loc', current_location)
      handleMovement({
        scooterId,
        current_location,
        updateData: { current_location: { type: "Point", coordinates: [current_location.lon, current_location.lat] } }
      });
    });

    socket.on("speedchange", ({ scooterId, speed }) => {
      console.log(`Scooter speedchange ${scooterId} speed updated to: ${speed}`);
    
      if (parseFloat(speed) > 30) {
        console.log(`High speed detected for scooter ${scooterId}. Emitting correction.`);
    
        // Debugging: Check which sockets are in the room
        const room = io.sockets.adapter.rooms.get(scooterId);
        console.log(`Sockets in room ${scooterId}:`, room ? [...room] : "No sockets in room");
    
        io.to(scooterId).emit("receivechangingspeed", 30);
      }
    });
    
    socket.on("charging", ({ scooterId }) => {
      console.log(`Scooter ${scooterId} is charging`);
      const status = 'charging';
      updateScooter(scooterId, {status: status});
      io.emit("statusChange", { scooterId, status});

    });

    socket.on("batterychange",async ({ scooterId, battery }) => {
      //console.log(`Scooter ${scooterId} battery updated to: ${battery}`);
      await updateScooter(scooterId, {battery_level:battery});
      io.emit("receivechangingbattery", {scooterId, battery});
    });

    socket.on("endTrip", async ({ scooterId, email, current_location, avgSpeed }) => {
      console.log('End trip event', scooterId, current_location, avgSpeed )
      const avg_speed = avgSpeed;
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
            //console.log('Not in station')
          }
        }

        if (!nearestStation) {
          parkAmount *= 1.5;
        }
    
        // Calculate total cost
        const cost = startAmount + parkAmount + duration * 0.05;
        console.log('Cost ', cost, startAmount, parkAmount, scooterId)
        console.log('Duration ', duration);
        //console.log(currentTrips[scooterId])
        trip.cost=cost
    
        // Save trip and update scooter status
        await trip.save();
        delete currentTrips[scooterId]; // Clean up after trip ends
        const status = 'inactive';
    
        await updateScooter(scooterId, {
          status: status,
          current_location: locationData,
          at_station: nearestStation ? nearestStation._id : null,
          designated_parking: Boolean(nearestStation),
        });
        io.to(scooterId).emit("tripEnded", { scooterId, cost});
        io.emit("statusChange", { scooterId, status});
        console.log(`Trip ended and logged for scooter ${scooterId}`);
        socket.leave(scooterId);
      } catch (err) {
        console.error("Error ending trip:", err);
      }

    });
    
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
