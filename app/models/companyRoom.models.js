module.exports = (sequelize, Sequelize) => {
  const CompanyRoom = sequelize.define("companyRoom", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    companyId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    chatRoomId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    masterUserStatus: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    slaveUserStatus: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    
  });

  return CompanyRoom;
};
