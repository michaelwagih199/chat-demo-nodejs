const moment = require("moment");

//enum for type and status
const RoomChatStatus = {
  DISCONNECT: "DISCONNECT",
  STANDBY: "STANDBY",
  CHATTING: "CURRENTLY_CHATTING",
};

const UserStatus = {
  DISCONNECT: "DISCONNECT",
  STANDBY: "STANDBY",
  CONNECTED :"CONNECTED",
  CHATTING: "CURRENTLY_CHATTING",
};

const UserType = {
  SLAVE: "0",
  MASTER: "1",
};

const ChatMessageType = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

function chattingInfoResponse(
  roomStatus,
  masterUserStatus,
  slaveUserStatus,
  message
) {
  return {
    messageType: "INFO_MESSAGE",
    masterUserStatus: masterUserStatus,
    slaveUserStatus: slaveUserStatus,
    currentlyChatStatus: roomStatus,
    importantInfo: message,
    time: moment().format("YYYY-MM-DD HH:mm:ss"),
  };
}

function chattingErrorResponse(code, message) {
  return {
    messageType: "ERROR_MESSAGE",
    code: code,
    message: message,
    time: moment().format("YYYY-MM-DD HH:mm:ss"),
  };
}

const chatConstants = {
  CHATTING_CHANNELS: {
    OPEN_CONVERSATION_CHANNEL: "open_conversation_channel",
    START_CONVERSATION_CHANNEL: "start_conversation_channel",
    STATUS_INFORMATION_CHANNEL: "status_information_channel",
    JOIN_CONVERSATION_CHANNEL: "join_conversation_channel",
    CHAT_MESSAGE_CHANNEL: "chat-message",
    DISCONNECT_CHANNEL: "disconnect"
  },

  MESSAGE_KEYS: {
    CONVERSATION_STATUS: "chat-info",
    CHAT_WARNING: "chat-warning",
    CHAT_MESSAGE: "chat-message",
    CONVERSATION_USERS: "conversation_users",
    ACTIVE_ROOM_USER_USER: "active_room_user_user",
  },

  DEFAULT_CHAT_MESSAGE: {
    STATUS_INFORMATION: " Status Chatting Information ",
  },

  DEFAULT_CHAT_ERROR: {
    Code: 500,
    message: "WEB Socket Error",
    error: "",
  },
};

module.exports = {
  RoomChatStatus,
  UserType,
  chatConstants,
  chattingInfoResponse,
  chattingErrorResponse,
  UserStatus,
  ChatMessageType,
};
