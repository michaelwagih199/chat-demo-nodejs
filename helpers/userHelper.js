const users = [];

// Join user to chat
function newUser(id, username, userType, room) {
  const user = { id, username, userType, room };
  const isUserJoined = users.find((user) => user.userType == userType);
  if (isUserJoined) throw Error("User Is Already Exist Before.");
  else users.push(user);
  return user;
}

// Get current user
function getActiveUser(id) {
  return users.find((user) => user.id === id);
}

function findByUserType(userType) {
  return users.find((user) => user.userType === userType);
}

// User leaves chat
function exitRoom(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
const getIndividualRoomUsers = async (room) => {
  return users.filter((user) => user.room === room);
};

module.exports = {
  newUser,
  getActiveUser,
  exitRoom,
  getIndividualRoomUsers,
  findByUserType,
};
