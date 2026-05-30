# Backend Development Rules

## Express.js Architecture

### App Structure
- `server.js` bootstraps the HTTP server and Socket.io — no route or business logic here
- `src/app.js` configures Express middleware, mounts routers, and sets up global error handling
- Each feature domain gets its own router file in `src/routes/`
- Routers mount under `/api` — example: `/api/auth`, `/api/rooms`, `/api/messages`

### App Setup Pattern
```js
// src/app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

app.use(errorHandler);

module.exports = app;
```

### Server Bootstrap Pattern
```js
// server.js
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket/socketHandler');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
```

---

## Mongoose Schema Design

### Rules
- Define schemas in `src/models/` — one file per model
- Always use `timestamps: true` to get `createdAt` and `updatedAt` automatically
- Use `ref` for all relationships — always populate when returning related data
- Define indexes inline on schema fields using `index: true` or via `schema.index({})`
- Keep schemas lean — no business logic inside models

### User Model
```js
// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

### Room Model
```js
// src/models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
```

### RoomMember Model
```js
// src/models/RoomMember.js
const mongoose = require('mongoose');

const roomMemberSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: false });

roomMemberSchema.index({ room: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', roomMemberSchema);
```

### Message Model
```js
// src/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room:    { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
```

---

## JWT Authentication

### Token Generation
```js
// src/utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
```

### Token Verification Rules
- Always verify tokens using `jwt.verify()` with `process.env.JWT_SECRET`
- Return 401 if the token is missing, malformed, or expired
- Attach the decoded user to `req.user` in the auth middleware
- Never trust data from the token payload without re-fetching from DB when security matters

---

## bcrypt Password Hashing

### Rules
- Always hash passwords before saving to MongoDB — never store plaintext passwords
- Use a salt rounds value of `10`
- Never return the `password` field in API responses — use `.select('-password')` in queries

```js
// In authService.js
const bcrypt = require('bcrypt');

const hashPassword = async (plaintext) => {
  return bcrypt.hash(plaintext, 10);
};

const verifyPassword = async (plaintext, hashed) => {
  return bcrypt.compare(plaintext, hashed);
};
```

---

## Middleware Patterns

### Auth Middleware
```js
// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

module.exports = { protect };
```

### Global Error Handler Middleware
```js
// src/middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
```

---

## Controller/Service Separation

### Rules
- **Controllers** — handle `req`, `res`, call the appropriate service, and return the response
- **Services** — contain all business logic, DB queries, and error throwing
- Controllers must never contain Mongoose queries or business logic
- Services must never reference `req` or `res`
- Throw errors from services using `const err = new Error('message'); err.statusCode = 400; throw err;`

### Controller Example
```js
// src/controllers/roomController.js
const roomService = require('../services/roomService');

const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body, req.user._id);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
};

const getRooms = async (req, res, next) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.status(200).json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRoom, getRooms };
```

### Service Example
```js
// src/services/roomService.js
const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');

const createRoom = async ({ name, description }, userId) => {
  const existing = await Room.findOne({ name });
  if (existing) {
    const err = new Error('Room name already exists');
    err.statusCode = 409;
    throw err;
  }
  const room = await Room.create({ name, description, createdBy: userId });
  await RoomMember.create({ room: room._id, user: userId });
  return room;
};

const getAllRooms = async () => {
  return Room.find().sort({ createdAt: -1 }).populate('createdBy', 'username');
};

module.exports = { createRoom, getAllRooms };
```

---

## Error Handling

- Always wrap controller logic in try/catch and pass errors to `next(err)`
- Throw errors from services with a custom `statusCode` property
- The global error handler reads `err.statusCode` to send the correct HTTP status
- Use 400 for validation errors, 401 for auth errors, 403 for forbidden, 404 for not found, 409 for conflict, 500 for unexpected errors
- Never expose stack traces in production responses

---

## API Response Conventions

Always return consistent JSON structures:

**Success:**
```json
{ "success": true, "data": { } }
```

**Error:**
```json
{ "success": false, "message": "Descriptive error message" }
```

**List response:**
```json
{ "success": true, "data": [ ], "count": 0 }
```

---

## Validation Rules

- Validate all incoming request bodies before processing
- Check for required fields and return 400 with a clear message if missing
- Sanitize string inputs using `.trim()` at the schema level
- Use schema-level constraints (`required`, `minlength`, `maxlength`, `unique`) as the first layer
- Add explicit service-level checks for business rule violations (e.g., duplicate room name)

---

## Socket Integration Standards

- Socket.io server must be initialized in `src/socket/socketHandler.js`
- Socket authentication must happen in the middleware before any event handlers run
- All socket event handlers must call service functions — no direct DB queries in socket files
- Message persistence happens inside the `send_message` socket handler via `messageService`
- See `.github/socket-rules.md` for full socket implementation details

---

## MongoDB Query Best Practices

- Always use `.lean()` for read-only queries that don't need Mongoose document methods
- Use `.select()` to explicitly choose returned fields — never return the full document if not needed
- Index fields used in `.find()`, `.sort()`, and `.populate()` queries
- Use `.populate()` with a field projection — e.g., `.populate('sender', 'username')`
- Limit message queries to 50 using `.limit(50).sort({ createdAt: -1 })` and reverse on the frontend
- Use `countDocuments()` only when counts are specifically needed — it adds overhead

---

## Database Connection

```js
// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```