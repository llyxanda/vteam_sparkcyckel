import { Server } from 'socket.io';

function setupSocketServer(httpServer) {
    const io = new Server(httpServer, { // Initialize socket.io with the existing HTTP server.
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected!');

        // Retrieve scooterId and isAdmin from the query parameters
        const scooterId = socket.handshake.query.scooterId || null; // TODO client needs to send the scooter ID.
        const isAdmin = socket.handshake.query.isAdmin === 'true'; // TODO client needs to send true/false.

        console.log('scooterId', scooterId); // The scooter's ID from the database.
        console.log('isAdmin', isAdmin); // Bool true/false depending on who's connecting to the socket.

        // Notify the client that the connection was established.
        socket.emit('connectionEstablished', 'Connection established.');

        // Join the appropriate room based on user type.
        if (isAdmin) {
            socket.join('adminRoom');
        } else {
            socket.join(scooterId); // Customers join a room for their specific scooterId.
        }

        // Handle incoming messages from the client.
        socket.on('scooterUpdate', (data) => {
            console.log(`Received update for scooter ${scooterId}: ${data}`);

            io.to(scooterId).emit('scooterUpdate', data); // Send the update to a specific ID.
            // FIX sending the data back is probably not necessary?
            // TODO Check and update the battery level.
            // TODO Calculate distance and cost.
            // TODO Save info to the database. Continuously or only when starting/stopping?

            if (isAdmin) { // Send the update to all admins.
                io.to('adminRoom').emit('scooterUpdate', data);
                // TODO Maybe implement some sort of batch logic? (send data in batches).
            }
        });

        socket.on('disconnect', () => {
            console.log(`${scooterId} disconnected`);
        });

        socket.on('error', (error) => {
            console.log('Socket error:', error);
        });
    });

    console.log('Socket.IO server is running.');
    return io;
}

export default setupSocketServer;
