# ChatApp

Real-time chat app with React, Express, MongoDB, and Socket.io.

## Local Setup

1. Start MongoDB locally, or use MongoDB Compass against your Atlas cluster.
2. Copy the example env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Fill in the values.

## Environment Variables

### Server

- `MONGO_URI`: MongoDB Atlas connection string for production, or `mongodb://127.0.0.1:27017/chatapp` locally.
- `JWT_SECRET`: any strong secret.
- `CLIENT_URL`: your Vercel frontend URL in production.

### Client

- `VITE_API_BASE_URL`: `http://localhost:5000/api` in development, or your Render backend URL in production.
- `VITE_SOCKET_URL`: `http://localhost:5000` in development, or your Render backend URL in production.

## Development

```bash
npm install
npm run dev
```

`npm run dev` starts both apps on `5000` and `5173` by default.
The client proxies `/api` and `/socket.io` to the backend in development.

## Deploying to Render

This repo can be deployed as a single Render web service from the root. The backend serves the built frontend from `client/dist`, so you do not need a separate Vercel app.

### Render web service

- Root directory: repository root
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables:
	- `PORT=10000` or the port Render assigns
	- `MONGO_URI=<your MongoDB Atlas URI>`
	- `JWT_SECRET=<strong secret>`
	- `CLIENT_URL=https://your-render-service.onrender.com` once the service URL is known, or leave it unset to allow same-origin defaults

If you want to keep the frontend and backend on the same origin, leave `VITE_API_BASE_URL` and `VITE_SOCKET_URL` unset in production. The client already falls back to `/api` and the current browser origin.

## Production Locally

```bash
npm run build
npm start
```

The Express server serves the built client from `client/dist` when present.
