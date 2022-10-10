const db = require("../models"); // models path depend on your structure
const User = db.user;
const ChatRoom = db.chatRoom;
const ChatMessage = db.chatMessage;
const CompanyRoom = db.companyRoom;
const chatEnum = require("./enum/chatting.util");
const formatMessage = require("../../helpers/formatDate");

const {
  getActiveUser,
  exitRoom,
  newUser,
  getM,
  getAllRoomUsers,
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

exports.startConversation = async (userEmail, socket) => {
  const currentUser = await User.findOne({
    where: {
      email: userEmail,
    },
  });

  if (!currentUser) {
    socket.emit(
      chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
      chatEnum.chattingErrorResponse(400, `Can't find Current User`)
    );
    return;
  }
  // console.log("🚀 ~ file: chat-room.service ~ line 25 ~ info", currentUser);
  const isRoomAlreadyOpened = await ChatRoom.findOne({
    where: {
      userId: currentUser.id,
      roomStatus: chatEnum.RoomChatStatus.STANDBY,
    },
  });

  // console.log(
  //   "🚀 ~ file: chat-room.service ~ line 34 ~ info",
  //   isRoomAlreadyOpened
  // );

  if (isRoomAlreadyOpened) {
    socket.emit(
      chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
      chatEnum.chattingErrorResponse(400, `chat room Is Opened before`)
    );
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
      companyRoomStatus: chatEnum.RoomChatStatus.STANDBY,
      masterUserStatus: chatEnum.UserStatus.STANDBY,
      slaveUserStatus: chatEnum.UserStatus.STANDBY,
    };
    companyRoom.create(companyRoomObject);
  });
  await sendChattingInfoResponse(socket, userEmail);
};

sendChattingInfoResponse = async (socket, userEmail) => {
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

    socket.emit(
      "CONVERSATION_STATUS",
      chatEnum.chattingInfoResponse(
        chatRoomStatus.roomStatus,
        companyRoomStatus.masterUserStatus,
        companyRoomStatus.slaveUserStatus,
        chatEnum.chatConstants.DEFAULT_CHAT_MESSAGE.STATUS_INFORMATION
      )
    );
  } catch (error) {
    console.log("🚀 ~ file: chat-room.service ~ line 111 ~ info", error);
    socket.emit(
      chatEnum.chatConstants.MESSAGE_KEYS.CONVERSATION_STATUS,
      chatEnum.chattingErrorResponse(500, `webSocket chat Error`)
    );
  }
};

exports.getChattingStatus = async (userEmail, socket) => {
  await sendChattingInfoResponse(socket, userEmail);
};

exports.joinChat = async (socket, io, userEmail, userType) => {
  
  try {

    await sendChattingInfoResponse(socket, userEmail);
    await updateChatRoom(
      chatInfo.chatRoomId,
      chatInfo.companyRoomId,
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

    // const user = newUser(socket.id, userEmail, userType, chatInfo.chatRoomId);
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

    const { count, rows } = await ChatMessage.findAndCountAll({
      where: {
        ChatRoomId: user.room,
        ChatMessageStatus:chatEnum.ChatMessageType.ACTIVE
      }
    });
   
    rows.forEach(element => {
      io.to(user.room).emit("message", formatMessage(user.username, element.message));
    });
  
  } catch (error) {}
};

exports.chatMessage = async (socket, io, chatMessage) => {
  const user = getActiveUser(socket.id);
  io.to(user.room).emit("message", formatMessage(user.username, chatMessage));
  let chatMessageObject = {
    message: chatMessage,
    ChatRoomId: user.room,
    userType: user.userType,
    ChatMessageStatus: chatEnum.ChatMessageType.ACTIVE
  };
  await ChatMessage.create(chatMessageObject).then((data) => {
    console.log(data);
  });
  
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

const updateChatRoom = async (chatRoomId, companyRoomId, status) => {
  await ChatRoom.update(
    { roomStatus: status },
    {
      where: {
        id: chatRoomId,
      },
    }
  );

  await CompanyRoom.update(
    { companyRoomStatus: status },
    {
      where: {
        id: companyRoomId,
      },
    }
  );
};
