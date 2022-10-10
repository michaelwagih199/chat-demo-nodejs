module.exports = (sequelize, Sequelize) => {
  const ChatMessage = sequelize.define("chatMessage", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    message: {
      type: Sequelize.STRING,
    },

    //FK
    ChatRoomId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    ChatMessageStatus: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    userType: {
      type: Sequelize.STRING,
    },
  });

  return ChatMessage;
};
