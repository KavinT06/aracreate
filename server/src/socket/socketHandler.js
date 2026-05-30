const { Server } = require('socket.io');
const { createCorsOriginChecker } = require('../config/cors');
const socketAuth = require('./socketAuth');
const messageService = require('../services/messageService');

const handleJoinRoom = (socket) => async (roomId) => {
  try {
    socket.join(roomId);
    socket.to(roomId).emit('user_joined', {
      userId: socket.user._id,
      username: socket.user.username,
    });
  } catch (err) {
    socket.emit('error', { message: 'Failed to join room' });
  }
};

const handleLeaveRoom = (socket) => async (roomId) => {
  socket.leave(roomId);
  socket.to(roomId).emit('user_left', {
    userId: socket.user._id,
    username: socket.user.username,
  });
};

const handleSendMessage = (socket, io) => async ({ roomId, content }) => {
  try {
    if (!roomId || !content?.trim()) {
      return socket.emit('error', { message: 'roomId and content are required' });
    }

    const message = await messageService.createMessage({
      room: roomId,
      sender: socket.user._id,
      content: content.trim(),
    });

    const populated = await message.populate('sender', 'username');

    io.to(roomId).emit('receive_message', {
      _id: populated._id,
      content: populated.content,
      createdAt: populated.createdAt,
      sender: { _id: populated.sender._id, username: populated.sender.username },
      room: roomId,
    });
  } catch (err) {
    socket.emit('error', { message: 'Failed to send message' });
  }
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: createCorsOriginChecker(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} [${socket.id}]`);

    socket.on('join_room', handleJoinRoom(socket));
    socket.on('leave_room', handleLeaveRoom(socket));
    socket.on('send_message', handleSendMessage(socket, io));

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = { initSocket };