# Frontend Development Rules

## React JSX Conventions

### Core Rules
- Use **JSX only** — never TypeScript, never `.tsx` files
- Use **functional components** exclusively — no class components
- Always define components as named arrow functions assigned to a `const`
- Use **React hooks** for local state and side effects
- Keep components **under 150 lines** — split into smaller components if they grow larger
- Never use inline functions directly in JSX event handlers — define handlers above the return statement

### Component Template
```jsx
// components/layout/RoomSidebar.jsx

const RoomSidebar = () => {
  // 1. Store selectors
  // 2. Local state (useState)
  // 3. Effects (useEffect)
  // 4. Derived values
  // 5. Event handlers
  // 6. Render

  return (
    <aside className="...">
      {/* JSX */}
    </aside>
  );
};

export default RoomSidebar;
```

### Key Patterns
- Destructure all props at the function signature level
- Use **early returns** for loading, error, and empty states before the main render
- Never use array index as a `key` prop — use unique IDs from the data
- Always add `key` props to any `.map()` rendered list

---

## Zustand Global State Rules

### Store Structure
Each store handles one domain. Three stores are required:

```
store/
├── useAuthStore.js
├── useRoomStore.js
└── useMessageStore.js
```

### Store Template
```js
// store/useAuthStore.js
import { create } from 'zustand';
import { loginUser, registerUser } from '../api/authApi';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await loginUser(credentials);
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
```

### Store Rules
- Each store must manage its own `isLoading` and `error` fields
- **Socket events must call Zustand store actions to update state** — never update local component state
- Never call API functions directly inside components — always go through store actions
- Use `set` for synchronous updates, async functions for API-driven updates
- Keep store actions small — delegate to API modules for HTTP calls
- Persist only the JWT token to `localStorage` — not user objects or rooms

### Room Store Example
```js
// store/useRoomStore.js
import { create } from 'zustand';
import { fetchRooms, createRoom } from '../api/roomApi';

const useRoomStore = create((set) => ({
  rooms: [],
  activeRoom: null,
  isLoading: false,
  error: null,

  loadRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await fetchRooms();
      set({ rooms, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load rooms', isLoading: false });
    }
  },

  addRoom: (room) => set((state) => ({ rooms: [room, ...state.rooms] })),
  setActiveRoom: (room) => set({ activeRoom: room }),
}));

export default useRoomStore;
```

### Message Store Example
```js
// store/useMessageStore.js
import { create } from 'zustand';
import { fetchMessages } from '../api/messageApi';

const useMessageStore = create((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  loadMessages: async (roomId) => {
    set({ isLoading: true, messages: [], error: null });
    try {
      const messages = await fetchMessages(roomId);
      set({ messages, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load messages', isLoading: false });
    }
  },

  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  clearMessages: () => set({ messages: [], error: null }),
}));

export default useMessageStore;
```

---

## Protected Routes

```jsx
// routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
```

```jsx
// routes/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ChatPage from '../pages/ChatPage';

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/chat"
        element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
```

---

## Reusable Component Patterns

### Spinner Component
```jsx
// components/common/Spinner.jsx
const Spinner = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClass}`} />
  );
};

export { Spinner };
```

### Empty State Component
```jsx
// components/common/EmptyState.jsx
const EmptyState = ({ title, description, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
    {Icon && <Icon className="h-12 w-12 opacity-40" />}
    <p className="text-lg font-medium">{title}</p>
    {description && <p className="text-sm text-center max-w-xs">{description}</p>}
  </div>
);

export { EmptyState };
```

---

## Axios API Handling

### Axios Instance
```js
// api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach JWT token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### API Module Pattern
```js
// api/roomApi.js
import axiosInstance from './axiosInstance';

export const fetchRooms = async () => {
  const { data } = await axiosInstance.get('/rooms');
  return data.data;
};

export const createRoom = async (payload) => {
  const { data } = await axiosInstance.post('/rooms', payload);
  return data.data;
};

export const joinRoom = async (roomId) => {
  const { data } = await axiosInstance.post(`/rooms/${roomId}/join`);
  return data.data;
};
```

### API Call Rules
- Never call `axios` directly in components or stores — always use API module functions
- Always destructure the `data` property from the Axios response
- Let errors propagate to the store's catch block — don't swallow them in API modules
- Never add try/catch inside API module functions

---

## Tailwind CSS Styling Conventions

- Use **Tailwind utility classes only** — never write custom CSS unless absolutely unavoidable
- Do not use inline `style` props
- Use `cn()` utility (from `clsx` + `tailwind-merge`) when combining conditional classes
- Follow a consistent spacing scale: `gap-2`, `gap-4`, `gap-6`, `p-4`, `p-6`
- Use semantic color tokens from shadcn/ui: `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `bg-primary`, `text-primary-foreground`
- Use `flex` and `grid` for layout — no absolute positioning unless needed for overlays

---

## shadcn/ui Usage Rules

- Always use shadcn/ui components for forms, buttons, inputs, dialogs, and cards
- Import from `@/components/ui/*` — do not modify generated component files
- Use `Button`, `Input`, `Dialog`, `Card`, `ScrollArea`, `Avatar`, `Separator` from shadcn/ui
- Pass `variant` and `size` props according to shadcn/ui API — do not override with inline styles
- For form inputs, always include a visible `label` element associated via `htmlFor`

---

## Loading and Empty States

### Rules
- Every API call must show a `<Spinner />` while `isLoading` is `true` in the store
- Every list (rooms, messages) must show an `<EmptyState />` when the array is empty and not loading
- Loading states must cover the relevant section — not the entire page unless it's initial auth loading

### Pattern
```jsx
const MessageList = () => {
  const { messages, isLoading } = useMessageStore();

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  if (messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="Be the first to say something!"
        icon={MessageSquareIcon}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2 p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg._id} message={msg} />
      ))}
    </ul>
  );
};
```

---

## Auto-Scroll Latest Messages

```jsx
import { useEffect, useRef } from 'react';

const messagesEndRef = useRef(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// In JSX, place at the bottom of the message list:
<div ref={messagesEndRef} />
```

---

## Folder Structure Rules

- `pages/` — route-level components only; must not contain business logic
- `components/layout/` — structural components (Sidebar, ChatWindow, Header, MessageInput)
- `components/auth/` — LoginForm, RegisterForm
- `components/common/` — Spinner, EmptyState, Avatar, MessageBubble (shared across features)
- `components/ui/` — shadcn/ui generated files only; do not add custom components here
- `api/` — one file per resource: `authApi.js`, `roomApi.js`, `messageApi.js`
- `store/` — one Zustand store per domain
- `socket/` — socket client setup and event binding
- `hooks/` — custom hooks extracted from components when reuse is needed
- `utils/` — pure utility functions (formatters, date helpers, etc.)