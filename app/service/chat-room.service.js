const db = require("../models"); // models path depend on your structure
const User = db.user;
const ChatRoom = db.chatRoom;
const ChatMessage = db.chatMessage;
const CompanyRoom = db.companyRoom;
const { QueryTypes } = require('sequelize');

const chatEnum = require("./enum/chatting.util");
const formatMessage = require("../../helpers/formatDate");

const {
  getActiveUser,
  exitRoom,
  newUser,
  getIndividualRoomUsers,
} = require("../../helpers/userHelper");
const { companyRoom } = require("../models");

var chatInfo = {
  roomStatus: "",
  masterUserStatus: "",
  slaveUserStatus: "",
  chatRoomId: "",
  companyRoomId: "",
};


exports.activeStatus = async (req, res) => {
  const id = req.params.id;
  try {
    const currentUser = await User.findByPk(id);
    if (!currentUser) {
      res.status(404).send({
        message: `Cant Find User ${currentUser}`,
      });
      return;
    }

    const isRoomAlreadyOpened = await ChatRoom.findOne({
      where: {
        userId: currentUser.id,
        roomStatus: chatEnum.RoomChatStatus.STANDBY,
      },
    });

    if (isRoomAlreadyOpened) {
      res.status(400).send({
        message: `Chat Setup before`,
      });
      return;
    }

    //insert chat room
    let chatRoomObject = {
      roomStatus: chatEnum.RoomChatStatus.STANDBY,
      userId: currentUser.id,
    };
    await ChatRoom.create(chatRoomObject).then((chatRoom) => {
      let companyRoomObject = {
        companyId: currentUser.parent_email_id,
        chatRoomId: chatRoom.id,
        masterUserStatus: chatEnum.UserStatus.STANDBY,
        slaveUserStatus: chatEnum.UserStatus.STANDBY,
      };
      companyRoom.create(companyRoomObject);
    });

    res.status(200).send({
      message: "Chat Setup Succssfully",
    });

  } catch (error) {

  }
};

exports.checkStatus = async (req,res) =>{
  try {
    const id = req.params.id;

    const currentUser = await User.findByPk(id);
    console.log(currentUser);
    if (!currentUser) {
      res.status(404).send({
        message: `Cant Find User ${currentUser}`,
      });
      return;
    }
    await sendChattingInfoResponse(currentUser.email);
    res.status(200).send({
      status:chatInfo,
    });

  } catch (error) {
    console.log(error);
  }

}


sendChattingInfoResponse = async (userEmail) => {
  try {
    const currentUser = await User.findOne({
      where: {
        email: userEmail,
      },
    });

    const chatRoomStatus = await ChatRoom.findOne({
      where: {
        userId: currentUser.id,
      },
    });

    const companyRoomStatus = await companyRoom.findOne({
      where: {
        chatRoomId: chatRoomStatus.id,
      },
    });

    chatInfo = {
      roomStatus: chatRoomStatus.roomStatus,
      masterUserStatus: companyRoomStatus.masterUserStatus,
      slaveUserStatus: companyRoomStatus.slaveUserStatus,
      chatRoomId: chatRoomStatus.id,
      companyRoomId: companyRoomStatus.id,
    };

  } catch (error) {
    console.log("🚀 ~ file: chat-room.service ~ line 120 ~ info", error);
    throw error
  }
};

exports.getChattingStatus = async (userEmail, socket) => {
  await sendChattingInfoResponse( userEmail);
  socket.emit(
    chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
    chatEnum.chattingInfoResponse(
      chatInfo.roomStatus,
      chatInfo.masterUserStatus,
      chatInfo.slaveUserStatus,
      chatEnum.chatConstants.DEFAULT_CHAT_MESSAGE.STATUS_INFORMATION
    )
  );
};

exports.startConversation = async(socket,  userEmail) => {
  
  await sendChattingInfoResponse( userEmail);
  
  await updateChatRoom(
    chatInfo.chatRoomId,
    chatEnum.RoomChatStatus.CHATTING
  ).then(()=>{
    socket.emit(
      chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
      'Conversation Started Successfully'
    );
  });
  
}

exports.disconnect = async(socket, io) => {
  
  try {
    
    const user = exitRoom(socket.id);

    if (user) {
      io.to(user.room).emit(
        chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
        formatMessage("I Hear you", `${user.username} has left the room`)
      );
  
      // Current active users and room name
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getIndividualRoomUsers(user.room),
      });
    }
  
    await sendChattingInfoResponse(user.username);
    
    await updateChatRoom(
      chatInfo.chatRoomId,
      chatEnum.RoomChatStatus.DISCONNECT
    ).then(()=>{
      socket.emit(
        chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
        'Conversation Status disconnected.'
      );
    });
  } catch (error) {
    console.log("disconnect error", error);
  }

  
}

exports.joinChat = async (socket, io, userEmail, userType) => {
  try {
    await sendChattingInfoResponse( userEmail);
    await updateChatRoom(
      chatInfo.chatRoomId,
      chatEnum.RoomChatStatus.STANDBY
    );
    switch (userType) {
      case chatEnum.UserType.MASTER:
        await standByMaster(chatInfo.companyRoomId);
        break;
      case chatEnum.UserType.SLAVE:
        await standBySlave(chatInfo.companyRoomId);
        break;
    }
    const user = newUser(
      socket.id,
      userEmail,
      userType,
      chatInfo.chatRoomId
    );

    socket.join(user.room);

    socket.broadcast
      .to(user.room)
      .emit(
        "joinUserMessage",
        formatMessage("I hear you", `${user.userType} has joined the Chat`)
      );

    // Current active users and room name
    io.to(user.room).emit("activeRoomUserUser", {
      room: user.room,
      users: getIndividualRoomUsers(user.room),
    });

    // const { count, rows } = await ChatMessage.findAndCountAll({
    //   where: {
    //     ChatRoomId: user.room,
    //     ChatMessageStatus: chatEnum.ChatMessageType.ACTIVE
    //   }
    // });

    
    // const historyMessage = await db.query("select msg.id, msg.message,msg.userType,msg.createdAt from chatmessages as msg join chatrooms as room on msg.ChatRoomId = room.id where room.id = :roomId", {
    //   model: ChatMessage,
    //   mapToModel: true,
    //   replacements: { roomId: '3' },
    //   type: QueryTypes.SELECT
    //  });
  
    //  console.log("historyMessage=>>>>>",historyMessage);

    // rows.forEach(element => {
    //   io.to(user.room).emit("message", formatMessage(user.username, element.message));
    // });

  } catch (error) {
    console.log(error);
   }
};

exports.chatMessage = async (socket, io, chatMessage) => {
  try {
    
    const user = getActiveUser(socket.id);
    await sendChattingInfoResponse(user.username);
    
    if (chatInfo.roomStatus != chatEnum.RoomChatStatus.CHATTING) {
      io.to(user.room).emit(chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS, formatMessage("I Hear You", 'Plase Start Conversation'));
      return;
    }
  
    io.to(user.room).emit("message", formatMessage(user.userType, chatMessage));
    let chatMessageObject = {
      message: chatMessage,
      ChatRoomId: user.room,
      userType: user.userType,
      ChatMessageStatus: chatEnum.ChatMessageType.ACTIVE
    };
    await ChatMessage.create(chatMessageObject);

  } catch (error) {
      console.log("====>> chatMessage EROR ===>>",error);
  }

};

const standByMaster = async (companyRoomId) => {
  await CompanyRoom.update(
    { masterUserStatus: chatEnum.UserStatus.STANDBY },
    {
      where: {
        id: companyRoomId,
      },
    }
  );
};

const standBySlave = async (companyRoomId) => {
  await CompanyRoom.update(
    { slaveUserStatus: chatEnum.UserStatus.STANDBY },
    {
      where: {
        id: companyRoomId,
      },
    }
  );
};

const updateChatRoom = async (chatRoomId, status) => {
  await ChatRoom.update(
    { roomStatus: status },
    {
      where: {
        id: chatRoomId,
      },
    }
  );

};
