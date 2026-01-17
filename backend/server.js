require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const app = require('./app');

// Serve "uploads" folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const connectDB = require('./config/db');
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

// Connect to Database
// Connect to Database
connectDB();

// Keep-Alive Endpoint (Ping Trick for Render/Heroku)
app.get('/ping', (req, res) => {
    res.status(200).send('Pong: Server is awake! 🚀');
});

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now (adjust for prod)
        methods: ["GET", "POST"]
    }
});

// Store io instance in app for usage in controllers
app.set('io', io);

// Socket.io Connection Handler
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join user to their own room (for personal notifications)
    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const cluster = require('cluster');
const os = require('os');
const startAutoRevokeJob = require('./cron/autoRevoke');

// Start Cron Jobs
startAutoRevokeJob();

// --- DEPLOYMENT CONFIG (Must be last before listen) ---
if (process.env.NODE_ENV === 'production') {
    // CLUSTERING LOGIC
    if (cluster.isPrimary) {
        console.log(`Primary ${process.pid} is running`);

        const numCPUs = os.cpus().length;
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
            cluster.fork(); // Restart worker on death
        });
    } else {
        // Worker process
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, console.log(`Worker ${process.pid} started on port ${PORT}`));
    }
} else {
    // Development Mode (No Clustering)
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
}
