module.exports = (app) => {
  const chatService = require("../service/chat-room.service");

  var router = require("express").Router();

  // setup Chatting
  // router.post("/standByAs/user/:id", chatService.activeStatus);  // to ready chat ( type ) (1 as master, 2 :slave)
  router.get("/checkStatus/user/:id", chatService.checkStatus); // ( 0 no one standby ,1 master standby,2 slave standby ,3 masterAnd slave )
  
   // check-chat ( room status : )
  // app get all standby() 

  app.use("/api/chat", router);
};
