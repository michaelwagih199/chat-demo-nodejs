const moment = require("moment");

//enum for type and status
const RoomChatStatus = {
  DISCONNECT: "DISCONNECT",
  STANDBY: "STANDBY",
  CHATTING: "CURRENTLY_CHATTING",
};

const UserStatus = {
  OPEN: "DISCONNECT",
  STANDBY: "STANDBY",
  CHATTING: "CURRENTLY_CHATTING",
};

const UserType = {
  SLAVE: "SLAVE",
  MASTER: "MASTER",
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
    OPEN_CONVERSATION_CHANNEL: "OPEN_CONVERSATION_CHANNEL",
    START_CONVERSATION_CHANNEL: "START_CONVERSATION_CHANNEL",
    STATUS_INFORMATION_CHANNEL: "STATUS_INFORMATION_CHANNEL",
    JOIN_CONVERSATION_CHANNEL: "JOIN_CONVERSATION_CHANNEL",
  },

  MESSAGE_KEYS: {
    CONVERSATION_STATUS: "CONVERSATION_STATUS",
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
  ChatMessageType
};
