require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const User = require('./models/User');
const GroupMessage = require('./models/GroupMessage');
const PrivateMessage = require('./models/PrivateMessage');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_test1_chat';
const PREDEFINED_ROOMS = ['devops', 'cloud computing', 'covid19', 'sports', 'nodeJS'];
const activeUsers = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'view')));
app.use('/view', express.static(path.join(__dirname, 'view')));

app.get('/', (req, res) => {
  res.redirect('/view/login.html');
});

app.get('/api/rooms', (req, res) => {
  res.json({ rooms: PREDEFINED_ROOMS });
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, firstname, lastname, password } = req.body;
    if (!username || !firstname || !lastname || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const createdUser = await User.create({ username, firstname, lastname, password });
    return res.status(201).json({
      message: 'Signup successful.',
      user: {
        username: createdUser.username,
        firstname: createdUser.firstname,
        lastname: createdUser.lastname,
        createon: createdUser.createon
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Signup failed.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username, password }).lean();
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.json({
      message: 'Login successful.',
      user: {
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        createon: user.createon
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { username } = req.query;
    const filter = username ? { username: { $ne: username } } : {};
    const users = await User.find(filter).select('username firstname lastname').sort({ username: 1 }).lean();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch users.' });
  }
});

app.get('/api/messages/room/:room', async (req, res) => {
  try {
    const room = req.params.room;
    const messages = await GroupMessage.find({ room }).sort({ date_sent: 1 }).lean();
    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch room messages.' });
  }
});

app.get('/api/messages/private/:otherUser', async (req, res) => {
  try {
    const { username } = req.query;
    const { otherUser } = req.params;
    if (!username || !otherUser) {
      return res.status(400).json({ message: 'Both users are required.' });
    }

    const messages = await PrivateMessage.find({
      $or: [
        { from_user: username, to_user: otherUser },
        { from_user: otherUser, to_user: username }
      ]
    })
      .sort({ date_sent: 1 })
      .lean();

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch private messages.' });
  }
});

io.on('connection', (socket) => {
  socket.on('register-user', ({ username }) => {
    if (!username) {
      return;
    }
    activeUsers.set(username, socket.id);
    io.emit('online-users', Array.from(activeUsers.keys()).sort());
  });

  socket.on('join-room', ({ username, room }) => {
    if (!username || !room || !PREDEFINED_ROOMS.includes(room)) {
      return;
    }

    const currentRoom = socket.data.room;
    if (currentRoom) {
      socket.leave(currentRoom);
      socket.to(currentRoom).emit('room-system-message', {
        room: currentRoom,
        message: `${username} left the room.`,
        date_sent: new Date().toISOString()
      });
    }

    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;

    io.to(room).emit('room-system-message', {
      room,
      message: `${username} joined the room.`,
      date_sent: new Date().toISOString()
    });
  });

  socket.on('leave-room', ({ username, room }) => {
    if (!room || socket.data.room !== room) {
      return;
    }

    socket.leave(room);
    socket.data.room = null;

    io.to(room).emit('room-system-message', {
      room,
      message: `${username || 'A user'} left the room.`,
      date_sent: new Date().toISOString()
    });
  });

  socket.on('send-room-message', async ({ from_user, room, message }) => {
    if (!from_user || !room || !message || socket.data.room !== room) {
      return;
    }

    try {
      const saved = await GroupMessage.create({ from_user, room, message });
      io.to(room).emit('room-message', {
        _id: saved._id,
        from_user: saved.from_user,
        room: saved.room,
        message: saved.message,
        date_sent: saved.date_sent
      });
    } catch (error) {}
  });

  socket.on('typing-room', ({ username, room, isTyping }) => {
    if (!username || !room || socket.data.room !== room) {
      return;
    }

    socket.to(room).emit('typing-room', { username, room, isTyping: Boolean(isTyping) });
  });

  socket.on('send-private-message', async ({ from_user, to_user, message }) => {
    if (!from_user || !to_user || !message) {
      return;
    }

    try {
      const saved = await PrivateMessage.create({ from_user, to_user, message });
      const payload = {
        _id: saved._id,
        from_user: saved.from_user,
        to_user: saved.to_user,
        message: saved.message,
        date_sent: saved.date_sent
      };

      const senderSocketId = activeUsers.get(from_user);
      const recipientSocketId = activeUsers.get(to_user);

      if (senderSocketId) {
        io.to(senderSocketId).emit('private-message', payload);
      }
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('private-message', payload);
      }
    } catch (error) {}
  });

  socket.on('typing-private', ({ from_user, to_user, isTyping }) => {
    if (!from_user || !to_user) {
      return;
    }

    const recipientSocketId = activeUsers.get(to_user);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing-private', {
        from_user,
        to_user,
        isTyping: Boolean(isTyping)
      });
    }
  });

  socket.on('disconnect', () => {
    let username = null;
    for (const [key, value] of activeUsers.entries()) {
      if (value === socket.id) {
        username = key;
        activeUsers.delete(key);
        break;
      }
    }

    if (username) {
      io.emit('online-users', Array.from(activeUsers.keys()).sort());
      if (socket.data.room) {
        io.to(socket.data.room).emit('room-system-message', {
          room: socket.data.room,
          message: `${username} disconnected.`,
          date_sent: new Date().toISOString()
        });
      }
    }
  });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

start();
