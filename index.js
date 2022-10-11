const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./helpers/formatDate");
const bodyParser = require("body-parser");
const cors = require("cors");
const chatEnum = require("./app/service/enum/chatting.util");

var corsOptions = {
  origin: "http://localhost:3000",
};

const {
  getActiveUser,
  exitRoom,
  newUser,
  newMessage,
  getM,
  getIndividualRoomUsers,
} = require("./helpers/userHelper");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set public directory
app.use(express.static(path.join(__dirname, "public")));

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const db = require("./app/models");
const User = db.user;
const chattingService = require("./app/service/chat-room.service");

// db.sequelize.sync({ force: true }).then(
//   () => console.log("Sync complete")
// ).then(()=>{
//   //we assume company id is 3
//   User.create({userName: "SuperAdmin",passwordHash:"123456789", firstName:"Super", parent_email_id:"0", email: "cb@gmail.com"})
//   User.create({userName: "agent1",passwordHash:"123456789", firstName:"Super", parent_email_id:"1", email: "agent@gmail.com"})
// });

// this block will run when the client connects
io.on("connection", (socket) => {


  socket.on(
    chatEnum.chatConstants.CHATTING_CHANNELS.STATUS_INFORMATION_CHANNEL,
    (userId) => {
      chattingService.getChattingStatus(userId, socket);
    }
  );

  socket.on(
    chatEnum.chatConstants.CHATTING_CHANNELS.JOIN_CONVERSATION_CHANNEL,
    ({ email, userType }) => {
      chattingService.joinChat(socket, io, email, userType);
    }
  );

  // Listen for client message
  socket.on("chatMessage", (msg) => {
    chattingService.chatMessage(socket,io,msg);
  });

  socket.on("startConversation", (email) => {
    chattingService.startConversation(socket, email);
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    chattingService.disconnect(socket,io);
  });
});

require("./app/routes/chat.routes")(app);
require("./app/routes/tutorial.routes")(app);


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
