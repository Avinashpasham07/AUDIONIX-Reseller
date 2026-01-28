require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const app = require('./app');
const cluster = require('cluster');
const os = require('os');
const { Server } = require("socket.io");
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");
const connectDB = require('./config/db');
const startAutoRevokeJob = require('./cron/autoRevoke');

// Security Middleware (Moved into App-level or Worker start)
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const { globalLimiter } = require('./middleware/rateLimiter');

const PORT = process.env.PORT || 5000;

// --- CLUSTER PROD SETUP ---
if (process.env.NODE_ENV === 'production' && cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    const httpServer = http.createServer(); // Master Proxy Server

    // 1. Setup Sticky Sessions (Balances Load + Ensures Socket Polling works)
    setupMaster(httpServer, {
        loadBalancingMethod: "least-connection",
    });

    // 2. Setup Cluster Adapter (Syncs Events between Workers)
    setupPrimary();

    // 3. Start Single Global Services (Cron)
    connectDB(); // Optional for Master, but good for Cron
    startAutoRevokeJob();

    // 4. Fork Workers
    const numCPUs = os.cpus().length;
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
    });

    // Master Listens on Port immediately to satisfy health checks
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Audionix Cluster Primary running on port ${PORT}`);

        // Start background services after port is open
        connectDB();
        startAutoRevokeJob();
    });

} else {
    // --- WORKER PROCESS (OR DEV MODE) ---
    // This runs for every Worker in Prod, OR Single process in Dev

    // 1. Database & App Config
    connectDB();

    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use(helmet());
    app.use(xss());
    app.use(mongoSanitize());
    app.use('/api/', globalLimiter);

    app.get('/ping', (req, res) => res.status(200).send('Pong: Server is awake! 🚀'));

    const server = http.createServer(app);

    // 2. Socket.io Setup
    const ioConfig = {
        cors: { origin: "*", methods: ["GET", "POST"] }
    };

    // If Prod Worker, use Adapter
    if (process.env.NODE_ENV === 'production') {
        ioConfig.adapter = createAdapter();
    }

    const io = new Server(server, ioConfig);

    // If Prod Worker, Register Sticky Worker
    if (process.env.NODE_ENV === 'production') {
        setupWorker(io);
    }

    app.set('io', io);

    io.on('connection', (socket) => {
        // console.log(`User Connected: ${socket.id} (Worker ${process.pid})`);
        socket.on('join_user_room', (userId) => {
            if (userId) socket.join(userId);
        });
    });

    // 3. Start Listening (ONLY IN DEV)
    // In Prod, setupWorker handles the request routing from Master, so we DON'T listen on PORT directly.
    if (process.env.NODE_ENV !== 'production') {
        // Dev Mode: Simple Start
        startAutoRevokeJob(); // Run cron in dev
        server.listen(PORT, () => {
            console.log(`Dev Server running on port ${PORT}`);
        });
    }
}
