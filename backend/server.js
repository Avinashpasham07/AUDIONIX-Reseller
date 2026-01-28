require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const app = require('./app');
const { Server } = require("socket.io");
const connectDB = require('./config/db');
const startAutoRevokeJob = require('./cron/autoRevoke');

const PORT = process.env.PORT || 5000;

// Security Middleware (Move these into app.js if possible, but keeping here for consistency with previous version)
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const { globalLimiter } = require('./middleware/rateLimiter');

// 1. Database & App Config
connectDB();
startAutoRevokeJob();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(xss());
app.use(mongoSanitize());
app.use('/api/', globalLimiter);

// Health Check
app.get('/ping', (req, res) => res.status(200).send('Pong: Server is awake! 🚀'));

// 2. HTTP Server & Socket.io
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('join_user_room', (userId) => {
        if (userId) socket.join(userId);
    });
});

// 3. Start Listening
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Audionix Server running on port ${PORT}`);
});
