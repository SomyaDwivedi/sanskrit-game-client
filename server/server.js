// Core Modules
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

// Internal Modules
const gameRoutes = require("./routes/gameRoutes");
const authRoutes = require("./routes/auth.routes"); // Optional, include if used
const { setupSocketEvents } = require("./socket/socketManager");
const { cleanupOldGames } = require("./services/gameService");

// Load environment variables
dotenv.config();

// Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);  // Optional - include only if auth is used
app.use("/", gameRoutes);

// Socket Events
setupSocketEvents(io);

// MongoDB Connection + Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🎮 Sockets ready at ws://localhost:${PORT}`);
      console.log(`🔁 Cleanup scheduled every hour`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Cleanup job: run every hour
setInterval(cleanupOldGames, 60 * 60 * 1000);
