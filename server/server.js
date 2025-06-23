const { setupServer } = require("./config/serverConfig.js");
const gameRoutes = require("./routes/gameRoutes");
const { setupSocketEvents } = require("./socket/socketManager");
const { cleanupOldGames } = require("./services/gameService");

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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Family Feud Quiz Server running on port ${PORT}`);
  console.log(`📱 Frontend should connect to http://localhost:${PORT}`);
  console.log(`🎮 Ready for multiplayer games!`);
  console.log(`🔧 Server organized with modular components`);
});