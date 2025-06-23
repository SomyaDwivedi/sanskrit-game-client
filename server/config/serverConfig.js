const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");

const setupServer = () => {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  return { app, server, io };
};

module.exports = { setupServer };
