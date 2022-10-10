module.exports = (sequelize, Sequelize) => {
  
  const ChatRoom = sequelize.define("chatRoom", {
  
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  roomStatus: {
    type: Sequelize.STRING,
    allowNull: false
  },

  //FK
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },

});

return ChatRoom;
};
