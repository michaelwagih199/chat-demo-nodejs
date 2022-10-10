module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userName: {
      type: Sequelize.STRING,
    },
    
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    parent_email_id: {
      type: Sequelize.INTEGER
    },

    passwordHash: { type: Sequelize.STRING, allowNull: false },
  });
  return User;
};
