const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const { email, userType } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

let configDevice = {
  email,
  userType,
};
// Join chatroom
// socket.emit('joinRoom', { username, room });

socket.emit('join_conversation_channel', {email,userType});


// socket.emit('OPEN_CONVERSATION_CHANNEL', "agent@gmail.com");

// Get room and users
socket.on('active_room_user_user', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on('chat-info',  (message) => {
console.log("🚀chat-warning", message)
});

socket.on('chat-warning',  (message) => {
  console.log("🚀chat-warning", message)
});

// Message from server
socket.on("conversation_users", (message) => {
  console.log("🚀conversation_users", message)
  
  console.log(message);
  // outputMessage(message);

  // // Scroll down
  // chatMessages.scrollTop = chatMessages.scrollHeight;
});


socket.on("chat-message", (message) => {
  console.log(message);
  outputMessage(message);

  console.log("chat-message", message)

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }


  // Emit message to server
  socket.emit("chat-message", msg);

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  console.log({ users });
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.userType;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  } else {
  }
});


document.getElementById("startConversation").addEventListener("click", () => {
  socket.emit('start_conversation_channel', email);

});

document.getElementById("endConversation").addEventListener("click", () => {
  // socket.emit('end_conversation', email);
});


