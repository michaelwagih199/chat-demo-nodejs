module.exports = (app) => {
  const chatService = require("../service/chat-room.service");

  var router = require("express").Router();

  // Retrieve company

  app.use("/api/chatting", router);
};
