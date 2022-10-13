const db = require("../models"); // models path depend on your structure
const User = db.user;
const ChatRoom = db.chatRoom;
const ChatMessage = db.chatMessage;
const CompanyRoom = db.companyRoom;
const { QueryTypes } = require("sequelize");

const chatEnum = require("./enum/chatting.util");
const formatMessage = require("../../helpers/formatDate");

const {
  getActiveUser,
  exitRoom,
  newUser,
  findByUserType,
  getIndividualRoomUsers,
} = require("../../helpers/userHelper");
const { companyRoom, user } = require("../models");

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
      message: "Chat Setup Successfully",
    });
  } catch (error) {}
};

exports.checkStatus = async (req, res) => {
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
      status: chatInfo,
    });
  } catch (error) {
    console.log(error);
  }
};

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
    console.log(
      "🚀 ~ file: chat-room.service.js ~ line 130 ~ sendChattingInfoResponse= ~ error",
      error
    );
    throw error;
  }
};

exports.getChattingStatus = async (userEmail, socket) => {
  await sendChattingInfoResponse(userEmail);
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

exports.startConversation = async (socket, username) => {
  await sendChattingInfoResponse(username);
  if (chatInfo.roomStatus === chatEnum.RoomChatStatus.CHATTING)
    socket.emit(
      chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
      formatMessage("I Hear you", `Conversation is Already Started`)
    );

  if (chatInfo.roomStatus === chatEnum.RoomChatStatus.STANDBY) {
    await ChatRoom.update(
      { roomStatus: chatEnum.RoomChatStatus.CHATTING },
      {
        where: {
          id: chatInfo.chatRoomId,
        },
      }
    );
    socket.emit(
      chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
      formatMessage("I Hear you", `Conversation Started Successfully`)
    );
  } else {
    socket.emit(
      chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
      formatMessage("I Hear you", `Not Eligible to Start Conversation`)
    );
  }
};

exports.disconnect = async (socket, io) => {
  try {
    const activeUser = getActiveUser(socket.id);

    await updateUserType(activeUser.userType, chatEnum.UserStatus.DISCONNECT);
    await updateChatRoom(activeUser.username);

    const user = exitRoom(socket.id);

    if (user) {
      io.to(user.room).emit(
        chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
        formatMessage("I Hear you", `${user.username} has left the room`)
      );

      // Current active users and room name
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: await getIndividualRoomUsers(user.room),
      });
    }
  } catch (error) {
    console.log("disconnect error", error);
  }
};

exports.joinChat = async (socket, io, username, userType) => {
  try {
    const userTypeList = [chatEnum.UserType.MASTER, chatEnum.UserType.SLAVE];
    if (!userTypeList.includes(userType)) {
      socket.emit(
        chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
        "User Type Not Valid "
      );
      return;
    }

    await sendChattingInfoResponse(username);
    await updateUserType(userType, chatEnum.UserStatus.CONNECTED);
    await updateChatRoom(username);
    const user = newUser(socket.id, username, userType, chatInfo.chatRoomId);

    socket.join(user.room);
    socket.broadcast
      .to(user.room)
      .emit(
        "joinUserMessage",
        formatMessage("I hear you", `${user.userType} has joined the Chat`)
      );

    // // Current active users and room name
    
    io.to(user.room).emit("activeRoomUserUser", {
      room: user.room,
      users: await getIndividualRoomUsers(user.room),
    });
  } catch (error) {
    
    console.log(
      "🚀 ~ file: chat-room.service.js ~ line 213 ~ exports.joinChat= ~ error",
      error
    );
  }
};

exports.chatMessage = async (socket, io, chatMessage) => {
  try {
    const user = getActiveUser(socket.id);

    const masterUser = findByUserType(chatEnum.UserType.MASTER);
    console.log("🚀 ~ file: chat-room.service.js ~ line 243 ~ exports.chatMessage= ~ masterUser", masterUser)
    const slaveUser = findByUserType(chatEnum.UserType.SLAVE);

    await sendChattingInfoResponse(user.username);

    if (chatInfo.roomStatus != chatEnum.RoomChatStatus.CHATTING) {
      io.to(user.room).emit(
        chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
        formatMessage("I Hear You", "Please Start Conversation")
      );
      return;
    }

    io.to(masterUser.id).emit(
      "message",
      formatMessage(user.userType, chatMessage+"\t :to Master")
    );

    io.to(slaveUser.id).emit(
      "message",
      formatMessage(user.userType, chatMessage + " \t : to slave")
    );

    let chatMessageObject = {
      message: chatMessage,
      ChatRoomId: user.room,
      userType: user.userType,
      ChatMessageStatus: chatEnum.ChatMessageType.ACTIVE,
    };

    await ChatMessage.create(chatMessageObject);
  } catch (error) {
    console.log("====>> chatMessage EROR ===>>", error);
  }
};

/*
utils message
*/

async function updateUserType(userType, status) {
  switch (userType) {
    case chatEnum.UserType.MASTER:
      await updateMasterStatus(chatInfo.companyRoomId, status);
      break;
    case chatEnum.UserType.SLAVE:
      await updateSlaveStatus(chatInfo.companyRoomId, status);
      break;
  }
}

async function updateMasterStatus(companyRoomId, status) {
  await CompanyRoom.update(
    { masterUserStatus: status },
    {
      where: {
        id: companyRoomId,
      },
    }
  );
}

async function updateSlaveStatus(companyRoomId, status) {
  await CompanyRoom.update(
    { slaveUserStatus: status },
    {
      where: {
        id: companyRoomId,
      },
    }
  );
}

async function updateChatRoom(username) {
  await sendChattingInfoResponse(username);
  let newRoomStatus = chatEnum.RoomChatStatus.STANDBY;
  if (
    chatInfo.masterUserStatus === chatEnum.UserStatus.DISCONNECT &&
    chatInfo.slaveUserStatus === chatEnum.UserStatus.DISCONNECT
  ) {
    newRoomStatus = chatEnum.RoomChatStatus.DISCONNECT;
  }

  if (
    chatInfo.masterUserStatus === chatEnum.UserStatus.CONNECTED &&
    chatInfo.slaveUserStatus === chatEnum.UserStatus.CONNECTED
  ) {
    newRoomStatus = chatEnum.RoomChatStatus.STANDBY;
  }

  if (
    chatInfo.masterUserStatus === chatEnum.UserStatus.CONNECTED &&
    chatInfo.slaveUserStatus === chatEnum.UserStatus.DISCONNECT
  ) {
    newRoomStatus = chatEnum.RoomChatStatus.DISCONNECT;
  }

  if (
    chatInfo.masterUserStatus === chatEnum.UserStatus.DISCONNECT &&
    chatInfo.slaveUserStatus === chatEnum.UserStatus.CONNECTED
  ) {
    newRoomStatus = chatEnum.RoomChatStatus.DISCONNECT;
  }

  await ChatRoom.update(
    { roomStatus: newRoomStatus },
    {
      where: {
        id: chatInfo.chatRoomId,
      },
    }
  );
}
