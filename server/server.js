const http = require('http');
const net = require('net');
require('./src/config/loadEnv');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket/socketHandler');

const PORT = process.env.PORT || 5000;

const findAvailablePort = (startPort) =>
  new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const tester = net.createServer();

      tester.unref();

      tester.once('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          tester.close(() => tryPort(port + 1));
          return;
        }

        reject(error);
      });

      tester.once('listening', () => {
        const address = tester.address();
        tester.close(() => resolve(address.port));
      });

      tester.listen(port);
    };

    tryPort(Number(startPort));
  });

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('Starting API without a MongoDB connection. Database-backed routes may fail until MONGO_URI is fixed.');
  }

  const server = http.createServer(app);
  initSocket(server);

  const listenOnPort = (port) => {
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  };

  server.on('error', (error) => {
    throw error;
  });

  const availablePort = await findAvailablePort(PORT);

  if (availablePort !== Number(PORT)) {
    console.warn(`Port ${PORT} is already in use. Using port ${availablePort} instead.`);
  }

  listenOnPort(availablePort);
};

startServer();