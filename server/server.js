import dotenv from "dotenv";
import { setupServer } from "./config/serverConfig.js";
import gameRoutes from "./routes/gameRoutes.js";
import { setupSocketEvents } from "./socket/socketManager.js";
import { cleanupOldGames } from "./services/gameService.js";
import connectDB from "./data/index.js";
dotenv.config({
  path: "./.env",
});

// Initialize server
const { app, server, io } = setupServer();

// Setup routes - FIXED: Use router properly
app.use("/", gameRoutes);

// Setup socket events
setupSocketEvents(io);

// Cleanup old games periodically (every hour)
setInterval(() => {
  cleanupOldGames();
}, 60 * 60 * 1000);

["MONGODB_URI", "DB_NAME", "PORT"].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env variable: ${key}`);
  }
});
// Connect to MongoDB, then start the server
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    // If the app throws an error after starting
    app.on("error", (error) => {
      console.log("Server Connection Error", error);
      throw error;
    });

    // Start the Express server
    server.listen(PORT, () => {
      console.log(`🚀 Family Feud Quiz Server running on port ${PORT}`);
      console.log(`📱 Frontend should connect to http://localhost:${PORT}`);
      console.log(`🎮 Ready for multiplayer games!`);
      console.log(`🔧 Server organized with modular components`);
    });
  })
  .catch((error) => {
    // Handle DB connection failure
    console.log("MONGO DB connection failed !!", error);
  });
