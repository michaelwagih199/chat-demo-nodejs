const dbConfig = require("../../config/config");

const Sequelize = require('sequelize');
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.tutorials = require("./tutorial.model")(sequelize, Sequelize);
db.user = require("./user.model")(sequelize, Sequelize);
db.chatRoom = require("./chat-room.model")(sequelize, Sequelize);
db.chatMessage = require("./chatMessage.models")(sequelize, Sequelize);
db.companyRoom = require("./companyRoom.models")(sequelize, Sequelize);

module.exports = db;