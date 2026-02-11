const sessionRaw = localStorage.getItem('chatUser');
if (!sessionRaw) {
  window.location.href = '/view/login.html';
  throw new Error('Missing session');
}

const user = JSON.parse(sessionRaw);
const socket = io();

const welcomeUser = document.getElementById('welcomeUser');
const roomSelect = document.getElementById('roomSelect');
const privateUserSelect = document.getElementById('privateUserSelect');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const currentRoomEl = document.getElementById('currentRoom');
const onlineUsersEl = document.getElementById('onlineUsers');
const logoutBtn = document.getElementById('logoutBtn');
const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const modeRoom = document.getElementById('modeRoom');
const modePrivate = document.getElementById('modePrivate');
const chatTitle = document.getElementById('chatTitle');
const loadPrivateBtn = document.getElementById('loadPrivateBtn');

let currentRoom = '';
let currentMode = 'room';
let activePrivateUser = '';
let typingTimer = null;

welcomeUser.textContent = `${user.firstname} ${user.lastname} (${user.username})`;

function formatTime(value) {
  return new Date(value).toLocaleString();
}

function appendMessage(entry) {
  const wrapper = document.createElement('div');
  wrapper.className = `message-item p-2 rounded mb-2 ${entry.self ? 'self-message' : 'other-message'}`;

  const meta = document.createElement('div');
  meta.className = 'small text-muted';
  meta.textContent = `${entry.sender} | ${formatTime(entry.date)}`;

  const text = document.createElement('div');
  text.textContent = entry.text;

  wrapper.appendChild(meta);
  wrapper.appendChild(text);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setTypingText(text) {
  $('#typingIndicator').text(text);
}

function appendSystemMessage(text) {
  const system = document.createElement('div');
  system.className = 'text-center text-muted small mb-2';
  system.textContent = text;
  messagesEl.appendChild(system);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function clearMessages() {
  messagesEl.innerHTML = '';
}

async function loadRooms() {
  const response = await fetch('/api/rooms');
  const data = await response.json();
  roomSelect.innerHTML = '';
  data.rooms.forEach((room) => {
    const option = document.createElement('option');
    option.value = room;
    option.textContent = room;
    roomSelect.appendChild(option);
  });
}

async function loadUsers() {
  const response = await fetch(`/api/users?username=${encodeURIComponent(user.username)}`);
  const data = await response.json();
  privateUserSelect.innerHTML = '<option value="">Select user</option>';

  data.users.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.username;
    option.textContent = `${entry.username} (${entry.firstname} ${entry.lastname})`;
    privateUserSelect.appendChild(option);
  });
}

async function loadRoomMessages(room) {
  const response = await fetch(`/api/messages/room/${encodeURIComponent(room)}`);
  const data = await response.json();
  clearMessages();

  data.messages.forEach((msg) => {
    appendMessage({
      sender: msg.from_user,
      text: msg.message,
      date: msg.date_sent,
      self: msg.from_user === user.username
    });
  });
}

async function loadPrivateMessages(otherUser) {
  const response = await fetch(`/api/messages/private/${encodeURIComponent(otherUser)}?username=${encodeURIComponent(user.username)}`);
  const data = await response.json();
  clearMessages();

  data.messages.forEach((msg) => {
    appendMessage({
      sender: msg.from_user,
      text: msg.message,
      date: msg.date_sent,
      self: msg.from_user === user.username
    });
  });
}

joinRoomBtn.addEventListener('click', async () => {
  const room = roomSelect.value;
  if (!room) {
    return;
  }

  socket.emit('join-room', { username: user.username, room });
  currentRoom = room;
  currentRoomEl.textContent = room;

  if (currentMode === 'room') {
    chatTitle.textContent = `Room Chat: ${room}`;
    await loadRoomMessages(room);
  }
});

leaveRoomBtn.addEventListener('click', () => {
  if (!currentRoom) {
    return;
  }

  socket.emit('leave-room', { username: user.username, room: currentRoom });
  currentRoom = '';
  currentRoomEl.textContent = 'None';
  if (currentMode === 'room') {
    clearMessages();
    chatTitle.textContent = 'Room Chat';
  }
});

modeRoom.addEventListener('change', async () => {
  if (!modeRoom.checked) {
    return;
  }

  currentMode = 'room';
  setTypingText('');
  chatTitle.textContent = currentRoom ? `Room Chat: ${currentRoom}` : 'Room Chat';
  if (currentRoom) {
    await loadRoomMessages(currentRoom);
  } else {
    clearMessages();
  }
});

modePrivate.addEventListener('change', async () => {
  if (!modePrivate.checked) {
    return;
  }

  currentMode = 'private';
  setTypingText('');
  chatTitle.textContent = activePrivateUser ? `Private Chat: ${activePrivateUser}` : 'Private Chat';
  if (activePrivateUser) {
    await loadPrivateMessages(activePrivateUser);
  } else {
    clearMessages();
  }
});

loadPrivateBtn.addEventListener('click', async () => {
  const selected = privateUserSelect.value;
  if (!selected) {
    return;
  }

  activePrivateUser = selected;
  currentMode = 'private';
  modePrivate.checked = true;
  modeRoom.checked = false;
  chatTitle.textContent = `Private Chat: ${activePrivateUser}`;
  setTypingText('');
  await loadPrivateMessages(activePrivateUser);
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  if (!message) {
    return;
  }

  if (currentMode === 'room') {
    if (!currentRoom) {
      return;
    }
    socket.emit('send-room-message', { from_user: user.username, room: currentRoom, message });
  } else {
    if (!activePrivateUser) {
      return;
    }
    socket.emit('send-private-message', {
      from_user: user.username,
      to_user: activePrivateUser,
      message
    });
    socket.emit('typing-private', { from_user: user.username, to_user: activePrivateUser, isTyping: false });
  }

  messageInput.value = '';
});

messageInput.addEventListener('input', () => {
  if (currentMode === 'room') {
    if (!currentRoom) {
      return;
    }
    socket.emit('typing-room', { username: user.username, room: currentRoom, isTyping: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing-room', { username: user.username, room: currentRoom, isTyping: false });
    }, 900);
  } else {
    if (!activePrivateUser) {
      return;
    }
    socket.emit('typing-private', { from_user: user.username, to_user: activePrivateUser, isTyping: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing-private', { from_user: user.username, to_user: activePrivateUser, isTyping: false });
    }, 900);
  }
});

socket.on('room-message', (msg) => {
  if (currentMode !== 'room' || msg.room !== currentRoom) {
    return;
  }

  appendMessage({
    sender: msg.from_user,
    text: msg.message,
    date: msg.date_sent,
    self: msg.from_user === user.username
  });
});

socket.on('private-message', (msg) => {
  const isConversation =
    (msg.from_user === user.username && msg.to_user === activePrivateUser) ||
    (msg.from_user === activePrivateUser && msg.to_user === user.username);

  if (currentMode === 'private' && isConversation) {
    appendMessage({
      sender: msg.from_user,
      text: msg.message,
      date: msg.date_sent,
      self: msg.from_user === user.username
    });
  }
});

socket.on('typing-room', (payload) => {
  if (currentMode !== 'room' || payload.room !== currentRoom) {
    return;
  }

  setTypingText(payload.isTyping ? `${payload.username} is typing...` : '');
});

socket.on('typing-private', (payload) => {
  if (currentMode !== 'private' || payload.from_user !== activePrivateUser || payload.to_user !== user.username) {
    return;
  }

  setTypingText(payload.isTyping ? `${payload.from_user} is typing...` : '');
});

socket.on('room-system-message', (payload) => {
  if (currentMode !== 'room' || payload.room !== currentRoom) {
    return;
  }

  appendSystemMessage(payload.message);
});

socket.on('online-users', (users) => {
  onlineUsersEl.innerHTML = '';
  users.forEach((username) => {
    const li = document.createElement('li');
    li.className = 'list-group-item py-1';
    li.textContent = username;
    onlineUsersEl.appendChild(li);
  });
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('chatUser');
  window.location.href = '/view/login.html';
});

(async function init() {
  await loadRooms();
  await loadUsers();
  socket.emit('register-user', { username: user.username });
})();
