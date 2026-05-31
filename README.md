# ChatApp — Real-Time Chat Application

> A full-stack real-time chat application built with React, Node.js, Express, Socket.IO, and MongoDB.

---

## Overview

ChatApp is a modern, room-based messaging platform that lets users register, sign in, create chat rooms, and exchange messages in real time. All messages are persisted in MongoDB so the conversation history survives page refreshes. Authentication is secured with signed JSON Web Tokens (JWT), and the live messaging layer is powered by Socket.IO.

---

## Features

- 🔐 **User Authentication** — Secure register/login flow with bcrypt-hashed passwords
- 💬 **Real-Time Messaging** — Instant message delivery via Socket.IO (no page refresh needed)
- 🏠 **Room Management** — Create named chat rooms with optional descriptions; join any room with a single click
- 🟢 **Online/Offline Status** — Live presence indicators so you know who is currently active
- 📜 **Message Persistence** — Full chat history stored in MongoDB and loaded on room join
- 📱 **Responsive UI** — Tailwind CSS layout that works on desktop and mobile viewports
- 🛡️ **Secure JWT Authentication** — Tokens stored in `localStorage`; protected API routes and Socket.IO handshake

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI component library |
| [Vite](https://vitejs.dev/) | Lightning-fast dev server & bundler |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight global state management |
| [React Router v6](https://reactrouter.com/) | Client-side routing |
| [Socket.IO Client](https://socket.io/) | Real-time WebSocket communication |

### Backend
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Express.js](https://expressjs.com/) | HTTP server & REST API |
| [Socket.IO](https://socket.io/) | Bidirectional real-time events |
| [Mongoose](https://mongoosejs.com/) | MongoDB ODM |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT signing & verification |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |

### Database
| Technology | Purpose |
|---|---|
| [MongoDB Atlas](https://www.mongodb.com/atlas) | Cloud-hosted NoSQL database |

---

## Screenshots

### Login Page
![Login page — dark themed sign-in form](https://raw.githubusercontent.com/KavinT06/aracreate/main/docs/login.png)

### Chat Interface
![Chat interface — room sidebar and message area](https://raw.githubusercontent.com/KavinT06/aracreate/main/docs/chat.png)

---

## Live Demo

🚀 **[https://aracreate.onrender.com](https://aracreate.onrender.com)**

> Hosted on Render (free tier — may take ~30 s to spin up on first visit).

---

## Installation

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A MongoDB Atlas cluster (or a local MongoDB instance)

### 1 — Clone the repository

```bash
git clone https://github.com/KavinT06/aracreate.git
cd aracreate
```

### 2 — Install all dependencies

```bash
npm run install:all
```

### 3 — Configure environment variables

```bash
# Copy the example files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/chatapp
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Edit `client/.env` (the defaults work for local dev — no changes needed):

```env
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=
```

### 4 — Start in development mode

```bash
npm run dev
```

This starts both the Express server on **port 5000** and the Vite dev server on **port 5173** concurrently. The Vite proxy forwards `/api` and `/socket.io` requests to the backend.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the Express server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used to sign JWTs | Any strong random string |
| `JWT_EXPIRES_IN` | JWT lifetime | `7d` |
| `CLIENT_URL` | Allowed CORS origin for the frontend | `http://localhost:5173` |

### Client (`client/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL for REST API calls | `/api` (dev) or `https://aracreate.onrender.com/api` (prod) |
| `VITE_SOCKET_URL` | Socket.IO server URL | *(empty = same origin)* |

---

## Deployment (Render)

This monorepo deploys as a **single Render web service**. The Express server builds and serves the React frontend from `client/dist`.

| Setting | Value |
|---|---|
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Environment | `NODE_ENV=production`, `PORT=10000`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` |

`render.yaml` in the repository root contains the full service definition for one-click deployment.

---

## Project Structure

```
aracreate/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios API helpers
│   │   ├── components/ui/   # Reusable UI primitives
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Route-level page components
│   │   ├── routes/          # React Router configuration
│   │   ├── socket/          # Socket.IO client wrapper
│   │   ├── store/           # Zustand state stores
│   │   └── utils/           # Shared utilities
│   └── vite.config.js
│
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── config/          # DB connection & env loader
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # Mongoose schemas (User, Room, Message)
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic
│   │   ├── socket/          # Socket.IO event handlers
│   │   └── utils/
│   └── server.js            # Entry point
│
├── render.yaml              # Render deployment config
└── package.json             # Root workspace config
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Get the current authenticated user |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms` | List all rooms |
| `POST` | `/api/rooms` | Create a new room |
| `POST` | `/api/rooms/:id/join` | Join a room |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/messages/:roomId` | Fetch message history for a room |

---

## Socket.IO Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_room` | Client → Server | `roomId` | Subscribe to a room's channel |
| `leave_room` | Client → Server | `roomId` | Unsubscribe from a room |
| `send_message` | Client → Server | `{ roomId, content }` | Send a new message |
| `new_message` | Server → Client | Message object | Broadcast a received message |

---

## Future Improvements

- [ ] Direct messages (1-to-1 private chat)
- [ ] File & image attachments
- [ ] Message read receipts
- [ ] User profile avatars (upload / gravatar)
- [ ] Push notifications (Web Push API)
- [ ] Message search
- [ ] Room admin controls (kick, ban, pin messages)
- [ ] End-to-end encryption

---

## Author

**Kavin T**
- GitHub: [@KavinT06](https://github.com/KavinT06)
- Project Board: [GitHub Projects — aracreate](https://github.com/users/KavinT06/projects/1)

---

## License

This project was built as an interview assignment. All rights reserved © 2025 Kavin T.
