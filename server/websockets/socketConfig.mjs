import { Server } from "socket.io";
import scooter from '../datamodels/scooter.mjs';

let movingTimeouts = {};

export const initializeSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:8080", "https://www.student.bth.se"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('a scooter connected:', socket.customid);

    socket.on('joinScooter', ({ scooterId, email }) => {
      socket.join(scooterId);
      console.log(`User ${socket.id} (Email: ${email}) joined scooter ${scooterId}`);
    });

    socket.on('moving', ({ scooterId, current_location, email }) => {
      console.log(`User ${email} is riding scooter  ${scooterId} and is at: ${current_location ? current_location : ''}`);

      if (movingTimeouts[scooterId]) clearTimeout(movingTimeouts[scooterId]);

      movingTimeouts[scooterId] = setTimeout(async () => {
        try {
          const locationData = {
            type: 'Point',
            coordinates: [current_location.lon, current_location.lat]
          };

          const response = await scooter.findOneAndUpdate(  { customid: scooterId },
            { $set: { current_location: locationData } },
            { new: true });
          console.log(`Scooter ${scooterId} saved with current_location: ${current_location} response:`, response);
        } catch (error) {
          console.error(`Error saving scooter ${scooterId}:`, error);
        }
      }, 3000);

      socket.to(scooterId).emit('receivemovingLocation', current_location);
    });

    socket.on('speedchange', ({ scooterId, speed, email }) => {
      console.log(`scooter speed for ${scooterId}: ${speed ? speed : ''}`);

      if (movingTimeouts[scooterId]) clearTimeout(movingTimeouts[scooterId]);

      movingTimeouts[scooterId] = setTimeout(async () => {
        try {
          const response = await scooter.findOneAndUpdate(  { customid: scooterId},
            { $set: {speed:speed} },
            { new: true });
          console.log(`Scooter ${scooterId} saved with speed: ${speed} response:`, response);
        } catch (error) {
          console.error(`Error saving document ${scooterId}:`, error);
        }
      }, 3000);

      socket.to(scooterId).emit('receivechangingspeed', speed);
    });

    socket.on('batterychange', ({ scooterId, battery_level, email }) => {
      console.log(`scooter battery level for ${scooterId}: ${battery_level ? battery_level : ''}`);

      if (movingTimeouts[scooterId]) clearTimeout(movingTimeouts[scooterId]);

      movingTimeouts[scooterId] = setTimeout(async () => {
        try {
          const response = await scooter.findOneAndUpdate(  { customid: scooterId},
            { $set: {battery_level:battery_level} },
            { new: true });
          console.log(`Scooter ${scooterId} saved with battery: ${battery_level} response:`, response);
        } catch (error) {
          console.error(`Error saving document ${scooterId}:`, error);
        }
      }, 3000);

      socket.to(scooterId).emit('receivechangingbattery', speed);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
    });
  });
};
