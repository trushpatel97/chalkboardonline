/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const {Server} = require("socket.io");
const {v4: uuidv4} = require("uuid");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Create Express app
const app = express();
app.use(cors({origin: true}));

// Create HTTP server
const server = require("http").createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store active sessions
const sessions = new Map();
const LOCKED = false;

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("new connection: " + socket.id);

  // ... Copy all the socket event handlers from server.js ...
  // (I'll add the specific handlers in the next edit)

  socket.on("disconnect", () => {
    console.log("user disconnected: " + socket.id);
    // Handle user disconnection
    for (const [sessionName, sessionObj] of sessions) {
      const userIndex = sessionObj.sessionUserIDs.indexOf(socket.id);
      if (userIndex !== -1) {
        sessionObj.sessionUsers.splice(userIndex, 1);
        sessionObj.sessionUserIDs.splice(userIndex, 1);
        io.to(sessionName).emit("updateUserList", 
          "\n" + sessionObj.sessionUsers.join("\n"));
      }
    }
  });
});

// Export the HTTP function
exports.chalkboard = functions.https.onRequest((req, res) => {
  // Handle HTTP requests
  if (req.path === "/") {
    res.sendFile("public/index.html", {root: __dirname});
  } else {
    res.status(404).send("Not Found");
  }
});

// Export the WebSocket function
exports.chalkboardSocket = functions.https.onRequest((req, res) => {
  if (!req.url) {
    res.status(400).send("Bad Request");
    return;
  }

  server.emit("request", req, res);
});
