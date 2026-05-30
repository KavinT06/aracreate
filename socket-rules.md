# Socket.io Implementation Rules

## Overview

Socket.io is used exclusively for real-time messaging. All other data operations (creating rooms, listing rooms, fetching message history) use REST APIs. Socket logic must be isolated from REST API logic and must never duplicate REST API responsibilities.

---

## Socket Authentication Using JWT

### Server-Side Socket Auth Middleware

Socket connections must be authenticated before any events are processed. JWT verification happens in a middleware attached to `io.use()`.

```js
// src/socket/socketAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();

    if (!user) {
      return next(new Error('Authentication error: user not found'));
    }

    socket.user = user; // Attach authenticated user to the socket instance
    next();
  } catch (err) {
    next(new Error('Authentication error: token invalid'));
  }
};

module.exports = socketAuth;
```

### Rules
- Always verify JWT in `io.use()` middleware — never inside individual event handlers
- Attach the decoded user to `socket.user` so all event handlers can access it
- Reject unauthenticated connections with a clear error message via `next(new Error(...))`
- Never trust `socket.handshake.auth.userId` from the client — always derive the user from the verified token

---

## Socket Server Initialization

```js
// src/socket/socketHandler.js
const { Server } = require('socket.io');
const socketAuth = require('./socketAuth');
const messageService = require('../services/messageService');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} [${socket.id}]`);

    // Event handlers
    socket.on('join_room', handleJoinRoom(socket));
    socket.on('leave_room', handleLeaveRoom(socket));
    socket.on('send_message', handleSendMessage(socket, io));

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = { initSocket };
```

---

## Room Joining Logic

```js
// Inside socketHandler.js

const handleJoinRoom = (socket) => async (roomId) => {
  try {
    // Join the Socket.io room (channel)
    socket.join(roomId);
    console.log(`${socket.user.username} joined room: ${roomId}`);

    // Optionally notify others in the room
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
```

### Room Joining Rules
- Use `socket.join(roomId)` to add the socket to a Socket.io room
- Socket.io rooms are ephemeral — they do not replace `RoomMember` records in MongoDB
- REST API `POST /rooms/:id/join` persists membership in MongoDB; the socket `join_room` event only subscribes to real-time events
- A user must call `join_room` via socket after joining a room via REST API

---

## Event Naming Conventions

Use **snake_case** for all event names:

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Subscribe to room's real-time events |
| `leave_room` | Client → Server | Unsubscribe from room's real-time events |
| `send_message` | Client → Server | Send a new message to a room |
| `receive_message` | Server → Client | Broadcast a new message to all room members |
| `user_joined` | Server → Client | Notify room members when a user joins |
| `user_left` | Server → Client | Notify room members when a user leaves |
| `error` | Server → Client | Send error messages back to a specific socket |

---

## Real-Time Message Broadcasting

```js
// Inside socketHandler.js

const handleSendMessage = (socket, io) => async ({ roomId, content }) => {
  try {
    // 1. Validate input
    if (!roomId || !content?.trim()) {
      return socket.emit('error', { message: 'roomId and content are required' });
    }

    // 2. Persist message to MongoDB via service
    const message = await messageService.createMessage({
      room: roomId,
      sender: socket.user._id,
      content: content.trim(),
    });

    // 3. Populate sender info for broadcast
    const populated = await message.populate('sender', 'username');

    // 4. Broadcast to all clients in the room (including sender)
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
```

### Broadcasting Rules
- Use `io.to(roomId).emit()` to send to **all clients in a room including the sender**
- Use `socket.to(roomId).emit()` to send to **all clients in a room except the sender**
- Never use `io.emit()` — it broadcasts to every connected socket globally
- Always include `_id`, `content`, `createdAt`, and `sender` in the `receive_message` payload

---

## MongoDB Message Persistence Rules

- All messages sent via socket **must be persisted** to MongoDB before being broadcast
- Use `messageService.createMessage()` — never use the `Message` model directly in socket handlers
- If MongoDB persistence fails, emit an error back to the sender and do not broadcast
- Message persistence is the responsibility of the socket layer — not the REST API for real-time messages

```js
// src/services/messageService.js
const Message = require('../models/Message');

const createMessage = async ({ room, sender, content }) => {
  const message = await Message.create({ room, sender, content });
  return message;
};

const getRoomMessages = async (roomId) => {
  return Message.find({ room: roomId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'username')
    .lean()
    .then((msgs) => msgs.reverse()); // Reverse so oldest is first
};

module.exports = { createMessage, getRoomMessages };
```

---

## Separation of Socket Logic from REST APIs

| Responsibility | REST API | Socket.io |
|---|---|---|
| User registration/login | ✅ | ❌ |
| Creating chat rooms | ✅ | ❌ |
| Listing chat rooms | ✅ | ❌ |
| Joining a room (DB persistence) | ✅ | ❌ |
| Subscribing to room events | ❌ | ✅ (`join_room`) |
| Fetching last 50 messages | ✅ | ❌ |
| Sending new real-time messages | ❌ | ✅ (`send_message`) |
| Receiving new messages | ❌ | ✅ (`receive_message`) |

---

## Reconnect Handling

```js
// client/src/socket/socketClient.js
import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

### Rules
- Initialize the socket **once** at login, store the instance in `socketClient.js`
- Reconnect with JWT token on every reconnection attempt — the `auth.token` is re-sent automatically
- Disconnect the socket on logout via `disconnectSocket()`
- Never create multiple socket instances — always use `getSocket()`

---

## Zustand Realtime Updates via Socket Events

Socket event listeners must call Zustand store actions to update global state.

```js
// socket/socketClient.js (event binding)
import useMessageStore from '../store/useMessageStore';
import useRoomStore from '../store/useRoomStore';

export const bindSocketEvents = (socket) => {
  socket.on('receive_message', (message) => {
    useMessageStore.getState().appendMessage(message);
  });

  socket.on('error', ({ message }) => {
    console.error('Socket error:', message);
  });
};
```

### Call binding after connecting:
```js
// In ChatPage.jsx or a top-level effect
useEffect(() => {
  const token = useAuthStore.getState().token;
  const socket = connectSocket(token);
  bindSocketEvents(socket);

  return () => disconnectSocket();
}, []);
```

### Rules
- Use `useMessageStore.getState().appendMessage()` — not `setState` inside components
- Never set local component state from socket events — all state updates go through Zustand
- Bind socket events once at the app level — not inside individual page components
- Clean up socket connection on component unmount or logout