const { setupHostEvents } = require("./hostEvents");
const { setupPlayerEvents } = require("./playerEvents");
const { handlePlayerDisconnect } = require("../services/gameService");

function setupSocketEvents(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // Setup host and player events
    setupHostEvents(socket, io);
    setupPlayerEvents(socket, io);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
      handlePlayerDisconnect(socket.id);
    });
  });
}

module.exports = { setupSocketEvents };