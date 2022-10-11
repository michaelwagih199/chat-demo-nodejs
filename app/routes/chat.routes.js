module.exports = (app) => {
  const chatService = require("../service/chat-room.service");

  var router = require("express").Router();

  // setup Chatting
  router.post("/activeStatus/user/:id", chatService.activeStatus);
  router.post("/checkStatus/user/:id", chatService.checkStatus);

  app.use("/api/chat", router);
};
