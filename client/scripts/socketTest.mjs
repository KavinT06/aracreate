import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';

async function main() {
  const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
    email: 'devuser@example.com',
    password: 'password123',
  });

  const { token } = loginResponse.data.data;

  let roomId;
  try {
    const createResponse = await axios.post(
      `${API_BASE}/rooms`,
      { name: 'socket-smoke-room', description: 'Temporary test room' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    roomId = createResponse.data.data._id;
  } catch (err) {
    const roomsResponse = await axios.get(`${API_BASE}/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    roomId = roomsResponse.data.data[0]?._id;
  }

  if (!roomId) {
    throw new Error('No room available for socket smoke test');
  }

  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });

  socket.emit('join_room', roomId);

  const messagePromise = new Promise((resolve, reject) => {
    socket.once('receive_message', resolve);
    socket.once('error', reject);
  });

  socket.emit('send_message', { roomId, content: 'socket smoke test message' });

  const message = await Promise.race([
    messagePromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for message broadcast')), 8000)),
  ]);

  console.log(JSON.stringify({ ok: true, roomId, message }, null, 2));
  socket.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
