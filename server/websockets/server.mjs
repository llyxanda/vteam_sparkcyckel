import { Server } from 'socket.io';

function setupSocketServer(httpServer) {
    const io = new Server(httpServer); // Initialize socket.io with the existing HTTP server.

    io.on('connection', (socket) => {
        console.log('New client connected!');

        // Retrieve scooterId and isAdmin from the query parameters
        const scooterId = socket.handshake.query.scooterId || null; // TODO client needs to send the scooter ID.
        const isAdmin = socket.handshake.query.isadmin === 'true'; // TODO client needs to send true/false.

        // Notify the client that the connection was established.
        socket.emit('connectionEstablished', 'Connection established');

        // Join the appropriate room based on user type.
        if (isAdmin) {
            // Admins can join an 'admin' room
            socket.join('adminRoom');
        } else {
            // Non-admin users join a room for their specific scooterId.
            socket.join(scooterId);
        }

        // Handle incoming messages from the client.
        socket.on('scooterUpdate', (data) => {
            console.log(`Received vehicle update for scooter ${scooterId}: ${data}`);

            io.to(scooterId).emit('scooterUpdate', data); // Send the update to a specific ID.

            if (isAdmin) { // Send the update to all admins as well.
                io.to('adminRoom').emit('scooterUpdate', data);
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
