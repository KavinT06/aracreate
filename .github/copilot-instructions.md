# GitHub Copilot Instructions — Real-Time Chat Application

## Project Overview

This is a full-stack real-time chat application built with React (JSX), Express.js, MongoDB, Socket.io, and Zustand. It supports JWT-based authentication, chat room management, and real-time messaging. The codebase must be clean, modular, scalable, and beginner-friendly.

---

## Tech Stack

### Frontend
- **React** (JSX only — never TypeScript)
- **Vite** (build tool)
- **Zustand** (global state management)
- **Tailwind CSS** (styling)
- **shadcn/ui** (component library)
- **Axios** (HTTP client)
- **Socket.io-client** (real-time)
- **React Router DOM** (routing)

### Backend
- **Node.js + Express.js**
- **MongoDB + Mongoose**
- **JWT** (authentication)
- **bcrypt** (password hashing)
- **Socket.io** (real-time server)

---

## Project Folder Structure

```
/
├── client/                        # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                   # Axios instances and API functions
│   │   │   ├── axiosInstance.js
│   │   │   ├── authApi.js
│   │   │   ├── roomApi.js
│   │   │   └── messageApi.js
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/                # shadcn/ui overrides and wrappers
│   │   │   ├── layout/            # Layout components (Sidebar, ChatWindow, etc.)
│   │   │   ├── auth/              # Login, Register forms
│   │   │   └── common/            # Spinner, EmptyState, Avatar, etc.
│   │   ├── pages/                 # Route-level page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ChatPage.jsx
│   │   ├── routes/                # Route guards and router config
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AppRouter.jsx
│   │   ├── socket/                # Socket.io client setup and event handlers
│   │   │   └── socketClient.js
│   │   ├── store/                 # Zustand stores
│   │   │   ├── useAuthStore.js
│   │   │   ├── useRoomStore.js
│   │   │   └── useMessageStore.js
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Helper utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── config/                # DB connection, env config
│   │   │   └── db.js
│   │   ├── controllers/           # Route handler functions
│   │   │   ├── authController.js
│   │   │   ├── roomController.js
│   │   │   └── messageController.js
│   │   ├── services/              # Business logic
│   │   │   ├── authService.js
│   │   │   ├── roomService.js
│   │   │   └── messageService.js
│   │   ├── models/                # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Room.js
│   │   │   ├── RoomMember.js
│   │   │   └── Message.js
│   │   ├── middleware/            # Express middleware
│   │   │   ├── authMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── routes/                # Express routers
│   │   │   ├── authRoutes.js
│   │   │   ├── roomRoutes.js
│   │   │   └── messageRoutes.js
│   │   ├── socket/                # Socket.io server logic
│   │   │   ├── socketHandler.js
│   │   │   └── socketAuth.js
│   │   ├── utils/                 # Utility functions
│   │   │   └── generateToken.js
│   │   └── app.js                 # Express app entry point
│   ├── server.js                  # HTTP + Socket.io server bootstrap
│   └── .env
│
├── .github/                       # GitHub Copilot instruction files
│   ├── copilot-instructions.md
│   ├── backend-rules.md
│   ├── frontend-rules.md
│   ├── socket-rules.md
│   ├── api-rules.md
│   ├── ui-rules.md
│   └── git-rules.md
│
└── README.md
```

---

## Coding Standards

### General
- Use **JavaScript and JSX only** — never generate TypeScript or `.ts`/`.tsx` files
- Use **ES Modules** (`import`/`export`) throughout, not CommonJS in the frontend; use CommonJS (`require`) in the backend unless the project is configured for ESM
- Follow **single responsibility principle** — each file/function does one thing
- Keep functions **small and focused** — prefer multiple small functions over one large one
- Use **async/await** with try/catch — never `.then()/.catch()` chains
- Always **destructure** props, function arguments, and objects for clarity
- Use **named exports** for components and utilities; default exports only for pages and route-level components

### Naming Conventions
| Type | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `ChatWindow.jsx` |
| Files (utils/hooks) | camelCase | `useAuthStore.js` |
| Variables/functions | camelCase | `fetchMessages` |
| Constants | UPPER_SNAKE_CASE | `MAX_MESSAGES` |
| MongoDB models | PascalCase | `User`, `Room` |
| API routes | kebab-case | `/api/chat-rooms` |
| Socket events | snake_case | `join_room`, `send_message` |
| CSS classes | Tailwind utilities only | `className="flex gap-4"` |

---

## Environment Variable Usage

### Frontend (`client/.env`)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Backend (`server/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

**Rules:**
- Never hardcode URLs, secrets, or config values — always use environment variables
- Prefix all frontend env vars with `VITE_` for Vite to expose them
- Access frontend env vars via `import.meta.env.VITE_*`
- Access backend env vars via `process.env.*`
- Never commit `.env` files — always add them to `.gitignore`

---

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add room creation endpoint
fix: resolve JWT verification error on socket handshake
chore: update dependencies
refactor: extract message service from controller
docs: update README with setup instructions
style: apply consistent Tailwind spacing to sidebar
test: add unit tests for authService
```

See `.github/git-rules.md` for full Git workflow.

---

## Architecture Principles

### Controller/Service Pattern (Backend)
- **Controllers** handle HTTP requests and responses only — no business logic
- **Services** contain all business logic and database interaction
- **Models** define Mongoose schemas only — no logic

### Store-Driven Architecture (Frontend)
- All global state lives in **Zustand stores**
- Socket events **must update Zustand stores directly** — never local component state
- Components read from stores — they never manage server data locally
- API calls are made via dedicated **API module functions** (not inside components)

### No Mock Data Rule
- Never use hardcoded mock arrays, objects, or fake API responses
- All data must come from real REST API calls or Socket.io events
- Loading and empty states handle the UI gap while data loads

---

## Reusable Code Practices

- Extract repeated logic into custom hooks (`hooks/`) or utility functions (`utils/`)
- Build shared UI elements (Spinner, EmptyState, Avatar) as standalone components in `components/common/`
- Never duplicate business logic — if the same function is needed in two places, extract it
- Axios instance with base URL and auth header interceptor must be defined once in `api/axiosInstance.js`
- Socket client must be initialized once in `socket/socketClient.js` and reused across the app

---

## Scalability Rules

- All route groups must be modular — each feature has its own router, controller, and service file
- Zustand stores must be separated by domain: `useAuthStore`, `useRoomStore`, `useMessageStore`
- Socket event handlers must be centralized in `socket/socketHandler.js` — never scattered across components
- MongoDB indexes must be defined on frequently queried fields (e.g., `room`, `createdAt` in messages)
- Pagination must be implemented for message fetching from the start (even if only 50 messages are loaded initially)

---

## Maintainability Guidelines

- Every function must have a clear, descriptive name that explains what it does
- Use JSDoc comments for complex functions — keep them concise
- Avoid deep nesting — use early returns and guard clauses
- Keep components under 150 lines — split if they grow larger
- Never mix concerns — UI logic stays in components, business logic stays in services/stores
- Use consistent error handling patterns across all API calls and socket events