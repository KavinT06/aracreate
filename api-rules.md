# REST API Design Rules

## Endpoint Naming Conventions

- Use **lowercase, kebab-case** for multi-word resource names
- Use **plural nouns** for resource collections
- Use **path parameters** (`/:id`) for individual resources
- Use **nested routes** to express relationships
- Never use verbs in endpoint paths — the HTTP method is the verb

### Endpoint Reference

```
POST   /api/auth/register         Register a new user
POST   /api/auth/login            Login and receive JWT
GET    /api/auth/me               Get current authenticated user

GET    /api/rooms                 List all chat rooms
POST   /api/rooms                 Create a new chat room
GET    /api/rooms/:id             Get a single room by ID
POST   /api/rooms/:id/join        Join a room (add RoomMember record)

GET    /api/messages/:roomId      Get last 50 messages for a room
```

### Rules
- Do not expose internal IDs as meaningful resource names — use MongoDB `_id`
- Never use `/getMessages` or `/createRoom` — use correct HTTP verb + resource path
- Prefix all routes with `/api` to namespace backend routes from frontend routes

---

## HTTP Status Codes

Always use the correct status code. Never return `200` for errors.

| Scenario | Status Code |
|---|---|
| Resource created | 201 Created |
| Success with data | 200 OK |
| No content | 204 No Content |
| Bad request / validation error | 400 Bad Request |
| Missing or invalid token | 401 Unauthorized |
| Authenticated but no permission | 403 Forbidden |
| Resource not found | 404 Not Found |
| Duplicate resource / conflict | 409 Conflict |
| Unexpected server error | 500 Internal Server Error |

---

## Request Validation

- Validate all incoming `req.body` fields before passing to the service layer
- Return `400` with a descriptive message for any missing or invalid field
- Perform validation inside the **service layer** — not the controller — for business rules
- Perform basic field presence checks inside the **controller** before calling the service

### Validation Pattern
```js
// In controller
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'username, email, and password are required',
      });
    }

    const user = await authService.register({ username, email, password });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
```

---

## Response Structure

Every API response must follow these structures exactly:

### Success — Single Resource
```json
{
  "success": true,
  "data": {
    "_id": "64abc123",
    "name": "General",
    "description": "General chat room",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Success — Collection
```json
{
  "success": true,
  "data": [
    { "_id": "64abc123", "name": "General" },
    { "_id": "64abc456", "name": "Random" }
  ],
  "count": 2
}
```

### Error Response
```json
{
  "success": false,
  "message": "Email already in use"
}
```

### Authentication Response (Login/Register)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64abc123",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Authentication Handling

- Protect all routes except `POST /api/auth/register` and `POST /api/auth/login`
- Apply the `protect` middleware to all protected routers:

```js
// src/routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getRooms, createRoom, joinRoom } = require('../controllers/roomController');

router.use(protect); // Apply to all routes in this router

router.get('/', getRooms);
router.post('/', createRoom);
router.post('/:id/join', joinRoom);

module.exports = router;
```

- Never return password hashes in any API response — always use `.select('-password')`
- The `token` is returned only on login and register — never on other endpoints

---

## Pagination and Message Fetching

- Fetch messages with a hard limit of **50** per request
- Sort by `createdAt: -1` (newest first) in the DB query, then reverse in the service to return oldest-first order to the client
- This ensures the chat renders messages in chronological order

```js
// src/services/messageService.js
const getRoomMessages = async (roomId) => {
  const messages = await Message.find({ room: roomId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'username')
    .lean();

  return messages.reverse();
};
```

### Message API Route
```js
// src/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getRoomMessages } = require('../controllers/messageController');

router.use(protect);
router.get('/:roomId', getRoomMessages);

module.exports = router;
```

### Message Controller
```js
// src/controllers/messageController.js
const messageService = require('../services/messageService');

const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const messages = await messageService.getRoomMessages(roomId);
    res.status(200).json({ success: true, data: messages, count: messages.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRoomMessages };
```

---

## Error Response Format

The global error handler produces all error responses:

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
```

### Throwing Errors from Services
```js
const err = new Error('Room not found');
err.statusCode = 404;
throw err;
```

---

## Clean REST Principles Summary

- ✅ Resources are nouns, not verbs
- ✅ HTTP methods define the action (GET, POST, PUT, PATCH, DELETE)
- ✅ Consistent response envelopes (`success`, `data`, `message`, `count`)
- ✅ Correct HTTP status codes always
- ✅ Authentication via `Authorization: Bearer <token>` header
- ✅ No sensitive data (passwords, secrets) in responses
- ✅ Errors always return `success: false` with a human-readable `message`
- ❌ Never use query strings for identity (`?action=create`)
- ❌ Never mix REST and socket responsibilities
- ❌ Never return `200` for an error condition
- ❌ Never return data without the `success` wrapper